from app.core.supabase.client import SupabaseClient
from app.core.utils.jwt_utils import JWTContextManager, validate_jwt_format
from typing import Dict, List, Any, Optional
import logging
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from app.services.workout_analysis.schemas import WorkoutDataBundle
from app.schemas.schemas import ConversationContext

logger = logging.getLogger(__name__)

class BaseDBService:
    """
    Base service for database operations with JWT context for RLS
    """
    def __init__(self, jwt_token: Optional[str] = None):
        logger.debug("Initializing BaseDBService with JWT context")
        try:
            # Create JWT context manager
            self.jwt_context = JWTContextManager(jwt_token)
            
            # Create a new SupabaseClient instance
            self._supabase = SupabaseClient()
            
            # Log JWT context status
            if self.jwt_context.has_valid_token():
                logger.debug("Valid JWT context established for RLS")
            else:
                logger.warning("No valid JWT context - RLS policies may not work correctly")
            
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
        """
        Property to get the appropriate Supabase client.
        Returns authenticated client if JWT context is available, otherwise default client.
        """
        if not hasattr(self, '_supabase') or self._supabase is None:
            logger.warning("Supabase client not found in service, creating new instance")
            self._supabase = SupabaseClient()
            
        # Return authenticated client if we have valid JWT
        if self.jwt_context.has_valid_token():
            return self._supabase.get_authenticated_client(self.jwt_context.get_token())
        else:
            # Return default client for backward compatibility
            logger.debug("Using default Supabase client (no JWT context)")
            return self._supabase.client
    
    def get_authenticated_client(self):
        """
        Get Supabase client with JWT context for RLS.
        Raises exception if no valid JWT token is available.
        """
        if not self.jwt_context.has_valid_token():
            logger.error("Attempted to get authenticated client without valid JWT")
            raise ValueError("Valid JWT token required for authenticated operations")
        
        return self._supabase.get_authenticated_client(self.jwt_context.get_token())
    
    def get_default_client(self):
        """Get the default (unauthenticated) Supabase client."""
        return self._supabase.client
    
    def has_auth_context(self) -> bool:
        """Check if service has valid JWT authentication context."""
        return self.jwt_context.has_valid_token()
    
    def require_auth_context(self):
        """Ensure service has valid JWT context, raise exception if not."""
        if not self.has_auth_context():
            logger.error("Operation requires authentication context but none provided")
            raise ValueError("This operation requires a valid JWT token")
    
    async def handle_error(self, operation: str, error: Exception) -> Dict[str, Any]:
        """
        Standardized error handling for database operations
        Returns a dict with error information rather than raising the exception
        """
        logger.error(f"Error in {operation}: {str(error)}")
        
        # Special handling for authentication/authorization errors
        error_str = str(error).lower()
        if any(phrase in error_str for phrase in ['unauthorized', 'forbidden', 'access denied', 'permission']):
            logger.error(f"Authentication/authorization error in {operation}")
            return {
                "error": "Access denied. Please check your permissions.", 
                "operation": operation, 
                "success": False,
                "error_type": "authorization"
            }
        
        # Special handling for API key issues
        if "api key is required" in error_str:
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
            "success": False,
            "error_type": "database"
        }
    
    async def format_response(self, data: Any, error: Any = None) -> Dict[str, Any]:
        """
        Format response in a consistent way
        """
        if error:
            return {"success": False, "error": str(error), "data": None}
        return {"success": True, "data": data, "error": None}

