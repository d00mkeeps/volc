import json
from typing import Dict, Any, Optional

from langchain_anthropic import ChatAnthropic
from app.core.prompts.workout_conversation import WORKOUT_PROMPT
from app.schemas.workout import Workout
from app.services.extraction.workout_extractor import WorkoutExtractor
from app.services.sentiment_analysis import WorkoutSentimentAnalyzer
from .base_conversation_chain import BaseConversationChain

class WorkoutChain(BaseConversationChain):
    def __init__(self, api_key: str):

        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            streaming=True,
            api_key = api_key
        )
        super().__init__(
            system_prompt=WORKOUT_PROMPT,
            llm=llm
        )
        
        self.approval_signal_type = 'workout_approved'
        # Initialize specialized components
        self.extractor = WorkoutExtractor()
        self.sentiment_analyzer = WorkoutSentimentAnalyzer(self.chat_model)
        
        # State management
        self.extraction_state: Optional[Workout] = None
        self.current_summary: Optional[Dict] = None
        self.summary_presented = False

    async def extract_data(self) -> Workout:
        """Extract workout data from conversation."""
        return await self.extractor.extract(self.messages)

    async def analyze_sentiment(self, message: str, current_summary: Dict) -> bool:
        """Analyze if user approves of the workout summary."""
        return await self.sentiment_analyzer.analyze_sentiment(
            message,
            current_summary,
            self.messages
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