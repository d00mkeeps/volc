import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.supabase.client import get_admin_client
import logging
import asyncio

logger = logging.getLogger(__name__)


class TelemetryMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Process the request
        response = await call_next(request)

        # Calculate latency
        process_time = time.time() - start_time
        latency_ms = int(process_time * 1000)

        # Extract details
        path = request.url.path
        method = request.method
        status_code = response.status_code

        # Skip logging for health checks or options
        if path == "/health" or method == "OPTIONS":
            return response

        # Fire and forget logging (don't block response)
        asyncio.create_task(
            self.log_request(
                path=path, method=method, status_code=status_code, latency_ms=latency_ms
            )
        )

        return response

    async def log_request(
        self, path: str, method: str, status_code: int, latency_ms: int
    ):
        try:
            data = {
                "path": path,
                "method": method,
                "status_code": status_code,
                "latency_ms": latency_ms,
                # user_id and tokens_used would need more complex extraction
                # (e.g. from request state if auth middleware ran first)
            }

            # Insert into Supabase
            # Using fire-and-forget might be risky if supabase client isn't async safe or if we want strict guarantees,
            # but for telemetry it's usually fine to avoid slowing down the main thread.
            # Note: supabase-py is synchronous by default unless using the async client.
            # If 'supabase' from client.py is the sync client, we should run this in a thread executor
            # or use the async postgrest client if available.
            # Assuming standard supabase-py client which is sync for data operations usually.

            # For safety in async context with sync client:
            supabase = get_admin_client()
            await asyncio.to_thread(
                lambda: supabase.table("usage_logs").insert(data).execute()
            )

        except Exception as e:
            logger.error(f"Failed to log telemetry: {str(e)}")
