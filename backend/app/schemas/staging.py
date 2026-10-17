# backend/app/schemas/staging.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ParsedSet(BaseModel):
    set_number: int
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = None
    duration: Optional[int] = None
    distance: Optional[float] = None


class ParsedExercise(BaseModel):
    exercise_name: str
    definition_id: Optional[str] = None
    matched_canonical_name: Optional[str] = None
    sets: List[ParsedSet] = Field(default_factory=list)
    order_index: int = 0
    notes: Optional[str] = None


class ParsedWorkout(BaseModel):
    name: str = "Workout"
    workout_timestamp: str
    notes: Optional[str] = None
    detected_unit: Optional[str] = "kg"
    exercises: List[ParsedExercise] = Field(default_factory=list)


class StageWorkoutRequest(BaseModel):
    raw_text: str
    reference_timestamp: Optional[str] = None
    timezone: Optional[str] = "UTC"
    is_imperial: Optional[bool] = False


class UpdateStagedWorkoutRequest(BaseModel):
    status: Optional[str] = None  # 'staging', 'confirmed', 'discarded'
    parsed_workout: Optional[Dict[str, Any]] = None


class StagedWorkoutResponse(BaseModel):
    id: str
    user_id: str
    raw_text: str
    reference_timestamp: str
    status: str
    parsed_workout: Dict[str, Any]
    created_at: str
    updated_at: str
