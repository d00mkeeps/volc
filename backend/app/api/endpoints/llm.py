import logging
import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from dotenv import load_dotenv
from langchain_google_vertexai import ChatVertexAI
from ...services.llm.workout_analysis import WorkoutAnalysisLLMService
from google.oauth2 import service_account

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
    
    if not credentials_json:
        logger.error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set")
        raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
    
    if not project_id:
        logger.error("GOOGLE_CLOUD_PROJECT environment variable not set")
        raise HTTPException(status_code=500, detail="Google Cloud project not configured")
    
    try:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        return {"credentials": credentials, "project_id": project_id}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid Google Cloud credentials JSON")

def get_llm(credentials: dict = Depends(get_google_credentials)):
    return ChatVertexAI(
        model="gemini-2.5-flash",
        streaming=True,
        max_retries=0,
        temperature=0,
        credentials=credentials["credentials"],  
        project=credentials["project_id"]       
    )

# Dependency to get workout LLM service
def get_workout_llm_service(credentials: dict = Depends(get_google_credentials)):
    return WorkoutAnalysisLLMService(
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

# Base user connection for all LLM WebSockets
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

@router.websocket("/api/llm/onboarding")
async def onboarding_websocket(
    websocket: WebSocket,
    llm: ChatVertexAI = Depends(get_llm)
):
    """WebSocket endpoint for onboarding conversations"""
    
    try:
        await websocket.accept()
        logger.info("Onboarding WebSocket connection accepted")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Initialize conversation with system prompt
        conversation_history = [{
            "role": "system", 
            "content": """You are a fitness assistant helping a new user set up their 
            fitness profile. Guide them through questions about their fitness goals, 
            experience level, preferred workout types, and any limitations they have. 
            Be conversational, friendly, and helpful."""
        }]
        
        # Process messages
        while True:
            data = await websocket.receive_json()
            
            # Handle heartbeat
            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
            
            # Handle message
            if data.get('type') == 'message' or 'message' in data:
                message = data.get('message', '')
                
                # Add user message to history
                conversation_history.append({"role": "user", "content": message})
                
                try:
                    # Stream response
                    response_content = ""
                    
                    with llm.stream(conversation_history) as stream:
                        for chunk in stream:
                            chunk_content = chunk.content
                            if chunk_content:
                                response_content += chunk_content
                                await websocket.send_json({
                                    "type": "content",
                                    "data": {"content": chunk_content}
                                })
                    
                    # Add assistant response to history
                    conversation_history.append({"role": "assistant", "content": response_content})
                    
                    # Send completion notification
                    await websocket.send_json({
                        "type": "complete",
                        "data": {"message_id": len(conversation_history) // 2}
                    })
                    
                except Exception as e:
                    logger.error(f"Error processing onboarding message: {str(e)}", exc_info=True)
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": f"Error generating response: {str(e)}"}
                    })
            
    except WebSocketDisconnect:
        logger.info("Onboarding WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in onboarding websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass

# Workout analysis interpretation endpoint
@router.websocket("/api/llm/workout-analysis/{conversation_id}/{user_id}")
async def llm_workout_analysis(
    websocket: WebSocket, 
    conversation_id: str,
    user_id: str,
    llm_service: WorkoutAnalysisLLMService = Depends(get_workout_llm_service)
):
    """
    WebSocket endpoint for LLM-based workout analysis interpretation.
    
    This endpoint handles:
    - Connecting to the workout analysis service
    - Loading conversation context (messages + workout data)
    - Proactive messaging for new conversations with workout data
    - Processing user messages through workout-specific prompting
    
    The client should send messages with:
    - type: 'message' and message: 'user message content'
    - type: 'heartbeat' for connection keepalive
    
    The server streams back responses with:
    - type: 'content' for content chunks
    - type: 'error' for error messages (including rate limits)
    - type: 'complete' when the response is complete
    - type: 'connection_status' for connection confirmation
    """
    try:
        await llm_service.process_websocket(websocket, conversation_id, user_id=user_id)
    except WebSocketDisconnect:
        logger.info(f"Workout analysis WebSocket disconnected: {conversation_id}")
    except Exception as e:
        logger.error(f"Error in workout analysis websocket: {str(e)}", exc_info=True)