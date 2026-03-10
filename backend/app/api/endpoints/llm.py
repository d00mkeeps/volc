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

        # variables for safe sending
        ws_lock = asyncio.Lock()

        async def safe_send_json(data: dict):
            """Send JSON safely with a lock to prevent concurrent frame corruption."""
            async with ws_lock:
                try:
                    await websocket.send_json(data)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message: {e}")
                    raise

        # Main message loop
        async def handle_messages():
            nonlocal current_stream_task, should_extract_memory
            try:
                while True:
                    data = await websocket.receive_json()
                    
                    # Update heartbeat
                    await ws_manager.update_heartbeat(connection_id)

                    # Handle heartbeat
                    if data.get("type") == "heartbeat":
                        await safe_send_json(
                            {"type": "heartbeat_ack", "timestamp": data.get("timestamp")}
                        )
                        continue

                    # Handle regular message
                    message = data.get("message", "")
                    if not message:
                        continue

                    # Cancel existing stream if any
                    if current_stream_task and not current_stream_task.done():
                        logger.info(f"🚫 Cancelling active stream for new message: {connection_id}")
                        current_stream_task.cancel()
                        try:
                            await current_stream_task
                        except asyncio.CancelledError:
                            pass

                    # Save user message to DB
                    await message_service.save_server_message(
                        conversation_id=conversation_id, content=message, sender="user"
                    )

                    # Stream response from service
                    async def stream_response(msg_text: str):
                        full_response = ""
                        last_activity_time = asyncio.get_event_loop().time()

                        async def keep_alive():
                            """Background task to send periodic updates and keep connection alive."""
                            try:
                                while True:
                                    await asyncio.sleep(15)
                                    # If no activity for 15s, send a small 'thinking' update to keep connection hot
                                    if asyncio.get_event_loop().time() - last_activity_time >= 15:
                                        await safe_send_json({"type": "thinking", "data": " "})
                                        await ws_manager.update_heartbeat(connection_id)
                            except asyncio.CancelledError:
                                pass
                            except Exception as e:
                                logger.error(f"Error in keep-alive task: {e}")

                        ka_task = asyncio.create_task(keep_alive())

                        try:
                            async for chunk in coach_service.process_message(msg_text):
                                last_activity_time = asyncio.get_event_loop().time()
                                # Update heartbeat on every chunk to prevent timeout during slow streams
                                await ws_manager.update_heartbeat(connection_id)

                                if chunk.startswith('{"_type": "thinking"'):
                                    thinking_data = json.loads(chunk)
                                    await safe_send_json({
                                        "type": "thinking",
                                        "data": thinking_data["content"]
                                    })
                                elif chunk.startswith('{"_type": "tool_call"'):
                                    tool_data = json.loads(chunk)
                                    await safe_send_json({
                                        "type": "tool_call",
                                        "data": tool_data
                                    })
                                else:
                                    full_response += chunk
                                    await safe_send_json(
                                        {"type": "content", "data": chunk}
                                    )
                                # Also update heartbeat after sending JSON to be safe
                                await ws_manager.update_heartbeat(connection_id)

                            await safe_send_json(
                                {"type": "complete", "data": {"length": len(full_response)}}
                            )

                            if full_response:
                                await message_service.save_server_message(
                                    conversation_id=conversation_id,
                                    content=full_response,
                                    sender="assistant",
                                )
                        except asyncio.CancelledError:
                            logger.info(f"⏹️ Stream cancelled: {connection_id}")
                            # Optionally add partial response to history if useful
                            raise
                        except Exception as e:
                            logger.error(f"Error streaming response: {e}", exc_info=True)
                            try:
                                await safe_send_json(
                                    {"type": "error", "data": {"message": str(e)}}
                                )
                            except:
                                pass
                        finally:
                            ka_task.cancel()
                            try:
                                await ka_task
                            except asyncio.CancelledError:
                                pass

                    current_stream_task = asyncio.create_task(stream_response(message))

            except WebSocketDisconnect:
                should_extract_memory = True
                if current_stream_task:
                    current_stream_task.cancel()
            except Exception as e:
                logger.error(f"Error in message handler: {e}", exc_info=True)
                should_extract_memory = True
                if current_stream_task:
                    current_stream_task.cancel()

        await handle_messages()

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
