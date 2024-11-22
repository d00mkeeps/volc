# backend/app/api/llm.py
from fastapi import APIRouter, WebSocket
from app.services.workout_history_service import WorkoutHistoryService

router = APIRouter()

@router.websocket("/ws/workout-history")
async def workout_history_websocket(websocket: WebSocket):
    service = WorkoutHistoryService()
    await service.process_websocket(websocket)