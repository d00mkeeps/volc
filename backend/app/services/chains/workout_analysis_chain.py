from datetime import datetime
from typing import Dict, Any, List, AsyncGenerator
import logging
import json
import asyncio
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_vertexai import ChatVertexAI
from app.services.workout_analysis.schemas import WorkoutAnalysisBundle
from .base_conversation_chain import BaseConversationChain
from app.services.db.user_profile_service import UserProfileService

logger = logging.getLogger(__name__)


async def stream_text_gradually(text: str, chunk_size: int = 5) -> AsyncGenerator[str, None]:
    """
    Split text into smaller chunks for gradual streaming effect.
    
    Args:
        text: The text to stream
        chunk_size: Number of words per chunk (default 5)
    """
    words = text.split(' ')
    
    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i + chunk_size])
        
        # Add space after chunk if not last chunk
        if i + chunk_size < len(words):
            chunk += ' '
        
        yield chunk
        await asyncio.sleep(0.015)  # 15ms delay between chunks


class WorkoutAnalysisChain(BaseConversationChain):
    """
    Workout-specific conversation chain.
    
    Handles sophisticated workout context formatting, analysis insights,
    and workout-specific prompting for fitness coaching conversations.
    """
    
    def __init__(self, llm: ChatVertexAI, user_id: str):
        super().__init__(llm)
        self.user_id = user_id
        self._data_bundles: List[WorkoutAnalysisBundle] = []
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
    def data_bundles(self) -> List[WorkoutAnalysisBundle]:
        return self._data_bundles

    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Override base process_message to add stream buffering for smoother responses.
        """
        try:
            # Get formatted prompt from subclass implementation
            formatted_prompt = await self.get_formatted_prompt(message)
            
            # Stream the response with buffering
            full_response = ""
            async for chunk in self.chat_model.astream(input=formatted_prompt):
                chunk_content = chunk.content
                if chunk_content:
                    full_response += chunk_content
                    
                    # Stream gradually for smooth typing effect
                    async for mini_chunk in stream_text_gradually(chunk_content, chunk_size=5):
                        yield {
                            "type": "content",
                            "data": mini_chunk
                        }

            # Send completion signal
            yield {
                "type": "complete",
                "data": {"length": len(full_response)}
            }

            # Add both messages to history
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
            logger.debug(f"✅ Message processed. Total messages: {len(self.messages)}")
                
        except Exception as e:
            logger.error(f"❌ Error processing message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }

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
                    #   "Current workout data context:\n{context}\n\n"
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

    async def add_data_bundle(self, bundle: WorkoutAnalysisBundle) -> bool:
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
        
        # Format top performers from NEW schema structure
        strength_highlights = []
        volume_highlights = []
        frequency_highlights = []
        
        # Extract strength highlights from strength_data.top_e1rms
        if hasattr(latest_bundle, 'strength_data') and latest_bundle.strength_data:
            if hasattr(latest_bundle.strength_data, 'top_e1rms'):
                for exercise_data in latest_bundle.strength_data.top_e1rms[:5]:
                    if hasattr(exercise_data, 'exercise'):
                        exercise_name = exercise_data.exercise
                        best_e1rm = exercise_data.best_e1rm
                    elif isinstance(exercise_data, dict):
                        exercise_name = exercise_data.get('exercise', 'Unknown')
                        best_e1rm = exercise_data.get('best_e1rm', 0)
                    else:
                        continue
                        
                    strength_highlights.append(
                        f"{exercise_name}: {best_e1rm:.1f}kg PR"
                    )
        
        # Extract volume highlights from volume_data.by_exercise
        if hasattr(latest_bundle, 'volume_data') and latest_bundle.volume_data:
            by_exercise = None
            if hasattr(latest_bundle.volume_data, 'by_exercise'):
                by_exercise = latest_bundle.volume_data.by_exercise
            elif isinstance(latest_bundle.volume_data, dict):
                by_exercise = latest_bundle.volume_data.get('by_exercise', {})
                
            if by_exercise:
                # Sort by volume and take top performers
                if isinstance(by_exercise, dict):
                    sorted_volumes = sorted(by_exercise.items(), key=lambda x: x[1], reverse=True)
                    for exercise_name, total_volume in sorted_volumes[:5]:
                        volume_highlights.append(
                            f"{exercise_name}: {total_volume:.0f}kg total"
                        )
        
        # Extract frequency highlights from general_workout_data.exercise_frequency
        if hasattr(latest_bundle, 'general_workout_data') and latest_bundle.general_workout_data:
            freq_data = None
            if hasattr(latest_bundle.general_workout_data, 'exercise_frequency'):
                freq_data = latest_bundle.general_workout_data.exercise_frequency
            elif isinstance(latest_bundle.general_workout_data, dict):
                freq_data = latest_bundle.general_workout_data.get('exercise_frequency', {})
                
            if freq_data:
                by_sets = None
                if hasattr(freq_data, 'by_sets'):
                    by_sets = freq_data.by_sets
                elif isinstance(freq_data, dict):
                    by_sets = freq_data.get('by_sets', {})
                    
                if by_sets and isinstance(by_sets, dict):
                    # Sort by set count and take most frequent
                    sorted_freq = sorted(by_sets.items(), key=lambda x: x[1], reverse=True)
                    for exercise_name, set_count in sorted_freq[:5]:
                        frequency_highlights.append(
                            f"{exercise_name}: {set_count} sets"
                        )
        
        # Format consistency metrics (NEW schema: consistency_data)
        consistency_gap = 0
        variance = None
        
        if hasattr(latest_bundle, 'consistency_data') and latest_bundle.consistency_data:
            if hasattr(latest_bundle.consistency_data, 'avg_days_between'):
                # Pydantic model
                consistency_gap = latest_bundle.consistency_data.avg_days_between
                variance = latest_bundle.consistency_data.variance if hasattr(latest_bundle.consistency_data, 'variance') else None
            elif isinstance(latest_bundle.consistency_data, dict):
                # Dict format
                consistency_gap = latest_bundle.consistency_data.get('avg_days_between', 0)
                variance = latest_bundle.consistency_data.get('variance', None)
        
        # Format correlation insights (NEW schema: correlation_insights)
        correlation_summary = "No correlation analysis available"
        top_correlations = []
        
        if hasattr(latest_bundle, 'correlation_insights') and latest_bundle.correlation_insights:
            correlation_data = latest_bundle.correlation_insights
            if hasattr(correlation_data, 'significant_patterns') and correlation_data.significant_patterns:
                correlation_summary = f"{len(correlation_data.significant_patterns)} significant patterns found"
                # Get top 3 patterns for highlights
                for pattern in correlation_data.significant_patterns[:3]:
                    if isinstance(pattern, dict):
                        summary = pattern.get('summary', pattern.get('description', 'Pattern found'))
                        top_correlations.append(f"• {summary}")
        
        # Get workout summary stats
        total_workouts = 'Unknown'
        total_exercises = 'Unknown'
        
        if hasattr(latest_bundle, 'general_workout_data') and latest_bundle.general_workout_data:
            if hasattr(latest_bundle.general_workout_data, 'total_workouts'):
                total_workouts = latest_bundle.general_workout_data.total_workouts
            elif isinstance(latest_bundle.general_workout_data, dict):
                total_workouts = latest_bundle.general_workout_data.get('total_workouts', 'Unknown')
                
            if hasattr(latest_bundle.general_workout_data, 'total_exercises_unique'):
                total_exercises = latest_bundle.general_workout_data.total_exercises_unique
            elif isinstance(latest_bundle.general_workout_data, dict):
                total_exercises = latest_bundle.general_workout_data.get('total_exercises_unique', 'Unknown')
        
        # Create the insights context
        context = f"""
    CONSISTENCY METRICS:
    - Average gap between workouts: {consistency_gap:.1f} days
    - Workout frequency variance: {variance if variance is not None else 'Not calculated'}

    TOP PERFORMERS:
    - Strength PRs: {', '.join(strength_highlights[:3]) if strength_highlights else 'No strength data available'}
    - Volume leaders: {', '.join(volume_highlights[:3]) if volume_highlights else 'No volume data available'}
    - Most frequent exercises: {', '.join(frequency_highlights[:3]) if frequency_highlights else 'Frequency data not available'}

    CORRELATION INSIGHTS:
    {correlation_summary}
    {chr(10).join(top_correlations[:3]) if top_correlations else '• No correlation patterns detected'}

    WORKOUT SUMMARY:
    - Total workouts analyzed: {total_workouts}
    - Exercise variety: {total_exercises} different exercises
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
        
        # NEW schema: date_range is in general_workout_data
        date_range = None
        if hasattr(latest_bundle, 'general_workout_data') and latest_bundle.general_workout_data:
            if hasattr(latest_bundle.general_workout_data, 'date_range'):
                date_range = latest_bundle.general_workout_data.date_range
            elif isinstance(latest_bundle.general_workout_data, dict):
                date_range = latest_bundle.general_workout_data.get('date_range')
        
        # Helper to extract values safely
        def get_value(obj, key, default=None):
            if hasattr(obj, key):
                return getattr(obj, key)
            elif isinstance(obj, dict):
                return obj.get(key, default)
            return default
        
        # Extract metadata
        total_workouts = 0
        total_exercises = 0
        exercises_included = []
        analysis_errors = []
        
        if hasattr(latest_bundle, 'general_workout_data') and latest_bundle.general_workout_data:
            gwd = latest_bundle.general_workout_data
            total_workouts = get_value(gwd, 'total_workouts', 0)
            total_exercises = get_value(gwd, 'total_exercises_unique', 0)
            exercises_included = get_value(gwd, 'exercises_included', [])
        
        if hasattr(latest_bundle, 'metadata') and latest_bundle.metadata:
            meta = latest_bundle.metadata
            analysis_errors = get_value(meta, 'errors', [])
        
        # Build date range dict
        date_range_dict = {}
        if date_range:
            earliest = get_value(date_range, 'earliest')
            latest = get_value(date_range, 'latest')
            date_range_dict = {
                "start": self._format_date(earliest),
                "end": self._format_date(latest)
            }
        
        # Extract strength data
        strength_top_performers = []
        if hasattr(latest_bundle, 'strength_data') and latest_bundle.strength_data:
            sd = latest_bundle.strength_data
            top_e1rms = get_value(sd, 'top_e1rms', [])
            strength_top_performers = top_e1rms[:5] if top_e1rms else []
        
        # Extract volume data
        volume_data_obj = None
        if hasattr(latest_bundle, 'volume_data'):
            volume_data_obj = latest_bundle.volume_data
        
        # Extract exercise frequency
        exercise_frequency_obj = None
        if hasattr(latest_bundle, 'general_workout_data') and latest_bundle.general_workout_data:
            gwd = latest_bundle.general_workout_data
            exercise_frequency_obj = get_value(gwd, 'exercise_frequency')
        
        # Extract consistency data
        consistency_analysis_obj = None
        if hasattr(latest_bundle, 'consistency_data'):
            consistency_analysis_obj = latest_bundle.consistency_data
        
        # Extract correlation insights
        significant_patterns = []
        if hasattr(latest_bundle, 'correlation_insights') and latest_bundle.correlation_insights:
            ci = latest_bundle.correlation_insights
            patterns = get_value(ci, 'significant_patterns', [])
            significant_patterns = patterns[:5] if patterns else []
        
        # Extract recent workouts
        recent_workouts_sample = []
        if hasattr(latest_bundle, 'recent_workouts'):
            rw = latest_bundle.recent_workouts
            recent_workouts_sample = rw[:5] if rw else []
        
        # Build comprehensive workout context with NEW schema
        workout_context = {
            "metadata": {
                "total_workouts": total_workouts,
                "total_exercises": total_exercises,
                "date_range": date_range_dict,
                "exercises_included": exercises_included[:10],  # Limit for context size
                "analysis_errors": analysis_errors
            },
            "performance_summary": {
                "strength_top_performers": strength_top_performers,
                "volume_data": volume_data_obj,
                "exercise_frequency": exercise_frequency_obj
            },
            "consistency_analysis": consistency_analysis_obj,
            "correlation_summary": {
                "significant_patterns": significant_patterns
            },
            "recent_workouts_sample": recent_workouts_sample
        }

        return {
            "system_prompt": enhanced_system_prompt,
            # "context": f"Available workout data:\n{self._serialize_workout_context(workout_context)}",
            "insights_context": self._format_insights_context(),
            "messages": self.messages,
            "current_message": ""
        }


    def load_bundles(self, bundles: List) -> None:
        """Load workout bundles into context"""        
        valid_bundles = []
        for bundle in bundles:
            if isinstance(bundle, WorkoutAnalysisBundle):
                valid_bundles.append(bundle)
            else:
                logger.warning(f"Skipping invalid bundle type: {type(bundle)}")
        
        self._data_bundles = valid_bundles.copy()
        logger.info(f"Loaded {len(self._data_bundles)} workout bundles into conversation context")