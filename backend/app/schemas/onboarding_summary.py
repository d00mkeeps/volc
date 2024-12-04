from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class PersonalInfo(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    ageGroup: Optional[str] = None
    preferredUnits: Optional[str] = None

    @field_validator('preferredUnits')
    def validate_units(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "not provided":
            return None
        valid_units = ['metric', 'imperial']
        if v.lower() not in valid_units:
            raise ValueError(f"preferredUnits must be one of {valid_units}")
        return v.lower()

class FitnessBackground(BaseModel):
    trainingAge: Optional[str] = None
    exercisePreferences: Optional[List[str]] = None
    currentAbilities: Optional[List[str]] = None
    injuries: Optional[List[str]] = None

    @field_validator('*')
    def handle_not_provided(cls, v):
        if v is None or v == "not provided":
            return None
        if isinstance(v, list):
            if not v or v[0] == "not provided":
                return None
        return v

class UserOnboarding(BaseModel):
    personalInfo: PersonalInfo
    goal: Optional[str] = None
    fitnessBackground: FitnessBackground