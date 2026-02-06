import logging
import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from google.oauth2 import service_account

from app.services.llm.unified_coach_service import UnifiedCoachService
from ...services.db.message_service import MessageService
from app.core.websocket_manager import get_websocket_manager
from app.core.utils.websocket_utils import trigger_memory_extraction
from app.core.utils.telemetry import get_trace, clear_trace

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()


# Dependency for WebSocket authentication (placeholder - implement as needed)
async def verify_token(token: str) -> Optional[str]:
    """Verify token and return user_id if valid"""
    return "test_user"


def get_google_credentials():
    """Initialize Google Cloud credentials directly from JSON"""
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

    if not credentials_json:
        logger.error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set")
        raise HTTPException(
            status_code=500, detail="Google Cloud credentials not configured"
        )

    if not project_id:
        logger.error("GOOGLE_CLOUD_PROJECT environment variable not set")
        raise HTTPException(
            status_code=500, detail="Google Cloud project not configured"
        )

    try:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info
        ).with_scopes(["https://www.googleapis.com/auth/cloud-platform"])
        return {"credentials": credentials, "project_id": project_id}
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="Invalid Google Cloud credentials JSON"
        )


# Custom JSON encoder that handles datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        from datetime import datetime

        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


# Dependency for unified coach service
def get_unified_coach_service(credentials: dict = Depends(get_google_credentials)):
    """Dependency for unified coach service"""
    return UnifiedCoachService(
        credentials=credentials["credentials"], project_id=credentials["project_id"]
    )


@router.websocket("/api/llm/coach/{conversation_id}/{user_id}")
async def unified_coach(
    websocket: WebSocket,
    conversation_id: str,
    user_id: str,
    coach_service: UnifiedCoachService = Depends(get_unified_coach_service),
):
    """Unified coaching endpoint - handles planning, analysis, and tracking"""
    connection_id = f"coach-{conversation_id}"
    ws_manager = get_websocket_manager()
    current_stream_task: Optional[asyncio.Task] = None
    message_service = MessageService()

    # Variables for timeout callback
    should_extract_memory = False

    async def on_timeout():
        """Called by WebSocketManager when connection times out"""
        nonlocal should_extract_memory
        logger.warning(f"⏰ Connection timeout for {connection_id}")
        should_extract_memory = True
        try:
            await websocket.close(code=1001, reason="heartbeat_timeout")
        except:
            pass

    try:
        # Accept connection
        await websocket.accept()
        logger.info(f"🔌 Unified coach connected: {conversation_id}")

        # Register with manager
        await ws_manager.register_connection(
            connection_id=connection_id,
            user_id=user_id,
            conversation_id=conversation_id,
            on_timeout=on_timeout,
        )

        # Send connection confirmation
        await websocket.send_json({"type": "connection_status", "data": "connected"})

        # Initialize service (loads context once)
        await coach_service.initialize(conversation_id, user_id)

        # Main message loop
        while True:
            try:
                # Wait for message
                data = await websocket.receive_json()

                # Update heartbeat
                await ws_manager.update_heartbeat(connection_id)

                # Handle heartbeat
                if data.get("type") == "heartbeat":
                    await websocket.send_json(
                        {"type": "heartbeat_ack", "timestamp": data.get("timestamp")}
                    )
                    continue

                # Handle regular message
                message = data.get("message", "")
                if not message:
                    continue

                # Save user message to DB
                await message_service.save_server_message(
                    conversation_id=conversation_id, content=message, sender="user"
                )

                # Stream response from service
                async def stream_response():
                    full_response = ""
                    try:
                        async for chunk in coach_service.process_message(message):
                            # Check if this is a thinking chunk (JSON string with _type: "thinking")
                            if chunk.startswith('{"_type": "thinking"'):
                                # Parse and send as thinking message
                                import json
                                thinking_data = json.loads(chunk)
                                await websocket.send_json({
                                    "type": "thinking",
                                    "data": thinking_data["content"]
                                })
                            else:
                                # Regular content chunk
                                full_response += chunk
                                await websocket.send_json(
                                    {"type": "content", "data": chunk}
                                )
                            await ws_manager.update_heartbeat(connection_id)

                        await websocket.send_json(
                            {"type": "complete", "data": {"length": len(full_response)}}
                        )

                        if full_response:
                            await message_service.save_server_message(
                                conversation_id=conversation_id,
                                content=full_response,
                                sender="assistant",
                            )
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        logger.error(f"Error streaming response: {e}")
                        await websocket.send_json(
                            {"type": "error", "data": {"message": str(e)}}
                        )

                current_stream_task = asyncio.create_task(stream_response())
                await current_stream_task
                current_stream_task = None

            except WebSocketDisconnect:
                should_extract_memory = True
                raise
            except Exception as e:
                should_extract_memory = True
                raise

    except WebSocketDisconnect:
        logger.info(f"Unified coach WebSocket disconnected: {conversation_id}")
        should_extract_memory = True
    except Exception as e:
        logger.error(f"Error in unified coach websocket: {e}")
    finally:
        # Cleanup
        await ws_manager.unregister_connection(connection_id)
        if should_extract_memory:
            try:
                await trigger_memory_extraction(user_id, conversation_id)
            except:
                pass


@router.get("/debug/trace/{session_id}")
async def get_session_trace(session_id: str):
    """Expose recorded trace for a session."""
    trace = get_trace(session_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Session trace not found")
    return trace


@router.delete("/debug/trace/{session_id}")
async def clear_session_trace(session_id: str):
    """Clear recorded trace for a session."""
    clear_trace(session_id)
    return {"status": "cleared"}
