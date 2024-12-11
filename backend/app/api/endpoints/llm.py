# app/api/endpoints/llm.py
from fastapi import APIRouter, WebSocket
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
    """
    Handles regular chat conversations.
    Each conversation is identified by its unique conversation_id.
    """
    service = ConversationService()
    await service.process_websocket(websocket, conversation_id)