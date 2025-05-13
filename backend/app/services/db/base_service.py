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
        logger.debug("Initializing BaseDBService")
        try:
            # Create a new SupabaseClient instance
            self._supabase = SupabaseClient()
            
            # Verify client
            if not hasattr(self._supabase, 'client') or self._supabase.client is None:
                logger.error("Supabase client not properly initialized in BaseDBService")
                raise ValueError("Supabase client not properly initialized")
                
            logger.debug("BaseDBService initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing BaseDBService: {str(e)}")
            raise
    
    @property
    def supabase(self):
        """Property to ensure we always have a valid Supabase client"""
        if not hasattr(self, '_supabase') or self._supabase is None:
            logger.warning("Supabase client not found in service, creating new instance")
            self._supabase = SupabaseClient()
        return self._supabase
    
    async def handle_error(self, operation: str, error: Exception) -> Dict[str, Any]:
        """
        Standardized error handling for database operations
        Returns a dict with error information rather than raising the exception
        """
        logger.error(f"Error in {operation}: {str(error)}")
        
        # Special handling for API key issues
        if "API key is required" in str(error):
            logger.error("API key error detected - attempting to reinitialize client")
            try:
                self._supabase = SupabaseClient()
                logger.info("Successfully reinitialized Supabase client")
            except Exception as reinit_error:
                logger.error(f"Failed to reinitialize client: {str(reinit_error)}")
        
        # Return formatted error response
        return {
            "error": str(error), 
            "operation": operation, 
            "success": False
        }
    
    async def format_response(self, data: Any, error: Any = None) -> Dict[str, Any]:
        """
        Format response in a consistent way
        """
        if error:
            return {"success": False, "error": str(error), "data": None}
        return {"success": True, "data": data, "error": None}