"""
Tool Selector (v2)

Changes from v1:
- Added <rules> section for hard constraints
- Added forceful mapping with explicit examples
- Added logging for model reasoning
- Restructured prompt for clarity

Location: /app/services/llm/tool_selector.py
"""

import logging
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.services.llm.base import BaseLLMService
from app.tools.exercise_tool import (
    get_strength_exercises,
    get_cardio_exercises,
    get_mobility_exercises,
)

logger = logging.getLogger(__name__)

# Dedicated file logger for tool selector debugging
TOOL_SELECTOR_LOG = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "testing", "logs", "tool_selector.log"
)
os.makedirs(os.path.dirname(TOOL_SELECTOR_LOG), exist_ok=True)


def _log_to_file(content: str) -> None:
    """Append content to the dedicated tool selector log file."""
    with open(TOOL_SELECTOR_LOG, "a") as f:
        f.write(content)


class ToolSelector(BaseLLMService):
    """
    Fast semantic tool selection using Gemini 2.5 Flash Lite.
    Determines which tools are needed and generates arguments.
    """

    def __init__(self, credentials=None, project_id=None):
        super().__init__(
            model_name="gemini-2.5-flash-lite",
            temperature=0,
            credentials=credentials,
            project_id=project_id,
        )

        self.tools = [
            get_strength_exercises,
            get_cardio_exercises,
            get_mobility_exercises,
        ]
        self.model_with_tools = self.llm.bind_tools(self.tools)

        self.system_prompt = """You are a SILENT TOOL ROUTER. You do NOT respond to the user. You ONLY decide if exercise data is needed.

OUTPUT: Either call a tool, or output nothing. Do not write conversational text.

<tools>
1. get_strength_exercises(muscle_groups: List[str], equipment?: List[str])
   - For: workouts, lifting, building muscle, strength training
   - muscle_groups: chest, back, shoulders, biceps, triceps, lats, quadriceps, hamstrings, glutes, abs, calves
   - equipment: barbell, dumbbell, cable, machine, bodyweight, kettlebell, band

2. get_cardio_exercises(base_movement?: str, equipment?: str)
   - For: cardio, running, cycling, swimming, rowing, endurance
   
3. get_mobility_exercises(muscle_groups?: List[str])
   - For: stretching, warm-up, cool-down, mobility, foam rolling, recovery, soreness
   - Do NOT pass equipment (data doesn't have equipment for mobility)
</tools>

<mapping>
"push day" → muscle_groups=['chest', 'shoulders', 'triceps']
"pull day" → muscle_groups=['back', 'biceps', 'lats']
"leg day" → muscle_groups=['quadriceps', 'hamstrings', 'glutes', 'calves']
"upper body" → muscle_groups=['chest', 'back', 'shoulders', 'biceps', 'triceps']
"lower body" → muscle_groups=['quadriceps', 'hamstrings', 'glutes', 'calves']
"full body" → muscle_groups=['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes']
"back" → muscle_groups=['lats', 'traps', 'lower_back', 'rhomboids']
</mapping>

<when_to_call>
CALL TOOL IF user:
- Requests a workout, exercises, or training plan
- Asks for stretches, warm-up, cool-down, or mobility work
- Says "give me", "build me", "create", "plan" + workout/exercises/stretches
- Mentions soreness + wants stretches (infer muscle groups from context)
- Confirms they want exercises after coach asks clarifying questions

DO NOT CALL IF user:
- Is just chatting or asking questions
- Is reviewing/approving a workout already shown
- Says "APPROVE" or "looks good"
</when_to_call>

<examples>
User: "push day with dumbbells" → get_strength_exercises(muscle_groups=['chest','shoulders','triceps'], equipment=['dumbbell'])
User: "stretch after leg day" → get_mobility_exercises(muscle_groups=['quadriceps','hamstrings','glutes'])
User: "my legs are sore, need recovery" → get_mobility_exercises(muscle_groups=['quadriceps','hamstrings','glutes'])
User: "give me the mobility stuff as a workout" → get_mobility_exercises()
User: "warm up before squats" → get_mobility_exercises(muscle_groups=['quadriceps','hamstrings','glutes','hips'])
User: "cardio on the rower" → get_cardio_exercises(base_movement='rowing')
User: "how's my progress?" → no tool
User: "APPROVE" → no tool
</examples>

MANDATORY INITIAL STEP: You must think step-by-step inside <thought> tags before deciding. Then call the appropriate tool or output nothing. Do NOT include any conversational text outside the tool call."""

    async def select_tools(
        self, message: str, history: List[Dict]
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Determine if tools are needed and return tool calls.

        Args:
            message: User's current message
            history: Recent message history for context

        Returns:
            Tuple: (List of tool call dicts, raw_reasoning_string)
            tool_calls: [{'name': 'tool_name', 'args': {...}}, ...]
        """
        import asyncio

        raw_reasoning = ""

        try:
            messages = [SystemMessage(content=self.system_prompt)]

            # Add recent history (last 6 messages)
            for msg in history[-6:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

            messages.append(HumanMessage(content=message))

            # Log context for observability
            logger.info(f"🎯 ToolSelector Triggered")
            logger.info(f"  └─ User Message: '{message[:100]}...'")
            logger.info(f"  └─ Context History ({len(history)} total):")
            for m in messages[1:-1]:  # Skip system and current message
                role = "User" if isinstance(m, HumanMessage) else "Assistant"
                logger.debug(f"     - {role}: {m.content[:50]}...")

            # === FILE LOGGING: INPUT ===
            _log_to_file(f"\n{'='*80}\n")
            _log_to_file(f"[{datetime.now().isoformat()}] TOOL SELECTOR INVOCATION\n")
            _log_to_file(f"{'='*80}\n\n")
            _log_to_file(f"## USER MESSAGE:\n{message}\n\n")
            _log_to_file(f"## CONVERSATION HISTORY ({len(history)} messages):\n")
            for i, msg in enumerate(history[-6:]):
                _log_to_file(
                    f"  [{i+1}] {msg['role'].upper()}: {msg['content'][:200]}{'...' if len(msg['content']) > 200 else ''}\n"
                )

            # Use base class retry-wrapped invocation
            response = await self._call_with_retry(self.model_with_tools.ainvoke, messages)

            if response is None:
                logger.error("❌ ToolSelector failed after retries")
                _log_to_file(f"\n## RESULT: FAILED (no response after retries)\n")
                return [], ""

            # Log model's reasoning if present
            raw_reasoning = response.content if response.content else ""
            if raw_reasoning:
                logger.info(f"🧠 Reasoning: {raw_reasoning[:300]}...")

            # === FILE LOGGING: REASONING ===
            _log_to_file(
                f"\n## LLM REASONING:\n{raw_reasoning if raw_reasoning else '(no reasoning provided)'}\n"
            )

            tool_calls = []
            if response.tool_calls:
                logger.info(f"✅ Decided on {len(response.tool_calls)} tool call(s):")
                for tc in response.tool_calls:
                    tool_calls.append({"name": tc["name"], "args": tc["args"]})
                    logger.info(f"   🔧 {tc['name']}({tc['args']})")

                # === FILE LOGGING: OUTPUT ===
                _log_to_file(f"\n## TOOL CALLS ({len(tool_calls)}):\n")
                for tc in tool_calls:
                    _log_to_file(f"  → {tc['name']}({tc['args']})\n")
            else:
                logger.info(f"✨ Result: No tools required for this request.")
                _log_to_file(f"\n## TOOL CALLS: None (no tools required)\n")

            _log_to_file(f"\n{'─'*80}\n")
            return tool_calls, raw_reasoning

        except Exception as e:
            logger.error(f"❌ Tool selection failed: {str(e)}", exc_info=True)
            return [], raw_reasoning
