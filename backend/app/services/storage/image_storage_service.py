import logging
from typing import Dict, Any
from app.services.db.base_service import BaseDBService

logger = logging.getLogger(__name__)

class ImageStorageService(BaseDBService):
    """Pure storage bucket operations - no database logic"""
    
    def __init__(self):
        super().__init__()
        self.bucket_name = "images"
    
    async def get_signed_upload_url(self, file_path: str, jwt_token: str) -> Dict[str, Any]:
        """Get signed URL for client upload"""
        try:
            user_client = self.get_user_client(jwt_token)
            signed_url = user_client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)
            
            if hasattr(signed_url, 'error') and signed_url.error:
                raise Exception(f"Failed to create signed URL: {signed_url.error}")
            
            if isinstance(signed_url, dict) and 'signedUrl' in signed_url:
                upload_url = signed_url['signedUrl']
            else:
                raise Exception("Cannot find signedUrl in response")
            
            return await self.format_response({
                "upload_url": upload_url,
                "file_path": file_path
            })
            
        except Exception as e:
            return await self.handle_error("get_signed_upload_url", e)
    
    async def get_public_url(self, file_path: str, jwt_token: str) -> Dict[str, Any]:
        """Get public URL for image display"""
        try:
            user_client = self.get_user_client(jwt_token)
            result = user_client.storage.from_(self.bucket_name).get_public_url(file_path)
            
            if isinstance(result, dict) and 'data' in result and 'publicUrl' in result['data']:
                public_url = result['data']['publicUrl']
            else:
                raise Exception("Cannot find publicUrl in response")
            
            return await self.format_response({"url": public_url})
            
        except Exception as e:
            return await self.handle_error("get_public_url", e)

# Create service instance
image_storage_service = ImageStorageService()