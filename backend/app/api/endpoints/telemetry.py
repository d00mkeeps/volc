"""Telemetry & Keep-Alive Endpoints for Volc.

Exposes endpoints for database health monitoring, Supabase keep-alive triggers,
and client-side error telemetry.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any

from app.services.telemetry.keep_alive_service import keep_alive_service

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("/keepalive")
async def get_keepalive_status():
    """Retrieve Supabase keep-alive status, last ping timestamp, and latency metrics."""
    return keep_alive_service.get_summary()


@router.post("/keepalive/ping")
async def trigger_keepalive_ping():
    """Trigger an immediate read/write keep-alive ping against Supabase."""
    return await keep_alive_service.ping()


@router.post("/errors")
async def report_client_telemetry_error(request: Request):
    """Ingest a client-side telemetry error and forward it to Cano Agent Inbox."""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    title = data.get("title") or data.get("message") or "Client Telemetry Error"
    message = data.get("message") or title
    stack = data.get("stack")
    level = data.get("level") or "error"
    metadata = data.get("metadata") or {}

    # Forward to Agent Inbox
    pusher = keep_alive_service._get_inbox_pusher()
    if pusher:
        pusher(
            project="volc",
            title=title,
            message=message,
            source="mobile-client",
            level=level,
            stack=stack,
            metadata=metadata,
        )

    return {"ok": True, "logged": True}
