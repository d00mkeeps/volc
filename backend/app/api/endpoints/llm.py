import logging
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from ...services.onboarding_service import OnboardingService
from ...services.conversation_service import ConversationService
from ...core.supabase.client import SupabaseClient
from ...services.workout_analysis_service import WorkoutAnalysisService

router = APIRouter()
load_dotenv()

# Base user connection
@router.websocket("/{user_id}")
async def user_base_websocket(websocket: WebSocket, user_id: str):
    logger = logging.getLogger(__name__)
    
    try:
        await websocket.accept()
        logger.info(f"Base WebSocket connection accepted for user: {user_id}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Handle user-level events
        while True:
            data = await websocket.receive_json()

            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
            
    except WebSocketDisconnect:
        logger.info(f"Base WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logger.error(f"Error in base user websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass


@router.websocket("/onboarding")
async def onboarding_websocket(websocket: WebSocket):
    """Handles the onboarding chat flow"""
    logger = logging.getLogger(__name__)
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        
        # Initialize LLM instance
        llm = ChatAnthropic(
            model="claude-3-7-sonnet-20250219",
            streaming=True,
            api_key=api_key
        )
        
        # Create service with LLM
        service = OnboardingService(llm=llm)

             # Process WebSocket messages
        while True:
            data = await websocket.receive_json()
            
            # Handle heartbeat messages
            if data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": data.get('timestamp')
                })
                continue
        
        # Process WebSocket messages
        await service.process_websocket(websocket)
        
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in onboarding websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass
        raise

@router.websocket("/{conversation_type}/{conversation_id}")
async def conversation_websocket(websocket: WebSocket, conversation_type: str, conversation_id: str):
    logger = logging.getLogger(__name__)
    logger.info(f"WebSocket connection request received for {conversation_type}: {conversation_id}")
    
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Get API key
        api_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Create appropriate service based on conversation_type
        if conversation_type == "default":
            service = ConversationService(api_key=api_key)
            
            # Process WebSocket messages directly in this handler
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat messages
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Otherwise process with service
                await service.process_message(websocket, data)
                
        elif conversation_type == "workout-analysis":
            llm = ChatAnthropic(
                model="claude-3-7-sonnet-20250219",
                streaming=True,
                api_key=api_key,
            )
            supabase_client = SupabaseClient()
            service = WorkoutAnalysisService(llm=llm, supabase_client=supabase_client)
            
            # Process WebSocket messages
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat messages
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Otherwise process with service
                await service.process_message(websocket, data, conversation_id)
                
        else:
            await websocket.close(code=1008, reason="Invalid conversation type")
            return
            
    except WebSocketDisconnect as e:
        logger.info(f"WebSocket disconnected for {conversation_type}: {conversation_id}")
    except Exception as e:
        logger.error(f"Error in {conversation_type} websocket: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass