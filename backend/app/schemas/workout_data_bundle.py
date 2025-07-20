from datetime import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class BundleMetadata(BaseModel):
    total_workouts: int
    total_exercises: int
    date_range: Dict[str, Any]
    exercises_included: List[str]

class TopPerformers(BaseModel):
    strength: List[Dict[str, Any]] = []
    volume: List[Dict[str, Any]] = []
    frequency: List[Dict[str, Any]] = []

class ConsistencyMetrics(BaseModel):
    score: float = 0.0
    streak: int = 0
    avg_gap: float = 0.0

class WorkoutDataBundle(BaseModel):
    bundle_id: str
    metadata: BundleMetadata
    raw_workouts: Dict[str, Any]
    chart_urls: Dict[str, str] = Field(default_factory=dict)
    top_performers: TopPerformers = Field(default_factory=TopPerformers)
    consistency_metrics: ConsistencyMetrics = Field(default_factory=ConsistencyMetrics)
    correlation_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }