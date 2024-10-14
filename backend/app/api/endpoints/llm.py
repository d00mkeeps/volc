import logging
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.message import ConversationRequest
from app.services.llm_service import LLMServiceFactory, LLMService
from fastapi.responses import StreamingResponse
import json

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_llm_service(config_name: str = "default"):
    return LLMServiceFactory.create(config_name)

@router.post("/process_stream/{config_name}")
async def process_message_stream(
    request: ConversationRequest,
    config_name: str,
    llm_service: LLMService = Depends(get_llm_service)
):
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    async def event_generator():
        try:
            async for event in await llm_service.process_message_stream(messages):
                if event.type == "content_block_delta":
                    yield f"data: {json.dumps({'type': 'content', 'content': event.delta.text})}\n\n"
                elif event.type == "message_stop":
                    yield f"data: {json.dumps({'type': 'stop'})}\n\n"
                    break  # Ensure we stop the generator after sending the stop event
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")