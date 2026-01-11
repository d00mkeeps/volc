"""
Schemas for Workout Analysis Bundles

This module defines the complete data structure for workout analysis bundles
used by the LLM coaching system. The bundle contains all workout data and
derived metrics needed for intelligent coaching insights.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
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
    definition_id: Optional[str] = None  
    notes: Optional[str] = Field(None, description="User's notes about this exercise")
    sets: List[WorkoutSet] = Field(
        default_factory=list,
        description="All sets performed for this exercise"
    )


class RecentWorkout(BaseModel):
    """
    Complete workout detail for recent workouts (last 14 days).
    
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

class ExerciseVolumeTimeSeries(BaseModel):
    """Single data point in exercise volume time series."""
    date: datetime = Field(..., description="Date of workout")
    volume_kg: float = Field(..., description="Total volume for this exercise on this date")


class ExerciseVolumeData(BaseModel):
    """Volume time series for a single exercise."""
    exercise: str = Field(..., description="Exercise name")
    time_series: List[ExerciseVolumeTimeSeries] = Field(
        default_factory=list,
        description="Volume over time for this exercise, ordered chronologically"
    )


class VolumeData(BaseModel):
    """
    Volume metrics and trends over time.
    
    Volume is calculated as weight × reps for all sets. Includes total volume,
    current workout volume, and per-exercise time series for trend analysis.
    """
    total_volume_kg: float = Field(
        ...,
        description="Total volume across all included workouts"
    )
    today_volume_kg: float = Field(
        ...,
        description="Volume from most recent workout only"
    )
    volume_by_exercise_over_time: List[ExerciseVolumeData] = Field(
        default_factory=list,
        description="Per-exercise volume time series, aggregated by date"
    )


# ==================== STRENGTH DATA ====================

class E1RMTimeSeries(BaseModel):
    """Single data point in e1RM time series."""
    date: datetime = Field(..., description="Date of workout")
    estimated_1rm: float = Field(..., description="Best e1RM achieved on this date")


class ExerciseStrengthProgress(BaseModel):
    """
    Strength progression time series for a single exercise.
    
    Contains full historical e1RM data for tracking strength progression over time.
    """
    exercise: str = Field(..., description="Exercise name")
    e1rm_time_series: List[E1RMTimeSeries] = Field(
        default_factory=list,
        description="All e1RM performances for this exercise over time, ordered chronologically"
    )


class StrengthData(BaseModel):
    """
    Strength metrics and progression for all exercises.
    
    Focuses on estimated 1RM (e1RM) as the primary strength indicator,
    tracking full historical performance across the data window.
    """
    exercise_strength_progress: List[ExerciseStrengthProgress] = Field(
        default_factory=list,
        description="E1RM time series for each exercise, showing strength progression"
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


# ==================== MUSCLE GROUP BALANCE ====================

class MuscleGroupDistribution(BaseModel):
    """Single muscle group with percentage of total training volume."""
    muscle_group: str = Field(..., description="Muscle group name (e.g., 'Chest', 'Back', 'Legs')")
    percentage: float = Field(..., description="Percentage of total muscle-set instances")


class MuscleGroupBalance(BaseModel):
    """
    Distribution of training across muscle groups.
    
    Shows how training volume is distributed across major muscle groups.
    Percentages are calculated from muscle-set instances (each primary muscle
    for each set counts as one instance), ensuring percentages always sum to 100%.
    
    Example: 3 sets of Bench Press (primary: chest, triceps) counts as:
    - 3 instances for Chest
    - 3 instances for Arms (triceps)
    - Total instances: 6
    - If these are the only sets: Chest=50%, Arms=50%
    """
    total_sets: int = Field(
        ...,
        description="Raw count of actual sets performed (each set counted once)"
    )
    distribution: List[MuscleGroupDistribution] = Field(
        default_factory=list,
        description="Percentage distribution across muscle groups, ordered by percentage descending"
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

class UserContextBundle(BaseModel):
    """
    Complete context bundle for LLM-powered coaching.
    
    Formerly known as WorkoutContextBundle. Now includes user profile and memory
    in addition to workout data.
    """
    id: str = Field(..., description="Unique bundle identifier (UUID)")
    user_id: str = Field(..., description="User this bundle belongs to")
    status: str = Field(
        default="complete",
        description="Bundle generation status: 'pending', 'processing', 'complete', 'failed'"
    )
    
    # User Context
    user_profile: Optional[Dict[str, Any]] = Field(
        None,
        description="Full user profile"
    )
    ai_memory: Optional[Dict[str, Any]] = Field(
        None,
        description="Long-term memory extracted from conversations (note-based)"
    )
    
    # Core data sections
    metadata: BundleMetadata = Field(..., description="Bundle metadata and generation info")
    general_workout_data: GeneralWorkoutData = Field(
        ...,
        description="Summary statistics and overview"
    )
    recent_workouts: List[RecentWorkout] = Field(
        default_factory=list,
        description="Last 14 days of workouts with full detail (newest first)"
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