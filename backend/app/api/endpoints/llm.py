from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from app.services.llm_service import LLMServiceFactory, LLMService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_llm_service(config_name: str) -> LLMService:
    logger.info(f"Creating LLM service with config: {config_name}")
    return LLMServiceFactory.create(config_name)

@router.websocket("/ws/llm_service/{config_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    config_name: str,
    llm_service: LLMService = Depends(get_llm_service)
):
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for config: {config_name}")
        
        while True:
            try:
                data = await websocket.receive_json()
                logger.debug(f"Received data: {data}")
                messages = data.get('messages', [])
                await llm_service.process_message_stream(websocket, messages)
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for config: {config_name}")
                break
            except Exception as e:
                logger.error(f"Error in websocket: {str(e)}")
                try:
                    await websocket.send_json({"type": "error", "data": str(e)})
                except:
                    logger.error("Could not send error message")
                break
    finally:
        try:
            await websocket.close()
        except:
            pass
        logger.info(f"WebSocket connection closed for config: {config_name}")