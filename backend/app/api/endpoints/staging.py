# backend/app/api/endpoints/staging.py
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.supabase.auth import get_current_user, get_jwt_token
from app.schemas.staging import (
    StageWorkoutRequest,
    UpdateStagedWorkoutRequest,
    StagedWorkoutResponse,
)
from app.services.llm.workout_parser_service import WorkoutParserService
from app.services.db.staging_service import StagingService

logger = logging.getLogger(__name__)

router = APIRouter()
staging_db = StagingService()
workout_parser = WorkoutParserService()


@router.post(
    "/workouts/stage",
    response_model=StagedWorkoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Stage a raw workout text for parsing and verification",
)
@router.post(
    "/api/workouts/stage",
    response_model=StagedWorkoutResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def stage_workout(
    request: StageWorkoutRequest,
    user=Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token),
):
    """
    Accepts raw workout text (e.g. from Apple Notes or Scratchpad),
    resolves dates, extracts exercises and sets via LLM, matches canonical
    exercises, and persists into staged_workouts.
    """
    try:
        logger.info(f"Staging workout for user {user.id}, text length: {len(request.raw_text)}")

        ref_ts = request.reference_timestamp or datetime.now(timezone.utc).isoformat()

        # Parse with LLM
        parsed_workout = await workout_parser.parse_workout_text(
            raw_text=request.raw_text,
            reference_timestamp=ref_ts,
            user_timezone=request.timezone or "UTC",
            is_imperial=bool(request.is_imperial),
        )

        parsed_dict = parsed_workout.model_dump()

        # Save to database
        saved_record = await staging_db.create_staged_workout(
            user_id=user.id,
            raw_text=request.raw_text,
            reference_timestamp=ref_ts,
            parsed_workout=parsed_dict,
            jwt_token=jwt_token,
        )

        return saved_record

    except Exception as e:
        logger.error(f"Error staging workout: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stage workout: {str(e)}",
        )


@router.get(
    "/workouts/stage/{stage_id}",
    response_model=StagedWorkoutResponse,
    summary="Get a staged workout by ID",
)
@router.get(
    "/api/workouts/stage/{stage_id}",
    response_model=StagedWorkoutResponse,
    include_in_schema=False,
)
async def get_staged_workout(
    stage_id: str,
    user=Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token),
):
    record = await staging_db.get_staged_workout(stage_id, jwt_token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staged workout not found",
        )
    return record


@router.patch(
    "/workouts/stage/{stage_id}",
    response_model=StagedWorkoutResponse,
    summary="Update staged workout status or parsed payload",
)
@router.patch(
    "/api/workouts/stage/{stage_id}",
    response_model=StagedWorkoutResponse,
    include_in_schema=False,
)
async def update_staged_workout(
    stage_id: str,
    request: UpdateStagedWorkoutRequest,
    user=Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token),
):
    updated = await staging_db.update_staged_workout(
        stage_id=stage_id,
        status=request.status,
        parsed_workout=request.parsed_workout,
        jwt_token=jwt_token,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staged workout not found",
        )
    return updated


@router.get(
    "/workouts/stage",
    response_model=List[StagedWorkoutResponse],
    summary="List staged workouts for user",
)
@router.get(
    "/api/workouts/stage",
    response_model=List[StagedWorkoutResponse],
    include_in_schema=False,
)
async def list_staged_workouts(
    status: Optional[str] = "staging",
    user=Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token),
):
    return await staging_db.list_staged_workouts(
        user_id=user.id, jwt_token=jwt_token, status=status
    )
