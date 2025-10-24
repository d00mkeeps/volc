from typing import Dict, List, Any, NamedTuple
import logging

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from app.services.workout_analysis.schemas import WorkoutAnalysisBundle
from app.services.db.base_service import BaseDBService

logger = logging.getLogger(__name__)

class ConversationContext(NamedTuple):
    """Structured conversation context data"""
    messages: List[BaseMessage]
    bundles: List[WorkoutAnalysisBundle]

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
    
    def _convert_bundles_to_workout_data(self, raw_bundles: List[Dict[str, Any]]) -> List[WorkoutAnalysisBundle]:
        """Convert database bundle format to WorkoutAnalysisBundle objects"""
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
                    'status': bundle_raw.get('status'),
                    'metadata': bundle_raw.get('metadata', {}),
                    'workouts': bundle_raw.get('workouts', {}),
                    'top_performers': bundle_raw.get('top_performers', {}),
                    'correlation_data': bundle_raw.get('correlation_data', {}),
                    'chart_urls': bundle_raw.get('chart_urls', {}),
                }
                
                # Create WorkoutAnalysisBundle instance
                workout_bundle = WorkoutAnalysisBundle(**bundle_data)
                workout_bundles.append(workout_bundle)
                
            except Exception as e:
                logger.warning(f"Failed to parse bundle {bundle_raw.get('id')}: {e}")
                continue
        
        return workout_bundles
    
    async def load_conversation_context(self, conversation_id: str, jwt_token: str) -> Dict[str, Any]:
        """Load conversation context using user JWT token"""
        operation = f"load_conversation_context({conversation_id})"
        
        try:
            logger.info(f"Loading conversation context for: {conversation_id}")
            
            # Use authenticated client - RLS handles user filtering
            user_client = self.get_user_client(jwt_token)
            result = user_client.rpc('get_conversation_attachments', {
                'p_conversation_id': conversation_id
            }).execute()
            
            return await self._process_rpc_result(result, conversation_id)
            
        except Exception as e:
            logger.error(f"Error in {operation}: {str(e)}", exc_info=True)
            return await self.handle_error(operation, e)
    
    async def load_conversation_context_admin(self, conversation_id: str) -> Dict[str, Any]:
        """Load conversation context using admin/service role"""
        operation = f"load_conversation_context_admin({conversation_id})"
        
        try:
            logger.info(f"Loading conversation context (admin) for: {conversation_id}")
            
            # Use admin client for server operations  
            admin_client = self.get_admin_client()
            result = admin_client.rpc('get_conversation_attachments', {
                'p_conversation_id': conversation_id
            }).execute()
            
            return await self._process_rpc_result(result, conversation_id)
            
        except Exception as e:
            logger.error(f"Error in {operation}: {str(e)}", exc_info=True)
            return await self.handle_error(operation, e)
    
    async def _process_rpc_result(self, result, conversation_id: str) -> Dict[str, Any]:
        """Process RPC result into ConversationContext - shared logic"""
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

# Convenience functions for easy usage
async def load_conversation_context(conversation_id: str, jwt_token: str = None) -> Dict[str, Any]:
    """
    Convenience function to load conversation context
    
    If jwt_token provided: uses user client
    If no jwt_token: uses admin client for server operations
    """
    service = ConversationAttachmentsService()
    
    if jwt_token:
        return await service.load_conversation_context(conversation_id, jwt_token)
    else:
        return await service.load_conversation_context_admin(conversation_id)