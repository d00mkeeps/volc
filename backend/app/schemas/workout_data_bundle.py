# app/schemas/workout_data_bundle.py
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from pydantic.json_schema import JsonSchemaValue

class BundleMetadata(BaseModel):
    total_workouts: int
    total_exercises: int
    date_range: Dict[str, datetime]
    exercises_included: List[str]
    
    model_config = ConfigDict(json_encoders={
        datetime: lambda dt: dt.isoformat()
    })

class WorkoutDataBundle(BaseModel):
    metadata: BundleMetadata
    workout_data: Dict
    original_query: str
    chart_url: Optional[str] = None
    created_at: datetime = datetime.now()
    bundle_id: UUID
    
    model_config = ConfigDict(json_encoders={
        datetime: lambda dt: dt.isoformat(),
        UUID: lambda uuid: str(uuid)
    })

class WorkoutDataBundles(BaseModel):
    """Container for managing multiple bundles with size limit"""
    bundles: List[WorkoutDataBundle] = []
    max_bundles: int = 3

    def add_bundle(self, bundle: WorkoutDataBundle) -> None:
        self.bundles.append(bundle)