class ConversationAttachmentsService(BaseDBService):
    """Service for loading complete conversation context (messages + analysis bundles)"""
    
    def __init__(self, jwt_token: Optional[str] = None):
        super().__init__(jwt_token)
    
    def _convert_messages_to_langchain(self, raw_messages: List[Dict[str, Any]]) -> List[BaseMessage]:
        """Convert database message format to LangChain message objects"""
        langchain_messages = []
        
        for msg in raw_messages:
            content = msg.get('content', '')
            sender = msg.get('sender', '')
            
            if sender == 'user':
                langchain_messages.append(HumanMessage(content=content))
            elif sender in ['assistant', 'ai']:
                langchain_messages.append(AIMessage(content=content))
            else:
                logger.warning(f"Unknown sender type '{sender}' for message {msg.get('id')}")
        
        return langchain_messages
    
    def _convert_bundles_to_workout_data(self, raw_bundles: List[Dict[str, Any]]) -> List[WorkoutDataBundle]:
        """Convert database bundle format to WorkoutDataBundle objects"""
        workout_bundles = []
        
        for bundle_raw in raw_bundles:
            try:
                # Reconstruct the bundle from separate JSONB fields
                bundle_data = {
                    'metadata': bundle_raw.get('metadata', {}),
                    'raw_workouts': bundle_raw.get('raw_workouts', {}),
                    'top_performers': bundle_raw.get('top_performers', {}),
                    'consistency_metrics': bundle_raw.get('consistency_metrics', {}),
                    'correlation_data': bundle_raw.get('correlation_data', {}),
                    'chart_urls': bundle_raw.get('chart_urls', {}),
                }
                
                # Create WorkoutDataBundle instance
                workout_bundle = WorkoutDataBundle(**bundle_data)
                workout_bundles.append(workout_bundle)
                
            except Exception as e:
                logger.warning(f"Failed to parse bundle {bundle_raw.get('id')}: {e}")
                continue
        
        return workout_bundles
    
    async def load_conversation_context(self, conversation_id: str) -> Dict[str, Any]:
        """
        Load complete conversation context (messages + analysis bundles) for a conversation.
        Uses JWT context for RLS if available.
        
        Returns:
            Dict with structure: {
                "success": bool,
                "data": ConversationContext or None,
                "error": str or None
            }
        """
        operation = f"load_conversation_context({conversation_id})"
        
        try:
            logger.info(f"Loading conversation context for: {conversation_id}")
            
            # Use authenticated client if available for RLS
            client = self.supabase
            
            # Call the RPC function
            result = client.rpc('get_conversation_attachments', {
                'p_conversation_id': conversation_id
            }).execute()
            
            if result.data is None:
                logger.warning(f"No data returned for conversation {conversation_id}")
                # Return empty context
                empty_context = ConversationContext(messages=[], bundles=[])
                return await self.format_response(empty_context)
            
            raw_data = result.data
            
            # Extract and convert messages
            raw_messages = raw_data.get('messages') or []
            langchain_messages = self._convert_messages_to_langchain(raw_messages)
            
            # Extract and convert analysis bundles
            raw_bundles = raw_data.get('analysis_bundles') or []
            workout_bundles = self._convert_bundles_to_workout_data(raw_bundles)
            
            # Create context object
            context = ConversationContext(
                messages=langchain_messages,
                bundles=workout_bundles
            )
            
            logger.info(f"Successfully loaded {len(langchain_messages)} messages and {len(workout_bundles)} bundles for conversation {conversation_id}")
            
            return await self.format_response(context)
            
        except Exception as e:
            logger.error(f"Error in {operation}: {str(e)}", exc_info=True)
            return await self.handle_error(operation, e)

# Convenience function for easy usage (with optional JWT context)
async def load_conversation_context(conversation_id: str, jwt_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Convenience function to load conversation context with optional JWT context
    
    Usage:
        # With JWT context for RLS
        result = await load_conversation_context("uuid-here", jwt_token)
        
        # Without JWT context (backward compatibility)
        result = await load_conversation_context("uuid-here")
        
        if result["success"]:
            context = result["data"]  # ConversationContext object
            messages = context.messages  # List[BaseMessage]
            bundles = context.bundles    # List[WorkoutDataBundle]
    """
    service = ConversationAttachmentsService(jwt_token)
    return await service.load_conversation_context(conversation_id)