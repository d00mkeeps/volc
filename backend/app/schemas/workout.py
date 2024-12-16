# app/schemas/workout.py
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any

class SetData(BaseModel):
    sets: List[Dict[str, Any]]  # Flexible structure for different metrics

class WorkoutExercise(BaseModel):
    exercise_name: str
    set_data: SetData
    order_in_workout: int

class Workout(BaseModel):
    name: str
    description: Optional[str] = None
    exercises: List[WorkoutExercise]