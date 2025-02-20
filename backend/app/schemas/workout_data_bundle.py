# app/schemas/workout_data_bundle.py
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

class BundleMetadata(BaseModel):
    total_workouts: int
    total_exercises: int
    date_range: Dict[str, datetime]
    exercises_included: List[str]  # List of exercise names in this bundle

class WorkoutDataBundle(BaseModel):
    metadata: BundleMetadata
    workout_data: Dict  # The formatted workout data from WorkoutFormatter
    original_query: str
    chart_url: Optional[str] = None
    created_at: datetime = datetime.now()
    bundle_id: UUID

class WorkoutDataBundles(BaseModel):
    """Container for managing multiple bundles with size limit"""
    bundles: List[WorkoutDataBundle] = []
    max_bundles: int = 3

    def add_bundle(self, bundle: WorkoutDataBundle) -> None:
        self.bundles.append(bundle)