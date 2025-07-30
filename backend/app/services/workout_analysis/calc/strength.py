from typing import Dict, Any, List, Tuple
import logging
from ....utils.one_rm_calc import OneRMCalculator
from ..schemas import StrengthCalculatorResult, TopPerformer, PerformanceDataPoint

logger = logging.getLogger(__name__)

class StrengthCalculator:
    """Calculates strength performance and top performers + time series data."""
    
    @staticmethod
    def calculate(raw_workout_data: Dict, limit: int = 3) -> StrengthCalculatorResult:
        """Calculate top strength performers AND time series data from raw workout data."""
        try:
            workouts = raw_workout_data.get('workouts', [])
            
            if not workouts:
                logger.info("No workouts available for strength calculation")
                return StrengthCalculatorResult(top_performers=[], time_series={})
            
            # Track exercise performance over time (now collecting ALL data points)
            exercise_metrics, time_series_data = StrengthCalculator._track_exercise_performance(workouts)
            
            # Calculate improvements for top performers
            improvement_results = StrengthCalculator._calculate_improvements(exercise_metrics)
            
            # Sort by improvement and create top performers using schema
            improvement_results.sort(key=lambda x: x.get('change_percent', 0), reverse=True)
            
            top_performers = [
                TopPerformer(
                    name=result['name'],
                    definition_id=result['definition_id'],
                    first_value=result['first_value'],
                    last_value=result['last_value'],
                    change=result['change'],
                    change_percent=result['change_percent']
                )
                for result in improvement_results[:limit]
            ]
            
            # Build time series using schema
            time_series = {}
            for exercise_name, data_points in time_series_data.items():
                time_series[exercise_name] = [
                    PerformanceDataPoint(
                        date=point["date"],
                        highest_1rm=point["highest_1rm"]
                    )
                    for point in data_points
                ]
            
            logger.info(f"Found {len(improvement_results)} exercises with strength data, returning top {limit}")
            logger.info(f"Generated time series for {len(time_series_data)} exercises")
            
            return StrengthCalculatorResult(
                top_performers=top_performers,
                time_series=time_series
            )
            
        except Exception as e:
            logger.error(f"Error calculating strength metrics: {e}")
            return StrengthCalculatorResult(top_performers=[], time_series={})
    
    @staticmethod
    def _track_exercise_performance(workouts: List[Dict]) -> Tuple[Dict[str, Dict], Dict[str, List[Dict]]]:
        """Track exercise performance over time - returns both summary metrics and full time series."""
        exercise_metrics = {}  # For top performers (first/last)
        time_series_data = {}  # For correlation analysis (all data points)
        
        for workout in workouts:
            workout_date = workout.get('date', '')
            if not workout_date:
                continue
                
            for exercise in workout.get('exercises', []):
                exercise_name = exercise.get('exercise_name', '')
                if not exercise_name:
                    continue
                
                # Calculate max 1RM for this exercise in this workout
                max_1rm = StrengthCalculator._calculate_max_1rm_for_exercise(exercise)
                
                if max_1rm > 0:
                    # Initialize tracking for this exercise
                    if exercise_name not in exercise_metrics:
                        exercise_metrics[exercise_name] = {
                            'first': None, 
                            'last': None,
                            'definition_id': exercise.get('definition_id')
                        }
                        time_series_data[f"{exercise_name} strength"] = []
                    
                    current_entry = {'date': workout_date, 'value': max_1rm}
                    
                    # Track first and last for top performers calculation
                    if not exercise_metrics[exercise_name]['first'] or workout_date < exercise_metrics[exercise_name]['first']['date']:
                        exercise_metrics[exercise_name]['first'] = current_entry
                    if not exercise_metrics[exercise_name]['last'] or workout_date > exercise_metrics[exercise_name]['last']['date']:
                        exercise_metrics[exercise_name]['last'] = current_entry
                    
                    # Track ALL data points for time series
                    time_series_data[f"{exercise_name} strength"].append({
                        "date": workout_date,
                        "highest_1rm": max_1rm
                    })
        
        # Sort time series data by date for each exercise
        for exercise_name in time_series_data:
            time_series_data[exercise_name].sort(key=lambda x: x['date'])
        
        return exercise_metrics, time_series_data
    
    @staticmethod
    def _calculate_max_1rm_for_exercise(exercise: Dict) -> float:
        """Calculate the maximum 1RM for an exercise from its sets."""
        max_1rm = 0
        
        for set_data in exercise.get('sets', []):
            weight = set_data.get('weight', 0) or 0
            reps = set_data.get('reps', 0) or 0
            
            if weight > 0 and reps > 0:
                estimated_1rm = OneRMCalculator.calculate(weight, reps)
                if estimated_1rm and estimated_1rm > max_1rm:
                    max_1rm = estimated_1rm
        
        return max_1rm
    
    @staticmethod
    def _calculate_improvements(exercise_metrics: Dict) -> List[Dict[str, Any]]:
        """Calculate strength improvements for each exercise."""
        results = []
        
        for exercise_name, data in exercise_metrics.items():
            if data['first'] and data['last'] and data['first']['value'] > 0:
                first_value = data['first']['value']
                last_value = data['last']['value']
                change = last_value - first_value
                change_percent = (change / first_value) * 100
                
                results.append({
                    'name': exercise_name,
                    'definition_id': data['definition_id'],
                    'first_value': round(first_value, 2),
                    'last_value': round(last_value, 2),
                    'change': round(change, 2),
                    'change_percent': round(change_percent, 1)
                })
        
        return results