from fastapi import APIRouter, Body, Depends, HTTPException, status
from typing import Dict, Any
from app.core.supabase.auth import get_current_user, get_jwt_token
import logging
from app.services.db.image_service import image_service
from ...core.supabase.client import supabase_factory
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images")

# New TTL endpoints
@router.post("/temp-upload")
async def create_temp_image(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    try:
        logger.info(f"User ID from endpoint: {user.id}")
        logger.info(f"User ID type: {type(user.id)}")
        logger.info(f"JWT token length: {len(jwt_token) if jwt_token else 0}")
        logger.info(f"JWT starts with: {jwt_token[:50] if jwt_token else 'None'}...")
        
        # Try to create user client and see what happens
        user_client = supabase_factory.get_user_client(jwt_token)
        logger.info(f"User client created successfully: {user_client is not None}")
        
        # Try a simple table query instead of auth.get_user()
        try:
            test_result = user_client.table("images").select("count").limit(1).execute()
            logger.info(f"Test query successful: {test_result is not None}")
        except Exception as query_error:
            logger.error(f"Test query failed: {query_error}")
        
        result = await image_service.create_temp_image(
            user_id=user.id,
            file_extension=data.get("file_extension", "jpg"),
            jwt_token=jwt_token
        )
        return result
    
    except Exception as e:
        logger.error(f"Error creating temp image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{image_id}/commit")
async def commit_image(
    image_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Commit a temporary image to permanent status
    """
    try:
        logger.info(f"API request to commit image: {image_id}")
        
        result = await image_service.commit_image(image_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error committing image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{image_id}/url")
async def get_image_url(
    image_id: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Get public URL for an image by ID
    """
    try:
        logger.info(f"API request to get image URL: {image_id}")
        
        result = await image_service.get_image_url(image_id, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error getting image URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Existing endpoints (keeping for backward compatibility)
@router.post("/upload-url")
async def get_image_upload_url(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Get a signed upload URL for image storage
    (Legacy endpoint - consider migrating to /temp-upload)
    """
    try:
        logger.info(f"API request to get image upload URL for user: {user.id}")
        
        result = await image_service.get_upload_url(
            user_id=user.id,
            jwt_token=jwt_token,
            file_extension=data.get("file_extension", "jpg"),
            folder=data.get("folder", "workouts") # allows for different folders later
        )
        return result
    except Exception as e:
        logger.error(f"Error getting upload URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{image_path:path}")
async def delete_image(
    image_path: str,
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Delete an image from storage
    """
    try:
        logger.info(f"API request to delete image: {image_path}")
        
        result = await image_service.delete_image(user.id, image_path, jwt_token)
        return result
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )