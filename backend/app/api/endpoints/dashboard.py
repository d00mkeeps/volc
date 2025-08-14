from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List
from ...services.db.dashboard_service import DashboardService
from ...core.supabase.auth import get_current_user, get_jwt_token 
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

class MuscleBalance(BaseModel):
    muscle: str
    sets: int

class Consistency(BaseModel):
    workoutDays: List[int]
    streak: int
    totalWorkouts: int
    score: int

class TimeframeData(BaseModel):
    muscleBalance: List[MuscleBalance]
    consistency: Consistency

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
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get dashboard analytics data for all timeframes"""
    try:
        logger.info(f"API request for dashboard data for user: {user.id}")
        
        dashboard_service = DashboardService()
        result = await dashboard_service.get_dashboard_data(user.id, jwt_token)
        
        if not result.get("success"):
            raise Exception(f"Dashboard service error: {result.get('error')}")
        
        raw_data = result["data"]
        
        # Convert to response models for validation/debugging
        response_data = {
            "one_week": TimeframeData(
                muscleBalance=[
                    MuscleBalance(muscle=item["muscle"], sets=item["sets"])
                    for item in raw_data.get("1week", {}).get("muscleBalance", [])
                ],
                consistency=Consistency(
                    workoutDays=raw_data.get("1week", {}).get("consistency", {}).get("workoutDays", []),
                    streak=raw_data.get("1week", {}).get("consistency", {}).get("streak", 0),
                    totalWorkouts=raw_data.get("1week", {}).get("consistency", {}).get("totalWorkouts", 0),
                    score=raw_data.get("1week", {}).get("consistency", {}).get("score", 0)
                )
            ),
            "two_weeks": TimeframeData(
                muscleBalance=[
                    MuscleBalance(muscle=item["muscle"], sets=item["sets"])
                    for item in raw_data.get("2weeks", {}).get("muscleBalance", [])
                ],
                consistency=Consistency(
                    workoutDays=raw_data.get("2weeks", {}).get("consistency", {}).get("workoutDays", []),
                    streak=raw_data.get("2weeks", {}).get("consistency", {}).get("streak", 0),
                    totalWorkouts=raw_data.get("2weeks", {}).get("consistency", {}).get("totalWorkouts", 0),
                    score=raw_data.get("2weeks", {}).get("consistency", {}).get("score", 0)
                )
            ),
            "one_month": TimeframeData(
                muscleBalance=[
                    MuscleBalance(muscle=item["muscle"], sets=item["sets"])
                    for item in raw_data.get("1month", {}).get("muscleBalance", [])
                ],
                consistency=Consistency(
                    workoutDays=raw_data.get("1month", {}).get("consistency", {}).get("workoutDays", []),
                    streak=raw_data.get("1month", {}).get("consistency", {}).get("streak", 0),
                    totalWorkouts=raw_data.get("1month", {}).get("consistency", {}).get("totalWorkouts", 0),
                    score=raw_data.get("1month", {}).get("consistency", {}).get("score", 0)
                )
            ),
            "two_months": TimeframeData(
                muscleBalance=[
                    MuscleBalance(muscle=item["muscle"], sets=item["sets"])
                    for item in raw_data.get("2months", {}).get("muscleBalance", [])
                ],
                consistency=Consistency(
                    workoutDays=raw_data.get("2months", {}).get("consistency", {}).get("workoutDays", []),
                    streak=raw_data.get("2months", {}).get("consistency", {}).get("streak", 0),
                    totalWorkouts=raw_data.get("2months", {}).get("consistency", {}).get("totalWorkouts", 0),
                    score=raw_data.get("2months", {}).get("consistency", {}).get("score", 0)
                )
            ),
            "lastUpdated": raw_data.get("lastUpdated", datetime.now().isoformat())
        }
        
        logger.info(f"Successfully returned dashboard data for user: {user.id}")
        return AllTimeframeResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))