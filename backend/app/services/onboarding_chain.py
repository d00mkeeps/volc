import asyncio
import json
import logging
import os
from typing import AsyncGenerator, Optional
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from pydantic import ValidationError
from app.core.prompts.onboarding_conversation import ONBOARDING_PROMPT
from app.schemas.onboarding_summary import UserOnboarding

logger = logging.getLogger(__name__)

class OnboardingChain:
    def __init__(self):
        
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
        self.messages = [SystemMessage(content=ONBOARDING_PROMPT)]
        self.current_summary = None

        # Create the main conversation prompt
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=ONBOARDING_PROMPT),
            MessagesPlaceholder(variable_name="messages")
        ])

        # Create the sentiment analysis prompt
        self.sentiment_prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""Analyze if the user's response fully approves the summary or requests any changes.
Rules:
- Return 'APPROVE' only if the response indicates complete acceptance
- Return 'REJECT' if:
* Any changes are requested, even minor ones
* User seems unsure or asks questions
* User indicates any information is incorrect or missing
* User wants to add or modify any details"""),
            MessagesPlaceholder(variable_name="messages")
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
        """Look for any text that matches our summary format in completed messages"""
        try:
            logger.info("Checking completed message for summary...")
            
            def to_camel_case(s: str) -> str:
                # Remove spaces and split
                words = s.strip().replace('-', ' ').split()
                # Make first word lowercase, capitalize others
                return words[0].lower() + ''.join(word.capitalize() for word in words[1:])
            
            lines = text.split('\n')
            summary = {
                'personalInfo': {},
                'fitnessBackground': {}
            }
            
            # Track sections
            in_personal_info = False
            in_goal = False
            in_fitness_background = False
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Check section headers
                if line == "Personal Information:":
                    in_personal_info = True
                    in_goal = False
                    in_fitness_background = False
                    continue
                elif line.startswith("Goal:"):
                    in_personal_info = False
                    in_goal = True
                    in_fitness_background = False
                    summary['goal'] = line.split(':', 1)[1].strip()
                    continue
                elif line == "Fitness Background:":
                    in_personal_info = False
                    in_goal = False
                    in_fitness_background = True
                    continue
                    
                # Parse sections
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = to_camel_case(key)
                    value = value.strip()
                    
                    if in_personal_info:
                        summary['personalInfo'][key] = value
                    elif in_fitness_background:
                        # Always create lists for fitnessBackground fields except trainingAge
                        if key != 'trainingAge':
                            if ',' in value:
                                value = [v.strip() for v in value.split(',')]
                            else:
                                value = [value]  # Convert single items to single-item list
                        summary['fitnessBackground'][key] = value

            # Debug logging
            logger.debug(f"Parsed summary structure: {json.dumps(summary, indent=2)}")
            logger.debug(f"Personal Info keys: {summary['personalInfo'].keys()}")
            logger.debug(f"Fitness Background keys: {summary['fitnessBackground'].keys()}")

            # Validate we have all required fields
            required_personal = {'firstName', 'lastName', 'ageGroup', 'preferredUnits'}
            required_fitness = {'trainingAge', 'exercisePreferences', 'currentAbilities', 'injuries'}
            
            if (set(summary['personalInfo'].keys()) == required_personal and
                'goal' in summary and
                set(summary['fitnessBackground'].keys()) == required_fitness):
                
                try:
                    logger.info(f"Attempting to validate summary: {json.dumps(summary, indent=2)}")
                    validated = UserOnboarding.model_validate(summary)
                    self.current_summary = validated.model_dump()
                    logger.info(f"Successfully validated and stored summary: {self.current_summary}")
                    return
                except ValidationError as e:
                    logger.error(f"Summary validation failed: {e}")
            else:
                logger.debug("Incomplete summary detected, continuing conversation")

        except Exception as e:
            logger.error(f"Error checking for summary: {str(e)}")
    async def analyze_sentiment(self, response: str, max_retries: int = 3) -> Optional[bool]:
        """Analyze user's response to summary with retry logic"""
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