from typing import Dict, List, Optional
from app.core.supabase.client import SupabaseClient
from app.schemas.workout_query import ExerciseQuery
from datetime import datetime, timedelta

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
            return 90  # Default to 3 months (90 days) if conversion fails

    def fetch_exercise_data(
        self,
        user_id: str,
        query_params: ExerciseQuery
    ) -> Optional[List[Dict]]:
        try:
            days = self._convert_timeframe_to_days(query_params.timeframe)
            from_date = datetime.now() - timedelta(days=days)
            
            print(f"\nDebug info:")
            print(f"User ID: {user_id}")
            print(f"From date: {from_date.isoformat()}")
            print(f"Looking for exercises containing: {query_params.exercises}")
            
            # Build OR conditions for each exercise name
            or_conditions = []
            for exercise in query_params.exercises:
                or_conditions.append(f"name.ilike.%{exercise}%")
            or_string = ",".join(or_conditions)
            
            print(f"\nOR conditions: {or_string}")
            
            result = (self.client.client
                .from_("workout_exercises")
                .select("""
                    name,
                    weight_unit,
                    distance_unit,
                    workouts!inner(
                        created_at,
                        notes
                    ),
                    workout_exercise_sets!inner(
                        weight,
                        reps,
                        duration,
                        distance,
                        rpe,
                        set_number
                    ),
                    order_index
                """)
                .eq("workouts.user_id", user_id)
                .gte("workouts.created_at", from_date.isoformat())
                .or_(or_string)
                .order("created_at.desc")
                .execute())
            
            print("\nQuery executed successfully")
            if result.data:
                print(f"Found {len(result.data)} matching exercises")
            
            return result.data
                
        except Exception as e:
            print(f"\nQuery execution failed: {e}")
            print(f"Exception type: {type(e)}")
            import traceback
            print(f"Traceback:\n{traceback.format_exc()}")
            return None