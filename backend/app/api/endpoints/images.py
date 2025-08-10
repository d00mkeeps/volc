from fastapi import APIRouter, Body, Depends, HTTPException, status
from typing import Dict, Any
from app.core.supabase.auth import get_current_user, get_jwt_token
import logging
from app.services.storage.image_service import image_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images")

# New TTL endpoints
@router.post("/temp-upload")
async def create_temp_image(
    data: Dict[str, Any] = Body(...),
    user = Depends(get_current_user),
    jwt_token: str = Depends(get_jwt_token)
):
    """
    Create a temporary image record and get upload URL
    """
    try:
        logger.info(f"API request to create temp image for user: {user.id}")
        
        result = await image_service.create_temp_image(
            user_id=user.id,
            jwt_token=jwt_token,
            file_extension=data.get("file_extension", "jpg")
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