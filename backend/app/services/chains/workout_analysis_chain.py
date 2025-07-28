from datetime import datetime
from typing import Dict, Any, List
import logging
import json
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from app.schemas.workout_data_bundle import WorkoutDataBundle
from .base_conversation_chain import BaseConversationChain

logger = logging.getLogger(__name__)

class WorkoutAnalysisChain(BaseConversationChain):
    def __init__(self, llm: ChatAnthropic, user_id: str):
        system_prompt = """ try and talk like a human fitness coach!
"""

        super().__init__(system_prompt=system_prompt, llm=llm)
        self.user_id = user_id
        self._data_bundles: List[WorkoutDataBundle] = []
        self.logger = logging.getLogger(__name__)

    @property
    def data_bundles(self) -> List[WorkoutDataBundle]:
        return self._data_bundles

    def _initialize_prompt_template(self) -> None:
        """Sets up the workout-specific prompt template with consolidated context."""
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}\n\n"
                      "Current workout data context:\n{context}\n\n"
                      "Visualizations and metrics:\n{visualization_context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    async def add_data_bundle(self, bundle: WorkoutDataBundle) -> bool:
        """Add workout data bundle to conversation context without adding system messages."""
        try:
            # Store the bundle
            self._data_bundles.append(bundle)
            
            # Log success but don't add to message history
            logger.info(f"Added workout data bundle to conversation context")
            
            # Log chart availability
            available_charts = []
            if hasattr(bundle, 'chart_urls') and bundle.chart_urls:
                available_charts = list(bundle.chart_urls.keys())
            logger.info(f"Bundle has {len(available_charts)} charts available")
            
            # Log top performers if available
            if hasattr(bundle, 'top_performers') and bundle.top_performers:
                strength_highlights = bundle.top_performers.get('strength', [])
                if strength_highlights and len(strength_highlights) > 0:
                    logger.info(f"Top strength performer: {strength_highlights[0].get('name') if isinstance(strength_highlights[0], dict) else 'None'}")
                else:
                    logger.info(f"Top strength performer: None")
            
            return True
        except Exception as e:
            logger.error(f"Failed to add workout data bundle: {str(e)}", exc_info=True)
            return False

    def _format_date(self, dt: datetime) -> str:
        """Format datetime to string."""
        return dt.isoformat() if dt else None

    def _format_visualization_context(self) -> str:
        """Format the visualization context for the latest bundle."""
        if not self._data_bundles:
            return "No workout data available"
        
        latest_bundle = self._data_bundles[-1]
        
        # Format available charts
        available_charts = []
        if hasattr(latest_bundle, 'chart_urls') and latest_bundle.chart_urls:
            if 'strength_progress' in latest_bundle.chart_urls:
                available_charts.append("Strength Progress Chart")
            if 'volume_progress' in latest_bundle.chart_urls:
                available_charts.append("Volume Progress Chart")
            if 'weekly_frequency' in latest_bundle.chart_urls:
                available_charts.append("Weekly Workout Frequency Chart")
        
        # Format top performers 
        strength_highlights = []
        volume_highlights = []
        frequency_highlights = []
        
        if hasattr(latest_bundle, 'top_performers'):
            # Process strength performers
            for performer in latest_bundle.top_performers.get('strength', []):
                if isinstance(performer, dict) and performer.get('change_percent', 0) > 0:
                    strength_highlights.append(
                        f"{performer.get('name')}: +{performer.get('change_percent')}%"
                    )
            
            # Process volume performers
            for performer in latest_bundle.top_performers.get('volume', []):
                if isinstance(performer, dict) and performer.get('change_percent', 0) > 0:
                    volume_highlights.append(
                        f"{performer.get('name')}: +{performer.get('change_percent')}%"
                    )
            
            # Process frequency performers
            for performer in latest_bundle.top_performers.get('frequency', []):
                if isinstance(performer, dict):
                    frequency_highlights.append(
                        f"{performer.get('name')}: {int(performer.get('first_value', 0))} sessions"
                    )
        
        # Format consistency metrics
        consistency_score = latest_bundle.consistency_metrics.get('score', 0) if hasattr(latest_bundle, 'consistency_metrics') else 0
        consistency_streak = latest_bundle.consistency_metrics.get('streak', 0) if hasattr(latest_bundle, 'consistency_metrics') else 0
        consistency_gap = latest_bundle.consistency_metrics.get('avg_gap', 0) if hasattr(latest_bundle, 'consistency_metrics') else 0
        
        # Create the visualization context
        context = f"""
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
"""
        return context

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get workout-specific context variables with consolidated formatting."""
        base_vars = await super().get_additional_prompt_vars()

        try:
            # Include the system prompt explicitly
            base_vars["system_prompt"] = self.system_prompt
            
            # Format the visualization context
            base_vars["visualization_context"] = self._format_visualization_context()
            
            # Format workout data context
            workout_context = {
                "available_data": []
            }
            
            if self._data_bundles:
                latest_bundle = self._data_bundles[-1]
                
                # Include the advanced metrics and minimal exercise data
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
                "system_prompt": self.system_prompt,
                "context": "No workout data available",
                "visualization_context": "No visualizations available",
                "messages": self.messages,
                "current_message": ""
            }
        

def load_bundles(self, bundles: List) -> None:
    """Load workout bundles into context"""
    from app.schemas.workout_data_bundle import WorkoutDataBundle
    
    # Ensure all bundles are WorkoutDataBundle instances
    valid_bundles = []
    for bundle in bundles:
        if isinstance(bundle, WorkoutDataBundle):
            valid_bundles.append(bundle)
        else:
            logger.warning(f"Skipping invalid bundle type: {type(bundle)}")
    
    self._data_bundles = valid_bundles.copy()
    logger.info(f"Loaded {len(self._data_bundles)} workout bundles into conversation context")