"""
Schemas for Workout Analysis Bundles

This module defines the complete data structure for workout analysis bundles
used by the LLM coaching system. The bundle contains all workout data and
derived metrics needed for intelligent coaching insights.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# ==================== METADATA ====================

class BundleMetadata(BaseModel):
    """
    Metadata about the analysis bundle itself.
    
    Describes how and when the bundle was created, what data window was used,
    and any errors encountered during generation.
    """
    bundle_type: str = Field(
        default="standard",
        description="Type of bundle (e.g., 'standard', 'advanced')"
    )
    created_at: datetime = Field(
        ...,
        description="When this bundle was generated"
    )
    data_window: str = Field(
        ...,
        description="Time window or workout count used for analysis (e.g., 'Last 30 days')"
    )
    errors: List[str] = Field(
        default_factory=list,
        description="Any errors encountered during bundle generation"
    )


# ==================== GENERAL WORKOUT DATA ====================

class DateRange(BaseModel):
    """Date range of workouts included in this bundle."""
    earliest: datetime = Field(..., description="Date of first workout in bundle")
    latest: datetime = Field(..., description="Date of most recent workout in bundle")


class ExerciseFrequency(BaseModel):
    """Exercise frequency metrics."""
    by_sets: Dict[str, int] = Field(
        default_factory=dict,
        description="Exercise name -> total sets count across all workouts"
    )


class GeneralWorkoutData(BaseModel):
    """
    High-level overview of workout data in this bundle.
    
    Provides summary statistics about workouts, exercises, and frequency
    without detailed set-by-set information.
    """
    total_workouts: int = Field(..., description="Total number of workouts in bundle")
    total_exercises_unique: int = Field(..., description="Number of unique exercises performed")
    date_range: DateRange = Field(..., description="Date range of workouts")
    exercises_included: List[str] = Field(
        default_factory=list,
        description="List of all unique exercise names"
    )
    exercise_frequency: ExerciseFrequency = Field(
        default_factory=ExerciseFrequency,
        description="Frequency metrics for exercises"
    )


# ==================== RECENT WORKOUTS ====================

class WorkoutSet(BaseModel):
    """
    Individual set data with full details.
    
    Contains weight, reps, RPE, estimated 1RM, and optional cardio metrics
    (distance, duration) for a single set.
    """
    set_number: int = Field(..., description="Set number (1, 2, 3, etc.)")
    weight: Optional[float] = Field(None, description="Weight used for this set (kg)")
    reps: Optional[int] = Field(None, description="Reps completed")
    rpe: Optional[float] = Field(None, description="Rate of perceived exertion (1-10)")
    estimated_1rm: Optional[float] = Field(
        None,
        description="Estimated one-rep max calculated from weight × reps"
    )
    distance: Optional[float] = Field(None, description="Distance covered (for cardio exercises)")
    duration: Optional[str] = Field(
        None,
        description="Duration of set in HH:MM:SS format (for timed exercises)"
    )


class WorkoutExercise(BaseModel):
    """
    Exercise within a workout, containing all sets performed.
    """
    name: str = Field(..., description="Exercise name")
    notes: Optional[str] = Field(None, description="User's notes about this exercise")
    sets: List[WorkoutSet] = Field(
        default_factory=list,
        description="All sets performed for this exercise"
    )


class RecentWorkout(BaseModel):
    """
    Complete workout detail for recent workouts (last 7 days).
    
    Contains full set-by-set detail for each exercise. Workouts are
    sorted descending by date (newest first).
    """
    date: datetime = Field(..., description="When the workout occurred")
    name: Optional[str] = Field(None, description="User-provided workout name")
    notes: Optional[str] = Field(None, description="User's workout-level notes")
    exercises: List[WorkoutExercise] = Field(
        default_factory=list,
        description="All exercises performed in this workout"
    )


# ==================== VOLUME DATA ====================

class VolumeTimeSeries(BaseModel):
    """Single data point in volume time series."""
    date: datetime = Field(..., description="Workout date")
    volume_kg: float = Field(..., description="Total volume for that workout")
    workout_name: Optional[str] = Field(None, description="Name of workout for context")


class VolumeData(BaseModel):
    """
    Volume metrics and trends over time.
    
    Volume is calculated as weight × reps for all sets. Includes total volume,
    per-exercise breakdowns, and time series for trend analysis.
    """
    total_volume_kg: float = Field(
        ...,
        description="Total volume across all included workouts"
    )
    today_volume_kg: float = Field(
        ...,
        description="Volume from most recent workout only"
    )
    by_exercise: Dict[str, float] = Field(
        default_factory=dict,
        description="Volume broken down per exercise (exercise name -> total volume)"
    )
    time_series: List[VolumeTimeSeries] = Field(
        default_factory=list,
        description="Volume per workout over time, ordered chronologically"
    )


# ==================== STRENGTH DATA ====================

class E1RMPerformance(BaseModel):
    """Single historical e1RM performance for an exercise."""
    estimated_1rm: float = Field(..., description="Estimated 1RM value")
    date: datetime = Field(..., description="When this performance occurred")


class ExerciseStrengthData(BaseModel):
    """
    Strength progression data for a single exercise.
    
    Contains the best e1RM achieved and full historical performance data
    for tracking strength progression over time.
    """
    exercise: str = Field(..., description="Exercise name")
    best_e1rm: float = Field(..., description="Highest estimated 1RM achieved")
    achieved_date: datetime = Field(..., description="When the PR was set")
    all_performances: List[E1RMPerformance] = Field(
        default_factory=list,
        description="All e1RM performances for this exercise, ordered by date"
    )


class StrengthData(BaseModel):
    """
    Strength metrics and progression for all exercises.
    
    Focuses on estimated 1RM (e1RM) as the primary strength indicator,
    tracking personal records and historical performance.
    """
    top_e1rms: List[ExerciseStrengthData] = Field(
        default_factory=list,
        description="Best e1RM performances for each exercise with historical data"
    )


# ==================== CONSISTENCY DATA ====================

class ConsistencyData(BaseModel):
    """
    Workout frequency and consistency metrics.
    
    Analyzes the temporal pattern of workouts to assess training consistency,
    including average gaps between workouts and variance.
    """
    avg_days_between: float = Field(
        ...,
        description="Average gap between workouts in days"
    )
    variance: Optional[float] = Field(
        None,
        description="Variance in workout frequency (null if insufficient data)"
    )
    workout_dates: List[datetime] = Field(
        default_factory=list,
        description="List of all workout dates in window, ordered chronologically"
    )


# ==================== MUSCLE GROUP BALANCE ====================

class MuscleGroupBalance(BaseModel):
    """
    Distribution of training across muscle groups.
    
    Uses existing muscle group calculation service to provide insights
    about training balance and potential imbalances.
    
    Structure will match the output of the existing muscle group service.
    """
    # This will be populated with actual structure once we integrate
    # the existing muscle group calculation service
    data: Optional[Dict] = Field(
        None,
        description="Muscle group distribution data from existing service"
    )


# ==================== CORRELATION INSIGHTS ====================

class CorrelationInsights(BaseModel):
    """
    Advanced pattern analysis and correlations (premium feature).
    
    Statistical correlations, trends, and patterns discovered in workout data.
    This section is null/empty for basic users.
    
    Structure to be defined based on specific correlation calculations.
    """
    # To be expanded later with specific correlation data structures
    significant_patterns: Optional[List[Dict]] = Field(
        None,
        description="List of significant patterns discovered in workout data"
    )


# ==================== MAIN BUNDLE ====================

class WorkoutAnalysisBundle(BaseModel):
    """
    Complete workout analysis bundle for LLM-powered coaching.
    
    This is the single source of truth for user workout analysis. It contains
    all workout data and derived metrics needed for the LLM to provide
    intelligent coaching insights, training recommendations, and progress analysis.
    
    The bundle is regenerated after each workout creation or deletion,
    ensuring the LLM always has access to current data.
    """
    id: str = Field(..., description="Unique bundle identifier (UUID)")
    user_id: str = Field(..., description="User this bundle belongs to")
    status: str = Field(
        default="complete",
        description="Bundle generation status: 'pending', 'processing', 'complete', 'failed'"
    )
    
    # Core data sections
    metadata: BundleMetadata = Field(..., description="Bundle metadata and generation info")
    general_workout_data: GeneralWorkoutData = Field(
        ...,
        description="Summary statistics and overview"
    )
    recent_workouts: List[RecentWorkout] = Field(
        default_factory=list,
        description="Last 7 days of workouts with full detail (newest first)"
    )
    volume_data: VolumeData = Field(..., description="Volume metrics and trends")
    strength_data: StrengthData = Field(..., description="Strength metrics and progression")
    consistency_data: ConsistencyData = Field(..., description="Frequency and consistency metrics")
    
    # Optional/Premium sections
    muscle_group_balance: Optional[MuscleGroupBalance] = Field(
        None,
        description="Muscle group training distribution"
    )
    correlation_insights: Optional[CorrelationInsights] = Field(
        None,
        description="Advanced pattern analysis (premium only)"
    )
    
    class Config:
        """Pydantic config for proper serialization."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }