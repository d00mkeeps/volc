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
        
        # Extract date range
        date_range = latest_bundle.metadata.date_range
        date_start = self._format_date(date_range['earliest'])
        date_end = self._format_date(date_range['latest'])
        
        # Extract metrics
        metrics = latest_bundle.workout_data.get('metrics', {})
        
        # Format exercise progression
        exercise_prog = ""
        if 'exercise_progression' in metrics:
            top_exercises = metrics['exercise_progression'][:5]  # Top 5
            exercise_items = []
            for ex in top_exercises:
                exercise_items.append(
                    f"    <exercise>\n"
                    f"      <name>{ex.get('name', 'Unknown')}</name>\n"
                    f"      <weight_change_percent>{ex.get('weight_change_percent', 0):.1f}%</weight_change_percent>\n"
                    f"      <volume_change_percent>{ex.get('volume_change_percent', 0):.1f}%</volume_change_percent>\n"
                    f"      <total_sessions>{ex.get('total_sessions', 0)}</total_sessions>\n"
                    f"    </exercise>"
                )
            exercise_prog = "\n".join(exercise_items)
        
        # Format strength progression
        strength_prog = ""
        if 'strength_progression' in metrics:
            top_strength = metrics['strength_progression'][:5]
            strength_items = []
            for ex in top_strength:
                strength_items.append(
                    f"    <exercise>\n"
                    f"      <name>{ex.get('name', 'Unknown')}</name>\n"
                    f"      <e1rm_change_kg>{ex.get('e1rm_change_kg', 0):.1f}kg</e1rm_change_kg>\n"
                    f"      <e1rm_change_percent>{ex.get('e1rm_change_percent', 0):.1f}%</e1rm_change_percent>\n"
                    f"      <monthly_rate>{ex.get('monthly_rate', 0):.1f}kg/month</monthly_rate>\n"
                    f"      <note>e1RM = Estimated 1 Rep Max (calculated, not tested)</note>\n"
                    f"    </exercise>"
                )
            strength_prog = "\n".join(strength_items)
        
        # Format frequency metrics
        frequency_data = ""
        if 'workout_frequency' in metrics:
            freq = metrics['workout_frequency']
            frequency_data = f"""  <workout_frequency>
    <consistency_score>{freq.get('consistency_score', 0):.0f}/100</consistency_score>
    <avg_workouts_per_week>{freq.get('avg_workouts_per_week', 0):.1f}</avg_workouts_per_week>
    <current_streak>{freq.get('current_streak', 0)} workouts</current_streak>
    <avg_days_between_workouts>{freq.get('avg_gap', 0):.1f} days</avg_days_between_workouts>
  </workout_frequency>"""
        
        # Format top performers
        top_performers = ""
        if 'most_improved_exercises' in metrics:
            improved = metrics['most_improved_exercises'][:3]
            perf_items = []
            for ex in improved:
                perf_items.append(
                    f"    <exercise>\n"
                    f"      <name>{ex.get('name', 'Unknown')}</name>\n"
                    f"      <improvement_type>{ex.get('type', 'Unknown')}</improvement_type>\n"
                    f"      <change_percent>{ex.get('change_percent', 0):.1f}%</change_percent>\n"
                    f"    </exercise>"
                )
            top_performers = "\n".join(perf_items)
        
        # Format correlations
        correlations_data = ""
        if latest_bundle.correlation_data and latest_bundle.correlation_data.summary:
            summary = latest_bundle.correlation_data.summary
            if 'significant_patterns' in summary:
                patterns = summary['significant_patterns'][:3]
                pattern_items = []
                for pattern in patterns:
                    if isinstance(pattern, dict):
                        pattern_items.append(
                            f"    <pattern>\n"
                            f"      <description>{pattern.get('summary', pattern.get('description', 'Pattern detected'))}</description>\n"
                            f"      <strength>{pattern.get('correlation_strength', 'moderate')}</strength>\n"
                            f"    </pattern>"
                        )
                correlations_data = "\n".join(pattern_items)
        
        # Build full XML context
        context = f"""<workout_data>
  <date_range>
    <start>{date_start}</start>
    <end>{date_end}</end>
    <total_workouts>{latest_bundle.metadata.total_workouts}</total_workouts>
  </date_range>

  <exercise_progression>
{exercise_prog if exercise_prog else "    <status>No exercise progression data</status>"}
  </exercise_progression>

  <strength_progression>
{strength_prog if strength_prog else "    <status>No strength progression data</status>"}
  </strength_progression>

{frequency_data if frequency_data else "  <workout_frequency><status>No frequency data</status></workout_frequency>"}

  <top_performers>
{top_performers if top_performers else "    <status>No top performers data</status>"}
  </top_performers>

  <correlation_insights>
{correlations_data if correlations_data else "    <status>No significant correlations detected</status>"}
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

    async def load_user_profile(self, user_profile_service) -> bool:
        """Load user profile data for context."""
        try:
            if not self.user_id:
                logger.warning("No user_id provided for profile loading")
                return False
                
            profile_result = await user_profile_service.get_user_profile_admin(self.user_id)
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