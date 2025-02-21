# app/api/endpoints/llm.py
import logging
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from ...services.onboarding_service import OnboardingService
from ...services.conversation_service import ConversationService
from ...core.supabase.client import SupabaseClient
from ...services.workout_analysis_service import WorkoutAnalysisService

router = APIRouter()

@router.websocket("/ws/onboarding")
async def onboarding_websocket(websocket: WebSocket):
    """Handles the onboarding chat flow"""
    service = OnboardingService()
    await service.process_websocket(websocket)

@router.websocket("/ws/default/{conversation_id}")
async def conversation_websocket(websocket: WebSocket, conversation_id: str):
    logger = logging.getLogger(__name__)
    logger.info(f"WebSocket connection request received for conversation: {conversation_id}")
    
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "data": "connected"
        })
        
        # Create new service instance for each connection
        service = ConversationService()  # Pass conversation_id
        logger.info(f"Created ConversationService instance for conversation: {conversation_id}")
        
        await service.process_websocket(websocket)
            
    except WebSocketDisconnect as e:
        logger.error(f"WebSocket disconnected with code {e.code} and reason: {e.reason}")
    except Exception as e:
        logger.error(f"Error in websocket handler: {str(e)}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except:
            pass
        raise
@router.websocket("/ws/workout-analysis")
async def workout_analysis_websocket(websocket: WebSocket):
        logger = logging.getLogger(__name__)
        user_id = os.getenv("DEVELOPMENT_USER_ID")
        api_key = os.getenv("ANTHROPIC_API_KEY")
        logger.info(f"WebSocket connection request received for workout analysis - user: {user_id}")
        
        try:
            await websocket.accept()
            logger.info("WebSocket connection accepted")
            
            # Send initial connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Initialize required dependencies
            llm = ChatAnthropic(
                model="claude-3-5-sonnet-20241022",
                streaming=True,
                api_key=api_key,
            )
            supabase_client = SupabaseClient()
            
            # Create service instance
            service = WorkoutAnalysisService(
                llm=llm,
                supabase_client=supabase_client
            )
            logger.info(f"Created WorkoutAnalysisService instance for user: {user_id}")
            
            # Process incoming messages
            while True:
                message = await websocket.receive_json()
                
                async for response in service.process_query(
                    user_id=user_id,
                    message=message["text"],
                    generate_graph=message.get("generate_graph", False)
                ):
                    await websocket.send_json(response)
                    
        except WebSocketDisconnect as e:
            logger.error(f"WebSocket disconnected with code {e.code} and reason: {e.reason}")
        except Exception as e:
            logger.error(f"Error in websocket handler: {str(e)}", exc_info=True)
            try:
                await websocket.close(code=1011)
            except:
                pass
            raise
