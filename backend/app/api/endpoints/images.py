from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from typing import Dict, Any
from app.core.supabase.auth import get_current_user
from app.core.utils.jwt_utils import extract_jwt_from_request
import logging
from app.services.storage.image_service import ImageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images")

# New TTL endpoints
@router.post("/temp-upload")
async def create_temp_image(
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a temporary image record and get upload URL
    """
    try:
        logger.info(f"API request to create temp image for user: {user.id}")
        
        jwt_token = extract_jwt_from_request(request)
        image_service = ImageService(jwt_token=jwt_token)
        result = await image_service.create_temp_image(
            user_id=user.id,
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
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Commit a temporary image to permanent status
    """
    try:
        logger.info(f"API request to commit image: {image_id}")
        
        jwt_token = extract_jwt_from_request(request)
        image_service = ImageService(jwt_token=jwt_token)
        result = await image_service.commit_image(image_id)
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
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get public URL for an image by ID
    """
    try:
        logger.info(f"API request to get image URL: {image_id}")
        
        jwt_token = extract_jwt_from_request(request)
        image_service = ImageService(jwt_token=jwt_token)
        result = await image_service.get_image_url(image_id)
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
    request: Request,
    data: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a signed upload URL for image storage
    (Legacy endpoint - consider migrating to /temp-upload)
    """
    try:
        logger.info(f"API request to get image upload URL for user: {user.id}")
        
        jwt_token = extract_jwt_from_request(request)
        image_service = ImageService(jwt_token=jwt_token)
        result = await image_service.get_upload_url(
            user_id=user.id,
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
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete an image from storage
    """
    try:
        logger.info(f"API request to delete image: {image_path}")
        
        jwt_token = extract_jwt_from_request(request)
        image_service = ImageService(jwt_token=jwt_token)
        result = await image_service.delete_image(user.id, image_path)
        return result
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )