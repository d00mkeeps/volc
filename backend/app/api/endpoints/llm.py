import logging
import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from app.services.llm.unified_coach_service import UnifiedCoachService
from ...services.db.message_service import MessageService
from google.oauth2 import service_account
from app.core.websocket_manager import get_websocket_manager
import asyncio
from typing import List, Dict
from app.core.utils.websocket_utils import trigger_memory_extraction

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency for WebSocket authentication (placeholder - implement as needed)
async def verify_token(token: str) -> Optional[str]:
    """Verify token and return user_id if valid"""
    # Implement your authentication logic here
    # This is a placeholder that always returns success
    return "test_user"




def get_google_credentials():
    """Initialize Google Cloud credentials directly from JSON"""
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    
    # DEBUG: Log environment variable status
    logger.info(f"GOOGLE_APPLICATION_CREDENTIALS_JSON present: {credentials_json is not None}")
    logger.info(f"GOOGLE_CLOUD_PROJECT present: {project_id is not None}")
    if credentials_json:
        logger.info(f"Credentials JSON length: {len(credentials_json)}")
    
    if not credentials_json:
        logger.error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set")
        raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
    
    if not project_id:
        logger.error("GOOGLE_CLOUD_PROJECT environment variable not set")
        raise HTTPException(status_code=500, detail="Google Cloud project not configured")
    
    try:
        credentials_info = json.loads(credentials_json)
        # ADD SCOPES HERE ⬇️
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info
        ).with_scopes([
            "https://www.googleapis.com/auth/cloud-platform"
        ])
        logger.info("Google credentials loaded successfully with scopes")
        return {"credentials": credentials, "project_id": project_id}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid Google Cloud credentials JSON")
        
def get_llm(credentials: dict = Depends(get_google_credentials)):
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        streaming=True,
        max_retries=0,
        temperature=0,
        credentials=credentials["credentials"],  
        project=credentials["project_id"],
        vertexai=True  # Explicit Vertex AI backend selection
    )

# Dependency to get workout LLM service
def get_workout_llm_service(credentials: dict = Depends(get_google_credentials)):
    return WorkoutAnalysisLLMService(
        credentials=credentials["credentials"],
        project_id=credentials["project_id"]
    )

def get_onboarding_service(credentials: dict = Depends(get_google_credentials)):
    return OnboardingLLMService(
        credentials=credentials["credentials"],
        project_id=credentials["project_id"]
    )


# Custom JSON encoder that handles datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        from datetime import datetime
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Helper to safely send JSON with datetime objects
async def send_json_safe(websocket: WebSocket, data: Dict[str, Any]):
    try:
        json_str = json.dumps(data, cls=DateTimeEncoder)
        await websocket.send_text(json_str)
    except Exception as e:
        logger.error(f"Error sending JSON: {str(e)}")
        # Fallback to simple error response
        await websocket.send_json({
            "type": "error",
            "data": {"message": "Error sending response"}
        })

@router.websocket("/api/llm/base/{user_id}")
async def base_llm_websocket(websocket: WebSocket, user_id: str):
    """Base WebSocket endpoint for LLM interactions"""
    
    try:
        await websocket.accept()
        logger.info(f"Base LLM WebSocket connection accepted for user: {user_id}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Handle basic messages
        while True:
            data = await websocket.receive_json()
            
            # Handle heartbeat
            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
            
            # Echo back non-heartbeat messages (placeholder)
            await websocket.send_json({
                "type": "echo",
                "data": data
            })
            
    except WebSocketDisconnect:
        logger.info(f"Base LLM WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logger.error(f"Error in base LLM websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass

# DEPRECATED: Unified coach endpoint replaces these specialized endpoints
# Kept for reference but disabled - remove after confirming unified coach stability

# @router.websocket("/api/llm/onboarding/{user_id}")
# async def onboarding_websocket(
#     websocket: WebSocket,
#     user_id: str,
#     onboarding_service: OnboardingLLMService = Depends(get_onboarding_service)
# ):
#     """
#     WebSocket endpoint for user onboarding conversations.
#     
#     Collects user profile information through natural conversation:
#     - Full name (first_name, last_name)
#     - Age (with numeric validation)
#     - Unit system preference (is_imperial)
#     - Fitness goals
#     - Current abilities/experience
#     - Training preferences
#     
#     The client should send messages with:
#     - type: 'message' and message: 'user message content'
#     - type: 'heartbeat' for connection keepalive
#     
#     The server streams back responses with:
#     - type: 'content' for content chunks
#     - type: 'onboarding_complete' with profile data when done
#     - type: 'error' for error messages
#     - type: 'complete' when each response is complete
#     - type: 'connection_status' for connection confirmation
#     """
#     try:
#         await onboarding_service.process_websocket(websocket, user_id)
#     except WebSocketDisconnect:
#         logger.info(f"Onboarding WebSocket disconnected for user: {user_id}")
#     except Exception as e:
#         logger.error(f"Error in onboarding websocket: {str(e)}", exc_info=True)

# Add new dependency
def get_workout_planning_service(credentials: dict = Depends(get_google_credentials)):
    return WorkoutPlanningLLMService(
        credentials=credentials["credentials"],
        project_id=credentials["project_id"]
    )

def get_unified_coach_service(credentials: dict = Depends(get_google_credentials)):
    """Dependency for unified coach service"""
    return UnifiedCoachService(
        credentials=credentials["credentials"],
        project_id=credentials["project_id"]
    )

# @router.websocket("/api/llm/workout-planning/{user_id}")
# async def llm_workout_planning(
#     websocket: WebSocket, 
#     user_id: str,
#     planning_service: WorkoutPlanningLLMService = Depends(get_workout_planning_service)
# ):
#     """WebSocket endpoint for workout planning conversations"""
#     try:
#         await planning_service.process_websocket(websocket, user_id)
#     except WebSocketDisconnect:
#         logger.info(f"Workout planning WebSocket disconnected for user: {user_id}")
#     except Exception as e:
#         logger.error(f"Error in workout planning websocket: {str(e)}", exc_info=True)
        
# Workout analysis interpretation endpoint
# @router.websocket("/api/llm/workout-analysis/{conversation_id}/{user_id}")
# async def llm_workout_analysis(
#     websocket: WebSocket, 
#     conversation_id: str,
#     user_id: str,
#     llm_service: WorkoutAnalysisLLMService = Depends(get_workout_llm_service)
# ):
#     """
#     WebSocket endpoint for LLM-based workout analysis interpretation.
#     
#     This endpoint handles:
#     - Connecting to the workout analysis service
#     - Loading conversation context (messages + workout data)
#     - Proactive messaging for new conversations with workout data
#     - Processing user messages through workout-specific prompting
#     
#     The client should send messages with:
#     - type: 'message' and message: 'user message content'
#     - type: 'heartbeat' for connection keepalive
#     
#     The server streams back responses with:
#     - type: 'content' for content chunks
#     - type: 'error' for error messages (including rate limits)
#     - type: 'complete' when the response is complete
#     - type: 'connection_status' for connection confirmation
#     """
#     try:
#         await llm_service.process_websocket(websocket, conversation_id, user_id=user_id)
#     except WebSocketDisconnect:
#         logger.info(f"Workout analysis WebSocket disconnected: {conversation_id}")
#         
#         # Trigger memory extraction in background
#         from app.core.utils.websocket_utils import trigger_memory_extraction
#         await trigger_memory_extraction(user_id, conversation_id)
#             
#     except Exception as e:
#         logger.error(f"Error in workout analysis websocket: {str(e)}", exc_info=True)

@router.websocket("/api/llm/coach/{conversation_id}/{user_id}")
async def unified_coach(
    websocket: WebSocket,
    conversation_id: str,
    user_id: str,
    coach_service: UnifiedCoachService = Depends(get_unified_coach_service)
):
    """
    Unified coaching endpoint - handles planning, analysis, and tracking
    through a single conversation interface.
    
    This endpoint provides:
    - Automatic tool selection (exercises, cardio, future: tracking)
    - Seamless mode switching between analysis and planning
    - Shared context loading (user profile, memory, workout history)
    - Consistent coaching personality across all interactions
    
    The client should send messages with:
    - type: 'message' and message: 'user message content'
    - type: 'heartbeat' for connection keepalive
    - type: 'cancel' with reason: 'user_requested' or 'network_error'
    
    The server streams back responses with:
    - type: 'content' for content chunks
    - type: 'workout_template' for workout templates
    - type: 'chart_data' for progress visualizations
    - type: 'error' for error messages
    - type: 'complete' when the response is complete
    - type: 'connection_status' for connection confirmation
    - type: 'heartbeat_ack' for heartbeat acknowledgment
    - type: 'cancelled' when stream is cancelled
    """
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
            on_timeout=on_timeout
        )
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Initialize service (loads context once)
        await coach_service.initialize(conversation_id, user_id)
        logger.info(f"✅ Service initialized for {conversation_id}")
        
        # Main message loop
        while True:
            try:
                # Wait for message
                data = await websocket.receive_json()
                
                # Update heartbeat
                await ws_manager.update_heartbeat(connection_id)
                
                # Handle heartbeat
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Handle cancel during active stream
                if data.get('type') == 'cancel':
                    if current_stream_task and not current_stream_task.done():
                        cancel_reason = data.get('reason', 'unknown')
                        logger.info(f"🛑 Stream cancelled: {cancel_reason}")
                        
                        # Cancel the stream
                        current_stream_task.cancel()
                        try:
                            await current_stream_task
                        except asyncio.CancelledError:
                            pass
                        
                        # Get partial response
                        partial_response = coach_service.get_current_response()
                        
                        # Save partial if user requested
                        if cancel_reason == 'user_requested' and partial_response.strip():
                            logger.info(f"💾 Saving partial response ({len(partial_response)} chars)")
                            await message_service.save_server_message(
                                conversation_id=conversation_id,
                                content=partial_response + " [cancelled]",
                                sender="assistant"
                            )
                            coach_service.add_to_history("assistant", partial_response + " [cancelled]")
                        else:
                            logger.info("🗑️ Discarding partial response")
                        
                        # Reset current response
                        coach_service.reset_current_response()
                        
                        # Send acknowledgment
                        await websocket.send_json({
                            "type": "cancelled",
                            "reason": cancel_reason
                        })
                        
                        current_stream_task = None
                    continue
                
                # Handle regular message
                message = data.get('message', '')
                if not message:
                    continue
                
                logger.info(f"📨 Processing message: {message[:80]}...")
                
                # Save user message to DB
                await message_service.save_server_message(
                    conversation_id=conversation_id,
                    content=message,
                    sender="user"
                )
                
                # Stream response from service
                async def stream_response():
                    full_response = ""
                    try:
                        async for chunk in coach_service.process_message(message):
                            full_response += chunk
                            await websocket.send_json({
                                "type": "content",
                                "data": chunk
                            })
                        
                        # Send completion
                        await websocket.send_json({
                            "type": "complete",
                            "data": {"length": len(full_response)}
                        })
                        
                        # Save AI response to DB
                        if full_response:
                            await message_service.save_server_message(
                                conversation_id=conversation_id,
                                content=full_response,
                                sender="assistant"
                            )
                        
                        logger.info(f"✅ Message processed successfully")
                    
                    except asyncio.CancelledError:
                        logger.info("Stream task cancelled")
                        raise
                    except Exception as e:
                        logger.error(f"Error streaming response: {e}", exc_info=True)
                        await websocket.send_json({
                            "type": "error",
                            "data": {"message": str(e)}
                        })
                
                # Start streaming task
                current_stream_task = asyncio.create_task(stream_response())
                await current_stream_task
                current_stream_task = None
            
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                should_extract_memory = True
                raise
            
            except Exception as e:
                error_msg = str(e).lower()
                if "disconnect" in error_msg or "close" in error_msg:
                    logger.info(f"Connection closed: {connection_id}")
                    should_extract_memory = True
                    raise WebSocketDisconnect()
                logger.error(f"Error in message loop: {e}", exc_info=True)
                should_extract_memory = True
                raise
    
    except WebSocketDisconnect:
        logger.info(f"Unified coach WebSocket disconnected: {conversation_id}")
        should_extract_memory = True
    
    except Exception as e:
        logger.error(f"Error in unified coach websocket: {e}", exc_info=True)
    
    finally:
        # Cleanup
        logger.info(f"🧹 Cleaning up connection: {connection_id}")
        
        # Cancel any active stream
        if current_stream_task and not current_stream_task.done():
            current_stream_task.cancel()
            try:
                await current_stream_task
            except asyncio.CancelledError:
                pass
        
        # Unregister from manager
        await ws_manager.unregister_connection(connection_id)
        
        # Trigger memory extraction if needed
        if should_extract_memory:
            logger.info(f"🧠 Triggering memory extraction for {conversation_id}")
            try:
                await trigger_memory_extraction(user_id, conversation_id)
            except Exception as mem_error:
                logger.error(f"Memory extraction failed: {mem_error}", exc_info=True)