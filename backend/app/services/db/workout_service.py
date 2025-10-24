from app.utils.one_rm_calc import OneRMCalculator
from .base_service import BaseDBService
from typing import Dict, List, Any
import logging
from datetime import datetime, timedelta
from ...core.utils.id_gen import new_uuid

logger = logging.getLogger(__name__)

class WorkoutService(BaseDBService):
    """
    Service for handling workout operations in the database
    """

    async def get_workout(self, workout_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get a workout by ID
        """
        try:
            logger.info(f"Getting workout: {workout_id}")

            # RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("workouts") \
                .select("*, workout_exercises(*, workout_exercise_sets(*))") \
                .eq("id", workout_id) \
                .execute()

            if not hasattr(result, "data") or not result.data:
                raise Exception(f"Workout not found: {workout_id}")

            # Format the response
            workout = result.data[0]

            # Sort exercises by order_index
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])

            # Sort sets by set_number
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            logger.info(f"Successfully retrieved workout: {workout_id}")
            return await self.format_response(workout)

        except Exception as e:
            logger.error(f"Error getting workout: {str(e)}")
            return await self.handle_error("get_workout", e)

    async def get_public_workout(self, workout_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get a workout by ID using admin privileges (for leaderboard viewing)
        """
        try:
            logger.info(f"Getting public workout: {workout_id}")

            # Use admin client to bypass RLS
            admin_client = self.get_admin_client()
            result = admin_client.table("workouts") \
                .select("*, workout_exercises(*, workout_exercise_sets(*))") \
                .eq("id", workout_id) \
                .execute()

            if not hasattr(result, "data") or not result.data:
                raise Exception(f"Workout not found: {workout_id}")

            # Format the response
            workout = result.data[0]

            # Sort exercises by order_index
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])

            # Sort sets by set_number
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            logger.info(f"Successfully retrieved public workout: {workout_id}")
            return await self.format_response(workout)

        except Exception as e:
            logger.error(f"Error getting public workout: {str(e)}")
            return await self.handle_error("get_public_workout", e)


    async def delete_workout(self, workout_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Delete a workout by ID (this cascades to exercises and sets)
        """
        try:
            logger.info(f"Deleting workout: {workout_id}")
            user_client = self.get_user_client(jwt_token)
            
            # IMPORTANT: Get user_id BEFORE deletion
            workout_result = user_client.table("workouts")\
                .select("user_id")\
                .eq("id", workout_id)\
                .execute()
            
            user_id = None
            if hasattr(workout_result, "data") and workout_result.data:
                user_id = workout_result.data[0]["user_id"]
            
            # Get all exercise IDs for this workout - RLS handles user access
            exercise_result = user_client.table("workout_exercises") \
                .select("id") \
                .eq("workout_id", workout_id) \
                .execute()
            
            if hasattr(exercise_result, "data") and exercise_result.data:
                exercise_ids = [e["id"] for e in exercise_result.data]
                # Delete all sets first
                user_client.table("workout_exercise_sets").delete().in_(
                    "exercise_id", exercise_ids
                ).execute()
                # Delete all exercises
                user_client.table("workout_exercises").delete().eq(
                    "workout_id", workout_id
                ).execute()
            
            # Delete the workout - RLS handles user access control
            result = user_client.table("workouts").delete().eq("id", workout_id).execute()
            
            # Regenerate bundle after deletion
            if user_id:
                import asyncio
                asyncio.create_task(self._regenerate_user_bundle(user_id, jwt_token))
                logger.info(f"Triggered bundle regeneration for user {user_id} after workout deletion")
            
            logger.info(f"Successfully deleted workout: {workout_id}")
            return await self.format_response({"success": True})
            
        except Exception as e:
            logger.error(f"Error deleting workout: {str(e)}")
            return await self.handle_error("delete_workout", e)

    # async def update_template_usage(self, template_id: str, jwt_token: str) -> Dict[str, Any]:
    #     """
    #     Update the used_as_template timestamp for a workout
    #     """
    #     try:
    #         logger.info(f"Updating template usage for workout: {template_id}")

    #         # RLS handles user access control
    #         user_client = self.get_user_client(jwt_token)
    #         result = user_client.table("workouts") \
    #             .update({"used_as_template": datetime.utcnow().isoformat()}) \
    #             .eq("id", template_id) \
    #             .execute()

    #         logger.info(f"Successfully updated template usage for workout: {template_id}")
    #         return await self.format_response({"success": True, "id": template_id})

    #     except Exception as e:
    #         logger.error(f"Error updating template usage: {str(e)}")
    #         return await self.handle_error("update_template_usage", e)

    # async def get_templates(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
    #     """
    #     Get all workout templates for a user
    #     """
    #     try:
    #         logger.info(f"Getting workout templates for user: {user_id}")

    #         # RLS handles user filtering - removed manual user_id filter
    #         user_client = self.get_user_client(jwt_token)
    #         result = user_client.table("workouts") \
    #             .select("*, workout_exercises(*, workout_exercise_sets(*))") \
    #             .order("used_as_template", desc=True) \
    #             .limit(50) \
    #             .execute()

    #         templates = result.data or []

    #         # Format each template
    #         formatted_templates = []
    #         for template in templates:
    #             # Sort exercises by order_index
    #             template["workout_exercises"].sort(key=lambda x: x["order_index"])

    #             # Sort sets by set_number
    #             for exercise in template["workout_exercises"]:
    #                 exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

    #             formatted_templates.append(template)

    #         logger.info(f"Retrieved {len(formatted_templates)} templates for user: {user_id}")
    #         return await self.format_response(formatted_templates)

    #     except Exception as e:
    #         logger.error(f"Error getting templates: {str(e)}")
    #         return await self.handle_error("get_templates", e)

    async def get_user_workouts(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get all workouts for a user (not filtered by conversation)
        """
        try:
            logger.info(f"Getting all workouts for user: {user_id}")

            # RLS handles user filtering - removed manual user_id filter
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("workouts") \
                .select("*, workout_exercises(*, workout_exercise_sets(*))") \
                .order("created_at", desc=True) \
                .execute()

            if hasattr(result, "error") and result.error:
                raise Exception(f"Failed to fetch workouts: {result.error.message}")

            workouts = result.data or []

            # Format each workout (same as other methods)
            for workout in workouts:
                # Sort exercises by order_index
                workout["workout_exercises"].sort(key=lambda x: x["order_index"])

                # Sort sets by set_number
                for exercise in workout["workout_exercises"]:
                    exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            logger.info(f"Retrieved {len(workouts)} workouts for user: {user_id}")
            return await self.format_response(workouts)

        except Exception as e:
            logger.error(f"Error getting user workouts: {str(e)}")
            return await self.handle_error("get_user_workouts", e)

    async def get_workout_history_by_definition_ids(
        self, 
        user_id: str, 
        definition_ids: List[str],
        jwt_token: str
    ) -> Dict[str, Any]:
        try:
            from_date = datetime.now() - timedelta(days=180)      
            logger.info(f"Calling RPC for user: {user_id}, definitions: {definition_ids}")
            
            # Keep user_id for RPC call - this is business logic requirement
            user_client = self.get_user_client(jwt_token)
            result = user_client.rpc('get_workouts_by_definition_ids', {
                'user_id_param': user_id,
                'definition_ids': definition_ids,
                'from_date_param': from_date.isoformat()
            }).execute()

            logger.info(f"RPC returned: {len(result.data.get('workouts', []) if result.data else [])} workouts")
            
            data = result.data if result.data else self._empty_workout_result(from_date)
            return await self.format_response(data)
            
        except Exception as e:
            logger.error(f"RPC error: {str(e)}")
            return await self.format_response(self._empty_workout_result(from_date))
        
    def _empty_workout_result(self, from_date):
        """Helper method for empty workout result"""
        return {
            "workouts": [],
            "from_date": from_date.isoformat()
        }
        
    async def create_workout(
        self, user_id: str, workout_data: Dict[str, Any], jwt_token: str
    ) -> Dict[str, Any]:
        """
        Create a new workout and store it in the database
        """
        try:
            logger.info(f"Creating workout: {workout_data.get('name')} for user: {user_id}")

            now = datetime.utcnow().isoformat()

            # Prepare the workout data including user_id for business logic
            workout_insert_data = {
                "id": workout_data.get("id") or str(await new_uuid()),
                "user_id": user_id,  # Keep user_id for business logic
                "name": workout_data.get("name"),
                "notes": workout_data.get("description") or workout_data.get("notes"),
                "image_id": workout_data.get("image_id"),
                "created_at": workout_data.get("created_at") or now,
                "used_as_template": now,  # Set this to creation date by default
            }

            logger.info(f"Inserting workout with data: {workout_insert_data.get('name')}")

            # Insert workout
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("workouts").insert(workout_insert_data).execute()

            if not hasattr(result, "data") or not result.data:
                raise Exception("Failed to create workout: No data returned")

            workout_id = result.data[0]["id"]
            logger.info(f"Workout created with ID: {workout_id}")

            # Process exercises if they exist in input
            if workout_data.get("workout_exercises") and len(workout_data["workout_exercises"]) > 0:
                logger.info(f"Creating {len(workout_data['workout_exercises'])} exercises for workout: {workout_id}")

                for index, exercise in enumerate(workout_data["workout_exercises"]):
                    # Extract exercise data
                    exercise_name = exercise.get("name")
                    definition_id = exercise.get("definition_id")
                    order_index = exercise.get("order_index") or index

                    logger.info(f"Creating exercise {index + 1}/{len(workout_data['workout_exercises'])}: {exercise_name}")

                    # Insert exercise
                    exercise_result = user_client.table("workout_exercises").insert({
                        "workout_id": workout_id,
                        "name": exercise_name,
                        "definition_id": definition_id,
                        "order_index": order_index,
                        "weight_unit": exercise.get("weight_unit") or "kg",
                        "distance_unit": exercise.get("distance_unit") or "m",
                        "notes": exercise.get("notes"),  # ADD THIS LINE
                    }).execute()

                    if not hasattr(exercise_result, "data") or not exercise_result.data:
                        raise Exception(f"Failed to create exercise: No data returned")

                    exercise_id = exercise_result.data[0]["id"]
                    logger.info(f"Exercise created: {exercise_name} with ID: {exercise_id}")

                    if exercise.get("workout_exercise_sets"):
                        sets = exercise["workout_exercise_sets"]

                        for set_index, set_data in enumerate(sets):
                            # Calculate e1rm if weight and reps are present
                            estimated_1rm = None
                            if set_data.get("weight") and set_data.get("reps"):
                                estimated_1rm = OneRMCalculator.calculate(
                                    weight=float(set_data.get("weight")),
                                    reps=int(set_data.get("reps"))
                                )
                            
                            set_result = user_client.table("workout_exercise_sets").insert({
                                "exercise_id": exercise_id,
                                "set_number": set_index + 1,
                                "weight": set_data.get("weight"),
                                "reps": set_data.get("reps"),
                                "rpe": set_data.get("rpe"),
                                "distance": set_data.get("distance"),
                                "duration": set_data.get("duration"),
                                "estimated_1rm": estimated_1rm,  # NEW
                            }).execute()


                            if not hasattr(set_result, "data") or not set_result.data:
                                raise Exception(f"Failed to create set: No data returned")

            # Fetch the complete workout
            complete_result = user_client.table("workouts") \
                .select("*, workout_exercises(*, workout_exercise_sets(*))") \
                .eq("id", workout_id) \
                .execute()

            if not hasattr(complete_result, "data") or not complete_result.data:
                raise Exception("Failed to fetch created workout")

            # Format the response
            workout = complete_result.data[0]

            # Sort exercises by order_index
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])

            # Sort sets by set_number
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            await self.update_bicep_leaderboard(workout_id, user_id, jwt_token)

            import asyncio
            asyncio.create_task(self._regenerate_user_bundle(user_id, jwt_token))

            logger.info(f"Workout creation complete for ID: {workout_id}")
            return await self.format_response(workout)
        
        except Exception as e:
            logger.error(f"Error creating workout: {str(e)}")
            return await self.handle_error("create_workout", e)
             
    async def update_workout(
        self, workout_id: str, workout_data: Dict[str, Any], jwt_token: str
    ) -> Dict[str, Any]:
        """
        Update an existing workout
        """
        try:
            logger.info(f"Updating workout: {workout_id}")

            user_client = self.get_user_client(jwt_token)
            
            # Update the main workout record - RLS handles user access control
            workout_update_data = {
                "name": workout_data.get("name"),
                "notes": workout_data.get("description") or workout_data.get("notes"),
                "image_id": workout_data.get("image_id"),
                "updated_at": datetime.utcnow().isoformat(),
            }

            workout_result = user_client.table("workouts") \
                .update(workout_update_data) \
                .eq("id", workout_id) \
                .execute()

            if not hasattr(workout_result, "data") or not workout_result.data:
                raise Exception("Failed to update workout")

            # If exercises are provided, replace them entirely
            if workout_data.get("workout_exercises"):
                # Delete existing exercises and sets (cascades)
                existing_exercises = user_client.table("workout_exercises") \
                    .select("id") \
                    .eq("workout_id", workout_id) \
                    .execute()

                if hasattr(existing_exercises, "data") and existing_exercises.data:
                    exercise_ids = [e["id"] for e in existing_exercises.data]

                    # Delete sets first
                    user_client.table("workout_exercise_sets").delete().in_(
                        "exercise_id", exercise_ids
                    ).execute()

                    # Delete exercises
                    user_client.table("workout_exercises").delete().eq(
                        "workout_id", workout_id
                    ).execute()

                # Create new exercises
                for index, exercise in enumerate(workout_data["workout_exercises"]):
                    exercise_name = exercise.get("name")

                    exercise_result = user_client.table("workout_exercises").insert({
                        "workout_id": workout_id,
                        "name": exercise_name,
                        "definition_id": exercise.get("definition_id"),
                        "order_index": exercise.get("order_index", index),
                        "weight_unit": exercise.get("weight_unit", "kg"),
                        "distance_unit": exercise.get("distance_unit", "m"),
                        "notes": exercise.get("notes"),
                    }).execute()

                    if hasattr(exercise_result, "data") and exercise_result.data:
                        exercise_id = exercise_result.data[0]["id"]

                    # Create sets if provided
                    if exercise.get("workout_exercise_sets"):
                        for set_index, set_data in enumerate(exercise["workout_exercise_sets"]):
                            # Calculate e1rm if weight and reps are present
                            estimated_1rm = None
                            if set_data.get("weight") and set_data.get("reps"):
                       
                                estimated_1rm = OneRMCalculator.calculate(
                                    weight=float(set_data.get("weight")),
                                    reps=int(set_data.get("reps"))
                                )
                            
                            user_client.table("workout_exercise_sets").insert({
                                "exercise_id": exercise_id,
                                "set_number": set_index + 1,
                                "weight": set_data.get("weight"),
                                "reps": set_data.get("reps"),
                                "rpe": set_data.get("rpe"),
                                "distance": set_data.get("distance"),
                                "duration": set_data.get("duration"),
                                "estimated_1rm": estimated_1rm,  # NEW
                            }).execute()


            # Return complete updated workout
            complete_result = user_client.table("workouts") \
                .select("*, workout_exercises(*, workout_exercise_sets(*))") \
                .eq("id", workout_id) \
                .execute()

            if not hasattr(complete_result, "data") or not complete_result.data:
                raise Exception("Failed to fetch updated workout")

            workout = complete_result.data[0]

            # Sort exercises and sets
            workout["workout_exercises"].sort(key=lambda x: x["order_index"])
            for exercise in workout["workout_exercises"]:
                exercise["workout_exercise_sets"].sort(key=lambda x: x["set_number"])

            workout_user = workout_result.data[0].get("user_id") if workout_result.data else None
            if workout_user:
                await self.update_bicep_leaderboard(workout_id, workout_user, jwt_token)

            logger.info(f"Successfully updated workout: {workout_id}")
            return await self.format_response(workout)

        except Exception as e:
            logger.error(f"Error updating workout: {str(e)}")
            return await self.handle_error("update_workout", e)
        
    async def update_bicep_leaderboard(self, workout_id: str, user_id: str, jwt_token: str) -> None:
        """
        Check if workout contains bicep PRs and update leaderboard
        """
        try:
            user_client = self.get_user_client(jwt_token)
            
            result = user_client.table("workout_exercises").select(
                "*, workout_exercise_sets(*), exercise_definitions!inner(*)"
            ).eq("workout_id", workout_id).execute()
            
            if not result.data:
                return
            
            # Find bicep exercises
            max_1rm = 0
            best_exercise = None
            
            for exercise in result.data:
                definition = exercise.get("exercise_definitions", {})
                primary_muscles = definition.get("primary_muscles", [])
                
                if "biceps" not in primary_muscles:
                    continue
                
                # Calculate 1RM for each set
                for set_data in exercise.get("workout_exercise_sets", []):
                    weight = set_data.get("weight")
                    reps = set_data.get("reps")
                    
                    if weight and reps:
                        from ...utils.one_rm_calc import OneRMCalculator
                        one_rm = OneRMCalculator.calculate(weight, reps)
                        
                        if one_rm and one_rm > max_1rm:
                            max_1rm = one_rm
                            best_exercise = {
                                "exercise_id": exercise["id"],
                                "definition_id": exercise["definition_id"],
                                "exercise_name": exercise["name"]
                            }
            
            if not best_exercise:
                return
            
            # Check current leaderboard entry
            current = user_client.table("leaderboard_biceps").select("estimated_1rm").eq("user_id", user_id).execute()
            
            # Get workout date
            workout_result = user_client.table("workouts").select("created_at").eq("id", workout_id).execute()
            performed_at = workout_result.data[0]["created_at"] if workout_result.data else datetime.utcnow().isoformat()
            
            if not current.data or max_1rm > current.data[0]["estimated_1rm"]:
                # Update or insert
                entry = {
                    "user_id": user_id,
                    "workout_id": workout_id,
                    "exercise_id": best_exercise["exercise_id"],
                    "definition_id": best_exercise["definition_id"],
                    "exercise_name": best_exercise["exercise_name"],
                    "estimated_1rm": max_1rm,
                    "performed_at": performed_at
                }
                
                user_client.table("leaderboard_biceps").upsert(entry).execute()
                logger.info(f"Updated bicep leaderboard for user {user_id}: {max_1rm} 1RM")
        
        except Exception as e:
            logger.error(f"Error updating leaderboard: {e}")

    async def get_user_workouts_admin(self, user_id: str, days_back: int = 14) -> Dict[str, Any]:
        """Get user workouts using admin client for planning context (no auth required)"""
        try:
            from datetime import datetime, timedelta
            
            from_date = datetime.now() - timedelta(days=days_back)
            logger.info(f"Loading workouts for user {user_id} from {from_date}")
            
            response = self.get_admin_client().table('workouts').select(
                '*, workout_exercises(name, definition_id, workout_exercise_sets(weight, reps, rpe))'
            ).eq('user_id', user_id).gte('created_at', from_date.isoformat()).order('created_at', desc=True).execute()
            
            if response.data:
                logger.info(f"Successfully loaded {len(response.data)} workouts for user {user_id}")
                return {
                    "success": True,
                    "data": response.data
                }
            else:
                logger.info(f"No recent workouts found for user {user_id}")
                return {
                    "success": True,
                    "data": []
                }
                
        except Exception as e:
            logger.error(f"Error fetching workouts for {user_id}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
        
    async def _regenerate_user_bundle(self, user_id: str, jwt_token: str):
        """
        Regenerate user's basic analysis bundle after workout completion.
        Runs in background - errors are logged but don't affect workout creation.
        """
        try:
            logger.info(f"🔄 Triggering basic bundle regeneration for user: {user_id}")
            
            from app.services.workout_analysis.basic.generator import BasicBundleGenerator
            
            generator = BasicBundleGenerator()
            result = await generator.generate_basic_bundle(user_id, jwt_token)
            
            if result.get('success'):
                logger.info(f"✅ Basic bundle regenerated for user {user_id}: {result.get('bundle_id')}")
            else:
                logger.warning(f"⚠️  Bundle regeneration failed for user {user_id}: {result.get('error')}")
                
        except Exception as e:
            logger.error(f"💥 Error regenerating bundle for user {user_id}: {str(e)}", exc_info=True)
