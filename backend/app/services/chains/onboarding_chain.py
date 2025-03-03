from datetime import datetime
import json
from typing import AsyncGenerator, Dict, Any, Optional
import logging
from fastapi import WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from app.core.prompts.onboarding_conversation import ONBOARDING_PROMPT
from app.schemas.onboarding_summary import UserOnboarding
from app.services.extraction.onboarding_extractor import OnboardingExtractor
from app.services.sentiment_analysis import BaseSentimentAnalyzer
from .base_conversation_chain import BaseConversationChain


logger = logging.getLogger()
class OnboardingChain(BaseConversationChain):
    def __init__(self, llm: ChatAnthropic):
        super().__init__(
            system_prompt=ONBOARDING_PROMPT,
            llm=llm
        )
        
        # Initialize specialized components
        self.extractor = OnboardingExtractor()
        self.sentiment_analyzer = BaseSentimentAnalyzer(self.chat_model)
        
        # State management
        self.extraction_state: Optional[UserOnboarding] = None
        self.current_summary: Optional[Dict] = None
        self.state_history = []

        self.approval_signal_type="workout_history_approved",
  
    async def analyze_sentiment(self, message: str, current_summary: Dict) -> bool:
        """Analyze if user approves of the onboarding summary."""
        return await self.sentiment_analyzer.analyze_sentiment(message, current_summary)



    async def update_state(self, extracted_data: UserOnboarding) -> None:
        """Update onboarding state and track changes."""
        if self.extraction_state:
            changes = self._detect_changes(self.extraction_state, extracted_data)
            if changes:
                self.state_history.append({
                    'timestamp': datetime.now(),
                    'changes': changes
                })
        
        self.extraction_state = extracted_data

        # Check if we have all required information for a summary
        if (all(v is not None for v in extracted_data.personalInfo.model_dump().values()) and
                extracted_data.goal is not None and
                all(v is not None for v in extracted_data.fitnessBackground.model_dump().values()) and
                not self.current_summary):
            self.current_summary = extracted_data.model_dump()

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get variables needed for onboarding conversation."""
        # Start with the required messages key
        prompt_vars = {
            "messages": self.messages,
            "current_message": ""  # Add empty default for current_message
        }
        
        if not self.extraction_state:
            return prompt_vars

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

        prompt_vars.update({
            "extraction_state": json.dumps(extraction_state_display, indent=2),
            "missing_fields": self._get_missing_fields(self.extraction_state)
        })

        return prompt_vars

    def _detect_changes(self, old_state: UserOnboarding, new_state: UserOnboarding) -> Dict[str, Any]:
        """Track changes between states."""
        changes = {}
        for field in old_state.personalInfo.model_fields:
            old_val = getattr(old_state.personalInfo, field)
            new_val = getattr(new_state.personalInfo, field)
            if old_val != new_val and new_val != "not provided":
                changes[f"personalInfo.{field}"] = {
                    'old': old_val,
                    'new': new_val
                }
        return changes if changes else None

    def _get_missing_fields(self, state: UserOnboarding) -> str:
        """Determine what information is still needed."""
        missing = []
        
        if state.personalInfo.firstName is None:
            missing.append("first name")
        if state.personalInfo.lastName is None:
            missing.append("last name")
        if state.personalInfo.ageGroup is None:
            missing.append("age group")
        if state.personalInfo.preferredUnits is None:
            missing.append("preferred measurement system")

        if state.goal is None:
            missing.append("fitness goal")

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