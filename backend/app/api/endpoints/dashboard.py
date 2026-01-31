from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List
from ...services.db.dashboard_service import DashboardService
from ...core.supabase.auth import get_current_user, get_jwt_token
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class MuscleBalance(BaseModel):
    muscle: str
    sets: int


class WorkoutEntry(BaseModel):
    id: str
    date: str


class Consistency(BaseModel):
    workoutDates: List[str]
    totalWorkouts: int
    workouts: List[WorkoutEntry]  # ✅ Add this field


# ✅ Add the missing ActualMetrics model
class ActualMetrics(BaseModel):
    workouts: int
    exercises: int
    sets: int


class TimeframeData(BaseModel):
    muscleBalance: List[MuscleBalance]
    consistency: Consistency
    actualMetrics: ActualMetrics  # ✅ Add this field!


class AllTimeframeResponse(BaseModel):
    one_week: TimeframeData = Field(..., alias="1week")
    two_weeks: TimeframeData = Field(..., alias="2weeks")
    one_month: TimeframeData = Field(..., alias="1month")
    two_months: TimeframeData = Field(..., alias="2months")
    lastUpdated: str

    class Config:
        allow_population_by_field_name = True


@router.get("/api/dashboard", response_model=AllTimeframeResponse)
async def get_dashboard_data(
    user=Depends(get_current_user), jwt_token: str = Depends(get_jwt_token)
):
    """Get dashboard analytics data for all timeframes"""
    try:
        logger.info(f"API request for dashboard data for user: {user.id}")

        dashboard_service = DashboardService()
        result = await dashboard_service.get_dashboard_data(user.id, jwt_token)

        if not result.get("success"):
            raise Exception(f"Dashboard service error: {result.get('error')}")

        raw_data = result["data"]

        logger.info(f"Successfully returned dashboard data for user: {user.id}")

        # Let Pydantic handle the alias mapping automatically
        return AllTimeframeResponse(**raw_data)
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
