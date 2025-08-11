import uuid
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from app.services.db.base_service import BaseDBService

logger = logging.getLogger(__name__)

class ImageService(BaseDBService):
    """
    Service for handling image storage operations with TTL support
    """
    
    def __init__(self):
        super().__init__()
        self.bucket_name = "images"
    
    async def create_temp_image(self, user_id: str, jwt_token: str, file_extension: str = "jpg") -> Dict[str, Any]:
        """
        Create temporary image record and upload URL
        """
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_path = f"{user_id}/{file_id}.{file_extension}"
            
            logger.info(f"Creating temp image record for path: {file_path}")
            
            # Create temp record with 24h expiry
            expires_at = datetime.utcnow() + timedelta(hours=24)
            
            # Use user client for database operations - RLS handles user access
            user_client = self.get_user_client(jwt_token)
            image_result = user_client.table("images").insert({
                "file_path": file_path,
                "user_id": user_id,
                "status": "temporary",
                "expires_at": expires_at.isoformat()
            }).execute()
            
            if not hasattr(image_result, "data") or not image_result.data:
                raise Exception("Failed to create image record")
            
            # Get signed URL for upload using user client for private bucket access
            signed_url = user_client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)   

            logger.info(f"Signed URL response type: {type(signed_url)}")

            # Check for errors
            if hasattr(signed_url, 'error') and signed_url.error:
                raise Exception(f"Failed to create signed URL: {signed_url.error}")

            image_id = image_result.data[0]["id"]
            logger.info(f"Created temp image record with ID: {image_id}")

            # Extract the signed URL - we know it's a dict with 'signedUrl' key
            if isinstance(signed_url, dict) and 'signedUrl' in signed_url:
                upload_url = signed_url['signedUrl']
            else:
                logger.error(f"Unexpected signed URL structure: {signed_url}")
                raise Exception(f"Cannot find signedUrl in response")
                
            logger.info(f"Successfully extracted upload URL")

            response_data = {
                "image_id": image_id,
                "upload_url": upload_url,
                "file_path": file_path,
            }
            
            logger.info(f"About to return response: {response_data}")
            final_response = await self.format_response(response_data)
            logger.info(f"Final formatted response: {final_response}")
            
            return final_response
            
        except Exception as e:
            logger.error(f"Error creating temp image: {str(e)}")
            return await self.handle_error("create_temp_image", e)


    async def commit_image(self, image_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Make temp image permanent
        """
        try:
            logger.info(f"Committing image to permanent: {image_id}")
            
            # Use user client - RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("images").update({
                "status": "permanent",
                "expires_at": None,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", image_id).execute()
            
            if not hasattr(result, "data") or not result.data:
                raise Exception("Failed to commit image")
            
            logger.info(f"Successfully committed image: {image_id}")
            return await self.format_response({"success": True})
            
        except Exception as e:
            logger.error(f"Error committing image: {str(e)}")
            return await self.handle_error("commit_image", e)
    
    async def get_image_url(self, image_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get public URL for image by ID
        """
        try:
            logger.info(f"Getting image URL for ID: {image_id}")
            
            # Use user client - RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("images").select("file_path").eq("id", image_id).execute()
            
            if not hasattr(result, "data") or not result.data:
                raise Exception("Image not found")
            
            file_path = result.data[0]["file_path"]
            public_url = self.get_public_url(file_path, jwt_token)
            
            return await self.format_response({"url": public_url})
            
        except Exception as e:
            logger.error(f"Error getting image URL: {str(e)}")
            return await self.handle_error("get_image_url", e)
    
    async def get_upload_url(
        self,
        user_id: str,
        jwt_token: str,
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
            
            # Create signed upload URL (expires in 1 hour) using user client
            user_client = self.get_user_client(jwt_token)
            signed_url = user_client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)
            
            if signed_url.get('error'):
                raise Exception(f"Failed to create signed URL: {signed_url['error']}")
            
            return await self.format_response({
                "upload_url": signed_url['data']['signedUrl'],
                "file_path": file_path,
            })
            
        except Exception as e:
            logger.error(f"Error generating upload URL: {str(e)}")
            return await self.handle_error("get_upload_url", e)
    
    async def delete_image(self, user_id: str, image_path: str, jwt_token: str) -> Dict[str, Any]:
        """
        Delete an image from storage
        """
        try:
            logger.info(f"Deleting image: {image_path}")
            
            # Verify the image belongs to the user (security check) - business logic validation
            if not image_path.startswith(f"workouts/{user_id}/") and not image_path.startswith(f"images/{user_id}/"):
                raise Exception("You can only delete your own images")
            
            # Delete from storage using user client for user permission enforcement
            user_client = self.get_user_client(jwt_token)
            result = user_client.storage.from_(self.bucket_name).remove([image_path])
            
            if result.get('error'):
                raise Exception(f"Failed to delete image: {result['error']}")
            
            logger.info(f"Successfully deleted image: {image_path}")
            return await self.format_response({"message": "Image deleted successfully"})
            
        except Exception as e:
            logger.error(f"Error deleting image: {str(e)}")
            return await self.handle_error("delete_image", e)
    
    def get_public_url(self, image_path: str, jwt_token: str) -> str:
        """
        Get the public URL for an image
        """
        try:
            # Use user client for consistent access patterns
            user_client = self.get_user_client(jwt_token)
            result = user_client.storage.from_(self.bucket_name).get_public_url(image_path)
            return result['data']['publicUrl']
        except Exception as e:
            logger.error(f"Error getting public URL for {image_path}: {str(e)}")
            return None

# Create service instance
image_service = ImageService()