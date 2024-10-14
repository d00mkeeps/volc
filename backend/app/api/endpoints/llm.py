from fastapi import APIRouter, HTTPException, Depends
from app.schemas.message import ConversationRequest
from app.services.llm_service import LLMServiceFactory, LLMService

router = APIRouter()

async def get_llm_service(config_name: str = "default"):
    return LLMServiceFactory.create(config_name)

@router.post("/process/{config_name}")
async def process_message(
    request: ConversationRequest,
    config_name: str,
    llm_service: LLMService = Depends(get_llm_service)
):
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        response = await llm_service.process_message(messages)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))