# app/schemas/workout_data_bundle.py
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class CorrelationData(BaseModel):
    summary: List[Dict[str, Any]] = Field(description="Summary of correlation analysis")
    heatmap_base64: Optional[str] = Field(description="Base64 encoded heatmap image")
    time_series: Dict[str, Dict[str, Any]] = Field(description="Time series data for correlated exercises")


class BundleMetadata(BaseModel):
    total_workouts: int
    total_exercises: int
    date_range: Dict[str, datetime]
    exercises_included: List[str]
    
    model_config = ConfigDict(json_encoders={
        datetime: lambda dt: dt.isoformat()
    })

class ConsistencyMetrics(BaseModel):
    """Enhanced workout consistency metrics"""
    score: int = Field(default=0, description="Consistency score from 0-100")
    streak: int = Field(default=0, description="Current workout streak")
    avg_gap: float = Field(default=0, description="Average days between workouts")

    def get(self, key, default=None):
        return getattr(self, key, default)
    
class TopPerformer(BaseModel):
    """Data for a top performing exercise"""
    name: str
    first_value: float
    last_value: float
    change: float
    change_percent: float
    
class TopPerformers(BaseModel):
    """Collection of top performing exercises by different metrics"""
    strength: List[TopPerformer] = Field(default_factory=list, description="Top exercises by 1RM improvement")
    volume: List[TopPerformer] = Field(default_factory=list, description="Top exercises by volume increase")
    frequency: List[TopPerformer] = Field(default_factory=list, description="Top exercises by workout frequency")

    def get(self, key, default=None):
        return getattr(self, key, default)


class WorkoutDataBundle(BaseModel):
    """Enhanced workout data bundle with multiple charts and metrics"""
    bundle_id: UUID
    metadata: BundleMetadata
    workout_data: Dict
    original_query: str
    # Keep for backward compatibility
    chart_url: Optional[str] = None
    # New fields for enhanced features
    chart_urls: Dict[str, str] = Field(default_factory=dict, description="Multiple chart URLs by type")
    correlation_data: Optional[CorrelationData] = None
    created_at: datetime = datetime.now()
    consistency_metrics: ConsistencyMetrics = Field(default_factory=ConsistencyMetrics)
    top_performers: TopPerformers = Field(default_factory=TopPerformers)
    
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