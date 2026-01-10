from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta, timezone
from .schemas import (
    UserContextBundle,
    BundleMetadata,
    GeneralWorkoutData,
    DateRange,
    ExerciseFrequency,
    RecentWorkout,
    WorkoutExercise,
    WorkoutSet,
    VolumeData,
    ExerciseVolumeData,
    ExerciseVolumeTimeSeries,
    StrengthData,
    ExerciseStrengthProgress,
    E1RMTimeSeries,
    ConsistencyData,
    MuscleGroupBalance,
    MuscleGroupDistribution,
)

logger = logging.getLogger(__name__)


class AnalysisBundleProcessor:
    """
    Processes workout data into comprehensive analysis bundles.
    
    Takes raw workout data from the database and transforms it into a
    structured bundle containing all metrics needed for LLM coaching.
    """
    
    # Muscle mapping from DashboardService
    MUSCLE_MAPPING = {
        # Chest
        "chest": "Chest",
        
        # Arms  
        "biceps": "Arms",
        "triceps": "Arms", 
        "forearms": "Arms",
        
        # Shoulders
        "shoulders": "Shoulders",
        
        # Back
        "back": "Back",
        "lats": "Back", 
        "traps": "Back",
        "lower_back": "Back",
        "lower back": "Back",
        
        # Legs
        "quadriceps": "Legs",
        "hamstrings": "Legs",
        "glutes": "Legs",
        "abductors": "Legs", 
        "adductors": "Legs",
        
        # Core
        "abs": "Core",
        "obliques": "Core",
        "hip_flexors": "Core",
        
        # Cardio
        "cardiovascular system": "Cardio"
    }
    
    def process(
        self,
        bundle_id: str,
        user_id: str,
        raw_workout_data: Dict[str, Any],
        exercise_definitions: List[Dict[str, Any]] = None
    ) -> UserContextBundle:
        """
        Process raw workout data into a complete analysis bundle.
        
        Args:
            bundle_id: Unique identifier for this bundle
            user_id: User this bundle belongs to
            raw_workout_data: Raw workout data from database
            exercise_definitions: List of exercise definition dicts from cache
            
        Returns:
            UserContextBundle with all sections populated
        """
        workouts = raw_workout_data.get('workouts', [])
        logger.info(f"Processing bundle {bundle_id} with {len(workouts)} workouts")
        
        errors = []
        
        try:
            # 1. Build metadata
            metadata = self._build_metadata(raw_workout_data, errors)
            
            # 2. Build general workout data
            general_workout_data = self._build_general_workout_data(workouts, errors)
            
            # 3. Build recent workouts (last 14 days)
            recent_workouts = self._build_recent_workouts(workouts, errors)
            
            # 4. Build volume data (with exercise time series)
            volume_data = self._build_volume_data(workouts, errors)
            
            # 5. Build strength data (with e1RM time series)
            strength_data = self._build_strength_data(workouts, errors)
            
            # 6. Build consistency data (simplified)
            consistency_data = self._build_consistency_data(workouts, errors)

            # 7. Build muscle group balance (percentage-based)
            muscle_group_balance = self._build_muscle_group_balance(
                workouts, errors, exercise_definitions
            )

            # 8. Skip correlation_insights for now (to be implemented later)
            
            # Assemble final bundle
            bundle = UserContextBundle(
                id=bundle_id,
                user_id=user_id,
                status='complete',
                metadata=metadata,
                general_workout_data=general_workout_data,
                recent_workouts=recent_workouts,
                volume_data=volume_data,
                strength_data=strength_data,
                consistency_data=consistency_data,
                muscle_group_balance=muscle_group_balance,
                correlation_insights=None,  # TODO: Implement correlations
            )
            
            logger.info(f"Successfully processed bundle {bundle_id}")
            return bundle
            
        except Exception as e:
            logger.error(f"Critical error processing bundle {bundle_id}: {e}", exc_info=True)
            errors.append(f"Processing failed: {str(e)}")
            return self._create_failed_bundle(bundle_id, user_id, raw_workout_data, errors)
    
    def _build_metadata(
        self,
        raw_workout_data: Dict[str, Any],
        errors: list
    ) -> BundleMetadata:
        """Build bundle metadata."""
        return BundleMetadata(
            bundle_type='standard',
            created_at=datetime.now(),
            data_window='Last 30 days',
            errors=errors
        )
    
    def _build_general_workout_data(
        self,
        workouts: list,
        errors: list
    ) -> GeneralWorkoutData:
        """Build general workout data with summary statistics."""
        try:
            if not workouts:
                return GeneralWorkoutData(
                    total_workouts=0,
                    total_exercises_unique=0,
                    date_range=DateRange(
                        earliest=datetime.now(),
                        latest=datetime.now()
                    ),
                    exercises_included=[],
                    exercise_frequency=ExerciseFrequency(by_sets={})
                )
            
            # Count unique exercises and calculate frequency
            exercise_names = set()
            exercise_set_counts = {}
            
            for workout in workouts:
                for exercise in workout.get('workout_exercises', []):
                    name = exercise.get('name')
                    if name:
                        exercise_names.add(name)
                        # Count sets for this exercise
                        num_sets = len(exercise.get('workout_exercise_sets', []))
                        exercise_set_counts[name] = exercise_set_counts.get(name, 0) + num_sets
            
            # Get date range
            workout_dates = [
                datetime.fromisoformat(w['created_at'].replace('Z', '+00:00'))
                for w in workouts if w.get('created_at')
            ]
            earliest = min(workout_dates) if workout_dates else datetime.now()
            latest = max(workout_dates) if workout_dates else datetime.now()
            
            return GeneralWorkoutData(
                total_workouts=len(workouts),
                total_exercises_unique=len(exercise_names),
                date_range=DateRange(earliest=earliest, latest=latest),
                exercises_included=sorted(list(exercise_names)),
                exercise_frequency=ExerciseFrequency(by_sets=exercise_set_counts)
            )
            
        except Exception as e:
            logger.error(f"Error building general workout data: {e}", exc_info=True)
            errors.append(f"General workout data failed: {str(e)}")
            return GeneralWorkoutData(
                total_workouts=0,
                total_exercises_unique=0,
                date_range=DateRange(earliest=datetime.now(), latest=datetime.now()),
                exercises_included=[],
                exercise_frequency=ExerciseFrequency(by_sets={})
            )
    
    def _build_recent_workouts(
        self,
        workouts: list,
        errors: list
    ) -> list:
        """
        Build recent workouts list (last 14 days with full detail).
        
        Location: /app/services/workout_analysis/processor.py
        Method: AnalysisBundleProcessor._build_recent_workouts()
        """
        try:
            recent_workouts = []
            # CHANGE: Extended from 7 to 14 days
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=14)
            
            for workout in workouts:
                workout_date_str = workout.get('created_at')
                if not workout_date_str:
                    continue
                
                workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
                
                # Only include workouts from last 14 days
                if workout_date < cutoff_date:
                    continue
                
                # Build exercises list
                exercises = []
                for exercise_data in workout.get('workout_exercises', []):
                    # Build sets list
                    sets = []
                    for set_data in exercise_data.get('workout_exercise_sets', []):
                        workout_set = WorkoutSet(
                            set_number=set_data.get('set_number', 0),
                            weight=set_data.get('weight'),
                            reps=set_data.get('reps'),
                            rpe=set_data.get('rpe'),
                            estimated_1rm=set_data.get('estimated_1rm'),
                            distance=set_data.get('distance'),
                            duration=set_data.get('duration')
                        )
                        sets.append(workout_set)
                    
                    # Sort sets by set_number
                    sets.sort(key=lambda s: s.set_number)
                    
                    exercise = WorkoutExercise(
                        name=exercise_data.get('name', ''),
                        definition_id=exercise_data.get('definition_id'),
                        notes=exercise_data.get('notes'),
                        sets=sets
                    )
                    exercises.append(exercise)
                
                # Sort exercises by order_index if available
                exercises.sort(key=lambda e: e.name)  # Fallback sort by name
                
                recent_workout = RecentWorkout(
                    date=workout_date,
                    name=workout.get('name'),
                    notes=workout.get('notes'),
                    exercises=exercises
                )
                recent_workouts.append(recent_workout)
            
            # Sort by date descending (newest first)
            recent_workouts.sort(key=lambda w: w.date, reverse=True)
            
            logger.info(f"Built {len(recent_workouts)} recent workouts")
            return recent_workouts
            
        except Exception as e:
            logger.error(f"Error building recent workouts: {e}", exc_info=True)
            errors.append(f"Recent workouts failed: {str(e)}")
            return []

    def _build_volume_data(
        self,
        workouts: list,
        errors: list
    ) -> VolumeData:
        """
        Build volume data with exercise-level time series.
        
        Location: /app/services/workout_analysis/processor.py
        Method: AnalysisBundleProcessor._build_volume_data()
        """
        try:
            total_volume = 0.0
            today_volume = 0.0
            
            # Track volume per exercise per date
            exercise_date_volumes = {}  # {exercise_name: {date: volume}}
            
            # Get most recent workout date for "today" calculation
            if workouts:
                latest_date = max(
                    datetime.fromisoformat(w['created_at'].replace('Z', '+00:00'))
                    for w in workouts if w.get('created_at')
                )
            else:
                latest_date = None
            
            for workout in workouts:
                workout_date_str = workout.get('created_at')
                if not workout_date_str:
                    continue
                
                workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
                workout_volume = 0.0
                
                for exercise in workout.get('workout_exercises', []):
                    exercise_name = exercise.get('name', '')
                    exercise_volume = 0.0
                    
                    for set_data in exercise.get('workout_exercise_sets', []):
                        weight = set_data.get('weight') or 0
                        reps = set_data.get('reps') or 0
                        set_volume = weight * reps
                        
                        exercise_volume += set_volume
                        workout_volume += set_volume
                        total_volume += set_volume
                    
                    # Add to exercise-date tracking
                    if exercise_name and exercise_volume > 0:
                        if exercise_name not in exercise_date_volumes:
                            exercise_date_volumes[exercise_name] = {}
                        
                        # Aggregate by date (combine multiple instances of same exercise on same day)
                        date_key = workout_date.date()
                        exercise_date_volumes[exercise_name][date_key] = \
                            exercise_date_volumes[exercise_name].get(date_key, 0) + exercise_volume
                
                # Check if this is "today" (most recent workout)
                if latest_date and workout_date == latest_date:
                    today_volume = workout_volume
            
            # Build exercise volume time series
            volume_by_exercise_over_time = []
            for exercise_name, date_volumes in exercise_date_volumes.items():
                time_series = [
                    ExerciseVolumeTimeSeries(
                        date=datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc),
                        volume_kg=round(volume, 2)
                    )
                    for date, volume in date_volumes.items()
                ]
                # Sort chronologically
                time_series.sort(key=lambda x: x.date)
                
                volume_by_exercise_over_time.append(
                    ExerciseVolumeData(
                        exercise=exercise_name,
                        time_series=time_series
                    )
                )
            
            # Sort by exercise name for consistency
            volume_by_exercise_over_time.sort(key=lambda x: x.exercise)
            
            return VolumeData(
                total_volume_kg=round(total_volume, 2),
                today_volume_kg=round(today_volume, 2),
                volume_by_exercise_over_time=volume_by_exercise_over_time
            )
            
        except Exception as e:
            logger.error(f"Error building volume data: {e}", exc_info=True)
            errors.append(f"Volume data failed: {str(e)}")
            return VolumeData(
                total_volume_kg=0.0,
                today_volume_kg=0.0,
                volume_by_exercise_over_time=[]
            )
    
    def _build_strength_data(
        self,
        workouts: list,
        errors: list
    ) -> StrengthData:
        """
        Build strength data with e1RM time series per exercise.
        
        Location: /app/services/workout_analysis/processor.py
        Method: AnalysisBundleProcessor._build_strength_data()
        """
        try:
            # Track e1RM performances per exercise per date
            exercise_date_e1rms = {}  # {exercise_name: {date: best_e1rm_on_that_date}}
            
            for workout in workouts:
                workout_date_str = workout.get('created_at')
                if not workout_date_str:
                    continue
                
                workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
                date_key = workout_date.date()
                
                for exercise in workout.get('workout_exercises', []):
                    exercise_name = exercise.get('name', '')
                    if not exercise_name:
                        continue
                    
                    # Find best e1RM for this exercise on this date
                    best_e1rm_today = 0.0
                    for set_data in exercise.get('workout_exercise_sets', []):
                        e1rm = set_data.get('estimated_1rm')
                        if e1rm and e1rm > best_e1rm_today:
                            best_e1rm_today = e1rm
                    
                    if best_e1rm_today > 0:
                        if exercise_name not in exercise_date_e1rms:
                            exercise_date_e1rms[exercise_name] = {}
                        
                        # Store best e1RM for this date (or update if better)
                        exercise_date_e1rms[exercise_name][date_key] = max(
                            exercise_date_e1rms[exercise_name].get(date_key, 0),
                            best_e1rm_today
                        )
            
            # Build exercise strength progress list
            exercise_strength_progress = []
            for exercise_name, date_e1rms in exercise_date_e1rms.items():
                time_series = [
                    E1RMTimeSeries(
                        date=datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc),
                        estimated_1rm=round(e1rm, 2)
                    )
                    for date, e1rm in date_e1rms.items()
                ]
                # Sort chronologically
                time_series.sort(key=lambda x: x.date)
                
                exercise_strength_progress.append(
                    ExerciseStrengthProgress(
                        exercise=exercise_name,
                        e1rm_time_series=time_series
                    )
                )
            
            # Sort by exercise name for consistency
            exercise_strength_progress.sort(key=lambda x: x.exercise)
            
            logger.info(f"Built strength data for {len(exercise_strength_progress)} exercises")
            return StrengthData(exercise_strength_progress=exercise_strength_progress)
            
        except Exception as e:
            logger.error(f"Error building strength data: {e}", exc_info=True)
            errors.append(f"Strength data failed: {str(e)}")
            return StrengthData(exercise_strength_progress=[])
    
    def _build_consistency_data(
        self,
        workouts: list,
        errors: list
    ) -> ConsistencyData:
        """
        Build consistency data (simplified - no redundant arrays).
        
        Location: /app/services/workout_analysis/processor.py
        Method: AnalysisBundleProcessor._build_consistency_data()
        """
        try:
            if len(workouts) < 2:
                return ConsistencyData(
                    avg_days_between=0.0,
                    variance=None
                )
            
            # Extract workout dates
            workout_dates = []
            for workout in workouts:
                date_str = workout.get('created_at')
                if date_str:
                    try:
                        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        workout_dates.append(date)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Could not parse workout date '{date_str}': {e}")
            
            if len(workout_dates) < 2:
                return ConsistencyData(
                    avg_days_between=0.0,
                    variance=None
                )
            
            # Sort by date
            workout_dates.sort()
            
            # Calculate gaps between consecutive workouts
            gaps = []
            for i in range(1, len(workout_dates)):
                gap_days = (workout_dates[i] - workout_dates[i-1]).total_seconds() / (24 * 3600)
                gaps.append(gap_days)
            
            # Calculate average gap
            avg_gap = sum(gaps) / len(gaps) if gaps else 0.0
            
            # Calculate variance (need at least 2 gaps)
            variance = None
            if len(gaps) >= 2:
                mean_gap = avg_gap
                variance_sum = sum((gap - mean_gap) ** 2 for gap in gaps)
                variance = variance_sum / len(gaps)
            
            return ConsistencyData(
                avg_days_between=round(avg_gap, 1),
                variance=round(variance, 2) if variance is not None else None
            )
            
        except Exception as e:
            logger.error(f"Error building consistency data: {e}", exc_info=True)
            errors.append(f"Consistency data failed: {str(e)}")
            return ConsistencyData(
                avg_days_between=0.0,
                variance=None
            )

    def _build_muscle_group_balance(
        self,
        workouts: list,
        errors: list,
        exercise_definitions: List[Dict[str, Any]] = None
    ) -> Optional[MuscleGroupBalance]:
        """
        Build muscle group balance with percentage distribution.
        
        Uses exercise definitions (from cache) to get primary muscles for each exercise.
        Counts all primary muscles (muscle-set instances) for percentage calculation.
        
        Location: /app/services/workout_analysis/processor.py
        Method: AnalysisBundleProcessor._build_muscle_group_balance()
        """
        try:
            # Build lookup map: definition_id -> primary_muscles
            definition_map = {}
            if exercise_definitions:
                for definition in exercise_definitions:
                    def_id = definition.get('id')
                    primary_muscles = definition.get('primary_muscles', [])
                    if def_id:
                        definition_map[def_id] = primary_muscles if isinstance(primary_muscles, list) else []
            
            if not definition_map:
                logger.warning("No exercise definitions available")
                return None
            
            logger.info(f"Using {len(definition_map)} exercise definitions from cache")
            
            # Calculate true total sets (raw count)
            true_total_sets = sum(
                len(ex.get('workout_exercise_sets', []))
                for w in workouts
                for ex in w.get('workout_exercises', [])
            )
            
            # Count muscle-set instances (all primary muscles)
            muscle_set_instances = {}
            
            for workout in workouts:
                for exercise in workout.get('workout_exercises', []):
                    definition_id = exercise.get('definition_id')
                    if not definition_id:
                        continue
                    
                    primary_muscles = definition_map.get(definition_id, [])
                    set_count = len(exercise.get('workout_exercise_sets', []))
                    
                    # Count each primary muscle
                    for muscle in primary_muscles:
                        muscle_group = self._map_muscle_to_group(muscle)
                        if muscle_group != "Other":
                            muscle_set_instances[muscle_group] = \
                                muscle_set_instances.get(muscle_group, 0) + set_count
            
            # Calculate total instances
            total_instances = sum(muscle_set_instances.values())
            
            if total_instances == 0:
                logger.warning("No muscle group data found")
                return None
            
            # Build distribution with percentages
            distribution = [
                MuscleGroupDistribution(
                    muscle_group=muscle_group,
                    percentage=round((instances / total_instances * 100), 1)
                )
                for muscle_group, instances in muscle_set_instances.items()
            ]
            
            # Sort by percentage descending
            distribution.sort(key=lambda x: x.percentage, reverse=True)
            
            logger.info(
                f"Built muscle group balance: {true_total_sets} total sets, "
                f"{total_instances} muscle-set instances, {len(distribution)} groups"
            )
            
            return MuscleGroupBalance(
                total_sets=true_total_sets,
                distribution=distribution
            )
            
        except Exception as e:
            logger.error(f"Error building muscle group balance: {e}", exc_info=True)
            errors.append(f"Muscle group balance failed: {str(e)}")
            return None
    
    def _map_muscle_to_group(self, muscle: str) -> str:
        """Map individual muscle to muscle group using static mapping."""
        return self.MUSCLE_MAPPING.get(muscle.lower(), "Other")
    
    def _create_failed_bundle(
        self,
        bundle_id: str,
        user_id: str,
        raw_workout_data: Dict,
        errors: list
    ) -> UserContextBundle:
        """Create minimal bundle when processing fails."""
        return UserContextBundle(
            id=bundle_id,
            user_id=user_id,
            status='failed',
            metadata=BundleMetadata(
                bundle_type='standard',
                created_at=datetime.now(),
                data_window='Last 30 days',
                errors=errors
            ),
            general_workout_data=GeneralWorkoutData(
                total_workouts=0,
                total_exercises_unique=0,
                date_range=DateRange(earliest=datetime.now(), latest=datetime.now()),
                exercises_included=[],
                exercise_frequency=ExerciseFrequency(by_sets={})
            ),
            recent_workouts=[],
            volume_data=VolumeData(
                total_volume_kg=0.0,
                today_volume_kg=0.0,
                volume_by_exercise_over_time=[]
            ),
            strength_data=StrengthData(exercise_strength_progress=[]),
            consistency_data=ConsistencyData(
                avg_days_between=0.0,
                variance=None
            ),
            muscle_group_balance=None,
            correlation_insights=None
        )