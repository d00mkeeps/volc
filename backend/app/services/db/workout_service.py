from .base_service import BaseDBService
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
from ...core.utils.id_gen import new_uuid

logger = logging.getLogger(__name__)


class WorkoutService(BaseDBService):
    """
    Service for handling workout operations in the database
    """

    async def create_workout(
        self, user_id: str, workout_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new worko]]ut and store it in the database
        """
        try:
            logger.info(
                f"Creating workout: {workout_data.get('name')} for user: {user_id}"
            )

            now = datetime.utcnow().isoformat()

            # Prepare the workout data including the conversation_id if present
            workout_insert_data = {
                "id": workout_data.get("id") or str(await new_uuid()),
                "user_id": user_id,
                "name": workout_data.get("name"),
                "notes": workout_data.get("description") or workout_data.get("notes"),
                "conversation_id": workout_data.get("conversationId"),
                "created_at": workout_data.get("created_at") or now,
                "used_as_template": now,  # Set this to creation date by default
            }

            logger.info(
                f"Inserting workout with data: {workout_insert_data.get('name')}, {workout_insert_data.get('conversation_id')}"
            )

            # Insert workout
            result = (
                self.supabase.table("workouts").insert(workout_insert_data).execute()
            )

            if not hasattr(result, "data") or not result.data:
                raise Exception("Failed to create workout: No data returned")

            workout_id = result.data[0]["id"]
            logger.info(f"Workout created with ID: {workout_id}")

            # Process exercises if they exist in input
            if workout_data.get("exercises") and len(workout_data["exercises"]) > 0:
                logger.info(
                    f"Creating {len(workout_data['exercises'])} exercises for workout: {workout_id}"
                )

                for index, exercise in enumerate(workout_data["exercises"]):
                    # Extract exercise data
                    exercise_name = exercise.get("exercise_name") or exercise.get(
                        "name"
                    )
                    definition_id = exercise.get("definition_id")
                    order_index = (
                        exercise.get("order_in_workout")
                        or exercise.get("order_index")
                        or index
                    )

                    logger.info(
                        f"Creating exercise {index + 1}/{len(workout_data['exercises'])}: {exercise_name}"
                    )

                    # Insert exercise
                    exercise_result = (
                        self.supabase.table("workout_exercises")
                        .insert(
                            {
                                "workout_id": workout_id,
                                "name": exercise_name,
                                "definition_id": definition_id,
                                "order_index": order_index,
                                "weight_unit": exercise.get("weight_unit") or "kg",
                                "distance_unit": exercise.get("distance_unit") or "m",
                            }
                        )
                        .execute()
                    )

                    if not hasattr(exercise_result, "data") or not exercise_result.data:
                        raise Exception(f"Failed to create exercise: No data returned")

                    exercise_id = exercise_result.data[0]["id"]
                    logger.info(
                        f"Exercise created: {exercise_name} with ID: {exercise_id}"
                    )

                    # Process sets if they exist
                    if exercise.get("set_data") and exercise["set_data"].get("sets"):
                        sets = exercise["set_data"]["sets"]

                        for set_index, set_data in enumerate(sets):
                            set_result = (
                                self.supabase.table("workout_exercise_sets")
                                .insert(
                                    {
                                        "exercise_id": exercise_id,
                                        "set_number": set_index + 1,
                                        "weight": set_data.get("weight"),
                                        "reps": set_data.get("reps"),
                                        "rpe": set_data.get("rpe"),
                                        "distance": set_data.get("distance"),
                                        "duration": set_data.get("duration"),
                                    }
                                )
                                .execute()
                            )

                            if not hasattr(set_result, "data") or not set_result.data:
                                raise Exception(
                                    f"Failed to create set: No data returned"
                                )

            # Fetch the complete workout
            complete_result = (
                self.supabase.table("workouts")
                .select("*, workout_exercises(*, workout_exercise_sets(*))")
                .eq("id", workout_id)
                .execute()
            )

            if not hasattr(complete_result, "data") or not complete_result.data:
                raise Exception("Failed to fetch created workout")

            # Format the response
            workout = complete_result.data[0]

            # Sort exercises by order_index
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])

            # Sort sets by set_number
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            # Add conversationId in the expected format
            workout["conversationId"] = workout["conversation_id"]

            logger.info(f"Workout creation complete for ID: {workout_id}")
            return workout

        except Exception as e:
            logger.error(f"Error creating workout: {str(e)}")
            return await self.handle_error("create_workout", e)

    async def get_workout(self, workout_id: str) -> Dict[str, Any]:
        """
        Get a workout by ID
        """
        try:
            logger.info(f"Getting workout: {workout_id}")

            result = (
                self.supabase.table("workouts")
                .select("*, workout_exercises(*, workout_exercise_sets(*))")
                .eq("id", workout_id)
                .execute()
            )

            if not hasattr(result, "data") or not result.data:
                raise Exception(f"Workout not found: {workout_id}")

            # Format the response
            workout = result.data[0]

            # Sort exercises by order_index
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])

            # Sort sets by set_number
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            # Add conversationId in the expected format
            workout["conversationId"] = workout["conversation_id"]

            logger.info(f"Successfully retrieved workout: {workout_id}")
            return workout

        except Exception as e:
            logger.error(f"Error getting workout: {str(e)}")
            return await self.handle_error("get_workout", e)

    async def get_workouts_by_conversation(
        self, user_id: str, conversation_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all workouts for a specific conversation
        """
        try:
            logger.info(f"Getting workouts for conversation: {conversation_id}")

            result = (
                self.supabase.table("workouts")
                .select("*, workout_exercises(*, workout_exercise_sets(*))")
                .eq("user_id", user_id)
                .eq("conversation_id", conversation_id)
                .order("created_at", desc=True)
                .execute()
            )

            if not hasattr(result, "data"):
                raise Exception("Failed to fetch workouts: No data returned")

            workouts = result.data or []

            # Format each workout
            formatted_workouts = []
            for workout in workouts:
                # Sort exercises by order_index
                workout["workout_exercises"].sort(key=lambda x: x["order_index"])

                # Sort sets by set_number
                for exercise in workout["workout_exercises"]:
                    exercise["workout_exercise_sets"].sort(
                        key=lambda x: x["set_number"]
                    )

                # Add conversationId in the expected format
                workout["conversationId"] = workout["conversation_id"]
                formatted_workouts.append(workout)

            logger.info(
                f"Retrieved {len(formatted_workouts)} workouts for conversation: {conversation_id}"
            )
            return formatted_workouts

        except Exception as e:
            logger.error(f"Error getting workouts by conversation: {str(e)}")
            return await self.handle_error("get_workouts_by_conversation", e)

    async def delete_workout(self, workout_id: str) -> Dict[str, Any]:
        """
        Delete a workout by ID (this cascades to exercises and sets)
        """
        try:
            logger.info(f"Deleting workout: {workout_id}")

            # Get all exercise IDs for this workout
            exercise_result = (
                self.supabase.table("workout_exercises")
                .select("id")
                .eq("workout_id", workout_id)
                .execute()
            )

            if hasattr(exercise_result, "data") and exercise_result.data:
                exercise_ids = [e["id"] for e in exercise_result.data]

                # Delete all sets first
                self.supabase.table("workout_exercise_sets").delete().in_(
                    "exercise_id", exercise_ids
                ).execute()

                # Delete all exercises
                self.supabase.table("workout_exercises").delete().eq(
                    "workout_id", workout_id
                ).execute()

            # Delete the workout
            result = (
                self.supabase.table("workouts").delete().eq("id", workout_id).execute()
            )

            if not hasattr(result, "data"):
                raise Exception("Failed to delete workout: No data returned")

            logger.info(f"Successfully deleted workout: {workout_id}")
            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting workout: {str(e)}")
            return await self.handle_error("delete_workout", e)

    async def delete_conversation_workouts(
        self, user_id: str, conversation_id: str
    ) -> Dict[str, Any]:
        """
        Delete all workouts for a specific conversation
        """
        try:
            logger.info(f"Deleting all workouts for conversation: {conversation_id}")

            # Get workout IDs for this conversation
            workout_result = (
                self.supabase.table("workouts")
                .select("id")
                .eq("user_id", user_id)
                .eq("conversation_id", conversation_id)
                .execute()
            )

            if not hasattr(workout_result, "data"):
                raise Exception(
                    "Failed to fetch workouts for deletion: No data returned"
                )

            if not workout_result.data:
                logger.info(
                    f"No workouts found to delete for conversation: {conversation_id}"
                )
                return {"success": True}

            workout_ids = [w["id"] for w in workout_result.data]
            logger.info(
                f"Found {len(workout_ids)} workouts to delete for conversation: {conversation_id}"
            )

            # Delete each workout (which will cascade to exercises and sets)
            for workout_id in workout_ids:
                await self.delete_workout(workout_id)

            logger.info(
                f"Successfully deleted all workouts for conversation: {conversation_id}"
            )
            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting conversation workouts: {str(e)}")
            return await self.handle_error("delete_conversation_workouts", e)

    async def update_template_usage(self, template_id: str) -> Dict[str, Any]:
        """
        Update the used_as_template timestamp for a workout
        """
        try:
            logger.info(f"Updating template usage for workout: {template_id}")

            result = (
                self.supabase.table("workouts")
                .update({"used_as_template": datetime.utcnow().isoformat()})
                .eq("id", template_id)
                .execute()
            )

            if not hasattr(result, "data"):
                raise Exception("Failed to update template usage: No data returned")

            logger.info(
                f"Successfully updated template usage for workout: {template_id}"
            )
            return {"success": True, "id": template_id}

        except Exception as e:
            logger.error(f"Error updating template usage: {str(e)}")
            return await self.handle_error("update_template_usage", e)

    async def get_templates(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all workout templates for a user
        """
        try:
            logger.info(f"Getting workout templates for user: {user_id}")

            result = (
                self.supabase.table("workouts")
                .select("*, workout_exercises(*, workout_exercise_sets(*))")
                .eq("user_id", user_id)
                .order("used_as_template", desc=True)
                .limit(50)
                .execute()
            )

            if not hasattr(result, "data"):
                raise Exception("Failed to fetch templates: No data returned")

            templates = result.data or []

            # Format each template
            formatted_templates = []
            for template in templates:
                # Sort exercises by order_index
                template["workout_exercises"].sort(key=lambda x: x["order_index"])

                # Sort sets by set_number
                for exercise in template["workout_exercises"]:
                    exercise["workout_exercise_sets"].sort(
                        key=lambda x: x["set_number"]
                    )

                formatted_templates.append(template)

            logger.info(
                f"Retrieved {len(formatted_templates)} templates for user: {user_id}"
            )
            return formatted_templates

        except Exception as e:
            logger.error(f"Error getting templates: {str(e)}")
            return await self.handle_error("get_templates", e)

    async def get_user_workouts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all workouts for a user (not filtered by conversation)
        """
        try:
            logger.info(f"Getting all workouts for user: {user_id}")

            # Use the same query structure as get_workout for consistency
            result = (
                self.supabase.table("workouts")
                .select("*, workout_exercises(*, workout_exercise_sets(*))")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )

            if hasattr(result, "error") and result.error:
                raise Exception(f"Failed to fetch workouts: {result.error.message}")

            workouts = result.data or []

            # Format each workout (same as other methods)
            for workout in workouts:
                # Sort exercises by order_index
                workout["workout_exercises"].sort(key=lambda x: x["order_index"])

                # Sort sets by set_number
                for exercise in workout["workout_exercises"]:
                    exercise["workout_exercise_sets"].sort(
                        key=lambda x: x["set_number"]
                    )

            logger.info(f"Retrieved {len(workouts)} workouts for user: {user_id}")
            return workouts

        except Exception as e:
            logger.error(f"Error getting user workouts: {str(e)}")
            return await self.handle_error("get_user_workouts", e)

    # async def get_workout_history_by_exercises(
    #     self, user_id: str, exercises: List[str], timeframe: str
    # ) -> Optional[Dict]:
    #     """
    #     Fetches workout data for specific exercises over a given timeframe.
    #     """
    #     try:
    #         # Convert timeframe string to days
    #         days = self._convert_timeframe_to_days(timeframe)
    #         from_date = datetime.now() - timedelta(days=days)

    #         # Filter non-empty exercises
    #         exercise_names = [ex.strip() for ex in exercises if ex.strip()]

    #         # Call the database function using supabase
    #         result = self.supabase.rpc(
    #             "search_workouts_by_exercises_with_definitions",
    #             {
    #                 "user_id_param": user_id,
    #                 "from_date_param": from_date.isoformat(),
    #                 "exercise_names": exercise_names,
    #             },
    #         ).execute()

    #         return result.data if hasattr(result, "data") and result.data else None

    #     except Exception as e:
    #         logger.error(f"Error fetching workout history: {str(e)}")
    #         return await self.handle_error("get_workout_history_by_exercises", e)

    async def update_workout(
        self, workout_id: str, workout_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing workout
        """
        try:
            logger.info(f"Updating workout: {workout_id}")

            # Update the main workout record
            workout_update_data = {
                "name": workout_data.get("name"),
                "notes": workout_data.get("description") or workout_data.get("notes"),
                "updated_at": datetime.utcnow().isoformat(),
            }

            workout_result = (
                self.supabase.table("workouts")
                .update(workout_update_data)
                .eq("id", workout_id)
                .execute()
            )

            if not hasattr(workout_result, "data") or not workout_result.data:
                raise Exception("Failed to update workout")

            # If exercises are provided, replace them entirely
            if workout_data.get("exercises"):
                # Delete existing exercises and sets (cascades)
                existing_exercises = (
                    self.supabase.table("workout_exercises")
                    .select("id")
                    .eq("workout_id", workout_id)
                    .execute()
                )

                if hasattr(existing_exercises, "data") and existing_exercises.data:
                    exercise_ids = [e["id"] for e in existing_exercises.data]

                    # Delete sets first
                    self.supabase.table("workout_exercise_sets").delete().in_(
                        "exercise_id", exercise_ids
                    ).execute()

                    # Delete exercises
                    self.supabase.table("workout_exercises").delete().eq(
                        "workout_id", workout_id
                    ).execute()

                # Create new exercises
                for index, exercise in enumerate(workout_data["exercises"]):
                    exercise_name = exercise.get("exercise_name") or exercise.get(
                        "name"
                    )

                    exercise_result = (
                        self.supabase.table("workout_exercises")
                        .insert(
                            {
                                "workout_id": workout_id,
                                "name": exercise_name,
                                "definition_id": exercise.get("definition_id"),
                                "order_index": exercise.get("order_in_workout", index),
                                "weight_unit": exercise.get("weight_unit", "kg"),
                                "distance_unit": exercise.get("distance_unit", "m"),
                            }
                        )
                        .execute()
                    )

                    if hasattr(exercise_result, "data") and exercise_result.data:
                        exercise_id = exercise_result.data[0]["id"]

                        # Create sets if provided
                        if exercise.get("set_data") and exercise["set_data"].get(
                            "sets"
                        ):
                            for set_index, set_data in enumerate(
                                exercise["set_data"]["sets"]
                            ):
                                self.supabase.table("workout_exercise_sets").insert(
                                    {
                                        "exercise_id": exercise_id,
                                        "set_number": set_index + 1,
                                        "weight": set_data.get("weight"),
                                        "reps": set_data.get("reps"),
                                        "rpe": set_data.get("rpe"),
                                        "distance": set_data.get("distance"),
                                        "duration": set_data.get("duration"),
                                    }
                                ).execute()

            # Return complete updated workout
            complete_result = (
                self.supabase.table("workouts")
                .select("*, workout_exercises(*, workout_exercise_sets(*))")
                .eq("id", workout_id)
                .execute()
            )

            if not hasattr(complete_result, "data") or not complete_result.data:
                raise Exception("Failed to fetch updated workout")

            workout = complete_result.data[0]

            # Sort exercises and sets
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            logger.info(f"Successfully updated workout: {workout_id}")
            return workout

        except Exception as e:
            logger.error(f"Error updating workout: {str(e)}")
            return await self.handle_error("update_workout", e)

    def _convert_timeframe_to_days(self, timeframe: str) -> int:
        """Convert a timeframe string to number of days."""
        try:
            number = int(timeframe.split()[0])
            unit = timeframe.split()[1].lower()

            if unit in ["month", "months"]:
                return number * 30
            elif unit in ["year", "years"]:
                return number * 365
            elif unit in ["day", "days"]:
                return number
            else:
                logger.warning(f"Unsupported time unit: {unit}")
                return 90  # Default to 90 days
        except Exception as e:
            logger.error(f"Error converting timeframe: {str(e)}")
            return 90  # Default to 90 days
    async def get_workout_history_by_definition_ids(
        self, 
        user_id: str, 
        definition_ids: List[str], 
        timeframe: str = "3 months"
    ) -> Dict[str, Any]:
        try:
            days = self._convert_timeframe_to_days(timeframe)
            from_date = datetime.now() - timedelta(days=days)
            
            logger.info(f"Calling RPC for user: {user_id}, definitions: {definition_ids}")
            
            result = self.supabase.rpc('get_workouts_by_definition_ids', {
                'user_id_param': user_id,
                'definition_ids': definition_ids,
                'from_date_param': from_date.isoformat()
            }).execute()

            logger.info(f"RPC returned: {len(result.data.get('workouts', []) if result.data else [])} workouts")
            
            return result.data if result.data else self._empty_workout_result(from_date)
            
        except Exception as e:
            logger.error(f"RPC error: {str(e)}")
            return self._empty_workout_result(from_date)