from langchain.callbacks.base import AsyncCallbackHandler
from typing import Any, Dict, List, Optional
import logging
from app.services.llm.performance_profiler import PerformanceProfiler

logger = logging.getLogger(__name__)


class AgentProfilerCallback(AsyncCallbackHandler):
    """Integrates agent execution phases with PerformanceProfiler."""

    def __init__(self, profiler: PerformanceProfiler):
        self.profiler = profiler
        self.llm_call_count = 0
        self.tool_call_count = 0
        self.current_phase_name = None

    async def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        """Track LLM call start."""
        self.llm_call_count += 1
        self.current_phase_name = f"agent_llm_call_{self.llm_call_count}"

        # Calculate prompt size
        total_prompt_length = sum(len(p) for p in prompts)

        self.profiler.start_phase(
            self.current_phase_name,
            prompt_size=total_prompt_length,
            call_type="reasoning" if self.llm_call_count == 1 else "generation",
        )

    async def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        """Track LLM call completion."""
        metadata = {}

        # Determine result type
        if hasattr(response, "generations"):
            gen = response.generations[0][0]
            if hasattr(gen, "message"):
                msg = gen.message
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    metadata["result_type"] = "tool_calls"
                    metadata["num_tool_calls"] = len(msg.tool_calls)
                else:
                    metadata["result_type"] = "final_answer"
                    metadata["response_length"] = len(msg.content)

        self.profiler.end_phase(**metadata)

    async def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> None:
        """Track tool execution start."""
        self.tool_call_count += 1
        tool_name = serialized.get("name", "unknown")

        self.profiler.start_phase(
            f"tool_execution_{self.tool_call_count}",
            tool_name=tool_name,
            input_preview=input_str[:100],
        )

    async def on_tool_end(self, output: str, **kwargs: Any) -> None:
        """Track tool execution completion."""
        metadata = {}

        if isinstance(output, list):
            metadata["items_returned"] = len(output)
            # Calculate rough size
            metadata["output_size_chars"] = sum(
                len(str(item)) for item in output[:10]
            )  # Sample
        else:
            metadata["output_size_chars"] = len(str(output))

        self.profiler.end_phase(**metadata)
