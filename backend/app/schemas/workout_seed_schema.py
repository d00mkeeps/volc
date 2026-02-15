from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SeedSet(BaseModel):
    """
    Represents a specific set in a seed workout.
    """
    set_number: int
    weight_kg: float
    reps: int


class SeedExercise(BaseModel):
    """
    Represents an exercise in a seed workout.
    """
    name: str
    order_index: int
    sets: Optional[List[SeedSet]] = None


class WorkoutSeedRequest(BaseModel):
    """
    Request schema for seeding workout data via admin endpoint.
    Supports backdated timestamps for test data.
    """

    id: str
    user_id: str
    name: str
    notes: Optional[str] = None
    created_at: datetime
    exercises: Optional[List[SeedExercise]] = None
