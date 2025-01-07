import asyncio
import json
import logging
from datetime import datetime
import os
from typing import AsyncGenerator, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.prompts.workout_conversation import WORKOUT_PROMPT
from app.core.prompts.sentiment_analysis import SENTIMENT_ANALYSIS_PROMPT
from app.schemas.workout import Workout
from app.services.extraction.workout_extractor import WorkoutExtractor

logger = logging.getLogger(__name__)
              
class WorkoutChain:
    """
    Manages the workout logging conversation flow by combining structured data extraction
    with natural conversation. This chain maintains state throughout the conversation,
    tracks information collection progress, and handles the transition between
    exercise logging and summary confirmation phases.
    """
    def __init__(self):
        
        load_dotenv()

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
                  
        
        self.chat_model = ChatAnthropic(
            model="claude-3-sonnet-20240229",
            streaming=True,
            api_key=api_key, 
        )
        self.extractor = WorkoutExtractor()
        
        # Set up state management
        self.messages = [SystemMessage(content=WORKOUT_PROMPT)]
        self.extraction_state = None
        self.current_summary = None
        
        # Create prompts and chains
        self._initialize_prompts_and_chains()

    def _initialize_prompts_and_chains(self) -> None:
        """
        Sets up the conversation and sentiment analysis prompts and chains.
        """
        self.prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            HumanMessage(content="{current_message}"),
        ]).partial(
            extraction_state="",
            missing_fields="",
            current_message=""
        )

        self.sentiment_prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=SENTIMENT_ANALYSIS_PROMPT),
            MessagesPlaceholder(variable_name="messages"),
            HumanMessage(content="{current_message}")
        ]).partial(
            current_message=""
        )

        self.chain = self.prompt | self.chat_model
        self.sentiment_chain = self.sentiment_prompt | self.chat_model

    def _get_missing_fields(self, state: Workout) -> str:
        """
        Analyzes the current state to determine what workout information is still needed.
        """
        missing = []
        
        if not state.name:
            missing.append("workout name")
            
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

    async def process_message(self, message: str) -> AsyncGenerator[dict, None]:
        """Processes each user message, maintaining conversation state and handling data extraction."""
        max_retries = 3
        base_delay = 1
        
        for attempt in range(max_retries):
            try:
                logger.debug(f"Processing message (attempt {attempt + 1}): {message[:100]}...")
                current_message = HumanMessage(content=message)
                self.messages.append(current_message)

                if self.current_summary:
                    logger.debug("Analyzing sentiment for current summary...")
                    is_approved = await self.analyze_sentiment(message)
                    if is_approved:
                        logger.debug("Summary approved by user")
                        yield {
                            "type": "workout_approved",
                            "data": self.current_summary
                        }
                        return

                logger.debug("Extracting data from messages...")
                extracted_data = await self.extractor.extract(self.messages)
                logger.info("\033[32m" + f"Extracted Workout Data: {json.dumps(extracted_data.model_dump(), indent=2)}" + "\033[0m")
                
                self.extraction_state = extracted_data
                missing_fields = self._get_missing_fields(extracted_data)
                logger.debug(f"Missing fields: {missing_fields}")

                # Generate and stream conversation response
                logger.debug("Generating conversation response...")
                full_response = ""
                async for chunk in self.chain.astream({
                    "messages": self.messages,
                    "extraction_state": json.dumps(self.extraction_state.model_dump(), indent=2),
                    "missing_fields": missing_fields,
                    "current_message": message
                }):
                    chunk_content = chunk.content
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }

                logger.debug(f"Response generated: {full_response[:100]}...")
                self.messages.append(AIMessage(content=full_response))
                yield {"type": "done"}
                break
            except Exception as e:
                if "overloaded_error" in str(e) and attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay} seconds after overload error")
                    await asyncio.sleep(delay)
                continue
            
            logger.error(f"Error processing message: {str(e)}")
            yield {
                "type": "error",
                "error": str(e)
            }
            return
    async def analyze_sentiment(self, response: str, max_retries: int = 3) -> Optional[bool]:
        """Analyze user's response to workout summary with retry logic"""
        if not self.current_summary:
            return False

        sentiment_messages = [
            HumanMessage(content=f"""Summary: {json.dumps(self.current_summary, indent=2)}
User's Response: {response}""")
        ]

        for attempt in range(max_retries):
            try:
                result = await self.sentiment_chain.ainvoke({
                    "messages": sentiment_messages
                })
                return result.content.strip() == "APPROVE"
            except Exception as e:
                if "overloaded_error" in str(e) and attempt < max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))
                    continue
                logger.error(f"Error in sentiment analysis: {str(e)}")
                return False