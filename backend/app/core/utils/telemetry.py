import logging
from typing import Any, Dict, List, Optional, Union
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.agents import AgentAction, AgentFinish

logger = logging.getLogger(__name__)

# Global in-memory trace store keyed by session_id
# Format: { session_id: [ { "thought": str, "tool": str, "input": dict, "output": str, "final_answer": str }, ... ] }
TRACE_STORE: Dict[str, List[Dict[str, Any]]] = {}


class FlightRecorderCallback(BaseCallbackHandler):
    """
    Flight Recorder captures the Agent's internal state during a session.
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        if session_id not in TRACE_STORE:
            TRACE_STORE[session_id] = []

        # Each turn in the session is tracked here
        self.current_turn: Dict[str, Any] = {
            "thought": None,
            "tool": None,
            "input": None,
            "output": None,
            "final_answer": None,
            "internal_context": None,  # NEW: Snapshot of what the agent sees
        }

    def snapshot_context(self, context_dict: Dict[str, str]) -> None:
        """
        Capture a snapshot of the internal context the agent sees.

        Args:
            context_dict: Formatted context dict (user_profile, ai_memory, etc.)
        """
        # Store a compact summary of the context
        self.current_turn["internal_context"] = {
            "user_profile": context_dict.get("user_profile", "")[
                :200
            ],  # Truncate for storage
            "ai_memory_length": len(context_dict.get("ai_memory", "")),
            "workout_history_length": len(context_dict.get("workout_history", "")),
            "has_strength_data": bool(context_dict.get("strength_progression")),
            "glossary_terms_count": context_dict.get("glossary_terms", "").count(
                "glossary://"
            ),
        }
        logger.debug(f"Telemetry: Captured context snapshot")

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        """Capture the reasoning/thought and the tool name/input."""
        self.current_turn["thought"] = action.log
        self.current_turn["tool"] = action.tool
        self.current_turn["input"] = action.tool_input
        logger.debug(f"Telemetry: Captured action - {action.tool}")

    def on_tool_end(self, output: str, **kwargs: Any) -> Any:
        """Capture the tool output."""
        self.current_turn["output"] = str(output)
        # Commit the turn to the trace store
        TRACE_STORE[self.session_id].append(self.current_turn.copy())
        # Reset for next tool call or final answer (preserve context snapshot)
        context_snapshot = self.current_turn.get("internal_context")
        self.current_turn = {
            "thought": None,
            "tool": None,
            "input": None,
            "output": None,
            "final_answer": None,
            "internal_context": context_snapshot,  # Preserve across tool calls
        }
        logger.debug("Telemetry: Captured tool end")

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> Any:
        """Capture the final output."""
        if "output" in outputs:
            self.current_turn["final_answer"] = outputs["output"]
            # If we have a final answer but no tool was called in this turn, commit it
            if not self.current_turn["tool"] and self.current_turn["final_answer"]:
                TRACE_STORE[self.session_id].append(self.current_turn.copy())
        logger.debug("Telemetry: Captured chain end")


def get_trace(session_id: str) -> List[Dict[str, Any]]:
    """Retrieve the trace for a given session ID."""
    return TRACE_STORE.get(session_id, [])


def clear_trace(session_id: str) -> None:
    """Clear the trace for a given session ID."""
    if session_id in TRACE_STORE:
        del TRACE_STORE[session_id]
