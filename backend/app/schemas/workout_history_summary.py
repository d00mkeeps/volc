from pydantic import BaseModel, Field, field_validator
from typing import List

class WorkoutHistory(BaseModel):
    trainingAge: str  # flexible format
    exercisePreferences: List[str]
    achievements: List[str]
    medicalConsiderations: List[str]

    @field_validator('*')
    def handle_not_provided(cls, v):
        if isinstance(v, str) and v.lower() == "not provided":
            return v
        if isinstance(v, list) and (not v or v[0].lower() == "not provided"):
            return ["not provided"]
        return v