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
        
        # Extract goals
        goals = profile.get('goals', {})
        primary_goal = goals.get('primary', 'Not specified') if isinstance(goals, dict) else 'Not specified'
        
        # Extract experience/stats
        current_stats = profile.get('current_stats', {})
        experience = current_stats.get('notes', 'Not specified') if isinstance(current_stats, dict) else 'Not specified'
        
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
        
        return {
            "system_prompt": base_prompt,
            "user_context": user_context,
            "messages": self.messages,
            "current_message": ""
        }