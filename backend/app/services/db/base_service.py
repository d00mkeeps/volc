# backend/app/services/db/base_service.py
from app.core.supabase.client import supabase_factory
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseDBService:
    """Base service for database operations"""
    
    def get_user_client(self, jwt_token: str):
        """Get Supabase client with user context for RLS"""
        return supabase_factory.get_user_client(jwt_token)
    
    def get_admin_client(self):
        """Get Supabase client with admin context (bypasses RLS)"""
        return supabase_factory.get_admin_client()
    
    async def handle_error(self, operation: str, error: Exception) -> Dict[str, Any]:
        """Standardized error handling"""
        logger.error(f"Error in {operation}: {str(error)}")
        return {
            "error": str(error), 
            "operation": operation, 
            "success": False
        }
    
    async def format_response(self, data: Any, error: Any = None) -> Dict[str, Any]:
        """Format response consistently"""
        if error:
            return {"success": False, "error": str(error), "data": None}
        return {"success": True, "data": data, "error": None}