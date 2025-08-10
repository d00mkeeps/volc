from app.services.db.base_service import BaseDBService
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Age group mapping
AGE_GROUP_MAP = {
    "18-24": 1,
    "25-34": 2,
    "35-44": 3,
    "45-54": 4,
    "55-64": 5,
    "65+": 6
}

class UserProfileService(BaseDBService):
    """
    Service for handling user profile operations in the database
    """
    
    def __init__(self, jwt_token: Optional[str] = None):
        super().__init__(jwt_token)
    
    def map_age_group_to_number(self, age_group: str) -> int:
        """
        Map an age group string to its corresponding number value
        """
        if age_group not in AGE_GROUP_MAP:
            raise ValueError(f"Invalid age group: {age_group}")
        
        return AGE_GROUP_MAP[age_group]
    
    async def save_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save or update a user's profile information
        """
        try:
            logger.info(f"Saving profile for user: {user_id}")
            
            # Extract from the onboarding data format and convert to database format
            user_profile = {
                "first_name": profile_data.get("personalInfo", {}).get("firstName"),
                "last_name": profile_data.get("personalInfo", {}).get("lastName"),
                "is_imperial": profile_data.get("personalInfo", {}).get("preferredUnits") == "imperial",
                "goal": profile_data.get("goal"),
                "training_history": profile_data.get("fitnessBackground")
            }
            
            # Get age group and convert to number if present
            age_group = profile_data.get("personalInfo", {}).get("ageGroup")
            if age_group:
                try:
                    user_profile["age_group"] = self.map_age_group_to_number(age_group)
                except ValueError as e:
                    logger.warning(f"Invalid age group: {age_group}")
                    # We'll continue without the age group rather than failing the entire operation
            
            # Update the user profile - RLS handles user filtering
            result = self.supabase.table("user_profiles") \
                .update(user_profile) \
                .eq("auth_user_uuid", user_id) \
                .execute()
                
            if not hasattr(result, 'data') or not result.data:
                # If update didn't affect any rows, the profile might not exist yet, so try insert
                logger.info(f"No existing profile found for user {user_id}, attempting to create")
                
                # Add the user ID to the profile data for insert (business logic requirement)
                user_profile["auth_user_uuid"] = user_id
                
                result = self.supabase.table("user_profiles") \
                    .insert(user_profile) \
                    .execute()
                    
                if not hasattr(result, 'data') or not result.data:
                    raise Exception("Failed to create user profile: No data returned")
            
            # Fetch the updated profile - RLS handles user filtering
            profile_result = self.supabase.table("user_profiles") \
                .select("*") \
                .execute()
                
            if not hasattr(profile_result, 'data') or not profile_result.data:
                raise Exception("Failed to fetch updated user profile")
                
            logger.info(f"Successfully saved profile for user: {user_id}")
            return profile_result.data[0]
            
        except Exception as e:
            logger.error(f"Error saving user profile: {str(e)}")
            return await self.handle_error("save_user_profile", e)
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get a user's profile information
        """
        try:
            logger.info(f"Getting profile for user: {user_id}")
            
            # RLS handles user filtering - no need to filter by auth_user_uuid
            result = self.supabase.table("user_profiles") \
                .select("*") \
                .execute()
                
            if not hasattr(result, 'data') or not result.data or len(result.data) == 0:
                logger.info(f"No profile found for user: {user_id}")
                return None
                
            logger.info(f"Successfully retrieved profile for user: {user_id}")
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return await self.handle_error("get_user_profile", e)