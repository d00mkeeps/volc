import uuid
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from app.core.supabase.client import SupabaseClient

logger = logging.getLogger(__name__)

class ImageService:
    """
    Service for handling image storage operations with TTL support
    """
    
    def __init__(self):
        self.supabase = SupabaseClient()
        self.bucket_name = "images"
    
    async def create_temp_image(self, user_id: str, file_extension: str = "jpg") -> Dict[str, Any]:
        """
        Create temporary image record and upload URL
        """
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_path = f"images/{user_id}/{file_id}.{file_extension}"
            
            logger.info(f"Creating temp image record for path: {file_path}")
            
            # Create temp record with 24h expiry
            expires_at = datetime.utcnow() + timedelta(hours=24)
            
            image_result = self.supabase.table("images").insert({
                "file_path": file_path,
                "user_id": user_id,
                "status": "temporary",
                "expires_at": expires_at.isoformat()
            }).execute()
            
            if not hasattr(image_result, "data") or not image_result.data:
                raise Exception("Failed to create image record")
            
            # Get signed URL for upload
            signed_url = self.supabase.client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)   

            if signed_url.get('error'):
                raise Exception(f"Failed to create signed URL: {signed_url['error']}")
            
            image_id = image_result.data[0]["id"]
            logger.info(f"Created temp image record with ID: {image_id}")
            
            return {
                "success": True,
                "image_id": image_id,
                "upload_url": signed_url['data']['signedUrl'],
                "file_path": file_path,
            }
            
        except Exception as e:
            logger.error(f"Error creating temp image: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def commit_image(self, image_id: str) -> Dict[str, Any]:
        """
        Make temp image permanent
        """
        try:
            logger.info(f"Committing image to permanent: {image_id}")
            
            result = self.supabase.table("images").update({
                "status": "permanent",
                "expires_at": None,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", image_id).execute()
            
            if not hasattr(result, "data") or not result.data:
                raise Exception("Failed to commit image")
            
            logger.info(f"Successfully committed image: {image_id}")
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error committing image: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_image_url(self, image_id: str) -> Dict[str, Any]:
        """
        Get public URL for image by ID
        """
        try:
            logger.info(f"Getting image URL for ID: {image_id}")
            
            result = self.supabase.table("images").select("file_path").eq("id", image_id).execute()
            
            if not hasattr(result, "data") or not result.data:
                raise Exception("Image not found")
            
            file_path = result.data[0]["file_path"]
            public_url = self.get_public_url(file_path)
            
            return {
                "success": True,
                "url": public_url
            }
            
        except Exception as e:
            logger.error(f"Error getting image URL: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # Keep existing methods for backward compatibility
    async def get_upload_url(
        self,
        user_id: str,
        file_extension: str = "jpg",
        folder: str = "workouts"
    ) -> Dict[str, Any]:
        """
        Generate a signed upload URL for direct client upload to Supabase storage
        (Legacy method - consider migrating to create_temp_image)
        """
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_path = f"{folder}/{user_id}/{file_id}.{file_extension}"
            logger.info(f"Generating upload URL for path: {file_path}")
            
            # Create signed upload URL (expires in 1 hour)
            signed_url = self.supabase.client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)
            
            if signed_url.get('error'):
                raise Exception(f"Failed to create signed URL: {signed_url['error']}")
            
            return {
                "success": True,
                "upload_url": signed_url['data']['signedUrl'],
                "file_path": file_path,
            }
        except Exception as e:
            logger.error(f"Error generating upload URL: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def delete_image(self, user_id: str, image_path: str) -> Dict[str, Any]:
        """
        Delete an image from storage
        """
        try:
            logger.info(f"Deleting image: {image_path}")
            
            # Verify the image belongs to the user (security check)
            if not image_path.startswith(f"workouts/{user_id}/") and not image_path.startswith(f"images/{user_id}/"):
                raise Exception("You can only delete your own images")
            
            # Delete from storage
            result = self.supabase.client.storage.from_(self.bucket_name).remove([image_path])
            
            if result.get('error'):
                raise Exception(f"Failed to delete image: {result['error']}")
            
            logger.info(f"Successfully deleted image: {image_path}")
            return {
                "success": True,
                "message": "Image deleted successfully"
            }
        except Exception as e:
            logger.error(f"Error deleting image: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_public_url(self, image_path: str) -> str:
        """
        Get the public URL for an image
        """
        try:
            result = self.supabase.client.storage.from_(self.bucket_name).get_public_url(image_path)
            return result['data']['publicUrl']
        except Exception as e:
            logger.error(f"Error getting public URL for {image_path}: {str(e)}")
            return None