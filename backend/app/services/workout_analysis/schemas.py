from datetime import datetime
from typing import Dict, List, Any, Optional, Literal
from pydantic import BaseModel, Field

# ==================== CALCULATOR DATA TYPES ====================

class PerformanceDataPoint(BaseModel):
    """Single data point in a time series."""
    date: str
    highest_1rm: Optional[float] = None
    total_volume: Optional[float] = None

class TopPerformer(BaseModel):
    """Individual top performer entry for strength/volume improvements."""
    name: str
    definition_id: Optional[Any] = None
    first_value: float
    last_value: float
    change: float
    change_percent: float

# ==================== CALCULATOR RESULTS ====================

class StrengthCalculatorResult(BaseModel):
    """Output from StrengthCalculator.calculate()"""
    top_performers: List[TopPerformer]
    time_series: Dict[str, List[PerformanceDataPoint]]

class VolumeCalculatorResult(BaseModel):
    """Output from VolumeCalculator.calculate()"""
    top_performers: List[TopPerformer]
    time_series: Dict[str, List[PerformanceDataPoint]]

class ConsistencyMetrics(BaseModel):
    """Workout frequency and consistency metrics."""
    avg_gap: float = 0.0
    variance: Optional[float] = None

class SignificantCorrelation(BaseModel):
    """A significant correlation between two exercises."""
    outcome: str
    predictor: str
    strength: Literal["strong", "moderate"]
    direction: Literal["positive", "negative"]
    lag_weeks: int
    summary: str

class CorrelationCalculatorResult(BaseModel):
    """Output from CorrelationCalculator.calculate()"""
    significant_correlations: List[SignificantCorrelation]
    total_pairs_analyzed: int
    significant_count: int
    data_quality_notes: List[str] = []

# ==================== BUNDLE SCHEMAS ====================

class BundleMetadata(BaseModel):
    """Metadata for workout analysis bundle."""
    total_workouts: int
    total_exercises: int
    date_range: Dict[str, Any]
    exercises_included: List[str]
    errors: List[str] = []

class TopPerformers(BaseModel):
    """Container for top performers by category (stores as dicts for LLM consumption)."""
    strength: List[Dict[str, Any]] = []
    volume: List[Dict[str, Any]] = []
    frequency: List[Dict[str, Any]] = []

class WorkoutDataBundle(BaseModel):
    """Complete workout analysis bundle for LLM consumption."""
    id: str
    metadata: BundleMetadata
    workouts: Dict[str, Any]  # Lean workout data only
    chart_urls: Dict[str, str] = Field(default_factory=dict)
    top_performers: TopPerformers = Field(default_factory=TopPerformers)
    consistency_metrics: ConsistencyMetrics = Field(default_factory=ConsistencyMetrics)
    correlation_data: Optional[CorrelationCalculatorResult] = None
    status: str
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }