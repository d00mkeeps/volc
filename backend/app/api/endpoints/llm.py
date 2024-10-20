from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from app.services.llm_service import LLMServiceFactory, LLMService
import json

router = APIRouter()

async def get_llm_service(config_name: str = "default"):
    return LLMServiceFactory.create(config_name)

@router.websocket("/ws/llm_service/{config_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    config_name: str,
    llm_service: LLMService = Depends(get_llm_service)
):
    print(f"WebSocket connection attempt for config: {config_name}")
    try:
        await websocket.accept()
        print(f"WebSocket connection accepted for config: {config_name}")
        while True:
            data = await websocket.receive_json()
            print(f"Received data: {data}")
            
            # Assuming the incoming message is in the format expected by the LLM service
            messages = [{"role": "user", "content": data['content']}]
            
            await llm_service.process_message_stream(websocket, messages)
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for config: {config_name}")
    except Exception as e:
        print(f"Error in WebSocket: {str(e)}")
        await websocket.send_json({"type": "error", "data": str(e)})
    finally:
        print(f"WebSocket connection closed for config: {config_name}")
        if not websocket.client_state == WebSocket.DISCONNECTED:
            await websocket.close()

# Keep the test endpoint as is
@router.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    print("Test WebSocket connection attempt")
    await websocket.accept()
    print("Test WebSocket connection accepted")
    await websocket.send_json({"message": "Hello, WebSocket!"})
    await websocket.close()