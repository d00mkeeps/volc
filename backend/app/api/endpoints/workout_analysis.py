import logging
from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Dict, Any
from app.core.supabase.auth import get_current_user
from app.core.utils.jwt_utils import extract_jwt_from_request
from ...services.workout_analysis_service import WorkoutAnalysisService
from ...schemas.workout_analysis import WorkoutAnalysisRequest

logger = logging.getLogger(__name__)
router = APIRouter()

def get_analysis_service(jwt_token: str = None):
    return WorkoutAnalysisService(jwt_token=jwt_token)

@router.post("/api/workout-analysis", status_code=status.HTTP_200_OK)
async def create_workout_analysis(
    request_data: WorkoutAnalysisRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
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
        
        jwt_token = extract_jwt_from_request(request)
        analysis_service = get_analysis_service(jwt_token=jwt_token)
        
        result = await analysis_service.initiate_analysis_and_conversation(request_data, user)
        return result
    except Exception as e:
        logger.error(f"Error initiating analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate analysis: {str(e)}"
        )