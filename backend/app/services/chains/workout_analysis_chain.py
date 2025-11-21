from datetime import datetime
from typing import Dict, Any, List, AsyncGenerator
import logging
import re
import json
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.schemas import WorkoutAnalysisBundle
from .base_conversation_chain import BaseConversationChain
from app.core.prompts.workout_analysis import get_workout_analysis_prompt

logger = logging.getLogger(__name__)

class WorkoutAnalysisChain(BaseConversationChain):
    """
    Workout analysis conversation chain with time series support.
    
    Location: /app/services/chains/workout_analysis_chain.py
    """
    
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
        """
        Sets up the workout-specific prompt template with XML-structured context.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain._initialize_prompt_template()
        """
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}\n\n{workout_context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process message and check for chart data.
        
        Overrides base class to add chart data extraction.
        """
        try:
            # Get formatted prompt
            formatted_prompt = await self.get_formatted_prompt(message)
            
            # Stream response
            full_response = ""
            async for chunk in self.chat_model.astream(input=formatted_prompt):
                chunk_content = chunk.content
                if chunk_content:
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }
            
            # Check for chart data in response
            chart_data = self._extract_chart_data(full_response)
            
            # If chart data extracted, send it to frontend
            if chart_data:
                yield {
                    "type": "chart_data",
                    "data": chart_data
                }
                logger.info(f"✅ Chart data extracted and sent")
            
            # Send completion signal
            yield {
                "type": "complete",
                "data": {"length": len(full_response)}
            }
            
            # Add messages to history
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
        except Exception as e:
            logger.error(f"Error processing analysis message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }

    def _extract_chart_data(self, response: str) -> Dict[str, Any]:
        """Extract chart data from JSON block in LLM response."""
        try:
            # Look for JSON code blocks
            json_pattern = r'```json\s*(.*?)\s*```'
            json_matches = re.findall(json_pattern, response, re.DOTALL)
            
            for json_str in json_matches:
                try:
                    # Clean up potential comments in JSON (simple strip)
                    cleaned_json = json_str.strip()
                    # Remove JS-style comments if any (LLMs sometimes add them)
                    cleaned_json = re.sub(r'//.*', '', cleaned_json)
                    
                    parsed_json = json.loads(cleaned_json)
                    
                    # Check if this is chart data
                    if parsed_json.get('type') == 'chart_data' and 'data' in parsed_json:
                        return parsed_json['data']
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON in response: {e}")
                    continue
                    
            return None
                    
        except Exception as e:
            logger.error(f"Error extracting chart data: {str(e)}", exc_info=True)
            return None

    async def add_data_bundle(self, bundle: WorkoutAnalysisBundle) -> bool:
        """
        Add workout data bundle to conversation context.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain.add_data_bundle()
        """
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
        """
        Format datetime to string.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain._format_date()
        """
        return dt.isoformat() if dt else None

    def _format_user_profile_context(self) -> str:
        """
        Format user profile with XML structure.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain._format_user_profile_context()
        """
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

    def _format_strength_progression_time_series(self, strength_data) -> str:
        """
        Format strength progression with time series data.
        
        Shows complete e1RM progression over time for top exercises, enabling
        the coach to discuss trends, gains, plateaus, and velocity of improvement.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain._format_strength_progression_time_series()
        
        Args:
            strength_data: StrengthData object with exercise_strength_progress
            
        Returns:
            XML-formatted string with time series data
        """
        if not strength_data or not hasattr(strength_data, 'exercise_strength_progress'):
            return "    <status>No strength progression data</status>"
        
        exercise_progress_list = strength_data.exercise_strength_progress
        if not exercise_progress_list:
            return "    <status>No strength progression data</status>"
        
        # Get top 5 exercises by best e1RM
        exercises_with_best = []
        for ex_prog in exercise_progress_list:
            if ex_prog.e1rm_time_series:
                best_point = max(ex_prog.e1rm_time_series, key=lambda x: x.estimated_1rm)
                exercises_with_best.append({
                    'exercise': ex_prog.exercise,
                    'best_e1rm': best_point.estimated_1rm,
                    'time_series': ex_prog.e1rm_time_series
                })
        
        if not exercises_with_best:
            return "    <status>No strength progression data</status>"
        
        top_exercises = sorted(exercises_with_best, key=lambda x: x['best_e1rm'], reverse=True)[:5]
        
        strength_items = []
        for ex_data in top_exercises:
            # Build time series points
            time_series_points = []
            for point in ex_data['time_series']:
                time_series_points.append(
                    f"            <data_point>\n"
                    f"                <date>{self._format_date(point.date)}</date>\n"
                    f"                <e1rm>{point.estimated_1rm:.1f}kg</e1rm>\n"
                    f"            </data_point>"
                )
            time_series_xml = "\n".join(time_series_points)
            
            # Calculate total change and change rate
            if len(ex_data['time_series']) > 1:
                first_point = ex_data['time_series'][0]
                last_point = ex_data['time_series'][-1]
                
                first_e1rm = first_point.estimated_1rm
                last_e1rm = last_point.estimated_1rm
                
                change_kg = last_e1rm - first_e1rm
                change_pct = (change_kg / first_e1rm) * 100 if first_e1rm > 0 else 0
                
                # Calculate days between first and last measurement
                days_diff = (last_point.date - first_point.date).days
                change_per_week = (change_kg / days_diff * 7) if days_diff > 0 else 0
                
                change_str = f"+{change_kg:.1f}kg (+{change_pct:.1f}%)" if change_kg >= 0 else f"{change_kg:.1f}kg ({change_pct:.1f}%)"
                rate_str = f"{abs(change_per_week):.1f}kg/week"
            else:
                change_str = "Insufficient data"
                rate_str = "N/A"
            
            best_date = max(ex_data['time_series'], key=lambda x: x.estimated_1rm).date
            
            strength_items.append(
                f"    <exercise>\n"
                f"        <name>{ex_data['exercise']}</name>\n"
                f"        <time_series>\n"
                f"{time_series_xml}\n"
                f"        </time_series>\n"
                f"        <summary>\n"
                f"            <best_e1rm>{ex_data['best_e1rm']:.1f}kg</best_e1rm>\n"
                f"            <total_change>{change_str}</total_change>\n"
                f"            <rate_of_change>{rate_str}</rate_of_change>\n"
                f"            <achieved_date>{self._format_date(best_date)}</achieved_date>\n"
                f"        </summary>\n"
                f"    </exercise>"
            )
        
        strength_prog = "\n".join(strength_items)
        strength_prog += "\n    <note>e1RM = Estimated 1 Rep Max (calculated from sets/reps/weight, not actual tested 1RM)</note>"
        
        return strength_prog

    def _format_volume_time_series(self, volume_data) -> str:
        """
        Format volume progression with time series data.
        
        Shows volume trends over time for top exercises, enabling the coach
        to discuss work capacity, volume periodization, and fatigue management.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain._format_volume_time_series()
        
        Args:
            volume_data: VolumeData object with volume_by_exercise_over_time
            
        Returns:
            XML-formatted string with volume time series
        """
        if not volume_data:
            return "    <status>No volume data</status>"
        
        # Calculate total volume per exercise
        exercise_volumes = {}
        if hasattr(volume_data, 'volume_by_exercise_over_time') and volume_data.volume_by_exercise_over_time:
            for exercise_data in volume_data.volume_by_exercise_over_time:
                total_volume = sum(point.volume_kg for point in exercise_data.time_series)
                exercise_volumes[exercise_data.exercise] = {
                    'total': total_volume,
                    'time_series': exercise_data.time_series
                }
        
        if not exercise_volumes:
            return "    <status>No volume data</status>"
        
        # Get top 5 exercises by total volume
        top_volume_exercises = sorted(
            exercise_volumes.items(),
            key=lambda x: x[1]['total'],
            reverse=True
        )[:5]
        
        volume_items = []
        for exercise, data in top_volume_exercises:
            # Build time series points
            time_series_points = []
            for point in data['time_series']:
                time_series_points.append(
                    f"            <data_point>\n"
                    f"                <date>{self._format_date(point.date)}</date>\n"
                    f"                <volume_kg>{point.volume_kg:.1f}kg</volume_kg>\n"
                    f"            </data_point>"
                )
            time_series_xml = "\n".join(time_series_points)
            
            # Calculate volume change
            if len(data['time_series']) > 1:
                first_vol = data['time_series'][0].volume_kg
                last_vol = data['time_series'][-1].volume_kg
                change_kg = last_vol - first_vol
                change_pct = (change_kg / first_vol) * 100 if first_vol > 0 else 0
                change_str = f"+{change_kg:.1f}kg (+{change_pct:.1f}%)" if change_kg >= 0 else f"{change_kg:.1f}kg ({change_pct:.1f}%)"
            else:
                change_str = "Single session"
            
            volume_items.append(
                f"    <exercise>\n"
                f"        <name>{exercise}</name>\n"
                f"        <time_series>\n"
                f"{time_series_xml}\n"
                f"        </time_series>\n"
                f"        <summary>\n"
                f"            <total_volume_kg>{data['total']:.1f}kg</total_volume_kg>\n"
                f"            <change>{change_str}</change>\n"
                f"        </summary>\n"
                f"    </exercise>"
            )
        
        return "\n".join(volume_items)

    def _format_workout_data_context(self) -> str:
        """
        Format workout data with XML structure for better LLM attention.
        
        Includes time series data for strength and volume progression to enable
        sophisticated coaching insights about trends, plateaus, and progress velocity.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain._format_workout_data_context()
        """
        if not self._data_bundles:
            return "<workout_data><status>No workout data available</status></workout_data>"
        
        latest_bundle = self._data_bundles[-1]
        
        # Extract date range from general_workout_data
        date_range = latest_bundle.general_workout_data.date_range
        date_start = self._format_date(date_range.earliest)
        date_end = self._format_date(date_range.latest)
        
        # Extract recent workouts with notes (last 5 workouts)
        recent_workouts_info = ""
        if latest_bundle.recent_workouts:
            workout_items = []
            for workout in latest_bundle.recent_workouts[:5]:  # Show up to 5 most recent
                workout_date = self._format_date(workout.date)
                workout_name = workout.name or "Workout"
                
                # Build exercise list with notes
                exercise_items = []
                for exercise in workout.exercises:
                    exercise_notes = f"\n        <notes>{exercise.notes}</notes>" if exercise.notes else ""
                    exercise_items.append(
                        f"      <exercise>\n"
                        f"        <name>{exercise.name}</name>"
                        f"{exercise_notes}\n"
                        f"        <sets_count>{len(exercise.sets)}</sets_count>\n"
                        f"      </exercise>"
                    )
                exercises_xml = "\n".join(exercise_items) if exercise_items else "      <status>No exercises</status>"
                
                workout_notes = f"\n    <workout_notes>{workout.notes}</workout_notes>" if workout.notes else ""
                workout_items.append(
                    f"  <workout>\n"
                    f"    <date>{workout_date}</date>\n"
                    f"    <name>{workout_name}</name>"
                    f"{workout_notes}\n"
                    f"    <exercises>\n"
                    f"{exercises_xml}\n"
                    f"    </exercises>\n"
                    f"  </workout>"
                )
            recent_workouts_info = "\n".join(workout_items)
        
        # Format strength progression with TIME SERIES
        strength_prog = self._format_strength_progression_time_series(latest_bundle.strength_data)
        
        # Format volume with TIME SERIES
        volume_time_series = self._format_volume_time_series(latest_bundle.volume_data)
        
        # Overall volume summary
        volume_summary = ""
        if latest_bundle.volume_data:
            vol = latest_bundle.volume_data
            volume_summary = f"""  <volume_summary>
        <total_volume_kg>{vol.total_volume_kg:.1f}kg</total_volume_kg>
        <today_volume_kg>{vol.today_volume_kg:.1f}kg</today_volume_kg>
    </volume_summary>
    
    <volume_by_exercise_over_time>
        <description>Volume trends over time for top exercises. Use this to discuss work capacity and fatigue management.</description>
{volume_time_series}
    </volume_by_exercise_over_time>"""
        
        # Extract consistency metrics
        consistency_info = ""
        if latest_bundle.consistency_data:
            cons = latest_bundle.consistency_data
            variance_str = f"{cons.variance:.2f}" if cons.variance is not None else "Not calculated"
            consistency_info = f"""  <consistency_data>
        <avg_days_between_workouts>{cons.avg_days_between:.1f} days</avg_days_between_workouts>
        <variance>{variance_str}</variance>
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
        
        # Extract muscle group balance
        muscle_balance_info = ""
        if latest_bundle.muscle_group_balance:
            mgb = latest_bundle.muscle_group_balance
            balance_items = []
            for dist in mgb.distribution:
                balance_items.append(
                    f"    <muscle_group>\n"
                    f"      <name>{dist.muscle_group}</name>\n"
                    f"      <percentage>{dist.percentage:.1f}%</percentage>\n"
                    f"    </muscle_group>"
                )
            muscle_balance_info = "\n".join(balance_items) if balance_items else "    <status>No muscle balance data</status>"
        
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

    <recent_workouts>
        <description>Last 5 workouts with full detail including notes</description>
    {recent_workouts_info if recent_workouts_info else "    <status>No recent workouts</status>"}
    </recent_workouts>

    <strength_progression>
        <description>e1RM progression over time for top exercises. Use this to discuss strength gains, plateaus, trends, and velocity of improvement.</description>
    {strength_prog}
    </strength_progression>

{volume_summary if volume_summary else "  <volume_data><status>No volume data</status></volume_data>"}

{consistency_info if consistency_info else "  <consistency_data><status>No consistency data</status></consistency_data>"}

    <exercise_frequency>
    {frequency_info if frequency_info else "    <status>No frequency data</status>"}
    </exercise_frequency>

    <muscle_group_balance>
    {muscle_balance_info if muscle_balance_info else "    <status>No muscle balance data</status>"}
    </muscle_group_balance>

    <correlation_insights>
    {correlations_data}
    </correlation_insights>
    </workout_data>"""
        
        return context

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """
        Get workout-specific context variables with XML formatting.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain.get_additional_prompt_vars()
        """
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
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain.get_formatted_prompt()
        """
        # Get all the context variables
        prompt_vars = await self.get_additional_prompt_vars()
        
        # Set the current message
        prompt_vars["current_message"] = message
        
        # Format using the template and return the messages
        formatted_messages = self.prompt.format_messages(**prompt_vars)
        
        return formatted_messages

    async def load_user_profile(self) -> bool:
        """
        Load user profile data for context.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain.load_user_profile()
        """
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
        """
        Load workout bundles into context.
        
        Location: /app/services/chains/workout_analysis_chain.py
        Method: WorkoutAnalysisChain.load_bundles()
        """
        valid_bundles = []
        for bundle in bundles:
            if isinstance(bundle, WorkoutAnalysisBundle):
                valid_bundles.append(bundle)
            else:
                logger.warning(f"Skipping invalid bundle type: {type(bundle)}")
        
        self._data_bundles = valid_bundles.copy()
        logger.info(f"Loaded {len(self._data_bundles)} workout bundles into conversation context")