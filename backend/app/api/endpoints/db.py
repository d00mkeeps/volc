from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from typing import Dict, Any
from app.core.supabase.auth import get_current_user
import logging
from app.services.db.graph_bundle_service import GraphBundleService
from app.services.db.workout_service import WorkoutService
from app.services.db.conversation_service import ConversationService
from app.services.db.exercise_definition_service import ExerciseDefinitionService
from app.services.db.user_profile_service import UserProfileService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/db")

@router.get("/health")
async def health_check():
    """
    Basic health check endpoint to verify the API is running
    """
    return {"status": "ok", "service": "db-api"}    

@router.get("/workouts/templates")
async def get_templates(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all workout templates for a user
    """
    try:
        logger.info(f"API request to get workout templates for user: {user.id}")
        
        workout_service = WorkoutService()
        result = await workout_service.get_templates(user.id)
        
        return result
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.get("/graph-bundles")
async def get_graph_bundles(
    conversation_id: str, 
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all graph bundles for a conversation
    """
    try:
        logger.info(f"API request to get graph bundles for conversation: {conversation_id}")
        
        graph_bundle_service = GraphBundleService()
        bundles = await graph_bundle_service.get_bundles_by_conversation(user.id, conversation_id)
        
        logger.info(f"Retrieved {len(bundles)} graph bundles for conversation: {conversation_id}")
        return bundles
    except Exception as e:
        logger.error(f"Error getting graph bundles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/graph-bundles")
async def save_graph_bundle(
    bundle: Dict[str, Any],
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Save a graph bundle
    """
    try:
        logger.info(f"API request to save graph bundle for conversation: {bundle.get('conversationId')}")
        
        graph_bundle_service = GraphBundleService()
        result = await graph_bundle_service.save_graph_bundle(user.id, bundle)
        
        return result
    except Exception as e:
        logger.error(f"Error saving graph bundle: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/graph-bundles/{bundle_id}")
async def delete_graph_bundle(
    bundle_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a graph bundle
    """
    try:
        logger.info(f"API request to delete graph bundle: {bundle_id}")
        
        graph_bundle_service = GraphBundleService()
        result = await graph_bundle_service.delete_graph_bundle(user.id, bundle_id)
        
        return result
    except Exception as e:
        logger.error(f"Error deleting graph bundle: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/graph-bundles/conversation/{conversation_id}")
async def delete_conversation_bundles(
    conversation_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete all graph bundles for a conversation
    """
    try:
        logger.info(f"API request to delete all graph bundles for conversation: {conversation_id}")
        
        graph_bundle_service = GraphBundleService()
        result = await graph_bundle_service.delete_conversation_bundles(user.id, conversation_id)
        
        return result
    except Exception as e:
        logger.error(f"Error deleting conversation bundles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.post("/workouts")
async def create_workout(
    workout: Dict[str, Any],
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new workout
    """
    try:
        logger.info(f"API request to create workout: {workout.get('name')}")
        
        workout_service = WorkoutService()
        result = await workout_service.create_workout(user.id, workout)
        
        return result
    except Exception as e:
        logger.error(f"Error creating workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
# In app/api/endpoints/db.py
# Place this BEFORE the /workouts/{workout_id} route

@router.get("/workouts/user")
async def get_user_workouts(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all workouts for a user (not filtered by conversation)
    """
    try:
        logger.info(f"API request to get all workouts for user: {user.id}")
        
        workout_service = WorkoutService()
        result = await workout_service.get_user_workouts(user.id)
        
        logger.info(f"Retrieved {len(result)} workouts for user: {user.id}")
        return result
    except Exception as e:
        logger.error(f"Error getting user workouts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.get("/workouts/{workout_id}")
async def get_workout(
    workout_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a workout by ID
    """
    try:
        logger.info(f"API request to get workout: {workout_id}")
        
        workout_service = WorkoutService()
        result = await workout_service.get_workout(workout_id)
        
        # Check if the workout belongs to the user
        if result["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this workout"
            )
        
        return result
    except Exception as e:
        logger.error(f"Error getting workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/workouts")
async def get_workouts_by_conversation(
    conversation_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all workouts for a specific conversation
    """
    try:
        logger.info(f"API request to get workouts for conversation: {conversation_id}")
        
        workout_service = WorkoutService()
        result = await workout_service.get_workouts_by_conversation(user.id, conversation_id)
        
        return result
    except Exception as e:
        logger.error(f"Error getting workouts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
# Add these to your existing FastAPI router

@router.post("/workouts/template")
async def save_workout_as_template(
    request: Request,

    user: Dict[str, Any] = Depends(get_current_user)
,
    workout: Dict[str, Any] = Body(...),
):
    """
    Save a workout as a template
    """
    try:
        logger.info(f"API request to save workout as template: {workout.get('id')}")
        
        workout_service = WorkoutService()
        result = await workout_service.save_as_template(user.id, workout)
        
        return result
    except Exception as e:
        logger.error(f"Error saving workout as template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.delete("/workouts/{workout_id}")
async def delete_workout(
    workout_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a workout
    """
    try:
        logger.info(f"API request to delete workout: {workout_id}")
        
        workout_service = WorkoutService()
        
        # First get the workout to verify ownership
        workout = await workout_service.get_workout(workout_id)
        if workout["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this workout"
            )
        
        result = await workout_service.delete_workout(workout_id)
        
        return result
    except Exception as e:
        logger.error(f"Error deleting workout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/workouts/conversation/{conversation_id}")
async def delete_conversation_workouts(
    conversation_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete all workouts for a conversation
    """
    try:
        logger.info(f"API request to delete all workouts for conversation: {conversation_id}")
        
        workout_service = WorkoutService()
        result = await workout_service.delete_conversation_workouts(user.id, conversation_id)
        
        return result
    except Exception as e:
        logger.error(f"Error deleting conversation workouts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/workouts/template/{template_id}")
async def update_template_usage(
    template_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update the used_as_template timestamp for a workout
    """
    try:
        logger.info(f"API request to update template usage for workout: {template_id}")
        
        workout_service = WorkoutService()
        
        # First get the template to verify ownership
        template = await workout_service.get_workout(template_id)
        if template["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this template"
            )
        
        result = await workout_service.update_template_usage(template_id)
        
        return result
    except Exception as e:
        logger.error(f"Error updating template usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
@router.post("/conversations")
async def create_conversation(
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new conversation with the first message
    """
    try:
        logger.info(f"API request to create conversation: {data.get('title')}")
        
        conversation_service = ConversationService()
        result = await conversation_service.create_conversation(
            user.id, 
            data.get("title"), 
            data.get("firstMessage"), 
            data.get("configName")
        )
        
        return result
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/conversations/onboarding")
async def create_onboarding_conversation(
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create an onboarding conversation with a specific ID
    """
    try:
        logger.info(f"API request to create onboarding conversation")
        
        conversation_service = ConversationService()
        result = await conversation_service.create_onboarding_conversation(
            user.id, 
            data.get("sessionId"), 
            data.get("configName")
        )
        
        return result
    except Exception as e:
        logger.error(f"Error creating onboarding conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a conversation by ID
    """
    try:
        logger.info(f"API request to get conversation: {conversation_id}")
        
        conversation_service = ConversationService()
        result = await conversation_service.get_conversation(conversation_id)
        
        # Check if the conversation belongs to the user
        if result["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this conversation"
            )
        
        return result
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all messages for a conversation
    """
    try:
        logger.info(f"API request to get messages for conversation: {conversation_id}")
        
        # First, verify the conversation belongs to the user
        conversation_service = ConversationService()
        conversation = await conversation_service.get_conversation(conversation_id)
        
        if conversation["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this conversation"
            )
        
        # Get messages
        messages = await conversation_service.get_conversation_messages(conversation_id)
        
        return messages
    except Exception as e:
        logger.error(f"Error getting conversation messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/conversations")
async def get_user_conversations(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all active conversations for a user
    """
    try:
        logger.info(f"API request to get active conversations for user: {user.id}")
        
        # Create service with additional logging
        logger.info("Creating ConversationService instance")
        conversation_service = ConversationService()
        
        # Explicitly log the Supabase client status
        supabase = conversation_service.supabase
        logger.info(f"Supabase client available: {hasattr(supabase, 'client')}")
        
        try:
            # Explicitly test the client
            test_result = supabase.client.table('conversations').select('count').limit(1).execute()
            logger.info("Supabase client test query successful")
        except Exception as e:
            logger.error(f"Supabase client test query failed: {str(e)}")
        
        # Attempt to get conversations
        logger.info("Calling get_user_conversations method")
        result = await conversation_service.get_user_conversations(user.id)
        
        # Check if we got an error response
        if isinstance(result, dict) and result.get('error'):
            error_msg = result.get('error')
            logger.error(f"Error response from service: {error_msg}")
            
            # If API key error, try direct query
            if "API key is required" in error_msg:
                logger.info("API key error detected, trying direct query")
                
                # Direct import to get a fresh client

                # direct_client = SupabaseClient()
                
                # # Try direct query
                # direct_result = direct_client.client.table("conversations") \
                #     .select("*") \
                #     .eq("user_id", user.id) \
                #     .eq("status", "active") \
                #     .neq("config_name", "onboarding") \
                #     .order("updated_at", {"ascending": False}) \
                #     .execute()
                
                conversations = []
                logger.info(f"Direct query retrieved {len(conversations)} conversations, maybe start debugging?")
                return conversations
            
            # If not an API key error, return a proper error response
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        logger.info(f"Retrieved {len(result)} active conversations for user: {user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error getting user conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Soft delete a conversation by setting status to 'deleted'
    """
    try:
        logger.info(f"API request to delete conversation: {conversation_id}")
        
        # First, verify the conversation belongs to the user
        conversation_service = ConversationService()
        conversation = await conversation_service.get_conversation(conversation_id)
        
        if conversation["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this conversation"
            )
        
        result = await conversation_service.delete_conversation(conversation_id)
        
        return result
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/conversations/{conversation_id}/messages")
async def save_message(
    conversation_id: str,
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Save a message to a conversation
    """
    try:
        logger.info(f"API request to save message to conversation: {conversation_id}")
        
        # First, verify the conversation belongs to the user
        conversation_service = ConversationService()
        conversation = await conversation_service.get_conversation(conversation_id)
        
        if conversation["user_id"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this conversation"
            )
        
        result = await conversation_service.save_message(
            conversation_id,
            data.get("content"),
            data.get("sender")
        )
        
        return result
    except Exception as e:
        logger.error(f"Error saving message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/exercise-definitions")
async def get_all_exercise_definitions(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all exercise definitions
    """
    try:
        logger.info("API request to get all exercise definitions")
        
        exercise_definition_service = ExerciseDefinitionService()
        result = await exercise_definition_service.get_all_exercise_definitions()
        
        return result
    except Exception as e:
        logger.error(f"Error getting exercise definitions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/exercise-definitions")
async def create_exercise_definition(
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new exercise definition
    """
    try:
        logger.info(f"API request to create exercise definition: {data.get('standard_name')}")
        
        exercise_definition_service = ExerciseDefinitionService()
        result = await exercise_definition_service.create_exercise_definition(data)
        
        return result
    except Exception as e:
        logger.error(f"Error creating exercise definition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/exercise-definitions/{definition_id}")
async def get_exercise_definition_by_id(
    definition_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get an exercise definition by ID
    """
    try:
        logger.info(f"API request to get exercise definition: {definition_id}")
        
        exercise_definition_service = ExerciseDefinitionService()
        result = await exercise_definition_service.get_exercise_definition_by_id(definition_id)
        
        return result
    except Exception as e:
        logger.error(f"Error getting exercise definition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.get("/user-profile")
async def get_user_profile(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get the current user's profile
    """
    try:
        logger.info(f"API request to get profile for user: {user.id}")
        
        user_profile_service = UserProfileService()
        result = await user_profile_service.get_user_profile(user.id)
        
        if not result:
            # Return empty object rather than 404 to simplify client handling
            return {}
        
        return result
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/user-profile")
async def save_user_profile(
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Save or update the current user's profile
    """
    try:
        logger.info(f"API request to save profile for user: {user.id}")
        
        user_profile_service = UserProfileService()
        result = await user_profile_service.save_user_profile(user.id, data)
        
        return result
    except Exception as e:
        logger.error(f"Error saving user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )