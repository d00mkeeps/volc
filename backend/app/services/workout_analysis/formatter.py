# /backend/app/services/workout_analysis/formatter.py

from typing import Dict, List, Optional
from app.utils.one_rm_calc import OneRMCalculator

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

    def format_exercise_data(self, raw_data: List[Dict]) -> Dict:
        """Format the raw query data into a structured format for analysis."""
        workouts = {}
        
        for exercise in raw_data:
            workout_id = exercise['workouts']['created_at']
            if workout_id not in workouts:
                workouts[workout_id] = {
                    'workout_name': exercise['workouts']['name'],
                    'workout_date': exercise['workouts']['created_at'],
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
        
        return {
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
                    'earliest': min(w['workout_date'] for w in workouts.values()),
                    'latest': max(w['workout_date'] for w in workouts.values())
                }
            }
        }