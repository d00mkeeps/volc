from datetime import datetime
from typing import Dict, List, Union, Any
from app.utils.one_rm_calc import OneRMCalculator
from .metrics_calc import MetricsProcessor

class WorkoutFormatter:
    def __init__(self):
        self.one_rm_calculator = OneRMCalculator()

    def _format_set_data(self, set_data: Dict) -> Dict:
        """Format individual set data and calculate 1RM if possible."""
        formatted_set = {
            'set_number': set_data['set_number'],
            'weight': set_data['weight'],
            'reps': set_data['reps'],
            'rpe': set_data['rpe'],
            'distance': set_data['distance'],
            'duration': set_data['duration']
        }
        
        # Calculate 1RM if we have both weight and reps
        if set_data['weight'] and set_data['reps']:
            formatted_set['estimated_1rm'] = self.one_rm_calculator.calculate(
                float(set_data['weight']), 
                int(set_data['reps'])
            )
            
        return formatted_set

    def format_exercise_data(self, raw_data: Union[List[Dict], Dict]) -> Dict:
        """
        Format the raw query data into a structured format for analysis.
        Handles both direct database query results and SQL function results.
        """
        # Check if this is SQL function data (has 'workouts' key at the top level)
        if isinstance(raw_data, dict) and 'workouts' in raw_data:
            return self._format_sql_function_data(raw_data)
        
        # Original format handling (list of exercise records)
        workouts = {}
        
        for exercise in raw_data:
            workout_date = exercise['workouts']['created_at']
            
            # Standardize date format
            if isinstance(workout_date, str):
                try:
                    # Parse date and convert to simple ISO format without microseconds/timezone
                    dt = datetime.fromisoformat(workout_date.replace('Z', '+00:00'))
                    workout_date = dt.strftime('%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    # Keep original if parsing fails
                    pass
            
            workout_id = workout_date
            
            if workout_id not in workouts:
                workouts[workout_id] = {
                    'workout_name': exercise['workouts']['name'],
                    'workout_date': workout_date,  # Standardized date
                    'workout_notes': exercise['workouts']['notes'],
                    'exercises': []
                }
            
            exercise_entry = {
                'exercise_name': exercise['name'],
                'units': {
                    'weight': exercise['weight_unit'],
                    'distance': exercise['distance_unit']
                },
                'sets': sorted([
                    self._format_set_data(set_data)
                    for set_data in exercise['workout_exercise_sets']
                ], key=lambda x: x['set_number'])
            }
            
            # Calculate exercise metrics
            exercise_entry['metrics'] = {
                'total_sets': len(exercise_entry['sets']),
                'total_volume': sum(
                    (set_data['weight'] or 0) * (set_data['reps'] or 0) 
                    for set_data in exercise_entry['sets']
                ),
                'highest_1rm': max(
                    (set_data.get('estimated_1rm', 0) or 0)
                    for set_data in exercise_entry['sets']
                )
            }
            
            workouts[workout_id]['exercises'].append(exercise_entry)
        
        # Create basic formatted data structure
        formatted_data = {
            'workouts': [
                {
                    'name': workout_data['workout_name'],
                    'date': workout_data['workout_date'],
                    'notes': workout_data['workout_notes'],
                    'exercises': workout_data['exercises']
                }
                for workout_data in sorted(workouts.values(), 
                                        key=lambda x: x['workout_date'], 
                                        reverse=True)
            ],
            'metadata': {
                'total_workouts': len(workouts),
                'total_exercises': sum(len(w['exercises']) for w in workouts.values()),
                'date_range': {
                    'earliest': min(w['workout_date'] for w in workouts.values()) if workouts else None,
                    'latest': max(w['workout_date'] for w in workouts.values()) if workouts else None
                }
            }
        }
        
        # Calculate advanced metrics using the MetricsProcessor
        metrics_processor = MetricsProcessor(formatted_data)
        advanced_metrics = metrics_processor.process()
        
        # Add the advanced metrics to the formatted data
        formatted_data['metrics'] = advanced_metrics
        
        return formatted_data

    def _format_sql_function_data(self, raw_data: Dict) -> Dict:
        """
        Format data returned from the search_workouts_by_exercises SQL function.
        This is an internal method used by format_exercise_data.
        """
        # Extract the workouts and metadata from the raw data
        workouts = raw_data.get('workouts', [])
        metadata = raw_data.get('metadata', {})
        
        # Create the transformed workouts list
        transformed_workouts = []
        
        # Process each workout
        for workout in workouts:
            transformed_exercises = []
            
            # Process each exercise within the workout
            for exercise in workout.get('exercises', []):
                # Transform the exercise structure
                transformed_exercise = {
                    'exercise_name': exercise.get('name', ''),
                    'units': {
                        'weight': exercise.get('weight_unit', ''),
                        'distance': exercise.get('distance_unit', '')
                    },
                    'sets': []
                }
                
                # Process each set and calculate 1RM
                sets = exercise.get('sets', [])
                transformed_sets = []
                highest_1rm = 0
                
                for set_data in sets:
                    # Create a copy of the set data
                    transformed_set = {
                        'set_number': set_data.get('set_number', 0),
                        'weight': set_data.get('weight'),
                        'reps': set_data.get('reps'),
                        'duration': set_data.get('duration'),
                        'distance': set_data.get('distance'),
                        'rpe': set_data.get('rpe')
                    }
                    
                    # Calculate estimated 1RM if weight and reps are present
                    if transformed_set['weight'] and transformed_set['reps']:
                        try:
                            estimated_1rm = self.one_rm_calculator.calculate(
                                float(transformed_set['weight']), 
                                int(transformed_set['reps'])
                            )
                            transformed_set['estimated_1rm'] = estimated_1rm
                            highest_1rm = max(highest_1rm, estimated_1rm or 0)
                        except (ValueError, TypeError) as e:
                            print(f"Error calculating 1RM: {e}")
                            transformed_set['estimated_1rm'] = None
                    
                    transformed_sets.append(transformed_set)
                
                # Sort sets by set number to ensure proper order
                transformed_sets.sort(key=lambda x: x['set_number'])
                transformed_exercise['sets'] = transformed_sets
                
                # Calculate and add metrics
                total_volume = sum(
                    (set_data.get('weight', 0) or 0) * (set_data.get('reps', 0) or 0) 
                    for set_data in transformed_sets
                )
                
                transformed_exercise['metrics'] = {
                    'total_sets': len(transformed_sets),
                    'total_volume': total_volume,
                    'highest_1rm': highest_1rm
                }
                
                transformed_exercises.append(transformed_exercise)
            
            # Create the transformed workout
            transformed_workout = {
                'name': workout.get('name', ''),
                'date': workout.get('date', ''),
                'notes': workout.get('notes', ''),
                'exercises': transformed_exercises
            }
            
            transformed_workouts.append(transformed_workout)
        
        # Ensure date formatting is consistent
        for workout in transformed_workouts:
            workout_date = workout['date']
            
            # Standardize date format if it's a string
            if isinstance(workout_date, str):
                try:
                    # Parse date and convert to simple ISO format without microseconds/timezone
                    dt = datetime.fromisoformat(workout_date.replace('Z', '+00:00'))
                    workout['date'] = dt.strftime('%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    # Keep original if parsing fails
                    pass
        
        # Sort workouts by date descending (newest first)
        transformed_workouts.sort(key=lambda x: x['date'], reverse=True)
        
        # Create the basic formatted data structure
        formatted_data = {
            'workouts': transformed_workouts,
            'metadata': metadata if metadata else {
                'total_workouts': len(transformed_workouts),
                'total_exercises': sum(len(w['exercises']) for w in transformed_workouts),
                'date_range': {
                    'earliest': min((w['date'] for w in transformed_workouts), default=None),
                    'latest': max((w['date'] for w in transformed_workouts), default=None)
                }
            }
        }
        
        # Calculate advanced metrics using the MetricsProcessor
        metrics_processor = MetricsProcessor(formatted_data)
        advanced_metrics = metrics_processor.process()
        
        # Add the advanced metrics to the formatted data
        formatted_data['metrics'] = advanced_metrics
        
        return formatted_data