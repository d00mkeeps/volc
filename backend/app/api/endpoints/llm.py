import logging
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.message import ConversationRequest
from app.services.llm_service import LLMServiceFactory, LLMService
from fastapi.responses import StreamingResponse
import json

router = APIRouter()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Set to DEBUG for more verbose logging


async def get_llm_service(config_name: str = "default"):
    logger.info(f"Creating LLM service with config: {config_name}")
    return LLMServiceFactory.create(config_name)

from fastapi.responses import StreamingResponse

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
                    yield f"data: {json.dumps({'content': event.delta.text})}\n\n"
                elif event.type == "message_stop":
                    yield f"data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")