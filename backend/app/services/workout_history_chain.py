import json
import re
import logging
import os
from typing import AsyncGenerator, Optional
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from pydantic import ValidationError
from app.core.prompts.workout_history import WORKOUT_HISTORY_PROMPT
from app.schemas.workout_history_summary import WorkoutHistory

logger = logging.getLogger(__name__)

class WorkoutHistoryChain:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        if not api_key.startswith("sk-ant-"):
            raise ValueError("ANTHROPIC_API_KEY appears to be invalid - should start with sk-ant-")

        # Initialize the chat model
        self.chat_model = ChatAnthropic(
            api_key=api_key,
            model="claude-3-sonnet-20240229",
            streaming=True
        )

        # Initialize messages with just the system message
        self.messages = [SystemMessage(content=WORKOUT_HISTORY_PROMPT)]
        self.current_summary = None

        # Create the main conversation prompt
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=WORKOUT_HISTORY_PROMPT),
            MessagesPlaceholder(variable_name="messages")
        ])

        # Create the sentiment analysis prompt
        self.sentiment_prompt = ChatPromptTemplate.from_messages([
            ("system", "Analyze if responses approve or reject summaries. Return only 'APPROVE' or 'REJECT'."),
            ("user", """Summary: {summary}
        Response: {input}""")
        ])

        # Create the LCEL chains
        self.chain = self.prompt | self.chat_model
        self.sentiment_chain = self.sentiment_prompt | self.chat_model

    async def process_message(self, message: str) -> AsyncGenerator[dict, None]:
        try:
            # STEP 3: If we have a summary, analyze sentiment before proceeding
            if self.current_summary:
                is_approved = await self.analyze_sentiment(message)
                
                if is_approved:
                    # STEP 4a: Send approval signal with summary
                    yield {
                        "type": "workout_history_approved",
                        "data": self.current_summary
                    }
                    
                    # STEP 4b: Let LLM respond to approval
                    current_message = HumanMessage(content=message)
                    self.messages.append(current_message)  # Add user message to history
                    
                    response = await self.chat_model.invoke(self.messages)
                    self.messages.append(response)  # Add assistant response to history
                    
                    yield {
                        "type": "content",
                        "data": response.content
                    }
                    
                    # STEP 4c: Frontend will handle the signal
                    yield {"type": "done"}
                    return

                else:
                    # STEP 4 (negative): Continue conversation for revision
                    self.current_summary = None  # Clear summary to allow new one
            
            # STEP 0: Normal conversation flow
            current_message = HumanMessage(content=message)
            self.messages.append(current_message)  # Add user message to history

            # Stream response and check for new summary
            full_response = ""
            async for chunk in self.chain.astream({
                "messages": self.messages
            }):
                full_response += chunk.content
                yield {
                    "type": "content",
                    "data": chunk.content
                }
                
                # STEP 1: Check for summary generation
                if self.current_summary is None:
                    self._check_for_summary(full_response)

            # Add assistant's complete response to history
            self.messages.append(AIMessage(content=full_response))
            
            # Signal message completion
            yield {"type": "done"}

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            yield {
                "type": "error",
                "error": str(e)
            }      
    def _check_for_summary(self, text: str) -> None:
        """Look for any text that matches our summary format"""
        try:
            logger.info("Checking text for summary...")
            lines = text.split('\n')
            summary = {}
            
            found_training_age = False
            found_preferences = False
            found_achievements = False
            found_medical = False
            
            for line in lines:
                logger.debug(f"Checking line: {line}")
                if 'Training Age:' in line:
                    logger.info(f"Found Training Age: {line}")
                    summary['trainingAge'] = line.split(':', 1)[1].strip()
                    found_training_age = True
                elif 'Exercise Preferences:' in line:
                    logger.info(f"Found Exercise Preferences: {line}")
                    summary['exercisePreferences'] = [p.strip() for p in line.split(':', 1)[1].split(',')]
                    found_preferences = True
                elif 'Achievements:' in line:
                    logger.info(f"Found Achievements: {line}")
                    summary['achievements'] = [a.strip() for a in line.split(':', 1)[1].split(',')]
                    found_achievements = True
                elif 'Medical Considerations:' in line:
                    logger.info(f"Found Medical Considerations: {line}")
                    summary['medicalConsiderations'] = [m.strip() for m in line.split(':', 1)[1].split(',')]
                    found_medical = True

            logger.info(f"Found fields - Training Age: {found_training_age}, Preferences: {found_preferences}, Achievements: {found_achievements}, Medical: {found_medical}")

            if summary:
                try:
                    logger.info(f"Attempting to validate summary: {summary}")
                    validated = WorkoutHistory.model_validate(summary)
                    self.current_summary = validated.model_dump()
                    logger.info(f"Successfully validated and stored summary: {self.current_summary}")
                    return
                except ValidationError as e:
                    logger.error(f"Summary validation failed: {e}")

        except Exception as e:
            logger.error(f"Error checking for summary: {str(e)}")
    async def analyze_sentiment(self, response: str) -> bool:
        """Analyze user's response to summary"""
        if not self.current_summary:
            return False

        try:
        
            result = await self.sentiment_chain.ainvoke({
                "summary": json.dumps(self.current_summary, indent=2),
                "input": response
            })
            return result.content.strip() == "APPROVE"
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return False