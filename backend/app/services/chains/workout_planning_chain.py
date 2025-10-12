import re
import json
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator, TYPE_CHECKING
import logging
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_vertexai import ChatVertexAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
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


class WorkoutPlanningChain(BaseConversationChain):
    """
    Workout planning conversation chain with tool support.
    
    Handles pre-workout conversations to understand user goals, preferences,
    available time, equipment, and limitations to create personalized workout plans.
    
    Features:
    - Tool-based exercise fetching (on-demand, not preloaded)
    - Template detection and storage
    - Approval workflow integration  
    - Structured workout output
    - User preference integration
    """

   
    
    def __init__(self, llm: ChatVertexAI, user_id: str, tools: list = None):
        super().__init__(llm)
        self.user_id = user_id
        self._user_profile = None
        self.user_profile_service = UserProfileService()
        self._recent_workouts = {"workouts": [], "patterns": {}}
        
        # Template detection and approval state
        self.current_template = None
        self.template_presented = False
        
        # Sentiment analyzer (will be injected by service)
        self.sentiment_analyzer: Optional['WorkoutPlanningSentimentAnalyzer'] = None
        
        # Load system prompt from prompts module
        self.system_prompt = WORKOUT_PLANNING_SYSTEM_PROMPT
        
        self._initialize_prompt_template()
        
        # Initialize agent with tools
        self.tools = tools or []
        self.agent_executor = None
        if self.tools:
            self._initialize_agent()
        
        self.logger = logging.getLogger(__name__)


    def _initialize_agent(self) -> None:
        """Initialize the agent with tools."""
        try:
            # Create tool-calling agent
            agent = create_tool_calling_agent(
                llm=self.chat_model,
                tools=self.tools,
                prompt=self.prompt
            )
            
            # Create executor
            self.agent_executor = AgentExecutor(
                agent=agent,
                tools=self.tools,
                verbose=True,
                handle_parsing_errors=True,
                return_intermediate_steps=True
            )
            
            logger.info(f"✅ Agent initialized with {len(self.tools)} tools")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize agent: {str(e)}", exc_info=True)
            raise

    async def process_message(self, message: str, profiler=None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Override base process_message to handle agent streaming.
        
        Maintains same output format as base class while adding tool support.
        """
        try:
            # Check for approval if template was presented (keep existing logic)
            if self.template_presented and self.current_template and self.sentiment_analyzer:
                approval_result = await self.sentiment_analyzer.analyze_approval(
                    message=message,
                    messages=self.messages,
                    template_data=self.current_template
                )
                if approval_result:
                    # Send approval signal with template data
                    yield {
                        "type": "workout_template_approved",
                        "data": self.current_template
                    }
                    
                    # Reset template state
                    self.current_template = None
                    self.template_presented = False
            
            # Get prompt variables for agent
            prompt_vars = await self.get_additional_prompt_vars()
            
            # Build input for agent
            agent_input = {
                "input": message,
                "system_prompt": prompt_vars["system_prompt"],
                "user_context": prompt_vars["user_context"],
                "messages": self.messages
            }
            
            full_response = ""
            iteration_count = 0  # Initialize iteration counter

            if self.agent_executor:
                callbacks = []
                if profiler:
                    from app.services.llm.agent_profiler import AgentProfilerCallback
                    callbacks.append(AgentProfilerCallback(profiler))
                
                async for chunk in self.agent_executor.astream(agent_input, config={"callbacks": callbacks}):
                    logger.info(f"🔄 Iteration {iteration_count} - Chunk keys: {chunk.keys()}")
                    
                    # Log the agent's thought/reasoning
                    if "messages" in chunk:
                        messages = chunk["messages"]
                        for msg in messages:
                            if hasattr(msg, 'content') and msg.content:
                                logger.info(f"💭 Agent thought: {msg.content[:200]}...")  # First 200 chars
                    
                    # Handle tool calls (show status to user)
                    if "actions" in chunk:
                        iteration_count += 1
                        actions = chunk["actions"]
                        logger.info(f"🔧 ITERATION {iteration_count}: Agent decided to call {len(actions)} tool(s)")
                        
                        for action in actions:
                            tool_name = action.tool
                            tool_input = action.tool_input
                            logger.info(f"  └─ Tool: {tool_name}")
                            logger.info(f"  └─ Input: {tool_input}")
                            
                            # Send status update
                            yield {
                                "type": "status",
                                "data": f"thinking.."
                            }
                    
                    # Handle tool results
                    elif "steps" in chunk:
                        steps = chunk["steps"]
                        for i, step in enumerate(steps):
                            result = step.observation
                            logger.info(f"📊 Tool {i+1} result type: {type(result)}")
                            if isinstance(result, list):
                                logger.info(f"  └─ Returned {len(result)} items")
                                yield {
                                    "type": "status",
                                    "data": f"loading exercises.."
                                }
                            else:
                                logger.info(f"  └─ Result preview: {str(result)[:100]}")
                    
                    elif "output" in chunk:
                        logger.info(f"✅ Agent finished after {iteration_count} tool calls")
                        logger.info(f"📝 Final output length: {len(chunk['output'])} chars")
                        
                        content = chunk["output"]
                        full_response += content
                        
                        # NEW: Stream gradually for smooth typing effect
                        async for mini_chunk in stream_text_gradually(content, chunk_size=5):
                            yield {
                                "type": "content",
                                "data": mini_chunk
                            }
            else:
                # Fallback: use direct LLM (no tools)
                formatted_prompt = await self.get_formatted_prompt(message)
                async for chunk in self.chat_model.astream(input=formatted_prompt):
                    chunk_content = chunk.content
                    if chunk_content:
                        full_response += chunk_content
                        yield {
                            "type": "content",
                            "data": chunk_content
                        }

            # After complete response, check for workout template (existing logic)
            await self._detect_and_store_template(full_response)
            
            # If template detected, send it to frontend
            if self.current_template:
                yield {
                    "type": "workout_template_detected",
                    "data": self.current_template
                }

            # Send completion signal (same as base class)
            yield {
                "type": "complete",
                "data": {"length": len(full_response)}
            }

            # Add both messages to history (same as base class)
            self.messages.append(HumanMessage(content=message))
            self.messages.append(AIMessage(content=full_response))
            
            logger.debug(f"✅ Message processed. Total messages: {len(self.messages)}")
                
        except Exception as e:
            logger.error(f"❌ Error processing message: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred while processing your message"
            }

    async def _detect_and_store_template(self, response: str) -> None:
        """Detect JSON workout templates in LLM response and store them."""
        try:
            json_pattern = r'```json\s*(.*?)\s*```'
            json_matches = re.findall(json_pattern, response, re.DOTALL)
            
            for json_str in json_matches:
                try:
                    parsed_json = json.loads(json_str.strip())
                    
                    if parsed_json.get('type') == 'workout_template' and 'data' in parsed_json:
                        template = parsed_json['data']
                        
                        if self._validate_template_structure(template):
                            self.current_template = template
                            
                            if "How does this workout look?" in response:
                                self.template_presented = True
                                logger.info("✅ Workout template detected and stored, presentation flag set")
                            else:
                                logger.info("✅ Workout template detected and stored, but no trigger phrase found")
                            
                            break
                        else:
                            logger.warning("❌ Template structure validation failed")
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON in response: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in template detection: {str(e)}", exc_info=True)

    def _validate_template_structure(self, template: dict) -> bool:
        """Validate basic template structure."""
        try:
            required_fields = ['name', 'workout_exercises']
            for field in required_fields:
                if field not in template:
                    logger.warning(f"Missing required field: {field}")
                    return False
            
            exercises = template['workout_exercises']
            if not isinstance(exercises, list) or len(exercises) == 0:
                logger.warning("workout_exercises must be non-empty list")
                return False
            
            first_exercise = exercises[0]
            exercise_required_fields = ['name', 'order_index', 'workout_exercise_sets']
            for field in exercise_required_fields:
                if field not in first_exercise:
                    logger.warning(f"Missing required exercise field: {field}")
                    return False
            
            sets = first_exercise['workout_exercise_sets']
            if not isinstance(sets, list) or len(sets) == 0:
                logger.warning("workout_exercise_sets must be non-empty list")
                return False
                
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
        """Load planning context (recent workouts only - exercises fetched via tool)."""
        try:
            # NOTE: No longer loading exercise_definitions here!
            # They're fetched on-demand via the tool
            self._recent_workouts = context.get("recent_workouts", {"workouts": [], "patterns": {}})
            
            logger.info(f"Loaded planning context: {self._recent_workouts['patterns'].get('total_workouts', 0)} recent workouts")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load planning context: {str(e)}", exc_info=True)
            return False

    def _format_user_context(self) -> str:
        """Format user profile context for personalized planning."""
        if not self._user_profile:
            return ""
        
        profile = self._user_profile
        
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
        
        current_stats = profile.get('current_stats')
        if isinstance(current_stats, str):
            experience = current_stats
        elif isinstance(current_stats, dict) and 'notes' in current_stats:
            experience = current_stats['notes']
        else:
            experience = 'Not specified'
        
        preferences = profile.get('preferences', {})
        preference_text = ""
        if isinstance(preferences, dict) and preferences.get('preferences'):
            preference_text = preferences['preferences']
        elif isinstance(preferences, str):
            preference_text = preferences
        
        preference_context = ""
        if preference_text:
            preference_context = f"\n    - Workout preferences: {preference_text}"
        
        return WORKOUT_PLANNING_USER_CONTEXT_TEMPLATE.format(
            name=name or 'Not provided',
            age=age if age else 'Not provided',
            units=units,
            primary_goal=primary_goal,
            experience=experience,
            preference_context=preference_context
        )

    def _format_exercise_context(self) -> str:
        """
        Format exercise context - now just tells LLM about the tool.
        
        NOTE: Exercises are no longer preloaded! They're fetched via tool.
        """
        return """
EXERCISE DATABASE ACCESS:
You have access to a comprehensive exercise database with 167 exercises covering all major muscle groups.

When you're ready to create the workout plan, use the get_exercises_by_muscle_groups tool to fetch relevant exercises.
Do NOT try to create exercises from memory - always use the tool to ensure accurate exercise IDs and details.

Example: If planning a chest workout, call get_exercises_by_muscle_groups(muscle_groups=['chest', 'triceps'])
"""

    def _format_recent_workout_context(self) -> str:
        """Format recent workout patterns for the LLM."""
        if not self._recent_workouts['patterns']:
            return "No recent workout history available"
        
        patterns = self._recent_workouts['patterns']
        
        frequent_exercises = patterns.get('most_frequent_exercises', [])
        frequent_exercise_lines = []
        for exercise_name, frequency in frequent_exercises:
            frequent_exercise_lines.append(f"- {exercise_name}: {frequency} times")
        
        if not frequent_exercise_lines:
            frequent_exercise_lines.append("- No recent exercise data available")
        
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
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])

    async def get_formatted_prompt(self, message: str):
        """Format planning-specific prompt with user context."""
        prompt_vars = await self.get_additional_prompt_vars()
        prompt_vars["input"] = message
        return self.prompt.format_messages(**prompt_vars)

    async def get_additional_prompt_vars(self) -> Dict[str, Any]:
        """Get all variables needed for workout planning prompt formatting."""
        
        base_prompt = self.system_prompt
        user_context = self._format_user_context()
        exercise_context = self._format_exercise_context()  # Now just tells about tool
        workout_context = self._format_recent_workout_context()
        
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
            "input": ""
        }