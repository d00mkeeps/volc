from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConversationService(BaseDBService):
    """
    Service for handling conversation operations in the database
    """
    
    async def create_conversation(self, user_id: str, title: str, first_message: str, config_name: str) -> Dict[str, Any]:
        """
        Create a new conversation with the first message
        """
        try:
            logger.info(f"Creating conversation with title: {title} for user: {user_id}")
            
            # Call RPC function to create conversation with message
            result = self.supabase.rpc(
                "create_conversation_with_message",
                {
                    "p_user_id": user_id,
                    "p_title": title,
                    "p_first_message": first_message,
                    "p_config_name": config_name
                }
            ).execute()
            
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to create conversation: {result.error.message}")
                
            if not result.data:
                raise Exception("No conversation ID returned")
                
            conversation_id = result.data
            
            # Fetch the created conversation
            conversation_result = self.supabase.table("conversations") \
                .select("*") \
                .eq("id", conversation_id) \
                .execute()
                
            if hasattr(conversation_result, 'error') and conversation_result.error or not conversation_result.data:
                raise Exception("Failed to fetch created conversation")
                
            logger.info(f"Conversation created with ID: {conversation_id}")
            return conversation_result.data[0]
            
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            return await self.handle_error("create_conversation", e)
    
    async def create_onboarding_conversation(self, user_id: str, session_id: str, config_name: str) -> Dict[str, Any]:
        """
        Create an onboarding conversation with a specific ID
        """
        try:
            logger.info(f"Creating onboarding conversation for user: {user_id}")
            
            # Direct insert with specified ID
            result = self.supabase.table("conversations") \
                .insert({
                    "id": session_id,
                    "user_id": user_id,
                    "title": "Onboarding Session",
                    "config_name": config_name,
                    "status": "active"
                }) \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to create onboarding conversation: {result.error.message}")
                
            if not result.data:
                raise Exception("Failed to create onboarding conversation")
                
            logger.info(f"Onboarding conversation created with ID: {session_id}")
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error creating onboarding conversation: {str(e)}")
            return await self.handle_error("create_onboarding_conversation", e)
    
    async def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Get all messages for a conversation
        """
        try:
            logger.info(f"Getting messages for conversation: {conversation_id}")
            
            result = self.supabase.table("messages") \
                .select("*") \
                .eq("conversation_id", conversation_id) \
                .order("conversation_sequence") \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to fetch messages: {result.error.message}")
                
            messages = result.data or []
            
            logger.info(f"Retrieved {len(messages)} messages for conversation: {conversation_id}")
            return messages
            
        except Exception as e:
            logger.error(f"Error getting conversation messages: {str(e)}")
            return await self.handle_error("get_conversation_messages", e)
    
    async def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get a conversation by ID
        """
        try:
            logger.info(f"Getting conversation: {conversation_id}")
            
            result = self.supabase.table("conversations") \
                .select("*") \
                .eq("id", conversation_id) \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to fetch conversation: {result.error.message}")
                
            if not result.data or len(result.data) == 0:
                raise Exception(f"No conversation found with ID: {conversation_id}")
                
            logger.info(f"Retrieved conversation: {conversation_id}")
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error getting conversation: {str(e)}")
            return await self.handle_error("get_conversation", e)
    
    async def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all active conversations for a user
        """
        try:
            logger.info(f"Getting active conversations for user: {user_id}") 
            
            result = self.supabase.table("conversations") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("status", "active") \
                .neq("config_name", "onboarding") \
                .order("updated_at", desc=True) \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to fetch conversations: {result.error.message}")
                
            conversations = result.data or []
            
            logger.info(f"Retrieved {len(conversations)} active conversations for user: {user_id}")
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting user conversations: {str(e)}")
            return await self.handle_error("get_user_conversations", e)
    
    async def delete_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Soft delete a conversation by setting status to 'deleted'
        """
        try:
            logger.info(f"Deleting conversation: {conversation_id}")
            
            result = self.supabase.table("conversations") \
                .update({"status": "deleted"}) \
                .eq("id", conversation_id) \
                .execute()
                
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Failed to delete conversation: {result.error.message}")
                
            logger.info(f"Successfully deleted conversation: {conversation_id}")
            return {"success": True, "id": conversation_id}
            
        except Exception as e:
            logger.error(f"Error deleting conversation: {str(e)}")
            return await self.handle_error("delete_conversation", e)
    
    async def save_message(self, conversation_id: str, content: str, sender: str) -> Dict[str, Any]:
        """
        Save a message to a conversation
        """
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
            return message
            
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            return await self.handle_error("save_message", e)