# app/api/endpoints/llm.py
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.onboarding_service import OnboardingService
from app.services.conversation_service import ConversationService

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