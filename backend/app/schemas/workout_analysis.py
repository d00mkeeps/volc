# app/schemas/workout_analysis.py

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union

class WorkoutAnalysisRequest(BaseModel):
    exercise_definition_ids: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "exercise_names": ["bench press", "squat", "deadlift"],
                "timeframe": "3 months",
                "message": "Analyze my recent workouts",
                "conversation_id": "conv123"
            }
        }

class JobResponse(BaseModel):
    job_id: str
    status: str = Field(..., description="Status of the job: pending, running, completed, or failed")
    progress: int = Field(..., description="Progress percentage from 0 to 100")
    status_message: Optional[str] = Field(None, description="Human-readable status message")
    result: Optional[Dict[str, Any]] = Field(None, description="Job result data (when completed)")
    error: Optional[str] = Field(None, description="Error message (when failed)")
    
    class Config:
        schema_extra = {
            "example": {
                "job_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
                "status": "running",
                "progress": 50,
                "status_message": "Analyzing exercise correlations",
                "result": None,
                "error": None
            }
        }