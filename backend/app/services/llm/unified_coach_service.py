import logging
import json
import re
import asyncio
from typing import Dict, Any, List, AsyncGenerator, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from datetime import datetime, date
from app.services.llm.base import BaseLLMService

from app.services.context.shared_context_loader import SharedContextLoader
from app.services.db.message_service import MessageService
from app.core.prompts.unified_coach import get_unified_coach_prompt
from app.tools.exercise_tool import (
    get_strength_exercises,
    get_cardio_exercises,
    get_mobility_exercises,
)

from app.core.utils.telemetry import FlightRecorderCallback
from langchain_core.agents import AgentAction

import os

COACH_REASONING_LOG = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "testing",
    "logs",
    "coach_reasoning.log",
)
os.makedirs(os.path.dirname(COACH_REASONING_LOG), exist_ok=True)

logger = logging.getLogger(__name__)


class UnifiedCoachService(BaseLLMService):
    """
    Unified coaching service that handles all coaching modes
    (planning, analysis, tracking) through message processing.

    Service is stateful per-connection - initialized once with context,
    then processes messages using that context.
    """

    def __init__(self, credentials=None, project_id=None):
        super().__init__(
            model_name="gemini-2.5-flash",
            temperature=1.0,
            streaming=True,
            credentials=credentials,
            project_id=project_id,
            thinking_budget=4096,
            include_thoughts=True,
        )

        # Shared services
        self.context_loader = SharedContextLoader()
        self.message_service = MessageService()

        # Tool registry
        self.tool_executors = {
            "get_strength_exercises": get_strength_exercises,
            "get_cardio_exercises": get_cardio_exercises,
            "get_mobility_exercises": get_mobility_exercises,
        }

        # Bind tools directly to the coach model
        self.bind_tools(list(self.tool_executors.values()))

        # State (initialized per connection)
        self.conversation_id: str = ""
        self.user_id: str = ""
        self.message_history: List[Dict] = []
        self.formatted_context: Dict[str, str] = {}
        self.raw_bundle = None  # Store raw bundle for weight lookups
        self.is_imperial: bool = False  # User's unit preference
        self.current_response: str = ""
        self.initialized: bool = False

        # Compaction state (for long conversations)
        self.compaction_state: str = "idle"  # idle | extracting | ready
        self.compaction_cutoff: int = 0  # Index to truncate history at
        self.compaction_task: Optional[asyncio.Task] = None

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
        from app.services.context.conversation_context_service import (
            conversation_context_service,
        )

        context = await conversation_context_service.load_context_admin(
            conversation_id, user_id
        )

        # Load shared context (profile, memory, workout history, strength data)
        shared_context = await self.context_loader.load_all(user_id)
        self.formatted_context = self._format_shared_context(shared_context)

        # Store raw bundle for weight lookups
        self.raw_bundle = shared_context.get("bundle")

        # Store unit preference from profile (source of truth)
        profile = shared_context.get("profile")
        self.is_imperial = profile.get("is_imperial", False) if profile else False

        # Build message history from DB
        self.message_history = []
        for msg in context.messages:
            role = "user" if msg.type == "human" else "assistant"
            self.message_history.append({"role": role, "content": msg.content})

        # Keep only last 10 messages -> REMOVED to allow compaction testing
        # if len(self.message_history) > 10:
        #     self.message_history = self.message_history[-10:]

        logger.info(
            f"✅ Service initialized - {len(self.message_history)} messages loaded"
        )
        self.initialized = True

        # Snapshot initial context for telemetry
        telemetry = FlightRecorderCallback(self.conversation_id)
        telemetry.snapshot_context(self.formatted_context)

    async def process_message(self, message: str) -> AsyncGenerator[str, None]:
        """
        Process a single user message and yield response chunks.

        Args:
            message: User's message text

        Yields:
            str: Response text chunks
        """
        # Initialize telemetry
        telemetry = FlightRecorderCallback(self.conversation_id)
        if self.initialized:
            telemetry.snapshot_context(self.formatted_context)

        if not self.initialized:
            raise RuntimeError("Service not initialized - call initialize() first")

        # Check for pending compaction swap
        if self.compaction_state == "ready":
            await self._apply_compaction()

        logger.info(f"🤖 Processing message: {message[:80]}...")

        # Reset current response tracker
        self.current_response = ""

        # Add user message to history
        self.message_history.append({"role": "user", "content": message})

        # Initial prompt build (no tool results yet)
        prompt = self._build_prompt(
            message=message,
            message_history=self.message_history[:-1],
            formatted_context=self.formatted_context,
            tool_results={},
        )

        # Stream response
        logger.info("📤 Streaming LLM response...")
        telemetry.start_stream_timer()
        first_token_received = False
        tool_calls = []

        # Log to reasoning file
        with open(COACH_REASONING_LOG, "a") as f:
            f.write(f"\n[{datetime.now().isoformat()}] CONVERSATION: {self.conversation_id}\n")
            f.write(f"SYSTEM PROMPT PREVIEW: {prompt[0].content[:500]}...\n")
            f.write(f"USER: {message}\n")
            f.write("ASSISTANT REASONING & RESPONSE:\n")

            # Pass 1: Streaming loop (Buffering text if tools are called)
            pass1_text_buffer = ""
            async for chunk in self.stream(prompt):
                if not first_token_received:
                    telemetry.record_first_token()
                    first_token_received = True

                # Collect tool calls if model decides to use tools
                if hasattr(chunk, "tool_calls") and chunk.tool_calls:
                    for tc in chunk.tool_calls:
                        tool_calls.append(tc)

                content = chunk.content
                if not content:
                    continue

                if isinstance(content, str):
                    pass1_text_buffer += content
                    # If we haven't seen tool calls yet, we can't be sure if we should stream
                    # But if we stream AND then see tools, we get repetition.
                    # CRITICAL: We only yield text in Pass 1 IF the model hasn't called tools yet.
                    if not tool_calls:
                        self.current_response += content
                        f.write(content)
                        f.flush()
                        yield content
                elif isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict):
                            if block.get("type") == "thinking":
                                thought = block.get("thinking", "")
                                f.write(f"[THOUGHT]: {thought}\n")
                                f.flush()
                                # Thinking is always safe to stream to the client as it's separate from final text
                                yield json.dumps({"_type": "thinking", "content": thought})
                            elif block.get("type") == "text":
                                text = block.get("text", "")
                                pass1_text_buffer += text
                                if not tool_calls:
                                    self.current_response += text
                                    f.write(text)
                                    f.flush()
                                    yield text

            # Handle Tool Execution & Re-invocation
            if tool_calls:
                logger.info(f"🔧 Model called {len(tool_calls)} tool(s). Aggregating results.")
                
                # If Pass 1 already yielded text, we reset current_response so Pass 2 is the source of truth.
                self.current_response = "" 
                
                # Dictionary of tool_name -> list of results to handle multiple calls
                tool_results = {}
                
                # Build re-invocation history
                model_msg = AIMessage(content=pass1_text_buffer, tool_calls=tool_calls)
                re_invocation_messages = prompt + [model_msg]

                # Execute tools in parallel
                tool_tasks = []
                for tc in tool_calls:
                    tool_name = tc["name"]
                    tool_args = tc["args"]
                    if tool_name in self.tool_executors:
                        logger.info(f"   └─ Executing {tool_name} with args: {tool_args}")
                        tool_tasks.append(self.tool_executors[tool_name].ainvoke(tool_args))
                    else:
                        logger.warning(f"   └─ Unknown tool: {tool_name}")

                if tool_tasks:
                    results = await asyncio.gather(*tool_tasks, return_exceptions=True)
                    for tc, result in zip(tool_calls, results):
                        tool_name = tc["name"]
                        if not isinstance(result, Exception):
                            # Aggregate results into lists
                            if tool_name not in tool_results:
                                tool_results[tool_name] = []
                            tool_results[tool_name].append(result)
                            
                            content_str = json.dumps(result) if not isinstance(result, str) else result
                            re_invocation_messages.append(ToolMessage(content=content_str, tool_call_id=tc["id"]))

                            # Telemetry
                            from app.core.utils.telemetry import AgentAction
                            action = AgentAction(tool=tool_name, tool_input=tc["args"], log="Direct pass")
                            telemetry.on_agent_action(action)
                            telemetry.on_tool_end(str(result))
                        else:
                            logger.error(f"Error in tool {tool_name}: {str(result)}")
                            re_invocation_messages.append(ToolMessage(content=f"Error: {str(result)}", tool_call_id=tc["id"]))

                # Enrich strength exercises with last weights
                if "get_strength_exercises" in tool_results:
                    # Flatten all batches of exercises
                    all_exercises = [ex for batch in tool_results["get_strength_exercises"] for ex in batch]
                    if all_exercises:
                        exercise_ids = [ex["id"] for ex in all_exercises]
                        last_weights = self._get_last_weights_for_exercises(exercise_ids)
                        for batch in tool_results["get_strength_exercises"]:
                            for ex in batch:
                                if ex["id"] in last_weights:
                                    ex["last_tracked"] = last_weights[ex["id"]]

                # Re-build "final" system prompt with high-quality data injection
                final_prompt_list = self._build_prompt(
                    message=message,
                    message_history=self.message_history[:-1],
                    formatted_context=self.formatted_context,
                    tool_results=tool_results,
                )
                
                # REINFORCEMENT message to ensure complete delivery
                reinforcement = SystemMessage(content="Tool execution complete. Now provide the FINAL response to the user. "
                                                      "You MUST include any requested details (like a workout_template JSON) "
                                                      "immediately in this turn based on the tool results provided above.")
                
                re_invocation_messages = [final_prompt_list[0]] + final_prompt_list[1:] + [model_msg] + \
                                         [msg for msg in re_invocation_messages if isinstance(msg, ToolMessage)] + \
                                         [reinforcement]
                
                f.write("\n[RE-INVOKING MODEL WITH DATA...]\n")
                logger.info("📤 Pass 2: Finalizing response with data...")
                
                async for chunk in self.stream(re_invocation_messages):
                    content = chunk.content
                    if not content:
                        continue

                    if isinstance(content, str):
                        self.current_response += content
                        f.write(content)
                        f.flush()
                        yield content
                    elif isinstance(content, list):
                        for block in content:
                            if block.get("type") == "text":
                                text = block.get("text", "")
                                self.current_response += text
                                f.write(text)
                                f.flush()
                                yield text

            f.write(f"\n{'-'*40}\n")

        # Record total stream time
        telemetry.record_stream_complete()

        # Log final answer to telemetry
        telemetry.on_chain_end({"output": self.current_response})

        # Add assistant response to history
        self.message_history.append(
            {"role": "assistant", "content": self.current_response}
        )

        logger.info(f"✅ Response complete ({len(self.current_response)} chars)")

        # Check if compaction needed (after response, async)
        if len(self.message_history) > 30 and self.compaction_state == "idle":
            logger.info(
                f"🗜️ Triggering compaction: {len(self.message_history)} messages"
            )
            self.compaction_task = asyncio.create_task(
                self._trigger_session_compaction()
            )

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
        self, exercise_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get last tracked weight for each exercise definition_id.

        Location: /app/services/unified_coach_service.UnifiedCoachService._get_last_weights_for_exercises()

        Args:
            exercise_ids: List of exercise definition_ids from tool results

        Returns:
            {definition_id: {"weight": float, "reps": int, "date": str}}
        """
        if not self.raw_bundle or not hasattr(self.raw_bundle, "recent_workouts"):
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
                        default=None,
                    )

                    if heaviest_set and heaviest_set.weight:
                        last_weights[def_id] = {
                            "weight": heaviest_set.weight,
                            "reps": heaviest_set.reps,
                            "date": (
                                workout.date.strftime("%b %d")
                                if hasattr(workout.date, "strftime")
                                else str(workout.date)
                            ),
                        }

        return last_weights


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
        is_imperial = profile.get("is_imperial", False) if profile else False

        # Format user profile
        if profile:
            name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
            # Calculate age from DOB
            age = "Not provided"
            dob_str = profile.get("dob")
            if dob_str:
                try:
                    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                    today = date.today()
                    age = (
                        today.year
                        - dob.year
                        - ((today.month, today.day) < (dob.month, dob.day))
                    )
                except (ValueError, TypeError):
                    # Fallback to age field if DOB parsing fails
                    age = profile.get("age", "Not provided")
            else:
                # Fallback to age field if no DOB
                age = profile.get("age", "Not provided")
            units = (
                "imperial (lb/mi)" if profile.get("is_imperial") else "metric (kg/km)"
            )
            user_profile_text = (
                f"Name: {name or 'Not provided'}, Age: {age}, Units: {units}"
            )
        else:
            user_profile_text = "No profile available"

        # Format AI memory
        if bundle and hasattr(bundle, "ai_memory") and bundle.ai_memory:
            memory_notes = bundle.ai_memory.get("notes", [])
            if memory_notes:
                memory_lines = []
                # Group by freshness (Recent = Last 14 days)
                recent_notes = []
                outdated_notes = []

                now = datetime.now()
                from datetime import timedelta

                for note in memory_notes:
                    note_date_str = note.get("date", "")
                    is_recent = False

                    if note_date_str:
                        try:
                            # Try ISO format (YYYY-MM-DD)
                            note_date = datetime.strptime(
                                note_date_str.split("T")[0], "%Y-%m-%d"
                            )
                            if now - note_date < timedelta(days=14):
                                is_recent = True
                        except (ValueError, IndexError):
                            # If parsing fails, treat as outdated/unknown
                            pass

                    if is_recent:
                        recent_notes.append(note)
                    else:
                        outdated_notes.append(note)

                def format_note_group(notes: List[Dict], title: str):
                    lines = [f"\n### {title}:"]
                    # Group by category
                    categorized = {}
                    for note in notes:
                        category = note.get("category", "general")
                        if category not in categorized:
                            categorized[category] = []
                        categorized[category].append(note)

                    for category, cat_notes in categorized.items():
                        lines.append(f"**{category.title()}:**")
                        for note in cat_notes:
                            text = note.get("text", "")
                            date_str = note.get("date", "")
                            lines.append(f"- {text} (noted: {date_str})")
                    return lines

                if recent_notes:
                    memory_lines.extend(
                        format_note_group(recent_notes, "RECENT MEMORY (Last 14 Days)")
                    )

                if outdated_notes:
                    memory_lines.extend(
                        format_note_group(
                            outdated_notes, "POTENTIALLY OUTDATED MEMORY (> 14 Days)"
                        )
                    )

                ai_memory_text = "\n".join(memory_lines).strip()
            else:
                ai_memory_text = "No memory available"
        else:
            ai_memory_text = "No memory available"

        # Format workout history with FULL DETAILS
        if bundle and hasattr(bundle, "recent_workouts"):
            recent = bundle.recent_workouts[:5]
            if recent:
                workout_lines = []
                for w in recent:
                    date_str = (
                        w.date.strftime("%b %d, %Y")
                        if hasattr(w.date, "strftime")
                        else str(w.date)
                    )
                    name = w.name or "Unnamed Workout"

                    # Build exercise list with full details
                    exercise_details = []
                    if hasattr(w, "exercises") and w.exercises:
                        for ex in w.exercises:
                            # Format sets info
                            sets_info = []
                            if hasattr(ex, "sets") and ex.sets:
                                for s in ex.sets:
                                    reps = s.reps if hasattr(s, "reps") else "N/A"
                                    weight = (
                                        self._format_weight(s.weight, is_imperial)
                                        if hasattr(s, "weight") and s.weight
                                        else "bodyweight"
                                    )
                                    sets_info.append(f"{reps}x{weight}")

                            sets_str = ", ".join(sets_info) if sets_info else "No sets"
                            ex_name = (
                                ex.name if hasattr(ex, "name") else "Unknown exercise"
                            )
                            exercise_details.append(f"    - {ex_name}: {sets_str}")

                    exercises_str = (
                        "\n".join(exercise_details)
                        if exercise_details
                        else "    - No exercises"
                    )
                    notes_str = (
                        f"\n  Notes: {w.notes}"
                        if hasattr(w, "notes") and w.notes
                        else ""
                    )

                    workout_lines.append(
                        f"- {date_str}: {name}{notes_str}\n" f"{exercises_str}"
                    )

                workout_history_text = "\n\n".join(workout_lines)
            else:
                workout_history_text = "No workout history available"
        else:
            workout_history_text = "No workout history available"

        # Format strength progression
        strength_prog_text = ""
        if bundle and hasattr(bundle, "strength_data") and bundle.strength_data:
            strength_data = bundle.strength_data
            if (
                hasattr(strength_data, "exercise_strength_progress")
                and strength_data.exercise_strength_progress
            ):
                exercises_with_best = []
                for ex_prog in strength_data.exercise_strength_progress:
                    if (
                        hasattr(ex_prog, "e1rm_time_series")
                        and ex_prog.e1rm_time_series
                    ):
                        best_point = max(
                            ex_prog.e1rm_time_series, key=lambda x: x.estimated_1rm
                        )
                        exercises_with_best.append(
                            {
                                "exercise": ex_prog.exercise,
                                "best_e1rm": best_point.estimated_1rm,
                                "time_series": ex_prog.e1rm_time_series,
                            }
                        )

                if exercises_with_best:
                    top_exercises = sorted(
                        exercises_with_best, key=lambda x: x["best_e1rm"], reverse=True
                    )[:20]
                    strength_lines = ["**Top Exercise Strength Progression (e1RM):**"]

                    for ex_data in top_exercises:
                        if len(ex_data["time_series"]) > 1:
                            first = ex_data["time_series"][0]
                            last = ex_data["time_series"][-1]
                            change_kg = last.estimated_1rm - first.estimated_1rm
                            change_pct = (
                                (change_kg / first.estimated_1rm * 100)
                                if first.estimated_1rm > 0
                                else 0
                            )

                            change_formatted = self._format_weight(
                                abs(change_kg), is_imperial
                            )
                            change_str = (
                                f"+{change_formatted} (+{change_pct:.1f}%)"
                                if change_kg >= 0
                                else f"-{change_formatted} ({change_pct:.1f}%)"
                            )

                            recent_points = ex_data["time_series"][-3:]
                            points_str = ", ".join(
                                [
                                    f"{p.date.strftime('%b %d') if hasattr(p.date, 'strftime') else str(p.date)}: {self._format_weight(p.estimated_1rm, is_imperial)}"
                                    for p in recent_points
                                ]
                            )

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

        # Format glossary terms
        glossary_terms = shared_context.get("glossary_terms", [])
        if glossary_terms:
            glossary_lines = [
                f"**Available glossary terms ({len(glossary_terms)} total):**"
            ]
            glossary_lines.append(
                "When mentioning these terms, link them as: [term](glossary://uuid)"
            )
            glossary_lines.append("")

            # Group by first letter for readability
            from itertools import groupby

            sorted_terms = sorted(glossary_terms, key=lambda t: t["term"].lower())

            for letter, terms in groupby(
                sorted_terms, key=lambda t: t["term"][0].upper()
            ):
                glossary_lines.append(f"**{letter}:**")
                for term in terms:
                    glossary_lines.append(
                        f"- [{term['term']}](glossary://{term['id']})"
                    )

            glossary_text = "\n".join(glossary_lines)
        else:
            glossary_text = "No glossary terms available"

        return {
            "user_profile": user_profile_text,
            "ai_memory": ai_memory_text,
            "workout_history": workout_history_text,
            "strength_progression": strength_prog_text,
            "glossary_terms": glossary_text,
        }

    def _build_prompt(
        self,
        message: str,
        message_history: List[Dict],
        formatted_context: Dict[str, str],
        tool_results: Dict,
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
        # Determine user state
        is_new_user = "No workout history available" in formatted_context.get(
            "workout_history", ""
        )

        # Get base prompt
        system_prompt = get_unified_coach_prompt(is_new_user=is_new_user)

        # Get user's unit preference (stored during initialization from profile)
        is_imperial = self.is_imperial

        # Format available exercises from tool results
        available_exercises_text = ""

        # Parallel exercise type formatting
        exercise_sections = []

        # Handle strength exercises (aggregated lists)
        if "get_strength_exercises" in tool_results:
            results = tool_results["get_strength_exercises"]
            # Flatten results if it's a list of lists or just a list
            all_strength = []
            for r in results:
                if isinstance(r, list):
                    all_strength.extend(r)
                else:
                    all_strength.append(r)
            
            if all_strength:
                # Deduplicate by ID
                seen_ids = set()
                unique_strength = []
                for ex in all_strength:
                    if ex["id"] not in seen_ids:
                        unique_strength.append(ex)
                        seen_ids.add(ex["id"])

                # Group by movement_pattern for clarity
                by_movement = {}
                for ex in unique_strength:
                    movement = ex.get("movement_pattern", "other")
                    if movement not in by_movement:
                        by_movement[movement] = []
                    by_movement[movement].append(ex)

                section_lines = [f"**{len(unique_strength)} strength exercises available:**"]
                for movement, exs in by_movement.items():
                    section_lines.append(f"\n**{movement.replace('_', ' ').title()}:**")
                    for ex in exs[:15]:  # Slightly more per movement
                        base_info = f"- {ex['standard_name']} (ID: {ex['id']}, Muscles: {', '.join(ex.get('primary_muscles', []))})"
                        if "last_tracked" in ex:
                            lt = ex["last_tracked"]
                            weight_str = self._format_weight(lt["weight"], is_imperial)
                            base_info += f" | Last: {lt['reps']}x{weight_str} ({lt['date']})"
                        section_lines.append(base_info)
                exercise_sections.append("\n".join(section_lines))

        # Handle mobility exercises
        if "get_mobility_exercises" in tool_results:
            results = tool_results["get_mobility_exercises"]
            all_mobility = []
            for r in results:
                if isinstance(r, list):
                    all_mobility.extend(r)
                else:
                    all_mobility.append(r)
            
            if all_mobility:
                seen_ids = set()
                section_lines = [f"**{len(all_mobility)} mobility exercises available:**"]
                for ex in all_mobility:
                    if ex["id"] not in seen_ids:
                        muscles = ", ".join(ex.get("primary_muscles", [])) or "general"
                        section_lines.append(f"- {ex['standard_name']} (ID: {ex['id']}, Targets: {muscles})")
                        seen_ids.add(ex["id"])
                exercise_sections.append("\n".join(section_lines))

        # Handle cardio exercises
        if "get_cardio_exercises" in tool_results:
            results = tool_results["get_cardio_exercises"]
            all_cardio = []
            for r in results:
                if isinstance(r, list):
                    all_cardio.extend(r)
                else:
                    all_cardio.append(r)
            
            if all_cardio:
                seen_ids = set()
                section_lines = [f"**{len(all_cardio)} cardio exercises available:**"]
                for ex in all_cardio:
                    if ex["id"] not in seen_ids:
                        section_lines.append(f"- {ex['standard_name']} (ID: {ex['id']}, Type: {ex.get('base_movement', 'N/A')})")
                        seen_ids.add(ex["id"])
                exercise_sections.append("\n".join(section_lines))

        available_exercises_text = "\n\n---\n\n".join(exercise_sections)

        # Default if no exercises fetched
        if not available_exercises_text:
            available_exercises_text = "No exercises fetched yet. If user wants to plan a workout, ask which muscles to target."

        # Inject ALL context into system prompt
        system_prompt = system_prompt.format(
            user_profile=formatted_context["user_profile"],
            ai_memory=formatted_context["ai_memory"],
            workout_history=formatted_context["workout_history"],
            strength_progression=formatted_context["strength_progression"],
            available_exercises=available_exercises_text,
            glossary_terms=formatted_context["glossary_terms"],
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
            json_pattern = r"```json\s*(.*?)\s*```"
            matches = re.findall(json_pattern, response, re.DOTALL)

            for json_str in matches:
                try:
                    parsed = json.loads(json_str.strip())

                    if parsed.get("type") and parsed.get("data"):
                        components.append(parsed)
                        logger.info(f"Extracted component: {parsed['type']}")

                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON component: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error extracting components: {str(e)}")

        return components

    async def _trigger_session_compaction(self) -> None:
        """
        Extract session memory from old messages (async background task).

        This runs in the background after response streaming completes.
        When done, sets state to 'ready' for the next message to apply.
        """
        try:
            self.compaction_state = "extracting"
            self.compaction_cutoff = len(self.message_history) - 10  # Keep last 10

            messages_to_extract = self.message_history[: self.compaction_cutoff]
            logger.info(f"🗜️ Extracting memory from {len(messages_to_extract)} messages")

            # Get bundle ID for memory storage
            if not self.raw_bundle or not hasattr(self.raw_bundle, "id"):
                logger.warning("No bundle available for session compaction")
                self.compaction_state = "idle"
                return

            bundle_id = self.raw_bundle.id

            # Run session memory extraction
            from app.services.memory.memory_service import MemoryExtractionService

            memory_service = MemoryExtractionService(
                credentials=self.credentials, project_id=self.project_id
            )

            success = await memory_service.append_session_memory(
                user_id=self.user_id, messages=messages_to_extract, bundle_id=bundle_id
            )

            if success:
                self.compaction_state = "ready"
                logger.info("✅ Session compaction ready to apply")
            else:
                logger.error("Session compaction failed, resetting state")
                self.compaction_state = "idle"

        except Exception as e:
            logger.error(f"Error in session compaction: {str(e)}", exc_info=True)
            self.compaction_state = "idle"

    async def _apply_compaction(self) -> None:
        """
        Apply pending compaction: truncate history and reload context.

        Called at the start of process_message when compaction_state is 'ready'.
        """
        try:
            logger.info(
                f"🗜️ Applying compaction: truncating to last {len(self.message_history) - self.compaction_cutoff} messages"
            )

            # Truncate message history
            self.message_history = self.message_history[self.compaction_cutoff :]

            # Reload context to pick up new session memory
            shared_context = await self.context_loader.load_all(self.user_id)
            self.formatted_context = self._format_shared_context(shared_context)
            self.raw_bundle = shared_context.get("bundle")

            # Reset compaction state
            self.compaction_state = "idle"
            self.compaction_cutoff = 0

            logger.info(
                f"✅ Compaction applied, history now {len(self.message_history)} messages"
            )

        except Exception as e:
            logger.error(f"Error applying compaction: {str(e)}", exc_info=True)
            self.compaction_state = "idle"
