# app/schemas/workout.py
from pydantic import BaseModel
from typing import List, Literal, Optional, Union, Dict, Any

class SetData(BaseModel):
    sets: List[Dict[str, Any]]  # Flexible structure for different metrics

class WorkoutExercise(BaseModel):
    exercise_name: str
    set_data: SetData
    order_in_workout: int
    weight_unit: Optional[Literal['kg', 'lbs']] = None
    distance_unit: Optional[Literal['km', 'm', 'mi']] = None

class Workout(BaseModel):
    name: str
    description: Optional[str] = None
    exercises: List[WorkoutExercise]