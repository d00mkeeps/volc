from typing import Dict, Any
import logging
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_vertexai import ChatVertexAI
from .base_conversation_chain import BaseConversationChain
from app.services.db.user_profile_service import UserProfileService

logger = logging.getLogger(__name__)

class WorkoutPlanningChain(BaseConversationChain):
    """
    Workout planning conversation chain.
    
    Handles pre-workout conversations to understand user goals, preferences,
    available time, equipment, and limitations to create personalized workout plans.
    """
    
    def __init__(self, llm: ChatVertexAI, user_id: str):
        super().__init__(llm)
        self.user_id = user_id
        self._user_profile = None
        self.user_profile_service = UserProfileService()
        self._exercise_definitions = []
        self._recent_workouts = {"workouts": [], "patterns": {}}
        self.system_prompt = """You are an experienced and knowledgeable fitness coach helping users plan their workout. 

Your goal is to understand their fitness goals, experience level, available time, equipment access, and any physical limitations through natural conversation.

Key principles:
- Ask thoughtful questions to understand their specific situation
- Be encouraging and supportive
- Provide practical, safe workout recommendations
- Consider their experience level when suggesting exercises
- Be conversational and friendly, not clinical or robotic
- Focus on sustainable, enjoyable fitness approaches

Start by greeting them warmly and asking about their current fitness goals."""

        self._initialize_prompt_template()
        self.logger = logging.getLogger(__name__)

    async def load_user_profile(self) -> bool:
        """Load user profile data for personalized planning context."""
        try:
            if not self.user_id:
                logger.warning("No user_id provided for profile loading")
                return False
                
            profile_result = await self.user_profile_service.get_user_profile_admin(self.user_id)
            if profile_result.get('success') and profile_result.get('data'):
                self._user_profile = profile_result['data']
                logger.info(f"Loaded user profile for planning session {self.user_id}")
                return True
            else:
                logger.warning(f"Failed to load profile for planning {self.user_id}: {profile_result.get('error', 'Unknown error')}")
                return False
        except Exception as e:
            logger.error(f"Exception loading user profile for planning {self.user_id}: {str(e)}", exc_info=True)
            return False

    async def load_planning_context(self, context: dict) -> bool:
        """Load planning context including exercise definitions and recent workout patterns."""
        try:
            self._exercise_definitions = context.get("exercise_definitions", [])
            self._recent_workouts = context.get("recent_workouts", {"workouts": [], "patterns": {}})
            
            logger.info(f"Loaded planning context: {len(self._exercise_definitions)} exercises, {self._recent_workouts['patterns'].get('total_workouts', 0)} recent workouts")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load planning context: {str(e)}", exc_info=True)
            return False


    def _format_user_context(self) -> str:
        """Format user profile context for personalized planning."""
        if not self._user_profile:
            return ""
        
        profile = self._user_profile
        
        # Extract key information
        name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
        age = profile.get('age')
        is_imperial = profile.get('is_imperial', False)
        units = "imperial (lb/mi)" if is_imperial else "metric (kg/km)"
        
        # Handle goals - database format: {"content": "goal text"}
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
    - Experience/background: {experience}

    IMPORTANT: 
    - Use the user's name when greeting them if available
    - Always use their preferred units when discussing weights, distances, and measurements
    - Tailor workout suggestions to their stated goals and experience level
    - If they haven't specified goals yet, ask about them naturally in conversation"""
        
        return context

    def _format_exercise_context(self) -> str:
        """Format available exercises for the LLM."""
        if not self._exercise_definitions:
            return "No exercise database available"
        
        # Group exercises by primary muscle groups for better organization
        muscle_groups = {}
        for exercise in self._exercise_definitions:
            primary_muscles = exercise.get('primary_muscles', [])
            for muscle in primary_muscles:
                if muscle not in muscle_groups:
                    muscle_groups[muscle] = []
                muscle_groups[muscle].append({
                    'name': exercise.get('standard_name'),
                    'equipment': exercise.get('equipment', []),
                    'type': exercise.get('exercise_type')
                })
        
        # Format for LLM context (limit to avoid token overflow)
        context_lines = ["AVAILABLE EXERCISES BY MUSCLE GROUP:"]
        for muscle, exercises in list(muscle_groups.items())[:15]:  # Limit muscle groups
            exercise_names = [ex['name'] for ex in exercises[:8]]  # Limit exercises per group
            context_lines.append(f"- {muscle.title()}: {', '.join(exercise_names)}")
        
        context_lines.append(f"\nTotal exercises available: {len(self._exercise_definitions)}")
        return "\n".join(context_lines)

    def _format_recent_workout_context(self) -> str:
        """Format recent workout patterns for the LLM."""
        if not self._recent_workouts['patterns']:
            return "No recent workout history available"
        
        patterns = self._recent_workouts['patterns']
        
        context = f"""
RECENT WORKOUT PATTERNS (Last 2 weeks):
- Total workouts: {patterns.get('total_workouts', 0)}
- Workout frequency: {patterns.get('workout_frequency_per_week', 0)} times per week
- Exercise variety: {patterns.get('exercise_variety', 0)} different exercises used

Most frequently trained exercises:"""
        
        frequent_exercises = patterns.get('most_frequent_exercises', [])
        for exercise_name, frequency in frequent_exercises:
            context += f"\n- {exercise_name}: {frequency} times"
        
        if not frequent_exercises:
            context += "\n- No recent exercise data available"
        
        return context

    def _initialize_prompt_template(self) -> None:
        """Sets up the workout planning prompt template."""
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_prompt}\n\n{user_context}"),
            MessagesPlaceholder(variable_name="messages"),
            ("human", "{current_message}")
        ])

    async def get_formatted_prompt(self, message: str):
        """Format planning-specific prompt with user context."""
        prompt_vars = await self.get_additional_prompt_vars()
        prompt_vars["current_message"] = message
        return self.prompt.format_messages(**prompt_vars)

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get all variables needed for workout planning prompt formatting."""
        
        # Build enhanced system prompt with user context
        base_prompt = self.system_prompt
        user_context = self._format_user_context()
        
        # Add exercise and workout context
        exercise_context = self._format_exercise_context()
        workout_context = self._format_recent_workout_context()
        
        # Combine all context
        full_context = ""
        if user_context:
            full_context += user_context
        if exercise_context:
            full_context += f"\n\n{exercise_context}"
        if workout_context:
            full_context += f"\n\n{workout_context}"
        
        return {
            "system_prompt": base_prompt,
            "user_context": full_context,
            "messages": self.messages,
            "current_message": ""
        }