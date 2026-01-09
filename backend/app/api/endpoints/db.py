from fastapi import APIRouter, Body, Depends, HTTPException, status
from typing import Dict, Any
from app.core.supabase.auth import get_current_user, get_jwt_token
import logging
from app.core.rate_limit import rate_limit

from app.services.db.analysis_service import AnalysisBundleService
from app.services.db.workout_service import WorkoutService
from app.services.db.conversation_service import ConversationService
from app.services.db.exercise_definition_service import ExerciseDefinitionService
from app.services.db.user_profile_service import UserProfileService
from app.services.db.message_service import MessageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/db")

conversation_service = ConversationService()
analysis_bundle_service = AnalysisBundleService()
workout_service = WorkoutService()
exercise_definition_service = ExerciseDefinitionService()
user_profile_service = UserProfileService()
message_service = MessageService()

@router.get("/health")
async def health_check():
    """Basic health check endpoint to verify the API is running"""
    return {"status": "ok", "service": "db-api"}    

@router.get("/exercise-definitions")
async def get_exercise_definitions(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get all exercise definitions"""
    try:
        result = await exercise_definition_service.get_all_exercise_definitions(jwt_token)
        return result.get("data", []) if result.get("success") else []
    except Exception as e:
        logger.error(f"Error getting exercise definitions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/workouts/templates")
async def get_templates(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get all workout templates for a user"""
    try:
        logger.info(f"API request to get workout templates for user: {user.id}")
        result = await workout_service.get_templates(user, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user-context/latest")
async def get_latest_user_context(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get the latest completed user context bundle"""
    try:
        logger.info(f"API request to get latest user context for user: {user.id}")
        result = await analysis_bundle_service.get_latest_analysis_bundle(user.id, jwt_token)
        
        if result.get("success"):
            return result.get("data")
        else:
            # It's okay if no bundle exists yet
            return None
            
    except Exception as e:
        logger.error(f"Error getting latest user context: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/analysis-bundles")
async def get_analysis_bundles(
    conversation_id: str, 
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get all analysis bundles for a conversation"""
    try:
        logger.info(f"API request to get analysis bundles for conversation: {conversation_id}")
        result = await analysis_bundle_service.get_bundles_by_conversation(conversation_id, jwt_token)
        
        if result.get("success"):
            bundles = result.get("data", [])
            logger.info(f"Retrieved {len(bundles)} analysis bundles for conversation: {conversation_id}")
            return bundles
        else:
            raise Exception(result.get("error", "Unknown error"))
            
    except Exception as e:
        logger.error(f"Error getting analysis bundles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/analysis-bundles/{bundle_id}")
async def delete_analysis_bundle(
    bundle_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Delete analysis bundle"""
    try:
        logger.info(f"API request to delete analysis bundle: {bundle_id}")
        result = await analysis_bundle_service.delete_analysis_bundle(bundle_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error deleting analysis bundle: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Delete a conversation"""
    try:
        logger.info(f"API request to delete conversation: {conversation_id}")
        # This line needs to be: conversation_service.delete_conversation(conversation_id, user, jwt_token)
        result = await conversation_service.delete_conversation(conversation_id, user, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.delete("/analysis-bundles/conversation/{conversation_id}")
async def delete_conversation_bundles(
    conversation_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Delete all analysis bundles for a conversation"""
    try:
        logger.info(f"API request to delete all analysis bundles for conversation: {conversation_id}")
        result = await analysis_bundle_service.delete_conversation_bundles(conversation_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error deleting conversation bundles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    

@router.post("/account/delete")
async def delete_user_account(
    confirmation: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Delete the current user's account permanently"""
    try:
        # Validate confirmation
        if not confirmation.get("confirmed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account deletion must be confirmed"
            )
        
        if confirmation.get("typed_confirmation") != "DELETE MY ACCOUNT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid confirmation text"
            )
        
        logger.info(f"API request to delete account for user: {user.id}")
        result = await user_profile_service.delete_user_account(user.id, jwt_token)
        
        if not result.get("success"):
            raise Exception(result.get("error", "Account deletion failed"))
        
        logger.info(f"Account successfully deleted for user: {user.id}")
        return {
            "success": True,
            "message": "Account deleted successfully",
            "data": result.get("data")
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        logger.error(f"Error deleting user account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.post("/workouts")
@rate_limit("workout_create") 
async def create_workout(
    workout: Dict[str, Any],
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Create a new workout"""
    try:
        logger.info(f"API request to create workout: {workout.get('name')}")
        result = await workout_service.create_workout(user.id, workout, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error creating workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/workouts/user")
async def get_user_workouts(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get all workouts for a user (not filtered by conversation)"""
    try:
        logger.info(f"API request to get all workouts for user: {user.id}")
        result = await workout_service.get_user_workouts(user, jwt_token)
        
        if isinstance(result, list):
            logger.info(f"Retrieved {len(result)} workouts for user: {user.id}")
            return result
        else:
            # Handle error response format
            if result.get("success") == False:
                raise Exception(result.get("error", "Unknown error"))
            return result.get("data", [])
            
    except Exception as e:
        logger.error(f"Error getting user workouts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/workouts/{workout_id}")
async def get_workout(
    workout_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get a workout by ID"""
    try:
        logger.info(f"API request to get workout: {workout_id}")
        result = await workout_service.get_workout(workout_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error getting workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/workouts/{workout_id}")
async def update_workout(
    workout_id: str,
    workout: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Update an existing workout"""
    try:
        logger.info(f"API request to update workout: {workout_id}")
        result = await workout_service.update_workout(workout_id, workout, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error updating workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/workouts/{workout_id}")
async def delete_workout(
    workout_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Delete a workout"""
    try:
        logger.info(f"API request to delete workout: {workout_id}")
        result = await workout_service.delete_workout(workout_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error deleting workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/workouts/public/{workout_id}")
async def get_public_workout(
    workout_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get a workout by ID with admin privileges (for leaderboard viewing)"""
    try:
        logger.info(f"API request to get public workout: {workout_id}")
        result = await workout_service.get_public_workout(workout_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error getting public workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.put("/workouts/template/{template_id}")
async def update_template_usage(
    template_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Update the used_as_template timestamp for a workout"""
    try:
        logger.info(f"API request to update template usage for workout: {template_id}")
        result = await workout_service.update_template_usage(template_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error updating template usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/conversations")
async def create_conversation(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Create a new conversation with the first message"""
    try:
        logger.info(f"API request to create conversation: {data.get('title')}")
        result = await conversation_service.create_conversation(
            data.get("title"), 
            data.get("configName"),
            user,
            jwt_token
        )
        return result
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/conversations/with-messages")
async def create_conversation_with_messages(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Create a new conversation with initial messages"""
    try:
        logger.info(f"API: Creating conversation with messages - {data.get('title')}")
        
        result = await conversation_service.create_conversation_with_messages(
            title=data.get("title"),
            config_name=data.get("configName"),
            messages=data.get("messages", []),
            user=user,
            jwt_token=jwt_token
        )
        
        return result
        
    except Exception as e:
        logger.error(f"API error creating conversation with messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/conversations")
async def get_user_conversations(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get all active conversations for a user"""
    try:
        logger.info(f"API request to get active conversations for user: {user.id}")
        result = await conversation_service.get_user_conversations(user, jwt_token)
        
        if result.get("success"):
            conversations = result.get("data", [])
            logger.info(f"Retrieved {len(conversations)} active conversations for user: {user.id}")
            return conversations
        else:
            raise Exception(result.get("error", "Unknown error"))
            
    except Exception as e:
        logger.error(f"Error getting user conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get all messages for a conversation"""
    try:
        logger.info(f"API request to get messages for conversation: {conversation_id}")
        result = await message_service.get_conversation_messages(conversation_id, jwt_token)
        
        if result.get("success"):
            return result.get("data", [])
        else:
            raise Exception(result.get("error", "Unknown error"))
            
    except Exception as e:
        logger.error(f"Error getting conversation messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/conversations/{conversation_id}/messages")
async def save_message(
    conversation_id: str,
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Save a message to a conversation"""
    try:
        logger.info(f"API request to save message to conversation: {conversation_id}")
        result = await message_service.save_message(
            conversation_id,
            data.get("content"),
            data.get("sender"),
            jwt_token
        )
        return result
    except Exception as e:
        logger.error(f"Error saving message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user-profile")
async def get_user_profile(
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Get the current user's profile"""
    try:
        logger.info(f"API request to get profile for user: {user.id}")
        result = await user_profile_service.get_user_profile(user.id, jwt_token)
        
        if result.get("success"):
            profile_data = result.get("data")
            return profile_data if profile_data else {}
        else:
            # Return empty object rather than error for missing profiles
            return {}
            
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/user-profile")
async def save_user_profile(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Save or update the current user's profile"""
    try:
        logger.info(f"API request to save profile for user: {user.id}")
        result = await user_profile_service.save_user_profile(user.id, data, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error saving user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)

        )

@router.post("/user-profile/onboarding")
async def complete_onboarding(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """Complete user onboarding"""
    try:
        logger.info(f"API request to complete onboarding for user: {user.id}")
        result = await user_profile_service.complete_onboarding(user.id, data, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )