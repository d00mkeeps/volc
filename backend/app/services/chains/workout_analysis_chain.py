from datetime import datetime
from typing import Dict, Any, List
import logging
import json
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_vertexai import ChatVertexAI
from app.services.workout_analysis.schemas import WorkoutDataBundle
from .base_conversation_chain import BaseConversationChain

logger = logging.getLogger(__name__)

class WorkoutAnalysisChain(BaseConversationChain):
    def __init__(self, llm: ChatVertexAI, user_id: str):
        system_prompt = """ try and talk like a human fitness coach! if the developer messages, find a way to talk about birds or colours."""

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
                      "Analysis insights:\n{insights_context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    def _serialize_for_json(self, data):
        """
        Convert any data structure containing Pydantic models to JSON-serializable format.
        
        Handles:
        - Pydantic models (ConsistencyMetrics, CorrelationCalculatorResult, etc.)
        - Nested dictionaries and lists
        - DateTime objects
        - Regular Python types
        """
        if isinstance(data, dict):
            return {k: self._serialize_for_json(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._serialize_for_json(item) for item in data]
        elif hasattr(data, "model_dump"):  # Pydantic models
            return self._serialize_for_json(data.model_dump())
        elif isinstance(data, datetime):
            return data.isoformat()
        else:
            return data

    def _serialize_workout_context(self, workout_context: dict) -> str:
        """Convert workout context with Pydantic objects to JSON string."""
        return json.dumps(self._serialize_for_json(workout_context), indent=2)

    async def add_data_bundle(self, bundle: WorkoutDataBundle) -> bool:
        """Add workout data bundle to conversation context without adding system messages."""
        try:
            # Store the bundle
            self._data_bundles.append(bundle)
            
            # Log success but don't add to message history
            logger.info(f"Added workout data bundle to conversation context")
            
            # Log top performers if available
            if hasattr(bundle, 'top_performers') and bundle.top_performers:
                strength_count = len(bundle.top_performers.strength)
                volume_count = len(bundle.top_performers.volume)
                logger.info(f"Bundle has {strength_count} strength performers, {volume_count} volume performers")
                
                if bundle.top_performers.strength:
                    top_strength = bundle.top_performers.strength[0]
                    logger.info(f"Top strength performer: {top_strength.get('name')} (+{top_strength.get('change_percent')}%)")
            
            # Log correlation insights
            if hasattr(bundle, 'correlation_data') and bundle.correlation_data:
                logger.info(f"Bundle has {bundle.correlation_data.significant_count} significant correlations")
            
            return True
        except Exception as e:
            logger.error(f"Failed to add workout data bundle: {str(e)}", exc_info=True)
            return False

    def _format_date(self, dt) -> str:
        """Format datetime to string."""
        if dt is None:
            return None
        
        if isinstance(dt, str):
            return dt
        
        if isinstance(dt, datetime):
            return dt.isoformat()
        
        return str(dt)

    def _format_insights_context(self) -> str:
        """Format analysis insights for the latest bundle (replaces old chart context)."""
        if not self._data_bundles:
            return "No workout analysis available"
        
        latest_bundle = self._data_bundles[-1]
        
        # Format top performers
        strength_highlights = []
        volume_highlights = []
        frequency_highlights = []
        
        if hasattr(latest_bundle, 'top_performers') and latest_bundle.top_performers:
            # Process strength performers
            for performer in latest_bundle.top_performers.strength:
                if isinstance(performer, dict) and performer.get('change_percent', 0) > 0:
                    strength_highlights.append(
                        f"{performer.get('name')}: +{performer.get('change_percent')}%"
                    )
            
            # Process volume performers  
            for performer in latest_bundle.top_performers.volume:
                if isinstance(performer, dict) and performer.get('change_percent', 0) > 0:
                    volume_highlights.append(
                        f"{performer.get('name')}: +{performer.get('change_percent')}%"
                    )
            
            # Process frequency performers (handle empty array gracefully)
            if latest_bundle.top_performers.frequency:  # Only process if not empty
                for performer in latest_bundle.top_performers.frequency:
                    if isinstance(performer, dict):
                        frequency_highlights.append(
                            f"{performer.get('name')}: {int(performer.get('first_value', 0))} sessions"
                        )
        
        # Format consistency metrics
        consistency_gap = 0
        variance = None
        
        if hasattr(latest_bundle, 'consistency_metrics') and latest_bundle.consistency_metrics:
            if hasattr(latest_bundle.consistency_metrics, 'avg_gap'):
                # Pydantic model
                consistency_gap = latest_bundle.consistency_metrics.avg_gap
                variance = latest_bundle.consistency_metrics.variance
            elif isinstance(latest_bundle.consistency_metrics, dict):
                # Dict format
                consistency_gap = latest_bundle.consistency_metrics.get('avg_gap', 0)
                variance = latest_bundle.consistency_metrics.get('variance', None)
        
        # Format correlation insights
        correlation_summary = "No correlation analysis available"
        top_correlations = []
        
        if hasattr(latest_bundle, 'correlation_data') and latest_bundle.correlation_data:
            correlation_data = latest_bundle.correlation_data
            significant_count = correlation_data.significant_count if hasattr(correlation_data, 'significant_count') else 0
            total_analyzed = correlation_data.total_pairs_analyzed if hasattr(correlation_data, 'total_pairs_analyzed') else 0
            
            correlation_summary = f"{significant_count} significant correlations found from {total_analyzed} exercise pairs analyzed"
            
            # Get top 3 correlations for highlights
            if hasattr(correlation_data, 'significant_correlations') and correlation_data.significant_correlations:
                for i, corr in enumerate(correlation_data.significant_correlations[:3]):
                    if isinstance(corr, dict):
                        summary = corr.get('summary', 'Correlation found')
                        top_correlations.append(f"• {summary}")
                    elif hasattr(corr, 'summary'):
                        top_correlations.append(f"• {corr.summary}")
        
        # Create the insights context
        context = f"""
CONSISTENCY METRICS:
- Average gap between workouts: {consistency_gap:.1f} days
- Workout frequency variance: {variance if variance is not None else 'Not calculated'}

TOP PERFORMERS:
- Strength gains: {', '.join(strength_highlights[:3]) if strength_highlights else 'No significant strength gains detected'}
- Volume increases: {', '.join(volume_highlights[:3]) if volume_highlights else 'No significant volume increases detected'}
- Most frequent exercises: {', '.join(frequency_highlights[:3]) if frequency_highlights else 'Frequency data not available'}

CORRELATION INSIGHTS:
{correlation_summary}
{chr(10).join(top_correlations[:3]) if top_correlations else '• No correlation patterns detected'}

WORKOUT SUMMARY:
- Total workouts analyzed: {latest_bundle.metadata.total_workouts if hasattr(latest_bundle, 'metadata') else 'Unknown'}
- Exercise variety: {len(latest_bundle.metadata.exercises_included) if hasattr(latest_bundle, 'metadata') and latest_bundle.metadata.exercises_included else 'Unknown'} different exercises
"""
        return context

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        if not self._data_bundles:
            return {
                "system_prompt": self.system_prompt,
                "context": "No workout data available", 
                "insights_context": "No analysis insights available",
                "messages": self.messages,
                "current_message": ""
            }

        latest_bundle = self._data_bundles[-1]
        date_range = latest_bundle.metadata.date_range
        
        # Build comprehensive workout context
        workout_context = {
            "metadata": {
                "total_workouts": latest_bundle.metadata.total_workouts,
                "total_exercises": latest_bundle.metadata.total_exercises,
                "date_range": {
                    "start": self._format_date(date_range.get('earliest')),
                    "end": self._format_date(date_range.get('latest'))
                },
                "exercises_included": latest_bundle.metadata.exercises_included[:10],  # Limit for context size
                "analysis_errors": latest_bundle.metadata.errors if latest_bundle.metadata.errors else []
            },
            "performance_summary": {
                "strength_top_performers": latest_bundle.top_performers.strength[:5],  # Top 5
                "volume_top_performers": latest_bundle.top_performers.volume[:5],      # Top 5
                "frequency_performers": latest_bundle.top_performers.frequency[:3]     # Top 3
            },
            "consistency_analysis": latest_bundle.consistency_metrics,
            "correlation_summary": {
                "significant_count": latest_bundle.correlation_data.significant_count if latest_bundle.correlation_data else 0,
                "total_analyzed": latest_bundle.correlation_data.total_pairs_analyzed if latest_bundle.correlation_data else 0,
                "top_correlations": latest_bundle.correlation_data.significant_correlations[:5] if latest_bundle.correlation_data and latest_bundle.correlation_data.significant_correlations else [],
                "data_quality": latest_bundle.correlation_data.data_quality_notes[:3] if latest_bundle.correlation_data and latest_bundle.correlation_data.data_quality_notes else []
            },
            "recent_workouts_sample": latest_bundle.workouts.get('workouts', [])[:5] if hasattr(latest_bundle.workouts, 'get') and latest_bundle.workouts.get('workouts') else []
        }

        return {
            "system_prompt": self.system_prompt,
            "context": f"Available workout data:\n{self._serialize_workout_context(workout_context)}",
            "insights_context": self._format_insights_context(),
            "messages": self.messages,
            "current_message": ""
        }
    
    def load_bundles(self, bundles: List) -> None:
        """Load workout bundles into context"""        
        valid_bundles = []
        for bundle in bundles:
            if isinstance(bundle, WorkoutDataBundle):
                valid_bundles.append(bundle)
            else:
                logger.warning(f"Skipping invalid bundle type: {type(bundle)}")
        
        self._data_bundles = valid_bundles.copy()
        logger.info(f"Loaded {len(self._data_bundles)} workout bundles into conversation context")