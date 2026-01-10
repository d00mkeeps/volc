# from pydantic import BaseModel, Field, field_validator
# from typing import List, Optional

# class PersonalInfo(BaseModel):
#     firstName: Optional[str] = None
#     lastName: Optional[str] = None
#     ageGroup: Optional[str] = None
#     preferredUnits: Optional[str] = None

#     @field_validator('preferredUnits')
#     def validate_units(cls, v: Optional[str]) -> Optional[str]:
#         if v is None or v == "not provided":
#             return None
#         valid_units = ['metric', 'imperial']
#         if v.lower() not in valid_units:
#             raise ValueError(f"preferredUnits must be one of {valid_units}")
#         return v.lower()

# class FitnessBackground(BaseModel):
#     trainingAge: Optional[str] = None
#     # Initialize array fields with empty lists instead of None
#     exercisePreferences: List[str] = []  # Changed from Optional[List[str]] = None
#     currentAbilities: List[str] = []     # Changed from Optional[List[str]] = None
#     injuries: List[str] = []             # Changed from Optional[List[str]] = None

#     @field_validator('*')
#     def handle_not_provided(cls, v):
#         # For non-list fields (trainingAge), keep existing None behavior
#         if not isinstance(v, list):
#             if v is None or v == "not provided":
#                 return None
#             return v
        
#         # For list fields, ensure we always return at least an empty list
#         if not v or v[0] == "not provided":
#             return []
#         return v

# class UserOnboarding(BaseModel):
#     personalInfo: PersonalInfo
#     goal: Optional[str] = None
#     fitnessBackground: FitnessBackground