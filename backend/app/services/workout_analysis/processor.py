from typing import Dict, Any, Optional
import logging
from datetime import datetime
from .schemas import (
    BundleMetadata,
    MuscleGroupBalance,
    MuscleGroupEntry,
    WorkoutConsistencyEntry,
)

logger = logging.getLogger(__name__)
"""
Workout Analysis Bundle Processor

Processes raw workout data into comprehensive analysis bundles for LLM coaching.
"""

from typing import Dict, Any, List
import logging
from datetime import datetime, timedelta
from .schemas import (
    WorkoutAnalysisBundle,
    BundleMetadata,
    GeneralWorkoutData,
    DateRange,
    ExerciseFrequency,
    RecentWorkout,
    WorkoutExercise,
    WorkoutSet,
    VolumeData,
    VolumeTimeSeries,
    StrengthData,
    ExerciseStrengthData,
    E1RMPerformance,
    ConsistencyData,
)

logger = logging.getLogger(__name__)


class AnalysisBundleProcessor:
    """
    Processes workout data into comprehensive analysis bundles.
    
    Takes raw workout data from the database and transforms it into a
    structured bundle containing all metrics needed for LLM coaching.
    """
    
    def process(
        self,
        bundle_id: str,
        user_id: str,
        raw_workout_data: Dict[str, Any]
    ) -> WorkoutAnalysisBundle:
        """
        Process raw workout data into a complete analysis bundle.
        
        Args:
            bundle_id: Unique identifier for this bundle
            user_id: User this bundle belongs to
            raw_workout_data: Raw workout data from database
            
        Returns:
            WorkoutAnalysisBundle with all sections populated
        """
        workouts = raw_workout_data.get('workouts', [])
        logger.info(f"Processing bundle {bundle_id} with {len(workouts)} workouts")
        
        errors = []
        
        try:
            # 1. Build metadata
            metadata = self._build_metadata(raw_workout_data, errors)
            
            # 2. Build general workout data
            general_workout_data = self._build_general_workout_data(workouts, errors)
            
            # 3. Build recent workouts (last 7 days)
            recent_workouts = self._build_recent_workouts(workouts, errors)
            
            # 4. Build volume data
            volume_data = self._build_volume_data(workouts, errors)
            
            # 5. Build strength data
            strength_data = self._build_strength_data(workouts, errors)
            

            # 6. Build consistency data (now includes workout IDs)
            consistency_data = self._build_consistency_data(workouts, errors)

            # 7. Build muscle group balance
            muscle_group_balance = self._build_muscle_group_balance(workouts, errors)

            # 8. Skip correlation_insights for now (to be implemented later)
            
            # Assemble final bundle
            bundle = WorkoutAnalysisBundle(
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
        errors: List[str]
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
        workouts: List[Dict],
        errors: List[str]
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
        workouts: List[Dict],
        errors: List[str]
    ) -> List[RecentWorkout]:
        """Build recent workouts list (last 7 days with full detail)."""
        try:
            from datetime import timezone
            
            recent_workouts = []
            # Fix: Make cutoff_date timezone-aware
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            for workout in workouts:
                workout_date_str = workout.get('created_at')
                if not workout_date_str:
                    continue
                
                workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
                
                # Only include workouts from last 7 days
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
        workouts: List[Dict],
        errors: List[str]
    ) -> VolumeData:
        """Build volume data (calculated on the fly)."""
        try:
            total_volume = 0.0
            today_volume = 0.0
            by_exercise = {}
            time_series = []
            
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
                    
                    # Add to by_exercise
                    if exercise_name and exercise_volume > 0:
                        by_exercise[exercise_name] = by_exercise.get(exercise_name, 0) + exercise_volume
                
                # Check if this is "today" (most recent workout)
                if latest_date and workout_date == latest_date:
                    today_volume = workout_volume
                
                # Add to time series
                time_series.append(VolumeTimeSeries(
                    date=workout_date,
                    volume_kg=round(workout_volume, 2),
                    workout_name=workout.get('name')
                ))
            
            # Sort time series chronologically
            time_series.sort(key=lambda x: x.date)
            
            # Round by_exercise values
            by_exercise = {k: round(v, 2) for k, v in by_exercise.items()}
            
            return VolumeData(
                total_volume_kg=round(total_volume, 2),
                today_volume_kg=round(today_volume, 2),
                by_exercise=by_exercise,
                time_series=time_series
            )
            
        except Exception as e:
            logger.error(f"Error building volume data: {e}", exc_info=True)
            errors.append(f"Volume data failed: {str(e)}")
            return VolumeData(
                total_volume_kg=0.0,
                today_volume_kg=0.0,
                by_exercise={},
                time_series=[]
            )
    
    def _build_strength_data(
        self,
        workouts: List[Dict],
        errors: List[str]
    ) -> StrengthData:
        """Build strength data using estimated_1rm from database."""
        try:
            # Track all e1RM performances by exercise
            exercise_performances = {}
            
            for workout in workouts:
                workout_date_str = workout.get('created_at')
                if not workout_date_str:
                    continue
                
                workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
                
                for exercise in workout.get('workout_exercises', []):
                    exercise_name = exercise.get('name', '')
                    if not exercise_name:
                        continue
                    
                    for set_data in exercise.get('workout_exercise_sets', []):
                        e1rm = set_data.get('estimated_1rm')
                        if e1rm and e1rm > 0:
                            if exercise_name not in exercise_performances:
                                exercise_performances[exercise_name] = []
                            
                            exercise_performances[exercise_name].append(
                                E1RMPerformance(
                                    estimated_1rm=e1rm,
                                    date=workout_date
                                )
                            )
            
            # Build top_e1rms list
            top_e1rms = []
            for exercise_name, performances in exercise_performances.items():
                if not performances:
                    continue
                
                # Sort by e1rm descending to find best
                performances.sort(key=lambda p: p.estimated_1rm, reverse=True)
                best_performance = performances[0]
                
                # Sort all performances by date for historical view
                all_performances_sorted = sorted(performances, key=lambda p: p.date)
                
                exercise_strength = ExerciseStrengthData(
                    exercise=exercise_name,
                    best_e1rm=best_performance.estimated_1rm,
                    achieved_date=best_performance.date,
                    all_performances=all_performances_sorted
                )
                top_e1rms.append(exercise_strength)
            
            # Sort by best e1rm descending
            top_e1rms.sort(key=lambda x: x.best_e1rm, reverse=True)
            
            logger.info(f"Built strength data for {len(top_e1rms)} exercises")
            return StrengthData(top_e1rms=top_e1rms)
            
        except Exception as e:
            logger.error(f"Error building strength data: {e}", exc_info=True)
            errors.append(f"Strength data failed: {str(e)}")
            return StrengthData(top_e1rms=[])
    

    def _build_consistency_data(
        self,
        workouts: List[Dict],
        errors: List[str]
    ) -> ConsistencyData:
        """Build consistency data using workout dates and IDs."""
        try:
            if len(workouts) < 2:
                return ConsistencyData(
                    avg_days_between=0.0,
                    variance=None,
                    workout_dates=[],
                    workouts=[]
                )
            
            # Extract workout data (ID + date)
            workout_entries = []
            for workout in workouts:
                workout_id = workout.get('id')
                date_str = workout.get('created_at')
                if workout_id and date_str:
                    try:
                        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        workout_entries.append({
                            'id': workout_id,
                            'date': date
                        })
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Could not parse workout date '{date_str}': {e}")
            
            if len(workout_entries) < 2:
                return ConsistencyData(
                    avg_days_between=0.0,
                    variance=None,
                    workout_dates=[],
                    workouts=[]
                )
            
            # Sort by date
            workout_entries.sort(key=lambda x: x['date'])
            
            # Extract sorted dates for calculations
            workout_dates = [entry['date'] for entry in workout_entries]
            
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
            
            # Build WorkoutConsistencyEntry objects
            workout_consistency_entries = [
                WorkoutConsistencyEntry(
                    workout_id=entry['id'],
                    date=entry['date']
                )
                for entry in workout_entries
            ]
            
            return ConsistencyData(
                avg_days_between=round(avg_gap, 1),
                variance=round(variance, 2) if variance is not None else None,
                workout_dates=workout_dates,
                workouts=workout_consistency_entries
            )
            
        except Exception as e:
            logger.error(f"Error building consistency data: {e}", exc_info=True)
            errors.append(f"Consistency data failed: {str(e)}")
            return ConsistencyData(
                avg_days_between=0.0,
                variance=None,
                workout_dates=[],
                workouts=[]
            )

    def _build_muscle_group_balance(
        self,
        workouts: List[Dict],
        errors: List[str]
    ) -> Optional[MuscleGroupBalance]:
        """
        Build muscle group balance from workouts.
        
        Uses the proven DashboardService._calculate_muscle_balance() method
        to ensure consistent calculations across the app.
        """
        try:
            # Import and instantiate dashboard service (has DB access)
            from app.services.db.dashboard_service import DashboardService
            dashboard_service = DashboardService()
            
            # Call the proven method - returns List[{"muscle": str, "sets": int}]
            muscle_balance_list = dashboard_service._calculate_muscle_balance(workouts)
            
            # Convert to our schema format
            muscle_group_entries = [
                MuscleGroupEntry(muscle=item["muscle"], sets=item["sets"])
                for item in muscle_balance_list
            ]
            
            # Calculate total sets
            total_sets = sum(entry.sets for entry in muscle_group_entries)
            
            logger.info(f"Built muscle group balance: {len(muscle_group_entries)} groups, {total_sets} total sets")
            
            return MuscleGroupBalance(
                muscle_groups=muscle_group_entries,
                total_sets=total_sets
            )
            
        except Exception as e:
            logger.error(f"Error building muscle group balance: {e}", exc_info=True)
            errors.append(f"Muscle group balance failed: {str(e)}")
            return None
    def _create_failed_bundle(
        self,
        bundle_id: str,
        user_id: str,
        raw_workout_data: Dict,
        errors: List[str]
    ) -> WorkoutAnalysisBundle:
        """Create minimal bundle when processing fails."""
        return WorkoutAnalysisBundle(
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
                by_exercise={},
                time_series=[]
            ),
            strength_data=StrengthData(top_e1rms=[]),
            consistency_data=ConsistencyData(
                avg_days_between=0.0,
                variance=None,
                workout_dates=[]
            ),
            muscle_group_balance=None,
            correlation_insights=None
        )