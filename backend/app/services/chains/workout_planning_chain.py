import re
import json
from typing import Dict, Any, Optional, AsyncGenerator, TYPE_CHECKING
import logging
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_vertexai import ChatVertexAI
from .base_conversation_chain import BaseConversationChain
from app.services.db.user_profile_service import UserProfileService
from app.core.prompts.workout_planning import (
    WORKOUT_PLANNING_SYSTEM_PROMPT,
    WORKOUT_PLANNING_USER_CONTEXT_TEMPLATE,
    EXERCISE_CONTEXT_TEMPLATE,
    RECENT_WORKOUT_CONTEXT_TEMPLATE
)

if TYPE_CHECKING:
    from app.services.sentiment_analysis.workout_planning import WorkoutPlanningSentimentAnalyzer

logger = logging.getLogger(__name__)

class WorkoutPlanningChain(BaseConversationChain):
    """
    Workout planning conversation chain.
    
    Handles pre-workout conversations to understand user goals, preferences,
    available time, equipment, and limitations to create personalized workout plans.
    
    Features:
    - Template detection and storage
    - Approval workflow integration  
    - Structured workout output
    - User preference integration
    """
    
    def __init__(self, llm: ChatVertexAI, user_id: str):
        super().__init__(llm)
        self.user_id = user_id
        self._user_profile = None
        self.user_profile_service = UserProfileService()
        self._exercise_definitions = []
        self._recent_workouts = {"workouts": [], "patterns": {}}
        
        # Template detection and approval state
        self.current_template = None
        self.template_presented = False
        
        # Sentiment analyzer (will be injected by service)
        self.sentiment_analyzer: Optional['WorkoutPlanningSentimentAnalyzer'] = None
        
        # Load system prompt from prompts module
        self.system_prompt = WORKOUT_PLANNING_SYSTEM_PROMPT
        
        self._initialize_prompt_template()
        self.logger = logging.getLogger(__name__)

    async def process_message(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Override base process_message to add template detection and approval checking.
        """
        try:
            # Get formatted prompt from subclass
            formatted_prompt = await self.get_formatted_prompt(message)
            
            # Log the formatted messages for debugging
            logger.info("\n=== Formatted Messages ===")
            for i, msg in enumerate(formatted_prompt):
                logger.info(f"\nMessage {i+1} ({type(msg).__name__}):")
                logger.info(f"Content: {msg.content}")
            logger.info("=====================")
            
            # Check for approval if template was presented
            if self.template_presented and self.current_template:
                approval_result = await self._check_for_approval(message)
                if approval_result:
                    # Send approval signal with template data
                    yield {
                        "type": "workout_template_approved",
                        "data": self.current_template
                    }
                    
                    # Reset template state
                    self.current_template = None
                    self.template_presented = False
                    
                    # Continue with normal processing for follow-up message
            
            # Stream the response
            full_response = ""
            async for chunk in self.chat_model.astream(input=formatted_prompt):
                logger.info(f"Chunk: content='{chunk.content}', metadata={getattr(chunk, 'response_metadata', None)}")
                
                chunk_content = chunk.content
                if chunk_content:  # Only send non-empty content chunks
                    full_response += chunk_content
                    yield {
                        "type": "content",
                        "data": chunk_content
                    }

            # After complete response, check for workout template
            await self._detect_and_store_template(full_response)

            # Send completion signal
            yield {
                "type": "complete",
                "data": {"length": len(full_response)}
            }

            # Add both messages to history after successful processing
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
            logger.debug("\n=== Final Conversation State ===")
            logger.debug(f"Total messages: {len(self.messages)}")
            logger.debug(f"Template presented: {self.template_presented}")
            logger.debug("=====================")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }

    async def _detect_and_store_template(self, response: str) -> None:
        """
        Detect JSON workout templates in LLM response and store them.
        
        Looks for ```json blocks containing workout_template structure.
        """
        try:
            # Look for JSON code blocks
            json_pattern = r'```json\s*(.*?)\s*```'
            json_matches = re.findall(json_pattern, response, re.DOTALL)
            
            for json_str in json_matches:
                try:
                    # Parse JSON
                    parsed_json = json.loads(json_str.strip())
                    
                    # Check if it contains new workout_template structure
                    if parsed_json.get('type') == 'workout_template' and 'data' in parsed_json:
                        template = parsed_json['data']  # Extract data, not the wrapper
                        
                        # Basic validation
                        if self._validate_template_structure(template):
                            self.current_template = template
                            
                            # Check for trigger phrase
                            if "How does this workout look?" in response:
                                self.template_presented = True
                                logger.info("✅ Workout template detected and stored, presentation flag set")
                            else:
                                logger.info("✅ Workout template detected and stored, but no trigger phrase found")
                            
                            break  # Use first valid template found
                        else:
                            logger.warning("❌ Template structure validation failed")
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON in response: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in template detection: {str(e)}", exc_info=True)

    def _validate_template_structure(self, template: dict) -> bool:
        """
        Validate basic template structure.
        
        Args:
            template: The workout_template dict to validate
            
        Returns:
            bool: True if structure is valid
        """
        try:
            # Check required fields
            required_fields = ['name', 'workout_exercises']
            for field in required_fields:
                if field not in template:
                    logger.warning(f"Missing required field: {field}")
                    return False
            
            # Check workout_exercises structure
            exercises = template['workout_exercises']
            if not isinstance(exercises, list) or len(exercises) == 0:
                logger.warning("workout_exercises must be non-empty list")
                return False
            
            # Validate first exercise structure
            first_exercise = exercises[0]
            exercise_required_fields = ['name', 'order_index', 'workout_exercise_sets']
            for field in exercise_required_fields:
                if field not in first_exercise:
                    logger.warning(f"Missing required exercise field: {field}")
                    return False
            
            # Validate sets structure
            sets = first_exercise['workout_exercise_sets']
            if not isinstance(sets, list) or len(sets) == 0:
                logger.warning("workout_exercise_sets must be non-empty list")
                return False
                
            # Check first set structure
            first_set = sets[0]
            set_required_fields = ['set_number', 'reps']
            for field in set_required_fields:
                if field not in first_set:
                    logger.warning(f"Missing required set field: {field}")
                    return False
            
            logger.info("✅ Template structure validation passed")
            return True
            
        except Exception as e:
            logger.error(f"Error validating template structure: {str(e)}")
            return False

    async def _check_for_approval(self, message: str) -> bool:
        """
        Check for approval using sentiment analyzer if available, fallback to simple detection.
        
        Args:
            message: User's response message
            
        Returns:
            bool: True if user approved the template
        """
        try:
            # Use sentiment analyzer if available
            if self.sentiment_analyzer and self.current_template:
                logger.info("Using sentiment analyzer for approval detection")
                return await self.sentiment_analyzer.analyze_approval(
                    message=message,
                    messages=self.messages,
                    template_data=self.current_template
                )
            
            # Fallback to simple keyword-based detection
            logger.info("Using fallback keyword-based approval detection")
            message_lower = message.lower().strip()
            
            # Positive indicators
            approval_phrases = [
                'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'good', 'great', 
                'looks good', 'sounds good', 'perfect', 'that works', 'let\'s do it',
                'i like it', 'approved', 'approve', 'correct', 'right', 'awesome'
            ]
            
            # Negative indicators
            rejection_phrases = [
                'no', 'nope', 'not really', 'change', 'different', 'modify',
                'adjust', 'wrong', 'incorrect', 'don\'t like', 'could we', 'what about'
            ]
            
            # Check for explicit rejection first
            for phrase in rejection_phrases:
                if phrase in message_lower:
                    logger.info(f"❌ Rejection detected: '{phrase}' found in message")
                    return False
            
            # Check for explicit approval
            for phrase in approval_phrases:
                if phrase in message_lower:
                    logger.info(f"✅ Approval detected: '{phrase}' found in message")
                    return True
            
            # Default to no approval if unclear
            logger.info("🤔 Unclear response - defaulting to no approval")
            return False
            
        except Exception as e:
            logger.error(f"Error checking for approval: {str(e)}")
            return False

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
        
        # Handle preferences - UPDATED to handle text input
        preferences = profile.get('preferences', {})
        preference_text = ""
        if isinstance(preferences, dict) and preferences.get('preferences'):
            # If stored as {"preferences": "text content"}
            preference_text = preferences['preferences']
        elif isinstance(preferences, str):
            # If stored directly as string
            preference_text = preferences
        elif isinstance(preferences, dict):
            # Fallback: if it's still the old structure, convert it
            dislikes = preferences.get('dislikes', [])
            prefers = preferences.get('prefers', [])
            if dislikes or prefers:
                parts = []
                if dislikes:
                    parts.append(f"Dislikes: {', '.join(dislikes)}")
                if prefers:
                    parts.append(f"Prefers: {', '.join(prefers)}")
                preference_text = ". ".join(parts)
        
        # Format preference context
        preference_context = ""
        if preference_text:
            preference_context = f"\n    - Workout preferences: {preference_text}"
        
        # Use template from prompts
        return WORKOUT_PLANNING_USER_CONTEXT_TEMPLATE.format(
            name=name or 'Not provided',
            age=age if age else 'Not provided',
            units=units,
            primary_goal=primary_goal,
            experience=experience,
            preference_context=preference_context
        )


    def _format_exercise_context(self) -> str:
        """Format available exercises for the LLM with complete database access and clear ID mapping."""
        if not self._exercise_definitions:
            return "No exercise database available"
        
        # Group exercises by primary muscle groups with full access
        muscle_groups = {}
        for exercise in self._exercise_definitions:
            primary_muscles = exercise.get('primary_muscles', [])
            for muscle in primary_muscles:
                if muscle not in muscle_groups:
                    muscle_groups[muscle] = []
                muscle_groups[muscle].append({
                    'name': exercise.get('standard_name'),
                    'equipment': exercise.get('equipment', []),
                    'definition_id': exercise.get('id'),
                    'description': exercise.get('description', '')
                })
        
        # Format with name→ID mapping and descriptions for clear context
        muscle_group_lines = []
        for muscle, exercises in muscle_groups.items():
            exercise_entries = []
            for ex in exercises:
                # Format: "Exercise Name (ID: definition-uuid) - Description"
                desc_part = f" - {ex['description']}" if ex['description'] else ""
                exercise_entries.append(f"{ex['name']} (ID: {ex['definition_id']}){desc_part}")
            
            muscle_group_lines.append(f"- {muscle.title()}:\n  {chr(10).join(['  • ' + entry for entry in exercise_entries])}")
        
        return EXERCISE_CONTEXT_TEMPLATE.format(
            muscle_group_exercises='\n'.join(muscle_group_lines),
            total_exercises=len(self._exercise_definitions)
        )


    def _format_recent_workout_context(self) -> str:
        """Format recent workout patterns for the LLM."""
        if not self._recent_workouts['patterns']:
            return "No recent workout history available"
        
        patterns = self._recent_workouts['patterns']
        
        # Format frequent exercises
        frequent_exercises = patterns.get('most_frequent_exercises', [])
        frequent_exercise_lines = []
        for exercise_name, frequency in frequent_exercises:
            frequent_exercise_lines.append(f"- {exercise_name}: {frequency} times")
        
        if not frequent_exercise_lines:
            frequent_exercise_lines.append("- No recent exercise data available")
        
        # Use template from prompts
        return RECENT_WORKOUT_CONTEXT_TEMPLATE.format(
            total_workouts=patterns.get('total_workouts', 0),
            workout_frequency=patterns.get('workout_frequency_per_week', 0),
            exercise_variety=patterns.get('exercise_variety', 0),
            frequent_exercises='\n'.join(frequent_exercise_lines)
        )

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