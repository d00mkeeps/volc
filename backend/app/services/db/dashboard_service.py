from app.services.db.base_service import BaseDBService
from app.services.db.workout_service import WorkoutService
from typing import Dict, List, Any
import logging
from datetime import datetime, timedelta, timezone  # Add timezone import

logger = logging.getLogger(__name__)

class DashboardService(BaseDBService):
    """
    Service for handling dashboard analytics operations
    """
    
    # Static mapping of all known muscles to groups
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

    def __init__(self):
        super().__init__()
        self.workout_service = WorkoutService()

    async def get_dashboard_data(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get dashboard analytics data for all timeframes
        """
        try:
            logger.info(f"Getting dashboard data for user: {user_id}")

            # Get 60 days of workout data using existing service
            workouts_result = await self.workout_service.get_user_workouts(user_id, jwt_token)
            
            if not workouts_result.get("success"):
                raise Exception(f"Failed to get workouts: {workouts_result.get('error')}")

            workouts = workouts_result["data"]
            
            # Filter to last 60 days - use UTC timezone-aware datetime
            sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
            recent_workouts = []
            
            for w in workouts:
                workout_date_str = w["created_at"]
                # Parse datetime with timezone info
                workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
                if workout_date >= sixty_days_ago:
                    recent_workouts.append(w)

            logger.info(f"Processing {len(recent_workouts)} workouts for dashboard analytics")

            # Process data for all timeframes
            dashboard_data = {
                "1week": self._calculate_timeframe_data(recent_workouts, 7),
                "2weeks": self._calculate_timeframe_data(recent_workouts, 14),
                "1month": self._calculate_timeframe_data(recent_workouts, 30),
                "2months": self._calculate_timeframe_data(recent_workouts, 60),
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }

            logger.info(f"Successfully processed dashboard data for user: {user_id}")
            return await self.format_response(dashboard_data)

        except Exception as e:
            logger.error(f"Error getting dashboard data for user {user_id}: {str(e)}")
            return await self.handle_error("get_dashboard_data", e)

    def _calculate_timeframe_data(self, workouts: List[Dict], days: int) -> Dict[str, Any]:
        """Calculate muscle balance and consistency for a specific timeframe"""
        # Use UTC timezone-aware datetime
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Filter workouts for this timeframe
        timeframe_workouts = []
        for w in workouts:
            workout_date_str = w["created_at"]
            # Parse datetime with timezone info
            workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00'))
            if workout_date >= cutoff_date:
                timeframe_workouts.append(w)

        return {
            "muscleBalance": self._calculate_muscle_balance(timeframe_workouts),
            "consistency": self._calculate_consistency(timeframe_workouts, days)
        }

    def _get_all_exercise_definitions(self) -> Dict[str, List[str]]:
        """Get all exercise definitions in one query and cache primary muscles"""
        try:
            admin_client = self.get_admin_client()
            result = admin_client.table("exercise_definitions") \
                .select("id, primary_muscles") \
                .execute()
            
            if hasattr(result, 'error') and result.error:
                logger.warning(f"Error batch fetching definitions: {result.error.message}")
                return {}
            
            # Return mapping: {definition_id: [primary_muscles]}
            definitions_map = {}
            for row in (result.data or []):
                definition_id = row.get("id")
                primary_muscles = row.get("primary_muscles", [])
                if definition_id:
                    definitions_map[definition_id] = primary_muscles if isinstance(primary_muscles, list) else []
            
            logger.info(f"Cached {len(definitions_map)} exercise definitions")
            return definitions_map
            
        except Exception as e:
            logger.warning(f"Could not batch fetch definitions: {str(e)}")
            return {}

    def _calculate_muscle_balance(self, workouts: List[Dict]) -> List[Dict[str, Any]]:
        """Calculate muscle group balance from workouts"""
        muscle_sets = {}
        
        # Batch fetch all exercise definitions once - PERFORMANCE FIX
        exercise_definitions = self._get_all_exercise_definitions()
        
        for workout in workouts:
            for exercise in workout.get("workout_exercises", []):
                definition_id = exercise.get("definition_id")
                if not definition_id:
                    continue
                
                # Use cached data instead of individual queries
                primary_muscles = exercise_definitions.get(definition_id, [])
                set_count = len(exercise.get("workout_exercise_sets", []))
                
                # Calculate distance for cardio
                total_distance = sum(
                    s.get("distance", 0) for s in exercise.get("workout_exercise_sets", [])
                    if s.get("distance")
                )
                
                for muscle in primary_muscles:
                    muscle_group = self._map_muscle_to_group(muscle)
                    if muscle_group != "Other":
                        
                        if muscle_group not in muscle_sets:
                            muscle_sets[muscle_group] = 0
                        
                        # Apply set counting logic
                        if muscle_group == "Cardio":
                            muscle_sets[muscle_group] += total_distance
                        elif len(primary_muscles) > 1:
                            muscle_sets[muscle_group] += set_count * 0.75
                        else:
                            muscle_sets[muscle_group] += set_count

        # Convert to list format
        return [
            {"muscle": group, "sets": round(sets)}
            for group, sets in sorted(muscle_sets.items(), key=lambda x: x[1], reverse=True)
            if sets > 0
        ]

    def _calculate_consistency(self, workouts: List[Dict], days: int) -> Dict[str, Any]:
        """Calculate consistency metrics"""
        
        # Get unique workout dates
        workout_dates = set()
        for workout in workouts:
            workout_date_str = workout["created_at"]
            # Parse and convert to date (removes time and timezone)
            workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00')).date()
            workout_dates.add(workout_date)

        # Calculate metrics
        total_workouts = len(workout_dates)
        
        # Return actual dates as ISO strings instead of just day numbers
        workout_date_strings = [date.isoformat() for date in sorted(workout_dates)]

        return {
            "workoutDates": workout_date_strings,  # Changed from workoutDays to workoutDates
            "totalWorkouts": total_workouts
            # Removed streak, score - as you requested
        }

    def _map_muscle_to_group(self, muscle: str) -> str:
        """Map muscle to group using static mapping"""
        return self.MUSCLE_MAPPING.get(muscle.lower(), "Other")

    def _calculate_current_streak(self, workout_dates: set) -> int:
        """Calculate current workout streak"""
        if not workout_dates:
            return 0
        
        # Use timezone-aware today
        today = datetime.now(timezone.utc).date()
        streak = 0
        
        # Count consecutive days backwards from today
        check_date = today
        while check_date in workout_dates:
            streak += 1
            check_date -= timedelta(days=1)
        
        return streak