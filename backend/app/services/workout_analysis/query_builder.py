# from typing import Dict, Optional
# from app.core.supabase.client import SupabaseClient
# from app.schemas.exercise_query import ExerciseQuery
# from datetime import datetime, timedelta

# from app.utils.one_rm_calc import OneRMCalculator
# class WorkoutQueryBuilder:
#     def __init__(self, supabase_client: SupabaseClient):
#         self.client = supabase_client
#         self.one_rm_calculator = OneRMCalculator()

#     def _convert_timeframe_to_days(self, timeframe: str) -> int:
#             """Convert a timeframe string to number of days."""
#             try:
#                 number = int(timeframe.split()[0])
#                 unit = timeframe.split()[1].lower()
                
#                 if unit in ['month', 'months']:
#                     return number * 30
#                 elif unit in ['year', 'years']:
#                     return number * 365
#                 elif unit in ['day', 'days']:
#                     return number
#                 else:
#                     raise ValueError(f"Unsupported time unit: {unit}")
#             except Exception as e:
#                 print(f"Error converting timeframe: {e}")
#                 return 90 
                
#     async def fetch_exercise_data(self, user_id: str, query_params: ExerciseQuery) -> Optional[Dict]:
#         """Fetches workout data for specific exercises over a given timeframe."""
#         try:
#             days = self._convert_timeframe_to_days(query_params.timeframe)
#             from_date = datetime.now() - timedelta(days=days)
            
#             # Filter non-empty exercises
#             exercise_names = [ex.strip() for ex in query_params.exercises if ex.strip()]
            
#             # Call the enhanced database function using RPC
#             result = (self.client.client
#                 .rpc(
#                     "search_workouts_by_exercises_with_definitions", 
#                     {
#                         "user_id_param": user_id,
#                         "from_date_param": from_date.isoformat(),
#                         "exercise_names": exercise_names
#                     }
#                 )
#                 .execute())
            
#             # Return raw data without any formatting
#             return result.data if result.data else None
                
#         except Exception as e:
#             print(f"Query execution failed: {e}")
#             import traceback
#             print(f"Traceback:\n{traceback.format_exc()}")
#             return None