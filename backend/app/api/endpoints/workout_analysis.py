import logging
from fastapi import APIRouter, HTTPException, Depends, status
from app.core.supabase.auth import get_current_user, get_jwt_token
from app.core.rate_limit import rate_limit
from ...services.workout_analysis.basic.generator import BasicBundleGenerator
from ...services.workout_analysis_service import WorkoutAnalysisService
from ...schemas.workout_analysis import WorkoutAnalysisRequest

logger = logging.getLogger(__name__)
router = APIRouter()

workout_analysis_service = WorkoutAnalysisService()

basic_bundle_generator = BasicBundleGenerator()

# deprecated - do not use! ask me for further information
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
    
# new bundle mechanism
@router.post("/api/analysis/basic/regenerate", status_code=status.HTTP_200_OK)
@rate_limit("bundle_regenerate")
async def regenerate_basic_bundle(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Regenerate the user's basic analysis bundle.
    
    This analyzes the last 30 days of workouts and creates/updates
    the user's basic bundle with:
    - Top strength/volume performers
    - Consistency metrics
    - Short-term trends
    
    Rate limits: 
    - Testers: 1 per hour
    - Admins: 3 per hour
    """
    try:
        user_id = user.id
        logger.info(f"Basic bundle regeneration requested for user: {user_id}")
        
        # Generate bundle
        result = await basic_bundle_generator.generate_basic_bundle(user_id, jwt_token)
        
        if not result.get('success'):
            error = result.get('error', 'Unknown error')
            logger.error(f"Bundle generation failed for user {user_id}: {error}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate bundle: {error}"
            )
        
        logger.info(f"Basic bundle regenerated successfully for user {user_id}: {result.get('bundle_id')}")
        
        return {
            "success": True,
            "bundle_id": result['bundle_id'],
            "message": "Basic bundle regenerated successfully",
            "metadata": result.get('metadata', {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating basic bundle: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to regenerate bundle: {str(e)}"
        )