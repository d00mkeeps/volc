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
    
    async def get_image_url(self, image_id: str, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """Get public URL by image ID - all workouts are public"""
        try:
            logger.info(f"🔥 NEW VERSION - Getting image URL for ID: {image_id}")
            logger.info(f"🔥 NEW VERSION - Requesting user ID: {user_id}")
            
            # ✅ Use admin client to bypass RLS and check permissions manually
            admin_client = self.get_admin_client()
            
            # Check if image exists and get details
            image_result = admin_client.table("images") \
                .select("id, file_path, user_id") \
                .eq("id", image_id) \
                .eq("status", "permanent") \
                .execute()
            
            logger.info(f"Image query result: {image_result.data}")
            
            if not image_result.data:
                logger.error("Image not found or not permanent")
                raise Exception("Image not found")
            
            image = image_result.data[0]
            image_owner_id = image["user_id"]
            file_path = image["file_path"]
            
            logger.info(f"Image owner ID: {image_owner_id}")
            logger.info(f"Requesting user ID: {user_id}")
            logger.info(f"User owns image: {image_owner_id == user_id}")
            
            # ✅ Simplified permission check: user owns image OR image belongs to any workout
            if image_owner_id == user_id:
                logger.info("User owns image - allowing access")
            else:
                logger.info("User doesn't own image - checking if image belongs to any workout")
                
                # ✅ Check if image belongs to ANY workout (all workouts are public)
                workout_result = admin_client.table("workouts") \
                    .select("id, user_id, image_id") \
                    .eq("image_id", image_id) \
                    .execute()
                
                logger.info(f"Workout query result: {workout_result.data}")
                
                if not workout_result.data:
                    logger.error("Image belongs to another user and no workout found")
                    raise Exception("Image not found")
                
                logger.info("Image belongs to a workout - allowing access (all workouts are public)")
            
            logger.info(f"Found file path: {file_path}")
            
            # ✅ Use user client for storage operations
            user_client = self.get_user_client(jwt_token)
            url_result = user_client.storage.from_(self.bucket_name).get_public_url(file_path)
            
            # Handle the URL response (keep your existing parsing logic)
            logger.info(f"Public URL response type: {type(url_result)}")
            logger.info(f"Public URL response: {url_result}")
            
            if isinstance(url_result, str):
                public_url = url_result
                logger.info("Used direct string")
            elif isinstance(url_result, dict):
                if 'publicUrl' in url_result:
                    public_url = url_result['publicUrl']
                    logger.info("Used publicUrl key")
                elif 'url' in url_result:
                    public_url = url_result['url']
                    logger.info("Used url key")
                else:
                    logger.error(f"Unknown structure - available keys: {list(url_result.keys())}")
                    raise Exception(f"Cannot find publicUrl in response: {url_result}")
            else:
                raise Exception(f"Unexpected response type: {type(url_result)}")
            
            logger.info(f"Final public URL: {public_url}")
            return await self.format_response({"url": public_url})
            
        except Exception as e:
            return await self.handle_error("get_image_url", e)


image_service = ImageService()