"""
LLM Telemetry Logger

Handles logging of LLM-specific metrics to the usage_logs table.
"""
import logging
import asyncio
from typing import Optional
from datetime import datetime
from app.core.supabase.client import get_admin_client

logger = logging.getLogger(__name__)


class LLMTelemetryLogger:
    """Service for logging LLM performance metrics"""
    
    @staticmethod
    async def log_llm_request(
        path: str,
        user_id: Optional[str],
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
        model_name: str,
        status_code: int = 200,
        method: str = "WS"
    ) -> None:
        """
        Log an LLM request with token usage and performance metrics.
        
        Args:
            path: The endpoint path (e.g., "/api/llm/workout-analysis")
            user_id: UUID of the user making the request
            input_tokens: Number of tokens in the prompt
            output_tokens: Number of tokens in the response
            latency_ms: Total latency in milliseconds
            model_name: Name of the LLM model (e.g., "gemini-2.5-flash")
            status_code: HTTP-like status code (default 200)
            method: Request method (default "WS" for WebSocket)
        """
        try:
            data = {
                "path": path,
                "method": method,
                "status_code": status_code,
                "latency_ms": latency_ms,
                "user_id": user_id,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "model_name": model_name,
                "endpoint_type": "llm",
                "tokens_used": input_tokens + output_tokens,  # Legacy field
            }
            
            # Use admin client for logging
            supabase = get_admin_client()
            
            # Run in thread executor to avoid blocking
            await asyncio.to_thread(
                lambda: supabase.table("usage_logs").insert(data).execute()
            )
            
            logger.debug(
                f"Logged LLM request: {path} | "
                f"Tokens: {input_tokens}→{output_tokens} | "
                f"Latency: {latency_ms}ms | "
                f"Model: {model_name}"
            )
            
        except Exception as e:
            logger.error(f"Failed to log LLM telemetry: {str(e)}", exc_info=True)


# Singleton instance
llm_telemetry_logger = LLMTelemetryLogger()
