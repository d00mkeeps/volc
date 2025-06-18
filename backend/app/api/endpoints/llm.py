# app/api/endpoints/llm.py

import logging
import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from ...services.llm.workout_analysis import WorkoutAnalysisLLMService
from ...services.chains.workout_analysis_chain import WorkoutAnalysisChain

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Dependency for WebSocket authentication (placeholder - implement as needed)
async def verify_token(token: str) -> Optional[str]:
    """Verify token and return user_id if valid"""
    # Implement your authentication logic here
    # This is a placeholder that always returns success
    return "test_user"

# Dependency to get Anthropic API key
def get_anthropic_api_key():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY environment variable not set")
        raise HTTPException(status_code=500, detail="API configuration error")
    return api_key

# Dependency to get LLM instance
def get_llm(api_key: str = Depends(get_anthropic_api_key)):
    return ChatAnthropic(
        model="claude-3-7-sonnet-20250219",
        streaming=True,
        api_key=api_key,
        max_retries=0
    )

# Dependency to get workout LLM service
def get_workout_llm_service(api_key: str = Depends(get_anthropic_api_key)):
    return WorkoutAnalysisLLMService(api_key=api_key)

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
@router.websocket("/api/llm/conversation/{conversation_id}/{user_id}")
async def conversation_websocket(
    websocket: WebSocket, 
    conversation_id: str,
    user_id: str,
    llm: ChatAnthropic = Depends(get_llm)
):
    """WebSocket endpoint for general LLM conversations"""
    
    try:
        await websocket.accept()
        logger.info(f"Conversation WebSocket connection accepted: {conversation_id}")
        
        # Load conversation context from cache
        from app.services.cache.conversation_attachments_cache import conversation_cache
        from app.services.db.message_service import MessageService
        
        try:
            context = await conversation_cache.get_conversation_context(conversation_id, user_id)
        except Exception as e:
            logger.error(f"Cache error, using empty context: {e}")
            context = {"messages": [], "analysis_bundles": []}
        
        message_service = MessageService()
        
        # Build conversation history from loaded messages + analysis context
        conversation_history = []
        
        # Add analysis bundles as system context if present
        if context["analysis_bundles"]:
            analysis_context = "Available workout analysis data:\n"
            for bundle in context["analysis_bundles"]:
                analysis_context += f"- Query: {bundle.get('original_query', 'Analysis')}\n"
                if bundle.get('top_performers'):
                    analysis_context += f"  Top performers: {bundle.get('top_performers')}\n"
                if bundle.get('consistency_metrics'):
                    analysis_context += f"  Metrics: {bundle.get('consistency_metrics')}\n"
            conversation_history.append({"role": "system", "content": analysis_context})
        
        # Add existing messages
        for msg in context["messages"]:
            conversation_history.append({
                "role": msg["sender"], 
                "content": msg["content"]
            })
        
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Process messages
        while True:
            data = await websocket.receive_json()
            
            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
            
            if data.get('type') == 'message' or 'message' in data:
                message = data.get('message', '')
                
                # Save user message to database
                user_msg = await message_service.save_message(conversation_id, message, "user")
                if user_msg.get('success') != False:
                    context["messages"].append(user_msg)
                
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
                    
                    # Save complete assistant response to database
                    assistant_msg = await message_service.save_message(conversation_id, response_content, "assistant")
                    if assistant_msg.get('success') != False:
                        context["messages"].append(assistant_msg)
                    
                    conversation_history.append({"role": "assistant", "content": response_content})
                    
                    await websocket.send_json({
                        "type": "complete",
                        "data": {"message_id": len(conversation_history) // 2}
                    })
                    
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}", exc_info=True)
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": f"Error generating response: {str(e)}"}
                    })
            
    except WebSocketDisconnect:
        logger.info(f"Conversation WebSocket disconnected: {conversation_id}")
    except Exception as e:
        logger.error(f"Error in conversation websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass

@router.websocket("/api/llm/onboarding")
async def onboarding_websocket(
    websocket: WebSocket,
    llm: ChatAnthropic = Depends(get_llm)
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
@router.websocket("/api/llm/workout-analysis/{conversation_id}")
async def llm_workout_analysis(
    websocket: WebSocket, 
    conversation_id: str,
    llm_service: WorkoutAnalysisLLMService = Depends(get_workout_llm_service)
):
    """
    WebSocket endpoint for LLM-based workout analysis interpretation.
    
    This endpoint handles:
    - Connecting to the workout analysis service
    - Processing analysis bundle data
    - Streaming AI interpretation responses
    
    The client should send a message with:
    - type: 'analysis_bundle'
    - bundle: The workout analysis bundle object
    - message: The user's query about the workout data
    
    The server streams back responses with:
    - type: 'content' for content chunks
    - type: 'error' for error messages
    - type: 'complete' when the response is complete
    """
    try:
        await llm_service.process_websocket(websocket, conversation_id)
    except WebSocketDisconnect:
        logger.info(f"Workout analysis WebSocket disconnected: {conversation_id}")
    except Exception as e:
        logger.error(f"Error in workout analysis websocket: {str(e)}", exc_info=True)