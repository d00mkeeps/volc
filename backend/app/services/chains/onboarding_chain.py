import asyncio
import json
import logging
import os
from datetime import datetime
import re
from typing import AsyncGenerator, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.prompts.onboarding_conversation import ONBOARDING_PROMPT
from app.schemas.onboarding_summary import UserOnboarding
from app.services.extraction.onboarding_extractor import OnboardingExtractor
from app.services.sentiment_analysis import BaseSentimentAnalyzer

logger = logging.getLogger(__name__)

class OnboardingChain:
   """
   Manages the onboarding conversation flow by combining structured data extraction
   with natural conversation. This chain maintains state throughout the conversation,
   tracks information collection progress, and handles the transition between
   information gathering and summary confirmation phases.
   """
   def __init__(self):
       # Set up environment and validate API key
       self._initialize_environment()
       
       # Initialize our conversation components
       self.chat_model = self._create_chat_model()
       self.extractor = OnboardingExtractor()
       self.sentiment_analyzer = BaseSentimentAnalyzer(self.chat_model)
       
       # Set up state management
       self.messages = [SystemMessage(content=ONBOARDING_PROMPT)]
       self.extraction_state = None
       self.current_summary = None
       self.state_history = []
       
       # Create our prompts and chains
       self._initialize_prompts_and_chains()

   def _initialize_environment(self) -> None:
       """
       Sets up and validates environment variables needed for the chain.
       This separation helps with testing and configuration management.
       """
       load_dotenv()
       api_key = os.getenv("ANTHROPIC_API_KEY")
       if not api_key:
           raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
       if not api_key.startswith("sk-ant-"):
           raise ValueError("ANTHROPIC_API_KEY appears to be invalid")
       self.api_key = api_key

   def _create_chat_model(self) -> ChatAnthropic:
       """
       Creates and configures the chat model with appropriate settings.
       Separating this allows for easier model updates and configuration changes.
       """
       return ChatAnthropic(
           api_key=self.api_key,
           model="claude-3-sonnet-20240229",
           streaming=True
       )

   def _initialize_prompts_and_chains(self) -> None:
       """
       Sets up the conversation prompts and chains.
       """
       # Main conversation prompt with all required template variables
       self.prompt = ChatPromptTemplate.from_messages([
           MessagesPlaceholder(variable_name="messages"),
           HumanMessage(content="{current_message}"),
       ]).partial(
           extraction_state="",
           missing_fields="",
           current_message=""
       )

       # Create our conversation chain
       self.chain = self.prompt | self.chat_model

   async def update_extraction_state(self, new_state: UserOnboarding) -> None:
       """
       Updates the current extraction state and maintains a history of significant changes.
       This helps track how user information evolves throughout the conversation.
       """
       if self.extraction_state:
           changes = self._detect_changes(self.extraction_state, new_state)
           if changes:
               self.state_history.append({
                   'timestamp': datetime.now(),
                   'changes': changes
               })
       self.extraction_state = new_state

   def _detect_changes(self, old_state: UserOnboarding, new_state: UserOnboarding) -> Dict[str, Any]:
       """
       Identifies meaningful changes between two states, focusing on updates
       from 'not provided' to actual values or corrections to existing information.
       """
       changes = {}
       # Compare personal info fields
       for field in old_state.personalInfo.model_fields:
           old_val = getattr(old_state.personalInfo, field)
           new_val = getattr(new_state.personalInfo, field)
           if old_val != new_val and new_val != "not provided":
               changes[f"personalInfo.{field}"] = {
                   'old': old_val,
                   'new': new_val
               }
       
       # Add similar comparisons for goal and fitness background
       # We track these separately to maintain clear change history
       return changes if changes else None

   def _get_missing_fields(self, state: UserOnboarding) -> str:
       """
       Analyzes the current state to determine what information is still needed.
       Now handles Optional fields appropriately.
       """
       missing = []
       
       # Check personal information
       if state.personalInfo.firstName is None:
           missing.append("first name")
       if state.personalInfo.lastName is None:
           missing.append("last name")
       if state.personalInfo.ageGroup is None:
           missing.append("age group")
       if state.personalInfo.preferredUnits is None:
           missing.append("preferred measurement system")

       # Check goal
       if state.goal is None:
           missing.append("fitness goal")

       # Check fitness background
       if state.fitnessBackground.trainingAge is None:
           missing.append("training experience")
       if state.fitnessBackground.exercisePreferences is None:
           missing.append("exercise preferences")
       if state.fitnessBackground.currentAbilities is None:
           missing.append("current fitness abilities")
       if state.fitnessBackground.injuries is None:
           missing.append("injury history")

       if not missing:
           return "All required information has been collected."
       
       return "Information still needed:\n" + "\n".join(f"- {field}" for field in missing)

   async def process_message(self, message: str) -> AsyncGenerator[dict, None]:
       """
       Processes each user message, maintaining conversation state and handling data extraction.
       Manages the flow between information collection and summary confirmation phases.
       """
       max_retries = 3
       base_delay = 1  # seconds
       
       for attempt in range(max_retries):
           try:
               # Add message to conversation history
               current_message = HumanMessage(content=message)
               self.messages.append(current_message)

               # Handle summary approval if we're in that phase
               if self.current_summary:
                   is_approved = await self.sentiment_analyzer.analyze_sentiment(
                       message,
                       self.current_summary
                   )
                   if is_approved:
                       yield {
                           "type": "workout_history_approved",
                           "data": self.current_summary
                       }
                       return

               # Extract current state from conversation
               extracted_data = await self.extractor.extract(self.messages)
               logger.info("\033[32m" + f"Extracted Data: {json.dumps(extracted_data.model_dump(), indent=2)}" + "\033[0m")
               
               await self.update_extraction_state(extracted_data)
               missing_fields = self._get_missing_fields(extracted_data)

               if (all(v is not None for v in extracted_data.personalInfo.model_dump().values()) and
                       extracted_data.goal is not None and
                       all(v is not None for v in extracted_data.fitnessBackground.model_dump().values()) and
                       not self.current_summary):
                       self.current_summary = extracted_data.model_dump()

               # Format extraction state for display
               extraction_state_display = {
                   "personalInfo": {
                       k: v if v is not None else "not yet provided"
                       for k, v in self.extraction_state.personalInfo.model_dump().items()
                   },
                   "goal": self.extraction_state.goal if self.extraction_state.goal is not None else "not yet provided",
                   "fitnessBackground": {
                       k: v if v is not None else "not yet provided"
                       for k, v in self.extraction_state.fitnessBackground.model_dump().items()
                   }
               }

               # Generate and stream conversation response
               full_response = ""
               async for chunk in self.chain.astream({
                   "messages": self.messages,
                   "extraction_state": json.dumps(extraction_state_display, indent=2),
                   "missing_fields": missing_fields,
                   "current_message": message
               }):
                   chunk_content = chunk.content
                   full_response += chunk_content
                   yield {
                       "type": "content",
                       "data": chunk_content
                   }

               # Add complete response to conversation history
               self.messages.append(AIMessage(content=full_response))
               
               # Signal completion
               yield {"type": "done"}
               break  # Success - exit retry loop

           except Exception as e:
               if "overloaded_error" in str(e) and attempt < max_retries - 1:
                   delay = base_delay * (2 ** attempt)  # exponential backoff
                   logger.info(f"Retrying in {delay} seconds after overload error")
                   await asyncio.sleep(delay)
                   continue
               
               logger.error(f"Error processing message: {str(e)}")
               yield {
                   "type": "error",
                   "error": str(e)
               }
               return