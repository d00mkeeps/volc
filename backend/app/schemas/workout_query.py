from typing import List
from pydantic import BaseModel

class ExerciseQuery(BaseModel):
    exercises: List[str]
    timeframe: str = "3 months"
