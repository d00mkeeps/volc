from typing import Dict, Optional
from app.core.supabase.client import SupabaseClient
from app.schemas.exercise_query import ExerciseQuery
from datetime import datetime, timedelta
from .formatter import WorkoutFormatter

class WorkoutQueryBuilder:
    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client

    def _convert_timeframe_to_days(self, timeframe: str) -> int:
            """Convert a timeframe string to number of days."""
            try:
                number = int(timeframe.split()[0])
                unit = timeframe.split()[1].lower()
                
                if unit in ['month', 'months']:
                    return number * 30
                elif unit in ['year', 'years']:
                    return number * 365
                elif unit in ['day', 'days']:
                    return number
                else:
                    raise ValueError(f"Unsupported time unit: {unit}")
            except Exception as e:
                print(f"Error converting timeframe: {e}")
                return 90 
                
    async def fetch_exercise_data(self, user_id: str, query_params: ExerciseQuery) -> Optional[Dict]:
        """Fetches workout data for specific exercises over a given timeframe."""
        try:
            days = self._convert_timeframe_to_days(query_params.timeframe)
            from_date = datetime.now() - timedelta(days=days)
            
            # Filter non-empty exercises
            exercise_names = [ex.strip() for ex in query_params.exercises if ex.strip()]
            
            # Call the database function using RPC
            result = (self.client.client
                .rpc(
                    "search_workouts_by_exercises", 
                    {
                        "user_id_param": user_id,
                        "from_date_param": from_date.isoformat(),
                        "exercise_names": exercise_names
                    }
                )
                .execute())
            
            # Return raw data without any formatting
            return result.data if result.data else None
                
        except Exception as e:
            print(f"Query execution failed: {e}")
            import traceback
            print(f"Traceback:\n{traceback.format_exc()}")
            return None
        
    def format_sql_function_data(self, raw_data: Dict) -> Dict:
        """Format data returned from the search_workouts_by_exercises SQL function."""
        # Extract the workouts from the raw data
        workouts = raw_data.get('workouts', [])
        metadata = raw_data.get('metadata', {})
        
        # Process each workout to add calculated metrics
        for workout in workouts:
            for exercise in workout.get('exercises', []):
                # Add metrics container if not present
                if 'metrics' not in exercise:
                    exercise['metrics'] = {}
                    
                # Calculate metrics
                sets = exercise.get('sets', [])
                exercise['metrics']['total_sets'] = len(sets)
                exercise['metrics']['total_volume'] = sum(
                    (set_data.get('weight', 0) or 0) * (set_data.get('reps', 0) or 0) 
                    for set_data in sets
                )
                
                # Calculate 1RM for each set and find the highest
                highest_1rm = 0
                for set_data in sets:
                    if set_data.get('weight') and set_data.get('reps'):
                        estimated_1rm = self.one_rm_calculator.calculate(
                            float(set_data.get('weight', 0)), 
                            int(set_data.get('reps', 0))
                        )
                        set_data['estimated_1rm'] = estimated_1rm
                        highest_1rm = max(highest_1rm, estimated_1rm or 0)
                
                exercise['metrics']['highest_1rm'] = highest_1rm
                
                # Rename keys to match expected format
                if 'name' in exercise and 'exercise_name' not in exercise:
                    exercise['exercise_name'] = exercise['name']
                    
                # Structure units data
                if 'weight_unit' in exercise or 'distance_unit' in exercise:
                    if 'units' not in exercise:
                        exercise['units'] = {}
                    if 'weight_unit' in exercise:
                        exercise['units']['weight'] = exercise.pop('weight_unit')
                    if 'distance_unit' in exercise:
                        exercise['units']['distance'] = exercise.pop('distance_unit')
        
        # Return in expected format
        return {
            'workouts': workouts,
            'metadata': metadata
        }