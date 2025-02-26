from datetime import datetime
from typing import Dict, Any, List, Optional
import logging
import json
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from app.schemas.workout_data_bundle import WorkoutDataBundle
from .base_conversation_chain import BaseConversationChain

logger = logging.getLogger(__name__)

class WorkoutAnalysisChain(BaseConversationChain):
    def __init__(self, llm: ChatAnthropic, user_id: str):
        system_prompt = """You are a workout analysis assistant with access to the user's workout data. When responding:
1. Always check the available_data in your context first
2. If you see ANY workout data, make sure you let the user know about it.
3. Reference actual values from the data, such as:
 - Specific weights/1RMs achieved
 - Progress over time
 - Notable improvements or patterns
4. Integrate graph data when available by discussing the trends shown
For example, if you see bench press data showing progression from 100kg to 110kg over 3 months, mention these specific numbers and the rate of improvement.
If no data is available for a specific query, then explain what data would be needed.

try to keep token output to a maximum of 100, and less if possible

The first message generally won't have workout data available, so just respond in a friendly, helpful manner."""

        super().__init__(system_prompt=system_prompt, llm=llm)
        self.user_id = user_id
        self._data_bundles: List[WorkoutDataBundle] = []
        self.logger = logging.getLogger(__name__)

    @property
    def data_bundles(self) -> List[WorkoutDataBundle]:
        return self._data_bundles

    async def add_data_bundle(self, bundle: WorkoutDataBundle) -> bool:
        """Add a workout data bundle to the conversation context."""
        try:
            self._data_bundles.append(bundle)
            logger.info(f"Added workout data bundle:")
            logger.info(f"Original query: {bundle.original_query}")
            logger.info(f"Workout data: {bundle.workout_data}")
            logger.info(f"Metadata: {bundle.metadata}")
            return True
        except Exception as e:
            logger.error(f"Failed to add workout data bundle: {str(e)}", exc_info=True)
            return False

    def _initialize_prompt_template(self) -> None:
        """Sets up the workout-specific prompt template with context."""
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("system", "Current workout data context:\n{context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    def _format_date(self, dt: datetime) -> str:
        """Format datetime to string."""
        return dt.isoformat() if dt else None

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get workout-specific context variables."""
        base_vars = await super().get_additional_prompt_vars()

        try:
            workout_context = {
                "available_data": []
            }
            
            if self.data_bundles:
                latest_bundle = self.data_bundles[-1]
                
                exercise_summaries = {}
                for workout in latest_bundle.workout_data.get('workouts', []):
                    date = workout['date']
                    for exercise in workout.get('exercises', []):
                        name = exercise['exercise_name']
                        if name not in exercise_summaries:
                            exercise_summaries[name] = []
                        
                        exercise_summaries[name].append({
                            'date': date,
                            'metrics': exercise['metrics'],
                            'sets': [
                                {
                                    'weight': s.get('weight'),
                                    'reps': s.get('reps'),
                                    'estimated_1rm': s.get('estimated_1rm')
                                }
                                for s in exercise.get('sets', [])
                            ]
                        })
                
                date_range = latest_bundle.metadata.date_range

                workout_context["available_data"] = {
                    "query": latest_bundle.original_query,
                    "date_range": {
                        "start": self._format_date(date_range['earliest']),
                        "end": self._format_date(date_range['latest'])
                    },
                    "exercises": exercise_summaries,
                    "total_workouts": latest_bundle.metadata.total_workouts
                }
            
            context_str = f"""Available workout data:
            {json.dumps(workout_context, indent=2)}"""
            
            base_vars["context"] = context_str
            return base_vars
            
            
        except Exception as e:
            self.logger.error(f"Error getting prompt variables: {str(e)}", exc_info=True)
            return {
                "context": "No workout data available",
                "messages": self.messages,
                "current_message": ""
            }