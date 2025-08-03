from app.core.supabase.client import SupabaseClient
from typing import Dict, List, Any, NamedTuple
import logging

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from app.services.workout_analysis.schemas import WorkoutDataBundle

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


class ConversationContext(NamedTuple):
    """Structured conversation context data"""
    messages: List[BaseMessage]
    bundles: List[WorkoutDataBundle]


class ConversationAttachmentsService(BaseDBService):
    """Service for loading complete conversation context (messages + analysis bundles)"""
    
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
                # Only process bundles with 'complete' status
                if bundle_raw.get('status') != 'complete':
                    logger.info(f"Skipping bundle {bundle_raw.get('id')} with status: {bundle_raw.get('status')}")
                    continue
                    
                # Reconstruct the bundle from separate JSONB fields
                bundle_data = {
                    'id': bundle_raw.get('id'),
                    'created_at': bundle_raw.get('created_at'),
                    'status': bundle_raw.get('status'),  # Add this line
                    'metadata': bundle_raw.get('metadata', {}),
                    'workouts': bundle_raw.get('workouts', {}),
                    'top_performers': bundle_raw.get('top_performers', {}),
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
        Load complete conversation context (messages + analysis bundles) for a conversation
        
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
            
            # Call the RPC function
            result = self.supabase.client.rpc('get_conversation_attachments', {
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
            
            # Extract and convert analysis bundles (only complete ones)
            raw_bundles = raw_data.get('analysis_bundles') or []
            workout_bundles = self._convert_bundles_to_workout_data(raw_bundles)
            
            # Check for pending/in_progress bundles for retry logic
            pending_bundles = [b for b in raw_bundles if b.get('status') in ['pending', 'in_progress']]
            
            # Create context object
            context = ConversationContext(
                messages=langchain_messages,
                bundles=workout_bundles
            )
            
            logger.info(f"Successfully loaded {len(langchain_messages)} messages and {len(workout_bundles)} complete bundles for conversation {conversation_id}")
            if pending_bundles:
                logger.info(f"Found {len(pending_bundles)} pending/in_progress bundles")
            
            return await self.format_response(context)
            
        except Exception as e:
            logger.error(f"Error in {operation}: {str(e)}", exc_info=True)
            return await self.handle_error(operation, e)


# Convenience function for easy usage
async def load_conversation_context(conversation_id: str) -> Dict[str, Any]:
    """
    Convenience function to load conversation context
    
    Usage:
        result = await load_conversation_context("uuid-here")
        if result["success"]:
            context = result["data"]  # ConversationContext object
            messages = context.messages  # List[BaseMessage]
            bundles = context.bundles    # List[WorkoutDataBundle]
    """
    service = ConversationAttachmentsService()
    return await service.load_conversation_context(conversation_id)