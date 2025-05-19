# app/api/endpoints/workout_analysis.py

from fastapi import APIRouter, HTTPException, Depends, Response, status
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from ...services.workout_analysis_service import WorkoutAnalysisService
from ...services.job_store import job_store
from ...schemas.workout_analysis import WorkoutAnalysisRequest, JobResponse

logger = logging.getLogger(__name__)

router = APIRouter()


# app/api/endpoints/workout_analysis.py (add to the top of the file)

"""
Workout Analysis API

This module provides endpoints for asynchronous workout data analysis.
The analysis process is split into two phases:

1. Data Processing (HTTP API):
   - Submit workout data for analysis
   - Check job status and retrieve results
   
2. LLM Interpretation (WebSocket API):
   - Connect to WebSocket for real-time AI analysis
   - Send analysis bundle for interpretation
   - Receive streaming AI responses

Typical workflow:
1. POST /api/workout-analysis to create a job
2. GET /api/workout-analysis/{job_id} to poll for completion
3. Connect to WebSocket /api/llm/workout-analysis/{conversation_id}
4. Send analysis bundle for interpretation
"""
# Start the job cleanup task on application startup
@router.on_event("startup")
async def startup_event():
    await job_store.start_cleanup_task()

# Dependency to get analysis service
def get_analysis_service():
    return WorkoutAnalysisService()

@router.post("/api/workout-analysis", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_workout_analysis(
    request: WorkoutAnalysisRequest,
    analysis_service: WorkoutAnalysisService = Depends(get_analysis_service)
):
    """
    Create a new workout analysis job.
    
    Submit workout data or exercise names to analyze performance metrics,
    track progress, and identify trends.
    """
    try:
        # Validate request
        if not request.exercise_names and not request.workout_data:
            raise HTTPException(
                status_code=400, 
                detail="Either exercise_names or workout_data must be provided"
            )
        
        # Create job and start processing
        job_id = await analysis_service.create_analysis_job(
            user_id=request.user_id,
            parameters=request.dict()
        )
        
        # Return initial job status
        job = await analysis_service.get_job_status(job_id)
        return JobResponse(**job)
        
    except Exception as e:
        logger.error(f"Error creating analysis job: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create analysis job: {str(e)}"
        )

@router.get("/api/workout-analysis/{job_id}", response_model=JobResponse)
async def get_workout_analysis_status(
    job_id: str,
    analysis_service: WorkoutAnalysisService = Depends(get_analysis_service)
):
    """
    Check the status of a workout analysis job.
    
    Returns the current status, progress, and results (when completed).
    """
    job = await analysis_service.get_job_status(job_id)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job {job_id} not found"
        )
    
    return JobResponse(**job)

@router.get("/api/workout-analysis/user/{user_id}", response_model=List[JobResponse])
async def get_user_workout_analyses(
    user_id: str,
    analysis_service: WorkoutAnalysisService = Depends(get_analysis_service)
):
    """
    Get all workout analysis jobs for a specific user.
    
    Returns a list of jobs with their status, progress, and results.
    """
    jobs = await analysis_service.get_user_jobs(user_id)
    return [JobResponse(**job) for job in jobs]