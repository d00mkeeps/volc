from fastapi import APIRouter, WebSocket
from app.services.onboarding_service import OnboardingService

router = APIRouter()

@router.websocket("/ws/onboarding")
async def workout_history_websocket(websocket: WebSocket):
    service = OnboardingService()
    await service.process_websocket(websocket)