from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConversationService(BaseDBService):
    """
    Service for handling conversation operations in the database
    """
    
    async def create_conversation(self, user_id: str, title: str, config_name: str) -> Dict[str, Any]:
        """
        Create a new, empty conversation
        """
        try:
            logger.info(f"Creating empty conversation with title: {title} for user: {user_id}")
            
            # Direct insert into conversations table
            result = self.supabase.table("conversations").insert({
                "user_id": user_id,
                "title": title,
                "config_name": config_name,
                "status": "active"
            }).execute()
            
            if not hasattr(result, 'data') or not result.data:
                raise Exception("Failed to create conversation: No data returned")
            
            conversation = result.data[0]
            logger.info(f"Empty conversation created with ID: {conversation['id']}")
            return conversation
            
        except Exception as e:
            logger.error(f"Error creating empty conversation: {str(e)}")
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
    
   