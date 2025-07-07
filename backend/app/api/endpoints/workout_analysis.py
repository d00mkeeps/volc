import logging
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any

from ...services.workout_analysis_service import WorkoutAnalysisService
from ...schemas.workout_analysis import WorkoutAnalysisRequest

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency to get analysis service
def get_analysis_service():
    return WorkoutAnalysisService()

@router.post("/api/workout-analysis", status_code=status.HTTP_200_OK)
async def create_workout_analysis(
    request: WorkoutAnalysisRequest,
    analysis_service: WorkoutAnalysisService = Depends(get_analysis_service)
):
    """
    Initiate a workout analysis and conversation.
    """
    try:
        # Validate request
        if not request.exercise_names and not request.workout_data:
            raise HTTPException(
                status_code=400, 
                detail="Either exercise_names or workout_data must be provided"
            )
        
        result = await analysis_service.initiate_analysis_and_conversation(request)
        return result
        
    except Exception as e:
        logger.error(f"Error initiating analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate analysis: {str(e)}"
        )