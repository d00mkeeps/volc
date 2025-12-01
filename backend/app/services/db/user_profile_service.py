from app.services.db.base_service import BaseDBService
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class UserProfileService(BaseDBService):
    """
    Service for handling user profile operations in the database
    """
    

    

    async def save_user_profile_admin(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save user profile using admin client (no auth required) - for backend operations"""
        try:
            logger.info(f"Saving profile for user {user_id} (admin)")
            
            # Map profile data to database fields
            user_profile = {}
            
            if "first_name" in profile_data:
                user_profile["first_name"] = profile_data["first_name"]
            if "last_name" in profile_data:
                user_profile["last_name"] = profile_data["last_name"]
            if "age" in profile_data:
                user_profile["age"] = profile_data["age"]
            if "is_imperial" in profile_data:
                user_profile["is_imperial"] = profile_data["is_imperial"]
            if "goals" in profile_data:
                user_profile["goals"] = profile_data["goals"]
            if "current_stats" in profile_data:
                user_profile["current_stats"] = profile_data["current_stats"]
            if "preferences" in profile_data:
                user_profile["preferences"] = profile_data["preferences"]
            if "avatar_image_id" in profile_data:
                user_profile["avatar_image_id"] = profile_data["avatar_image_id"]
            if "instagram_username" in profile_data:
                user_profile["instagram_username"] = profile_data["instagram_username"]
            if "training_history" in profile_data:
                user_profile["training_history"] = profile_data["training_history"]
            if "bio" in profile_data:
                user_profile["bio"] = profile_data["bio"]
            if "ai_memory" in profile_data:
                user_profile["ai_memory"] = profile_data["ai_memory"]
            
            # Check if profile exists first
            admin_client = self.get_admin_client()
            existing_profile = admin_client.table("user_profiles") \
                .select("auth_user_uuid") \
                .eq("auth_user_uuid", user_id) \
                .execute()
            
            profile_exists = hasattr(existing_profile, 'data') and existing_profile.data
            
            if profile_exists:
                # Profile exists - UPDATE
                result = admin_client.table("user_profiles") \
                    .update(user_profile) \
                    .eq("auth_user_uuid", user_id) \
                    .execute()
                    
                if not hasattr(result, 'data'):
                    raise Exception("Failed to update user profile: No data returned")
            else:
                # Profile doesn't exist - INSERT
                logger.info(f"No existing profile found for user {user_id}, creating new profile")
                user_profile["auth_user_uuid"] = user_id
                
                result = admin_client.table("user_profiles") \
                    .insert(user_profile) \
                    .execute()
                
                if not hasattr(result, 'data') or not result.data:
                    raise Exception("Failed to create user profile: No data returned")
            
            # Fetch the saved profile
            profile_result = admin_client.table("user_profiles") \
                .select("*") \
                .eq("auth_user_uuid", user_id) \
                .execute()
            
            if not hasattr(profile_result, 'data') or not profile_result.data:
                raise Exception("Failed to fetch saved user profile")
            
            logger.info(f"Successfully saved profile for user {user_id} (admin)")
            return {
                "success": True,
                "data": profile_result.data[0]
            }
            
        except Exception as e:
            logger.error(f"Error saving user profile (admin) for {user_id}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def save_user_profile(self, user_id: str, profile_data: Dict[str, Any], jwt_token: str) -> Dict[str, Any]:
        """
        Save or update a user's profile information
        """
        try:
            logger.info(f"Saving profile for user: {user_id}")
            
       
            user_profile = {}
            
            # Map frontend UserProfile fields to database fields
            if "first_name" in profile_data:
                user_profile["first_name"] = profile_data["first_name"]
            if "avatar_image_id" in profile_data:
                user_profile["avatar_image_id"] = profile_data["avatar_image_id"]
            if "age" in profile_data:
                user_profile["age"] = profile_data["age"]
            if "last_name" in profile_data:
                user_profile["last_name"] = profile_data["last_name"]
            if "is_imperial" in profile_data:
                user_profile["is_imperial"] = profile_data["is_imperial"]
            if "instagram_username" in profile_data:
                user_profile["instagram_username"] = profile_data["instagram_username"]
            if "goals" in profile_data: 
                user_profile["goals"] = profile_data["goals"]
            if "current_stats" in profile_data:
                user_profile["current_stats"] = profile_data["current_stats"]
            if "preferences" in profile_data:
                user_profile["preferences"] = profile_data["preferences"]
            if "training_history" in profile_data:
                user_profile["training_history"] = profile_data["training_history"]
            if "bio" in profile_data:
                user_profile["bio"] = profile_data["bio"]
            
            # Update the user profile - RLS handles user filtering
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("user_profiles") \
                .update(user_profile) \
                .eq("auth_user_uuid", user_id) \
                .execute()
                
            if not hasattr(result, 'data') or not result.data:
                # If update didn't affect any rows, the profile might not exist yet, so try insert
                logger.info(f"No existing profile found for user {user_id}, attempting to create")
                
                # Add the user ID to the profile data for insert (business logic requirement)
                user_profile["auth_user_uuid"] = user_id
                
                result = user_client.table("user_profiles") \
                    .insert(user_profile) \
                    .execute()
                    
                if not hasattr(result, 'data') or not result.data:
                    raise Exception("Failed to create user profile: No data returned")
            
            # Fetch the updated profile - RLS handles user filtering
            profile_result = user_client.table("user_profiles") \
                .select("*") \
                .execute()
                
            if not hasattr(profile_result, 'data') or not profile_result.data:
                raise Exception("Failed to fetch updated user profile")
                
            logger.info(f"Successfully saved profile for user: {user_id}")
            return await self.format_response(profile_result.data[0])
            
        except Exception as e:
            logger.error(f"Error saving user profile: {str(e)}")
            return await self.handle_error("save_user_profile", e)


    async def get_user_profile(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get a user's profile information
        """
        try:
            logger.info(f"Getting profile for user: {user_id}")
            
            # RLS handles user filtering - no need to filter by auth_user_uuid
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("user_profiles") \
                .select("*") \
                .execute()
                
            if not hasattr(result, 'data') or not result.data or len(result.data) == 0:
                logger.info(f"No profile found for user: {user_id}")
                return await self.format_response(None)
                
            logger.info(f"Successfully retrieved profile for user: {user_id}")
            return await self.format_response(result.data[0])
            
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return await self.handle_error("get_user_profile", e)
        

    async def delete_user_account(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """Delete user account and all associated data"""
        try:
            logger.info(f"Deleting account for user: {user_id}")
            
            # Call our secure deletion function
            user_client = self.get_user_client(jwt_token)
            result = user_client.rpc('delete_user_account', {
                'user_uuid': user_id
            }).execute()
            
            if not hasattr(result, 'data') or not result.data:
                raise Exception("Account deletion failed: No response from database")
                
            deletion_result = result.data[0] if isinstance(result.data, list) else result.data
            
            logger.info(f"Successfully deleted account for user: {user_id}")
            return await self.format_response(deletion_result)
            
        except Exception as e:
            logger.error(f"Error deleting user account: {str(e)}")
            return await self.handle_error("delete_user_account", e)

    async def get_user_profile_admin(self, user_id: str) -> Dict[str, Any]:
        """Get user profile by user ID using admin client (no auth required)"""
        try:
            response = self.get_admin_client().table('user_profiles').select(
                'user_id, first_name, last_name, age, is_imperial, goals, current_stats, preferences, instagram_username, ai_memory'
            ).eq('auth_user_uuid', user_id).execute()
            
            if response.data:
                logger.info(f"Successfully loaded profile for user {user_id}")
                return {
                    "success": True,
                    "data": response.data[0]
                }
            else:
                logger.warning(f"No profile found for user {user_id}")
                return {
                    "success": False,
                    "error": "User profile not found"
                }
                
        except Exception as e:
            logger.error(f"Error fetching user profile for {user_id}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }