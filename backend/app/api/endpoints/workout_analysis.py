import logging
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
from app.core.supabase.auth import get_current_user, get_jwt_token
from ...services.workout_analysis_service import WorkoutAnalysisService
from ...schemas.workout_analysis import WorkoutAnalysisRequest

logger = logging.getLogger(__name__)
router = APIRouter()

# Create service instance
workout_analysis_service = WorkoutAnalysisService()

@router.post("/api/workout-analysis", status_code=status.HTTP_200_OK)
async def create_workout_analysis(
    request_data: WorkoutAnalysisRequest,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Initiate a workout analysis and conversation.
    """
    try:
        if not request_data.exercise_definition_ids:
            raise HTTPException(
                status_code=400,
                detail="exercise_definition_ids must be provided"
            )
        
        result = await workout_analysis_service.initiate_analysis_and_conversation(
            request_data, 
            user, 
            jwt_token
        )
        return result
        
    except Exception as e:
        logger.error(f"Error initiating analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate analysis: {str(e)}"
        )