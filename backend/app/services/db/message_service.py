from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class MessageService(BaseDBService):
    """Service for handling message operations"""
    
    def __init__(self, jwt_token: Optional[str] = None):
        super().__init__(jwt_token)
    
    async def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation"""
        try:
            logger.info(f"Getting messages for conversation: {conversation_id}")
            
            # RLS handles user filtering through conversation ownership
            result = self.supabase.table("messages") \
                .select("*") \
                .eq("conversation_id", conversation_id) \
                .order("timestamp") \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to fetch messages: {result.error.message}")
                
            messages = result.data or []
            logger.info(f"Retrieved {len(messages)} messages")
            return messages
            
        except Exception as e:
            logger.error(f"Error getting messages: {str(e)}")
            return await self.handle_error("get_conversation_messages", e)
    
    async def save_message(self, conversation_id: str, content: str, sender: str) -> Dict[str, Any]:
        """Save a message to a conversation"""
        try:
            logger.info(f"Saving {sender} message to conversation: {conversation_id}")
            
            result = self.supabase.table("messages") \
                .insert({
                    "conversation_id": conversation_id,
                    "content": content,
                    "sender": sender
                }) \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to save message: {result.error.message}")
                
            if not result.data:
                raise Exception("No data returned from insert")
                
            message = result.data[0]
            logger.info(f"Message saved with ID: {message.get('id')}")
            
            # Refresh context cache since we added a new message
            from app.services.context.conversation_context_service import conversation_context_service
            await conversation_context_service.refresh_context(conversation_id)
            
            return message
            
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            return await self.handle_error("save_message", e)