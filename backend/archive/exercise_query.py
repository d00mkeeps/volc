from typing import List
from pydantic import BaseModel, Field

class ExerciseQuery(BaseModel):
    exercises: List[str] = Field(description="List of exercise names to look up")
    timeframe: str = Field(default="3 months", description="Time period to look back for exercises")