import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from .base_service import BaseDBService

logger = logging.getLogger(__name__)

class ImageService(BaseDBService):
    """Unified image service - handles both DB and storage operations with JWT"""
    
    def __init__(self):
        super().__init__()
        self.bucket_name = "images"
    
    async def create_temp_image(self, user_id: str, file_extension: str, jwt_token: str) -> Dict[str, Any]:
        """Create temp record + get upload URL"""
        try:
            # Generate file path
            file_id = str(uuid.uuid4())
            file_path = f"{user_id}/{file_id}.{file_extension}"
            
            logger.info(f"Creating temp image with path: {file_path}")
            logger.info(f"User ID to insert: {user_id} (type: {type(user_id)})")
            
            # Single user client for everything
            user_client = self.get_user_client(jwt_token)
            
            # Create temp record
            expires_at = datetime.utcnow() + timedelta(hours=24)
            image_insert_data = {
                "file_path": file_path,
                "user_id": user_id,
                "status": "temporary",
                "expires_at": expires_at.isoformat()
            }
            
            logger.info(f"About to insert: {image_insert_data}")
            
            image_result = user_client.table("images").insert(image_insert_data).execute()
            
            if hasattr(image_result, "error") and image_result.error:
                logger.error(f"Insert error details: {image_result.error}")
                raise Exception(f"Failed to create image record: {image_result.error}")
            
            if not hasattr(image_result, "data") or not image_result.data:
                raise Exception("Failed to create image record: No data returned")
            
            image_id = image_result.data[0]["id"]
            logger.info(f"Created temp image record with ID: {image_id}")
            
            # Get signed URL with same client
            logger.info("About to create signed URL...")
            signed_url = user_client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)
            
            logger.info(f"Signed URL response type: {type(signed_url)}")
            logger.info(f"Signed URL response: {signed_url}")
            
            if hasattr(signed_url, 'error') and signed_url.error:
                raise Exception(f"Failed to create signed URL: {signed_url.error}")
            
            if isinstance(signed_url, dict) and 'signedUrl' in signed_url:
                upload_url = signed_url['signedUrl']
            else:
                logger.error(f"Unexpected signed URL structure: {signed_url}")
                raise Exception("Cannot find signedUrl in response")
            
            logger.info(f"Successfully created upload URL")
            
            response_data = {
                "image_id": image_id,
                "upload_url": upload_url,
                "file_path": file_path
            }
            
            logger.info(f"Returning response: {response_data}")
            return await self.format_response(response_data)
            
        except Exception as e:
            logger.error(f"Error in create_temp_image: {str(e)}")
            return await self.handle_error("create_temp_image", e)


    async def commit_image(self, image_id: str, jwt_token: str) -> Dict[str, Any]:
        """Make temp image permanent"""
        try:
            logger.info(f"Committing image to permanent: {image_id}")
            
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
            return await self.handle_error("commit_image", e)
    
    async def get_image_url(self, image_id: str, jwt_token: str) -> Dict[str, Any]:
        """Get public URL by image ID"""
        try:
            logger.info(f"Getting image URL for ID: {image_id}")
            
            user_client = self.get_user_client(jwt_token)
            
            # Get file path from DB
            result = user_client.table("images").select("file_path").eq("id", image_id).execute()
            
            if not hasattr(result, "data") or not result.data:
                raise Exception("Image not found")
            
            file_path = result.data[0]["file_path"]
            
            # Get public URL from storage
            url_result = user_client.storage.from_(self.bucket_name).get_public_url(file_path)
            
            if isinstance(url_result, dict) and 'data' in url_result and 'publicUrl' in url_result['data']:
                public_url = url_result['data']['publicUrl']
            else:
                raise Exception("Cannot find publicUrl in response")
            
            return await self.format_response({"url": public_url})
            
        except Exception as e:
            return await self.handle_error("get_image_url", e)

# Create service instance
image_service = ImageService()