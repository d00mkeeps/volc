import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from ...core.prompts.workout_conversation import WORKOUT_PROMPT
from ...schemas.workout import Workout
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from .base_conversation_chain import BaseConversationChain
from ..extraction.workout_extractor import WorkoutExtractor
from ..sentiment_analysis.workout import WorkoutSentimentAnalyzer

logger = logging.getLogger(__name__)

class WorkoutChain(BaseConversationChain):
    def __init__(self, api_key: str):
        llm = ChatAnthropic(
            model="claude-3-7-sonnet-20250219",
            streaming=True,
            api_key=api_key
        )
        super().__init__(
            system_prompt=WORKOUT_PROMPT,
            llm=llm
        )
        self.sentiment_model = ChatAnthropic(
        model="claude-3-7-sonnet-20250219",
        streaming=False,  # Important: non-streaming for reliable responses
        api_key=api_key
        )
        self.sentiment_analyzer = WorkoutSentimentAnalyzer(self.sentiment_model)
        
        self.approval_signal_type = 'workout_approved'
        # Initialize specialized components
        self.extractor = WorkoutExtractor()
        
        # State management
        self.extraction_state: Optional[Workout] = None
        self.current_summary: Optional[Dict] = None
        self.summary_presented = False

    async def extract_data(self) -> Workout:
        """Extract workout data from conversation."""
        return await self.extractor.extract(self.messages)

    async def analyze_sentiment(self, message: str, current_summary: Dict,  messages: List[HumanMessage | AIMessage]) -> bool:
        """Analyze if user approves of the workout summary."""
        return await self.sentiment_analyzer.analyze_sentiment(
            message,
            current_summary,
            messages
        )

    async def update_state(self, extracted_data: Workout) -> None:
        """Update workout state and check for summary readiness."""
        self.extraction_state = extracted_data
        
        # Check if workout is ready for summary
        if self._is_workout_saveable(extracted_data) and not self.current_summary:
            self.current_summary = extracted_data.model_dump()

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get variables needed for workout conversation."""
        base_vars = await super().get_additional_prompt_vars()
        if not self.extraction_state:
            return base_vars
        
        base_vars.update({
            "extraction_state": json.dumps(self.extraction_state.model_dump(), indent=2),
            "missing_fields": self._get_missing_fields(self.extraction_state)
        })
        
        return base_vars

    def _initialize_prompt_template(self) -> None:
        """Sets up the workout-specific prompt template."""
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=self.system_prompt),
            MessagesPlaceholder(variable_name="messages"),
            HumanMessage(content="{current_message}"),
        ]).partial(
            extraction_state="",
            missing_fields="",
            current_message=""
        )

    def _is_workout_saveable(self, extracted_data: Workout) -> bool:
        """Determines if a workout has enough information to be saved."""
        return (
            len(extracted_data.exercises) > 0 
            and any(len(ex.set_data.sets) > 0 for ex in extracted_data.exercises)
        )

    def _get_missing_fields(self, state: Workout) -> str:
        """Determine what workout information is still needed."""
        missing = []
        
        if not state.exercises:
            missing.append("at least one exercise")
        else:
            # Check last exercise for completeness
            last_exercise = state.exercises[-1]
            if not last_exercise.set_data.sets:
                missing.append(f"set data for {last_exercise.exercise_name}")

        if not missing:
            return "All required information has been collected."
        
        return "Information still needed:\n" + "\n".join(f"- {field}" for field in missing)

    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Process messages and handle workout approval flow."""
        try:
            # Add message to conversation history
            self.messages.append(HumanMessage(content=message))
            
            # Check for workout approval if we've presented a summary
            if self.current_summary and self.summary_presented:
                logger.info(f"Sentiment analysis input - Message: '{message[:100]}...', Summary exists: {bool(self.current_summary)}")

                is_approved = await self.sentiment_analyzer.analyze_sentiment(
                    message,
                    self.current_summary,
                    self.messages
                )
                
                logger.info(f"Sentiment analysis completed with result: {is_approved}")
                
                if is_approved:
                    logger.info("🎉 User approved workout - emitting approval signal")
                    yield {
                        "type": self.approval_signal_type,
                        "data": self.current_summary
                    }
                    # Continue with normal processing after emitting the signal
            
            # Extract data from conversation
            extracted_data = await self.extractor.extract(self.messages)
            if extracted_data:
                logger.info(f"Extracted workout data: {json.dumps(extracted_data.model_dump(), indent=2)}")
                await self.update_state(extracted_data)
            
            # Format prompt and get response
            prompt_vars = await self.get_additional_prompt_vars()
            prompt_vars["current_message"] = message
            
            # Format the prompt
            formatted_prompt = self.prompt.format_messages(**prompt_vars)
            
            # Stream the response
            full_response = ""
            async for chunk in self.chat_model.astream(
                input=formatted_prompt
            ):
                # Check if this is a completion chunk
                if (not chunk.content and 
                    getattr(chunk, 'response_metadata', {}).get('stop_reason') == 'end_turn'):
                    yield {
                        "type": "done",
                        "data": ""
                    }
                    continue
                    
                chunk_content = chunk.content
                if chunk_content:  # Only send non-empty content chunks
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }
            
            # Add response to message history
            self.messages.append(AIMessage(content=full_response))
            
            # Check if this response included a summary presentation
            if "Does this look correct?" in full_response:
                self.summary_presented = True
                logger.info("Summary presented to user")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }