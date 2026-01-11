import logging
import json
import re
import asyncio
from typing import Dict, Any, List, AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from datetime import datetime, date

from app.services.context.shared_context_loader import SharedContextLoader
from app.services.llm.tool_selector import ToolSelector
from app.services.db.message_service import MessageService
from app.core.prompts.unified_coach import get_unified_coach_prompt
from app.tools.exercise_tool import get_exercises_by_muscle_groups, get_cardio_exercises

logger = logging.getLogger(__name__)


class UnifiedCoachService:
    """
    Unified coaching service that handles all coaching modes
    (planning, analysis, tracking) through message processing.
    
    Service is stateful per-connection - initialized once with context,
    then processes messages using that context.
    """
    
    def __init__(self, credentials=None, project_id=None):
        self.credentials = credentials
        self.project_id = project_id
        
        # Main response model (Gemini 2.5 Flash)
        self.response_model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            streaming=True,
            temperature=0,
            credentials=credentials,
            project=project_id,
            vertexai=True
        )
        
        # Shared services
        self.context_loader = SharedContextLoader()
        self.tool_selector = ToolSelector(credentials=credentials, project_id=project_id)
        self.message_service = MessageService()
        
        # Tool registry
        self.tool_executors = {
            "get_exercises_by_muscle_groups": get_exercises_by_muscle_groups,
            "get_cardio_exercises": get_cardio_exercises
        }
        
        # State (initialized per connection)
        self.conversation_id: str = ""
        self.user_id: str = ""
        self.message_history: List[Dict] = []
        self.formatted_context: Dict[str, str] = {}
        self.raw_bundle = None  # Store raw bundle for weight lookups
        self.is_imperial: bool = False  # User's unit preference
        self.current_response: str = ""
        self.initialized: bool = False
    
    async def initialize(self, conversation_id: str, user_id: str) -> None:
        """
        Initialize service with conversation context.
        Call once per WebSocket connection before processing messages.
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID
        """
        logger.info(f"🔄 Initializing service for conversation: {conversation_id}")
        
        self.conversation_id = conversation_id
        self.user_id = user_id
        
        # Load conversation context
        from app.services.context.conversation_context_service import conversation_context_service
        context = await conversation_context_service.load_context_admin(conversation_id, user_id)
        
        # Load shared context (profile, memory, workout history, strength data)
        shared_context = await self.context_loader.load_all(user_id)
        self.formatted_context = self._format_shared_context(shared_context)
        
        # Store raw bundle for weight lookups
        self.raw_bundle = shared_context.get("bundle")
        
        # Store unit preference from profile (source of truth)
        profile = shared_context.get("profile")
        self.is_imperial = profile.get('is_imperial', False) if profile else False
        
        # Build message history from DB
        self.message_history = []
        for msg in context.messages:
            role = "user" if msg.type == "human" else "assistant"
            self.message_history.append({
                "role": role,
                "content": msg.content
            })
        
        # Keep only last 10 messages
        if len(self.message_history) > 10:
            self.message_history = self.message_history[-10:]
        
        logger.info(f"✅ Service initialized - {len(self.message_history)} messages loaded")
        self.initialized = True
    
    async def process_message(self, message: str) -> AsyncGenerator[str, None]:
        """
        Process a single user message and yield response chunks.
        
        Args:
            message: User's message text
            
        Yields:
            str: Response text chunks
        """
        if not self.initialized:
            raise RuntimeError("Service not initialized - call initialize() first")
        
        logger.info(f"🤖 Processing message: {message[:80]}...")
        
        # Reset current response tracker
        self.current_response = ""
        
        # Add user message to history
        self.message_history.append({"role": "user", "content": message})
        
        # Keep history manageable
        if len(self.message_history) > 10:
            self.message_history = self.message_history[-10:]
        
        # Select and execute tools
        tool_calls = await self.tool_selector.select_tools(message, self.message_history[:-1])
        tool_results = {}
        
        if tool_calls:
            logger.info(f"🔧 Executing {len(tool_calls)} tools")
            tool_tasks = [self._execute_tool(tc["name"], tc["args"]) for tc in tool_calls]
            results = await asyncio.gather(*tool_tasks, return_exceptions=True)
            
            for tc, result in zip(tool_calls, results):
                if not isinstance(result, Exception):
                    tool_results[tc["name"]] = result
        else:
            logger.info("✨ No tools needed")
        
        # Enrich exercises with last weights
        if "get_exercises_by_muscle_groups" in tool_results:
            exercises = tool_results["get_exercises_by_muscle_groups"]
            if exercises:
                exercise_ids = [ex['id'] for ex in exercises]
                last_weights = self._get_last_weights_for_exercises(exercise_ids)
                
                # Add weight data to each exercise
                for ex in exercises:
                    if ex['id'] in last_weights:
                        ex['last_tracked'] = last_weights[ex['id']]
                
                logger.info(f"💪 Enriched {len(last_weights)} exercises with weight history")
        
        # Build prompt
        prompt = self._build_prompt(
            message=message,
            message_history=self.message_history[:-1],
            formatted_context=self.formatted_context,
            tool_results=tool_results
        )
        
        # Stream response
        logger.info("📤 Streaming LLM response...")
        
        async for chunk in self.response_model.astream(prompt):
            content = chunk.content
            if content:
                self.current_response += content
                yield content
        
        # Add assistant response to history
        self.message_history.append({"role": "assistant", "content": self.current_response})
        
        # Keep history manageable
        if len(self.message_history) > 10:
            self.message_history = self.message_history[-10:]
        
        logger.info(f"✅ Response complete ({len(self.current_response)} chars)")
    
    def get_current_response(self) -> str:
        """Get the current partial response (for cancellation handling)"""
        return self.current_response
    
    def reset_current_response(self) -> None:
        """Reset the current response tracker"""
        self.current_response = ""
    
    def add_to_history(self, role: str, content: str) -> None:
        """
        Add a message to history (used for cancelled responses).
        
        Args:
            role: 'user' or 'assistant'
            content: Message content
        """
        self.message_history.append({"role": role, "content": content})
        
        if len(self.message_history) > 10:
            self.message_history = self.message_history[-10:]
    
    def _get_last_weights_for_exercises(
        self, 
        exercise_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get last tracked weight for each exercise definition_id.
        
        Location: /app/services/unified_coach_service.UnifiedCoachService._get_last_weights_for_exercises()
        
        Args:
            exercise_ids: List of exercise definition_ids from tool results
            
        Returns:
            {definition_id: {"weight": float, "reps": int, "date": str}}
        """
        if not self.raw_bundle or not hasattr(self.raw_bundle, 'recent_workouts'):
            return {}
        
        # Track most recent weight per definition_id
        last_weights = {}
        
        # Iterate workouts chronologically (recent_workouts already sorted newest first)
        for workout in self.raw_bundle.recent_workouts:
            for exercise in workout.exercises:
                def_id = exercise.definition_id
                
                # Skip if no definition_id or already found (we want most recent)
                if not def_id or def_id in last_weights:
                    continue
                
                # Skip if not in our target list
                if def_id not in exercise_ids:
                    continue
                
                # Find the heaviest set (typically the working weight)
                if exercise.sets:
                    heaviest_set = max(
                        [s for s in exercise.sets if s.weight],
                        key=lambda s: s.weight,
                        default=None
                    )
                    
                    if heaviest_set and heaviest_set.weight:
                        last_weights[def_id] = {
                            "weight": heaviest_set.weight,
                            "reps": heaviest_set.reps,
                            "date": workout.date.strftime('%b %d') if hasattr(workout.date, 'strftime') else str(workout.date)
                        }
        
        return last_weights
    
    async def _execute_tool(self, tool_name: str, args: Dict) -> Any:
        """
        Execute a specific tool with the given arguments.
        
        Args:
            tool_name: Name of the tool to execute
            args: Tool arguments
            
        Returns:
            Tool execution result
        """
        if tool_name not in self.tool_executors:
            logger.error(f"Unknown tool: {tool_name}")
            return []
        
        try:
            tool_func = self.tool_executors[tool_name]
            result = await tool_func.ainvoke(args)
            return result
        except Exception as e:
            logger.error(f"Tool {tool_name} execution failed: {str(e)}")
            return []

    def _format_weight(self, weight_kg: float, is_imperial: bool) -> str:
        """
        Format weight in user's preferred units.
        
        Args:
            weight_kg: Weight in kilograms
            is_imperial: Whether user prefers imperial units
            
        Returns:
            Formatted weight string with unit (e.g., "225.0lbs" or "102.0kg")
        """
        if is_imperial:
            weight_lbs = weight_kg / 0.453592
            return f"{weight_lbs:.1f}lbs"
        return f"{weight_kg:.1f}kg"
    
    def _format_shared_context(self, shared_context: Dict) -> Dict[str, str]:
        """
        Format all shared context into strings ONCE at initialization.
        Returns dict of pre-formatted strings to reuse on every message.
        
        Args:
            shared_context: Raw context from SharedContextLoader
            
        Returns:
            Dict with formatted context strings
        """
        bundle = shared_context.get("bundle")
        profile = shared_context.get("profile")
        
        # Extract user's unit preference
        is_imperial = profile.get('is_imperial', False) if profile else False
        
        # Format user profile
        if profile:
            name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
            # Calculate age from DOB
            age = 'Not provided'
            dob_str = profile.get('dob')
            if dob_str:
                try:
                    dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
                    today = date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                except (ValueError, TypeError):
                    # Fallback to age field if DOB parsing fails
                    age = profile.get('age', 'Not provided')
            else:
                # Fallback to age field if no DOB
                age = profile.get('age', 'Not provided')
            units = "imperial (lb/mi)" if profile.get('is_imperial') else "metric (kg/km)"
            user_profile_text = f"Name: {name or 'Not provided'}, Age: {age}, Units: {units}"
        else:
            user_profile_text = "No profile available"
        
        # Format AI memory
        if bundle and hasattr(bundle, 'ai_memory') and bundle.ai_memory:
            memory_notes = bundle.ai_memory.get('notes', [])
            if memory_notes:
                memory_lines = []
                # Group by category
                categorized = {}
                for note in memory_notes:
                    category = note.get('category', 'general')
                    if category not in categorized:
                        categorized[category] = []
                    categorized[category].append(note)
                
                for category, notes in categorized.items():
                    memory_lines.append(f"**{category.title()}:**")
                    for note in notes:
                        text = note.get('text', '')
                        date = note.get('date', '')
                        memory_lines.append(f"- {text} (noted: {date})")
                
                ai_memory_text = "\n".join(memory_lines)
            else:
                ai_memory_text = "No memory available"
        else:
            ai_memory_text = "No memory available"
        
        # Format workout history with FULL DETAILS
        if bundle and hasattr(bundle, 'recent_workouts'):
            recent = bundle.recent_workouts[:5]
            if recent:
                workout_lines = []
                for w in recent:
                    date_str = w.date.strftime('%b %d, %Y') if hasattr(w.date, 'strftime') else str(w.date)
                    name = w.name or 'Unnamed Workout'
                    
                    # Build exercise list with full details
                    exercise_details = []
                    if hasattr(w, 'exercises') and w.exercises:
                        for ex in w.exercises:
                            # Format sets info
                            sets_info = []
                            if hasattr(ex, 'sets') and ex.sets:
                                for s in ex.sets:
                                    reps = s.reps if hasattr(s, 'reps') else 'N/A'
                                    weight = self._format_weight(s.weight, is_imperial) if hasattr(s, 'weight') and s.weight else 'bodyweight'
                                    sets_info.append(f"{reps}x{weight}")
                            
                            sets_str = ", ".join(sets_info) if sets_info else "No sets"
                            ex_name = ex.name if hasattr(ex, 'name') else 'Unknown exercise'
                            exercise_details.append(f"    - {ex_name}: {sets_str}")
                    
                    exercises_str = "\n".join(exercise_details) if exercise_details else "    - No exercises"
                    notes_str = f"\n  Notes: {w.notes}" if hasattr(w, 'notes') and w.notes else ""
                    
                    workout_lines.append(
                        f"- {date_str}: {name}{notes_str}\n"
                        f"{exercises_str}"
                    )
                
                workout_history_text = "\n\n".join(workout_lines)
            else:
                workout_history_text = "No workout history available"
        else:
            workout_history_text = "No workout history available"
        
        # Format strength progression
        strength_prog_text = ""
        if bundle and hasattr(bundle, 'strength_data') and bundle.strength_data:
            strength_data = bundle.strength_data
            if hasattr(strength_data, 'exercise_strength_progress') and strength_data.exercise_strength_progress:
                exercises_with_best = []
                for ex_prog in strength_data.exercise_strength_progress:
                    if hasattr(ex_prog, 'e1rm_time_series') and ex_prog.e1rm_time_series:
                        best_point = max(ex_prog.e1rm_time_series, key=lambda x: x.estimated_1rm)
                        exercises_with_best.append({
                            'exercise': ex_prog.exercise,
                            'best_e1rm': best_point.estimated_1rm,
                            'time_series': ex_prog.e1rm_time_series
                        })
                
                if exercises_with_best:
                    top_exercises = sorted(exercises_with_best, key=lambda x: x['best_e1rm'], reverse=True)[:5]
                    strength_lines = ["**Top Exercise Strength Progression (e1RM):**"]
                    
                    for ex_data in top_exercises:
                        if len(ex_data['time_series']) > 1:
                            first = ex_data['time_series'][0]
                            last = ex_data['time_series'][-1]
                            change_kg = last.estimated_1rm - first.estimated_1rm
                            change_pct = (change_kg / first.estimated_1rm * 100) if first.estimated_1rm > 0 else 0
                            
                            change_formatted = self._format_weight(abs(change_kg), is_imperial)
                            change_str = f"+{change_formatted} (+{change_pct:.1f}%)" if change_kg >= 0 else f"-{change_formatted} ({change_pct:.1f}%)"
                            
                            recent_points = ex_data['time_series'][-3:]
                            points_str = ", ".join([
                                f"{p.date.strftime('%b %d') if hasattr(p.date, 'strftime') else str(p.date)}: {self._format_weight(p.estimated_1rm, is_imperial)}"
                                for p in recent_points
                            ])
                            
                            strength_lines.append(
                                f"- {ex_data['exercise']}: Best {self._format_weight(ex_data['best_e1rm'], is_imperial)} | Change: {change_str} | Recent: {points_str}"
                            )
                        else:
                            strength_lines.append(
                                f"- {ex_data['exercise']}: {self._format_weight(ex_data['best_e1rm'], is_imperial)} (single data point)"
                            )
                    
                    strength_prog_text = "\n".join(strength_lines)
        
        if not strength_prog_text:
            strength_prog_text = "No strength progression data available"
        
        return {
            "user_profile": user_profile_text,
            "ai_memory": ai_memory_text,
            "workout_history": workout_history_text,
            "strength_progression": strength_prog_text
        }
    
    def _build_prompt(
        self,
        message: str,
        message_history: List[Dict],
        formatted_context: Dict[str, str],
        tool_results: Dict
    ) -> List:
        """
        Build the complete prompt with pre-formatted context and tool results.
        
        Location: /app/services/unified_coach_service.UnifiedCoachService._build_prompt()
        
        Args:
            message: Current user message
            message_history: List of previous messages
            formatted_context: Pre-formatted context strings
            tool_results: Results from tool execution
            
        Returns:
            List of LangChain message objects
        """
        # Get base prompt
        system_prompt = get_unified_coach_prompt()
        
        # Get user's unit preference (stored during initialization from profile)
        is_imperial = self.is_imperial
        
        # Format available exercises
        if "get_exercises_by_muscle_groups" in tool_results:
            exercises = tool_results["get_exercises_by_muscle_groups"]
            if exercises:
                exercise_lines = [f"**{len(exercises)} exercises available:**"]
                for ex in exercises[:30]:
                    base_info = f"- {ex['standard_name']} (ID: {ex['id']}, Muscles: {', '.join(ex.get('primary_muscles', []))})"
                    
                    # Add last tracked weight if available
                    if 'last_tracked' in ex:
                        lt = ex['last_tracked']
                        weight_str = self._format_weight(lt['weight'], is_imperial)
                        base_info += f" | Last: {lt['reps']}x{weight_str} ({lt['date']})"
                    
                    exercise_lines.append(base_info)
                
                available_exercises_text = "\n".join(exercise_lines)
            else:
                available_exercises_text = "No exercises available (ask user which muscles to target)"
        elif "get_cardio_exercises" in tool_results:
            exercises = tool_results["get_cardio_exercises"]
            if exercises:
                exercise_lines = [f"**{len(exercises)} cardio exercises available:**"]
                for ex in exercises[:20]:
                    exercise_lines.append(
                        f"- {ex['standard_name']} (ID: {ex['id']}, Type: {ex.get('base_movement', 'N/A')})"
                    )
                available_exercises_text = "\n".join(exercise_lines)
            else:
                available_exercises_text = "No cardio exercises available"
        else:
            available_exercises_text = "No exercises fetched yet. If user wants to plan a workout, ask which muscles to target."
        
        # Inject ALL context into system prompt
        system_prompt = system_prompt.format(
            user_profile=formatted_context["user_profile"],
            ai_memory=formatted_context["ai_memory"],
            workout_history=formatted_context["workout_history"],
            strength_progression=formatted_context["strength_progression"],
            available_exercises=available_exercises_text
        )
        
        # Build messages list
        messages = [SystemMessage(content=system_prompt)]
        
        # Add message history
        for msg in message_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        return messages

    def _extract_json_components(self, response: str) -> List[Dict]:
        """Extract JSON code blocks from response (workout_template, chart_data, etc.)"""
        components = []
        
        try:
            json_pattern = r'```json\s*(.*?)\s*```'
            matches = re.findall(json_pattern, response, re.DOTALL)
            
            for json_str in matches:
                try:
                    parsed = json.loads(json_str.strip())
                    
                    if parsed.get('type') and parsed.get('data'):
                        components.append(parsed)
                        logger.info(f"Extracted component: {parsed['type']}")
                
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON component: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error extracting components: {str(e)}")
        
        return components