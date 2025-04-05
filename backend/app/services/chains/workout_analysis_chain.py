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
        system_prompt = """You are a workout analysis assistant with access to the user's workout data metrics. When responding:

1. Always check the available_data.workout_metrics in your context first
2. Prioritize discussing the most significant insights from the metrics:
   - For exercise_progression: Focus on weight changes and volume trends
   - For strength_progression: Highlight estimated 1RM improvements and monthly rates
   - For workout_frequency: Mention consistency scores and workout patterns
   - For most_improved_exercises: Always mention the top performers

3. Be specific with numbers when discussing progress:
   - "Your bench press 1RM has increased by 15kg (12%) over 3 months, at a rate of 5kg per month"
   - "Your workout consistency score is 85/100, with an average of 3.2 workouts per week"
   

4. Interpret metrics in context:
   - Explain what the numbers mean for the user's fitness journey
   - Compare progress across different exercises when relevant
   - Note any potential plateaus or exceptional improvements

5. Acknowledge correlations when available by highlighting significant relationships

Try to keep responses concise (under 100 tokens when possible) while still discussing the most relevant metrics.

"""

        super().__init__(system_prompt=system_prompt, llm=llm)
        self.user_id = user_id
        self._data_bundles: List[WorkoutDataBundle] = []
        self.logger = logging.getLogger(__name__)

    @property
    def data_bundles(self) -> List[WorkoutDataBundle]:
        return self._data_bundles

    async def add_data_bundle(self, bundle: WorkoutDataBundle) -> bool:
        """Add workout data bundle to conversation context with enhanced details."""
        try:
            # Store the bundle
            self._data_bundles.append(bundle)
            
            # Format top performers for display
            strength_highlights = []
            volume_highlights = []
            frequency_highlights = []
            
            if hasattr(bundle, 'top_performers'):
                # Process strength performers
                for performer in bundle.top_performers.get('strength', []):
                    if isinstance(performer, dict) and performer.get('change_percent', 0) > 0:
                        strength_highlights.append(
                            f"{performer.get('name')}: +{performer.get('change_percent')}%"
                        )
                
                # Process volume performers
                for performer in bundle.top_performers.get('volume', []):
                    if isinstance(performer, dict) and performer.get('change_percent', 0) > 0:
                        volume_highlights.append(
                            f"{performer.get('name')}: +{performer.get('change_percent')}%"
                        )
                
                # Process frequency performers
                for performer in bundle.top_performers.get('frequency', []):
                    if isinstance(performer, dict):
                        frequency_highlights.append(
                            f"{performer.get('name')}: {int(performer.get('first_value', 0))} sessions"
                        )
            
            # Format consistency metrics
            consistency_score = bundle.consistency_metrics.get('score', 0) if hasattr(bundle, 'consistency_metrics') else 0
            consistency_streak = bundle.consistency_metrics.get('streak', 0) if hasattr(bundle, 'consistency_metrics') else 0
            consistency_gap = bundle.consistency_metrics.get('avg_gap', 0) if hasattr(bundle, 'consistency_metrics') else 0
            
            # Format chart availability
            available_charts = []
            if hasattr(bundle, 'chart_urls') and bundle.chart_urls:
                if 'strength_progress' in bundle.chart_urls:
                    available_charts.append("Strength Progress Chart")
                if 'volume_progress' in bundle.chart_urls:
                    available_charts.append("Volume Progress Chart")
                if 'weekly_frequency' in bundle.chart_urls:
                    available_charts.append("Weekly Workout Frequency Chart")
            
            # Create the context message
            context_message = f"""
    The user is viewing their workout analysis with these visualizations and metrics:

    CHARTS:
    {', '.join(available_charts) if available_charts else 'No charts available'}

    CONSISTENCY METRICS:
    - Score: {consistency_score}/100
    - Current streak: {consistency_streak} workouts
    - Average frequency: Every {consistency_gap} days

    TOP PERFORMERS:
    - Strength gains: {', '.join(strength_highlights) if strength_highlights else 'No significant strength gains detected'}
    - Volume increases: {', '.join(volume_highlights) if volume_highlights else 'No significant volume increases detected'}
    - Most frequent exercises: {', '.join(frequency_highlights) if frequency_highlights else 'Not enough data'}

    When discussing their workout progress, reference these specific metrics they can see in their interface.
    Focus on their most significant improvements and patterns.
    """
            
            # Add to conversation history
            self.messages.append(SystemMessage(content=context_message))
            
            logger.info(f"Added workout data bundle to conversation context")
            logger.info(f"Bundle has {len(available_charts)} charts available")
            logger.info(f"Top strength performer: {strength_highlights[0] if strength_highlights else 'None'}")
            
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
                
                # Include only the advanced metrics and minimal exercise data
                date_range = latest_bundle.metadata.date_range
                
                workout_context["available_data"] = {
                    "query": latest_bundle.original_query,
                    "date_range": {
                        "start": self._format_date(date_range['earliest']),
                        "end": self._format_date(date_range['latest'])
                    },
                    # Focus on providing the metrics instead of raw data
                    "workout_metrics": latest_bundle.workout_data.get('metrics', {}),
                    "total_workouts": latest_bundle.metadata.total_workouts,
                    "correlation_analysis": latest_bundle.correlation_data.summary if latest_bundle.correlation_data else None
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