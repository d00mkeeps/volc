from app.core.supabase.client import SupabaseClient
from typing import Dict, List, Any, Optional, TypeVar, Generic
import logging

T = TypeVar('T')

logger = logging.getLogger(__name__)

class BaseDBService:
    """
    Base service for database operations
    """
    def __init__(self):
        self.supabase = SupabaseClient()
    
    async def handle_error(self, operation: str, error: Exception) -> None:
        """
        Standardized error handling for database operations
        """
        logger.error(f"Error in {operation}: {str(error)}")
        raise error
    
    async def format_response(self, data: Any, error: Any = None) -> Dict[str, Any]:
        """
        Format response in a consistent way
        """
        if error:
            return {"success": False, "error": str(error), "data": None}
        return {"success": True, "data": data, "error": None}