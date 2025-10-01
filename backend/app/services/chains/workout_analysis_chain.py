from datetime import datetime
from typing import Dict, Any, List
import logging
import json
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_vertexai import ChatVertexAI
from app.services.workout_analysis.schemas import WorkoutDataBundle
from .base_conversation_chain import BaseConversationChain
from app.services.db.user_profile_service import UserProfileService

logger = logging.getLogger(__name__)

class WorkoutAnalysisChain(BaseConversationChain):
    """
    Workout-specific conversation chain.
    
    Handles sophisticated workout context formatting, analysis insights,
    and workout-specific prompting for fitness coaching conversations.
    """
    
    def __init__(self, llm: ChatVertexAI, user_id: str):
        super().__init__(llm)
        self.user_id = user_id
        self._data_bundles: List[WorkoutDataBundle] = []
        self._user_profile = None  # Add user profile storage
        self.user_profile_service = UserProfileService()  # Add profile service
        self.system_prompt = """Talk like a human fitness coach! try to get an idea of how the user feels about their workout. 
        
        Tone:
- Ask thoughtful questions to understand their specific situation
- Be encouraging and supportive
- Consider their experience level when suggesting exercises/volume
- Be conversational and friendly, not clinical or robotic
- Try to keep responses brief, with no more than two questions per response. 
- Use asyndecation where it makes sense
- Use a more casual verb form construction on occasion [ex. "How much time do you have?" (standard/formal auxiliary "do")
- Informal phrasing where appropriate [ex. "How much time've you got?" (more colloquial/informal construction)]

"""
        self._initialize_prompt_template()
        self.logger = logging.getLogger(__name__)

    @property
    def data_bundles(self) -> List[WorkoutDataBundle]:
        return self._data_bundles

    async def load_user_profile(self) -> bool:
        """Load user profile data for context."""
        try:
            if not self.user_id:
                logger.warning("No user_id provided for profile loading")
                return False
                
            profile_result = await self.user_profile_service.get_user_profile_admin(self.user_id)
            if profile_result.get('success') and profile_result.get('data'):
                self._user_profile = profile_result['data']
                logger.info(f"Loaded user profile for user {self.user_id}")
                return True
            else:
                logger.warning(f"Failed to load profile for user {self.user_id}: {profile_result.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            logger.error(f"Exception loading user profile for {self.user_id}: {str(e)}", exc_info=True)
            return False

    def _format_user_context(self) -> str:
        """Format user profile context for the LLM."""
        if not self._user_profile:
            return ""
        
        profile = self._user_profile
        
        # Extract key information
        name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
        age = profile.get('age')
        is_imperial = profile.get('is_imperial', False)
        units = "imperial (lb/mi)" if is_imperial else "metric (kg/km)"
        

        goals = profile.get('goals', {})
        if isinstance(goals, dict) and 'content' in goals:
            primary_goal = goals['content']
        elif isinstance(goals, str):
            primary_goal = goals
        else:
            primary_goal = 'Not specified'

        # Handle current_stats - database format: "intermediate" (string)
        current_stats = profile.get('current_stats')
        if isinstance(current_stats, str):
            experience = current_stats
        elif isinstance(current_stats, dict) and 'notes' in current_stats:
            experience = current_stats['notes']
        else:
            experience = 'Not specified'

        
        context = f"""
USER PROFILE:
- Name: {name or 'Not provided'}
- Age: {age if age else 'Not provided'}
- Preferred units: {units}
- Primary fitness goal: {primary_goal}
- Experience level: {experience}

IMPORTANT: Always use the user's preferred units when discussing weights, distances, and measurements. 
When providing advice, consider their age, goals, and experience level."""
        
        return context

    def _initialize_prompt_template(self) -> None:
        """Sets up the workout-specific prompt template with consolidated context."""
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}\n\n"
                      "Current workout data context:\n{context}\n\n"
                      "Analysis insights:\n{insights_context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    async def get_formatted_prompt(self, message: str):
        """
        Format workout-specific prompt with context and insights.
        
        Combines system prompt, workout data context, analysis insights,
        message history, and current message into LangChain format.
        """
        prompt_vars = await self.get_additional_prompt_vars()
        prompt_vars["current_message"] = message
        return self.prompt.format_messages(**prompt_vars)

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
        """Get all variables needed for workout-specific prompt formatting."""
        
        # Build enhanced system prompt with user context
        base_prompt = self.system_prompt
        user_context = self._format_user_context()
        
        # Combine base prompt with user context
        enhanced_system_prompt = base_prompt
        if user_context:
            enhanced_system_prompt = f"{base_prompt}\n{user_context}"
        
        if not self._data_bundles:
            return {
                "system_prompt": enhanced_system_prompt,
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
            "system_prompt": enhanced_system_prompt,  # Use enhanced prompt with user context
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