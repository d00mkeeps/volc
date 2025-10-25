from datetime import datetime
from typing import Dict, Any, List, Optional, AsyncGenerator
import logging
import json
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.schemas import WorkoutAnalysisBundle
from .base_conversation_chain import BaseConversationChain
from app.core.prompts.workout_analysis import get_workout_analysis_prompt

logger = logging.getLogger(__name__)

class WorkoutAnalysisChain(BaseConversationChain):
    def __init__(self, llm: ChatAnthropic, user_id: str):
        # Initialize base class (only takes llm)
        super().__init__(llm=llm)
        
        # Load the enhanced prompt from separate file
        self.system_prompt = get_workout_analysis_prompt()
        self.user_id = user_id
        self._data_bundles: List[WorkoutAnalysisBundle] = []
        self._user_profile = None
        self.logger = logging.getLogger(__name__)
        
        # Initialize user profile service
        from app.services.db.user_profile_service import UserProfileService
        self.user_profile_service = UserProfileService()
        
        # Initialize the prompt template
        self._initialize_prompt_template()

    @property
    def data_bundles(self) -> List[WorkoutAnalysisBundle]:
        return self._data_bundles

    def _initialize_prompt_template(self) -> None:
        """Sets up the workout-specific prompt template with XML-structured context."""
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}\n\n{workout_context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    async def add_data_bundle(self, bundle: WorkoutAnalysisBundle) -> bool:
        """Add workout data bundle to conversation context."""
        try:
            self._data_bundles.append(bundle)
            logger.info(f"Added workout data bundle to conversation context")
            
            # Log availability for debugging
            available_charts = []
            if hasattr(bundle, 'chart_urls') and bundle.chart_urls:
                available_charts = list(bundle.chart_urls.keys())
            logger.info(f"Bundle has {len(available_charts)} charts available")
            
            return True
        except Exception as e:
            logger.error(f"Failed to add workout data bundle: {str(e)}", exc_info=True)
            return False

    def _format_date(self, dt: datetime) -> str:
        """Format datetime to string."""
        return dt.isoformat() if dt else None

    def _format_user_profile_context(self) -> str:
        """Format user profile with XML structure."""
        if not self._user_profile:
            return ""
        
        profile = self._user_profile
        name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
        age = profile.get('age')
        is_imperial = profile.get('is_imperial', False)
        units = "imperial (lb/mi)" if is_imperial else "metric (kg/km)"
        
        # Extract goals
        goals = profile.get('goals', {})
        if isinstance(goals, dict) and 'content' in goals:
            primary_goal = goals['content']
        elif isinstance(goals, str):
            primary_goal = goals
        else:
            primary_goal = 'Not specified'
        
        # Extract experience level
        current_stats = profile.get('current_stats')
        if isinstance(current_stats, str):
            experience = current_stats
        elif isinstance(current_stats, dict) and 'notes' in current_stats:
            experience = current_stats['notes']
        else:
            experience = 'Not specified'
        
        return f"""<user_profile>
  <name>{name or 'Not provided'}</name>
  <age>{age if age else 'Not provided'}</age>
  <units>{units}</units>
  <primary_goal>{primary_goal}</primary_goal>
  <experience_level>{experience}</experience_level>
  <important>Always use {units} when discussing weights and distances</important>
</user_profile>"""

    def _format_workout_data_context(self) -> str:
        """Format workout data with XML structure for better LLM attention."""
        if not self._data_bundles:
            return "<workout_data><status>No workout data available</status></workout_data>"
        
        latest_bundle = self._data_bundles[-1]
        
        # Extract date range from general_workout_data
        date_range = latest_bundle.general_workout_data.date_range
        date_start = self._format_date(date_range.earliest)
        date_end = self._format_date(date_range.latest)
        
        # Extract strength progression from strength_data.top_e1rms
        strength_prog = ""
        if latest_bundle.strength_data and latest_bundle.strength_data.top_e1rms:
            top_strength = latest_bundle.strength_data.top_e1rms[:5]
            strength_items = []
            for ex in top_strength:
                strength_items.append(
                    f"    <exercise>\n"
                    f"      <name>{ex.exercise}</name>\n"
                    f"      <best_e1rm>{ex.best_e1rm:.1f}kg</best_e1rm>\n"
                    f"      <achieved_date>{self._format_date(ex.achieved_date)}</achieved_date>\n"
                    f"      <note>e1RM = Estimated 1 Rep Max (calculated, not tested)</note>\n"
                    f"    </exercise>"
                )
            strength_prog = "\n".join(strength_items)
        
        # Extract volume data
        volume_info = ""
        if latest_bundle.volume_data:
            vol = latest_bundle.volume_data
            # Get top 5 exercises by volume
            top_volume = sorted(vol.by_exercise.items(), key=lambda x: x[1], reverse=True)[:5]
            volume_items = []
            for exercise, volume in top_volume:
                volume_items.append(
                    f"    <exercise>\n"
                    f"      <name>{exercise}</name>\n"
                    f"      <total_volume_kg>{volume:.1f}kg</total_volume_kg>\n"
                    f"    </exercise>"
                )
            volume_exercises = "\n".join(volume_items) if volume_items else "    <status>No volume data</status>"
            
            volume_info = f"""  <volume_data>
    <total_volume_kg>{vol.total_volume_kg:.1f}kg</total_volume_kg>
    <today_volume_kg>{vol.today_volume_kg:.1f}kg</today_volume_kg>
    <top_exercises_by_volume>
{volume_exercises}
    </top_exercises_by_volume>
  </volume_data>"""
        
        # Extract consistency metrics
        consistency_info = ""
        if latest_bundle.consistency_data:
            cons = latest_bundle.consistency_data
            variance_str = f"{cons.variance:.2f}" if cons.variance is not None else "Not calculated"
            consistency_info = f"""  <consistency_data>
    <avg_days_between_workouts>{cons.avg_days_between:.1f} days</avg_days_between_workouts>
    <variance>{variance_str}</variance>
    <total_workouts_tracked>{len(cons.workout_dates)}</total_workouts_tracked>
  </consistency_data>"""
        
        # Extract exercise frequency
        frequency_info = ""
        if latest_bundle.general_workout_data.exercise_frequency:
            freq = latest_bundle.general_workout_data.exercise_frequency
            # Get top 5 most frequent exercises
            top_freq = sorted(freq.by_sets.items(), key=lambda x: x[1], reverse=True)[:5]
            freq_items = []
            for exercise, sets in top_freq:
                freq_items.append(
                    f"    <exercise>\n"
                    f"      <name>{exercise}</name>\n"
                    f"      <total_sets>{sets}</total_sets>\n"
                    f"    </exercise>"
                )
            frequency_info = "\n".join(freq_items) if freq_items else "    <status>No frequency data</status>"
        
        # Extract correlations
        correlations_data = ""
        if latest_bundle.correlation_insights and latest_bundle.correlation_insights.significant_patterns:
            patterns = latest_bundle.correlation_insights.significant_patterns[:3]
            pattern_items = []
            for pattern in patterns:
                if isinstance(pattern, dict):
                    pattern_items.append(
                        f"    <pattern>\n"
                        f"      <description>{pattern.get('summary', pattern.get('description', 'Pattern detected'))}</description>\n"
                        f"      <strength>{pattern.get('correlation_strength', 'moderate')}</strength>\n"
                        f"    </pattern>"
                    )
            correlations_data = "\n".join(pattern_items) if pattern_items else "    <status>No significant correlations detected</status>"
        else:
            correlations_data = "    <status>No significant correlations detected</status>"
        
        # Build full XML context
        context = f"""<workout_data>
  <date_range>
    <start>{date_start}</start>
    <end>{date_end}</end>
    <total_workouts>{latest_bundle.general_workout_data.total_workouts}</total_workouts>
    <unique_exercises>{latest_bundle.general_workout_data.total_exercises_unique}</unique_exercises>
  </date_range>

  <strength_progression>
{strength_prog if strength_prog else "    <status>No strength progression data</status>"}
  </strength_progression>

{volume_info if volume_info else "  <volume_data><status>No volume data</status></volume_data>"}

{consistency_info if consistency_info else "  <consistency_data><status>No consistency data</status></consistency_data>"}

  <exercise_frequency>
{frequency_info if frequency_info else "    <status>No frequency data</status>"}
  </exercise_frequency>

  <correlation_insights>
{correlations_data}
  </correlation_insights>
</workout_data>"""
        
        return context

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get workout-specific context variables with XML formatting."""
        try:
            # Build the complete workout context with both profile and data
            user_profile_xml = self._format_user_profile_context()
            workout_data_xml = self._format_workout_data_context()
            
            # Combine into single context block
            full_context = ""
            if user_profile_xml:
                full_context += user_profile_xml + "\n\n"
            full_context += workout_data_xml
            
            return {
                "system_prompt": self.system_prompt,
                "workout_context": full_context,
                "messages": self.messages,
                "current_message": ""
            }
            
        except Exception as e:
            self.logger.error(f"Error getting prompt variables: {str(e)}", exc_info=True)
            return {
                "system_prompt": self.system_prompt,
                "workout_context": "<workout_data><status>Error loading workout data</status></workout_data>",
                "messages": self.messages,
                "current_message": ""
            }

    async def get_formatted_prompt(self, message: str):
        """
        Format the prompt for LangChain (required by BaseConversationChain).
        
        Returns formatted messages ready for the LLM.
        """
        # Get all the context variables
        prompt_vars = await self.get_additional_prompt_vars()
        
        # Set the current message
        prompt_vars["current_message"] = message
        
        # Format using the template and return the messages
        formatted_messages = self.prompt.format_messages(**prompt_vars)
        
        return formatted_messages

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
                logger.warning(f"Failed to load profile: {profile_result.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            logger.error(f"Exception loading user profile: {str(e)}", exc_info=True)
            return False

    def load_bundles(self, bundles: List) -> None:
        """Load workout bundles into context."""
        valid_bundles = []
        for bundle in bundles:
            if isinstance(bundle, WorkoutAnalysisBundle):
                valid_bundles.append(bundle)
            else:
                logger.warning(f"Skipping invalid bundle type: {type(bundle)}")
        
        self._data_bundles = valid_bundles.copy()
        logger.info(f"Loaded {len(self._data_bundles)} workout bundles into conversation context")