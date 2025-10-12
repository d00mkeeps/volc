"""
Performance profiler for LLM service
Tracks timing of each phase in message processing
"""
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class PerformancePhase:
    name: str
    start_time: float
    end_time: Optional[float] = None
    duration: Optional[float] = None
    metadata: Dict = field(default_factory=dict)
    
    def complete(self, **metadata):
        """Mark phase as complete"""
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time
        self.metadata.update(metadata)
        return self.duration


class PerformanceProfiler:
    """Tracks performance metrics for a single message/conversation flow"""
    
    def __init__(self, conversation_id: str, enabled: bool = True):
        self.conversation_id = conversation_id
        self.enabled = enabled
        self.start_time = time.time()
        self.phases: List[PerformancePhase] = []
        self.current_phase: Optional[PerformancePhase] = None
        
    def start_phase(self, name: str, **metadata) -> PerformancePhase:
        """Start timing a new phase"""
        if not self.enabled:
            return None
            
        # Complete previous phase if exists
        if self.current_phase and self.current_phase.end_time is None:
            self.current_phase.complete()
            
        phase = PerformancePhase(
            name=name,
            start_time=time.time(),
            metadata=metadata
        )
        self.phases.append(phase)
        self.current_phase = phase
        
        elapsed = phase.start_time - self.start_time
        logger.info(f"⏱️  [{elapsed:.3f}s] Started: {name}")
        
        return phase
        
    def end_phase(self, **metadata) -> Optional[float]:
        """End the current phase"""
        if not self.enabled or not self.current_phase:
            return None
            
        duration = self.current_phase.complete(**metadata)
        elapsed = time.time() - self.start_time
        
        logger.info(
            f"⏱️  [{elapsed:.3f}s] Completed: {self.current_phase.name} "
            f"(took {duration:.3f}s)"
        )
        
        return duration
        
    def get_summary(self) -> Dict:
        """Get performance summary"""
        total_duration = time.time() - self.start_time
        
        summary = {
            "conversation_id": self.conversation_id,
            "total_duration": total_duration,
            "phases": []
        }
        
        for phase in self.phases:
            if phase.duration is not None:
                summary["phases"].append({
                    "name": phase.name,
                    "duration": phase.duration,
                    "metadata": phase.metadata
                })
                
        return summary
        
    def log_summary(self):
        """Log detailed performance summary"""
        if not self.enabled:
            return
            
        summary = self.get_summary()
        
        logger.info("=" * 60)
        logger.info(f"PERFORMANCE SUMMARY - Conversation: {self.conversation_id}")
        logger.info("=" * 60)
        
        for phase_data in summary["phases"]:
            name = phase_data["name"]
            duration = phase_data["duration"]
            logger.info(f"{name:.<45} {duration:.3f}s")
            
            # Log metadata if present
            if phase_data["metadata"]:
                for key, value in phase_data["metadata"].items():
                    logger.info(f"  └─ {key}: {value}")
                    
        logger.info(f"{'TOTAL':.<45} {summary['total_duration']:.3f}s")
        logger.info("=" * 60)
        
        # Performance warnings
        self._log_warnings(summary)
    def _log_warnings(self, summary: Dict):
        """Log performance warnings"""
        for phase_data in summary["phases"]:
            name = phase_data["name"]
            duration = phase_data["duration"]
            metadata = phase_data.get("metadata", {})
            
            # Context loading warnings
            if name == "context_loading" and duration > 0.5:
                logger.warning(f"⚠️  Context loading slow: {duration:.3f}s (target: <0.5s)")
            
            # User profile warnings
            elif name == "user_profile_loading" and duration > 0.1:
                logger.warning(f"⚠️  User profile loading slow: {duration:.3f}s (target: <0.1s)")
            
            # Prompt formatting warnings
            elif name == "prompt_formatting" and duration > 0.2:
                logger.warning(f"⚠️  Prompt formatting slow: {duration:.3f}s (target: <0.2s)")
            
            # LLM first token warnings
            elif name == "llm_first_token" and duration > 2.0:
                logger.warning(f"⚠️  Time to first token high: {duration:.3f}s (target: <2.0s)")
            
            # Agent LLM call warnings
            elif name.startswith("agent_llm_call"):
                if duration > 6.0:
                    logger.warning(
                        f"⚠️  {name} slow: {duration:.3f}s (target: <6.0s)"
                    )
                
                # Warn about large prompts
                prompt_size = metadata.get("prompt_size", 0)
                if prompt_size > 50000:
                    logger.warning(
                        f"⚠️  {name} large context: {prompt_size:,} chars (target: <50,000)"
                    )
                elif prompt_size > 30000:
                    logger.info(
                        f"ℹ️  {name} moderate context: {prompt_size:,} chars"
                    )
                
                # Info about result type
                result_type = metadata.get("result_type")
                if result_type == "tool_calls":
                    num_calls = metadata.get("num_tool_calls", 0)
                    logger.info(f"ℹ️  {name} decided to call {num_calls} tool(s)")
                elif result_type == "final_answer":
                    response_length = metadata.get("response_length", 0)
                    logger.info(f"ℹ️  {name} generated final answer ({response_length} chars)")
            
            # Tool execution warnings
            elif name.startswith("tool_execution"):
                tool_name = metadata.get("tool_name", "unknown")
                
                # Warn about slow tool execution
                if duration > 1.0:
                    logger.warning(
                        f"⚠️  {name} ({tool_name}) slow: {duration:.3f}s (target: <1.0s)"
                    )
                
                # Warn about large result sets
                items_returned = metadata.get("items_returned")
                if items_returned is not None:
                    if items_returned > 150:
                        logger.warning(
                            f"⚠️  {name} ({tool_name}) returned many items: {items_returned} "
                            "(consider filtering or pagination)"
                        )
                    elif items_returned > 100:
                        logger.info(
                            f"ℹ️  {name} ({tool_name}) returned {items_returned} items"
                        )
                
                # Warn about large output size
                output_size = metadata.get("output_size_chars", 0)
                if output_size > 100000:
                    logger.warning(
                        f"⚠️  {name} ({tool_name}) large output: {output_size:,} chars "
                        "(may increase next LLM call latency)"
                    )
            
            # Planning context warnings
            elif name == "load_recent_workouts":
                workout_count = metadata.get("workout_count", 0)
                if workout_count > 20 and duration > 0.5:
                    logger.warning(
                        f"⚠️  Loading {workout_count} workouts took {duration:.3f}s (consider caching)"
                    )
            
            elif name == "load_user_profile_for_planning":
                if not metadata.get("loaded", False) and duration > 0.2:
                    logger.warning(
                        f"⚠️  Failed to load user profile after {duration:.3f}s"
                    )
        
        # Overall performance warnings
        total_duration = summary["total_duration"]
        
        if total_duration > 15.0:
            logger.warning(
                f"⚠️  Total response time very high: {total_duration:.3f}s (target: <5.0s)"
            )
        elif total_duration > 5.0:
            logger.warning(
                f"⚠️  Total response time high: {total_duration:.3f}s (target: <5.0s)"
            )
        
        # Count agent LLM calls
        agent_llm_calls = [p for p in summary["phases"] if p["name"].startswith("agent_llm_call")]
        if len(agent_llm_calls) > 4:
            logger.warning(
                f"⚠️  High number of agent LLM calls: {len(agent_llm_calls)} "
                "(agent may be looping - consider adding max_iterations)"
            )
        elif len(agent_llm_calls) > 2:
            logger.info(
                f"ℹ️  Agent made {len(agent_llm_calls)} LLM calls "
                "(this is normal for complex queries)"
            )
        
        # Count tool calls
        tool_calls = [p for p in summary["phases"] if p["name"].startswith("tool_execution")]
        if len(tool_calls) > 3:
            logger.warning(
                f"⚠️  High number of tool calls: {len(tool_calls)} "
                "(consider tool output optimization)"
            )