# backend/app/services/db/conversation_service.py
from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class ConversationService(BaseDBService):
    """Service for handling conversation operations"""
    
    async def create_conversation(
        self,
        title: str,
        config_name: str,
        user,
        jwt_token: str
    ) -> Dict[str, Any]:
        """Create a new conversation"""
        try:
            logger.info(f"Creating conversation for user: {user.id}")
            
            # Use user context for RLS
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("conversations").insert({
                "user_id": user.id,
                "title": title,
                "config_name": config_name,
                "status": "active"
            }).execute()
            
            if not result.data:
                raise Exception("Failed to create conversation")
            
            # # Optional: Log to admin table
            # admin_client = self.get_admin_client()
            # admin_client.table("operation_logs").insert({
            #     "operation": "create_conversation",
            #     "user_id": user.id,
            #     "conversation_id": result.data[0]["id"]
            # }).execute()
             
            return await self.format_response(result.data[0])
            
        except Exception as e:
            return await self.handle_error("create_conversation", e)
    

    async def delete_conversation(
        self,
        conversation_id: str,
        user,
        jwt_token: str
    ) -> Dict[str, Any]:
        """Soft delete a conversation by setting status to 'deleted'"""
        try:
            logger.info(f"Deleting conversation: {conversation_id}")
            
            # Use user context for RLS
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("conversations") \
                .update({"status": "deleted"}) \
                .eq("id", conversation_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to delete conversation")
            
            return await self.format_response(result.data[0])
            
        except Exception as e:
            return await self.handle_error("delete_conversation", e)

    async def get_user_conversations(
        self,
        user,
        jwt_token: str
    ) -> Dict[str, Any]:
        """Get all conversations for authenticated user"""
        try:
            # Use user context - RLS will filter to user's conversations
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("conversations") \
                .select("*") \
                .eq("status", "active") \
                .neq("config_name", "onboarding") \
                .order("updated_at", desc=True) \
                .execute()
            
            return await self.format_response(result.data or [])
            
        except Exception as e:
            return await self.handle_error("get_user_conversations", e)


    async def create_conversation_with_message(
        self,
        title: str,
        config_name: str,
        first_message: str,
        user,
        jwt_token: str
    ) -> Dict[str, Any]:
        """Create conversation and insert first user message"""
        try:
            logger.info(f"Creating conversation with message for user: {user.id}")
            user_client = self.get_user_client(jwt_token)
            
            # Create conversation
            conv_result = user_client.table("conversations").insert({
                "user_id": user.id,
                "title": title,
                "config_name": config_name,
                "status": "active"
            }).execute()
            
            if not conv_result.data:
                raise Exception("Failed to create conversation")
            
            conversation = conv_result.data[0]
            logger.info(f"Conversation created: {conversation['id']}")
            
            # Insert first message
            msg_result = user_client.table("messages").insert({
                "conversation_id": conversation["id"],
                "content": first_message,
                "sender": "user",
                "conversation_sequence": 1
            }).execute()
            
            if not msg_result.data:
                raise Exception("Failed to insert first message")
            
            message = msg_result.data[0]
            logger.info(f"First message created: {message['id']}")
            
            return {
                "conversation": await self.format_response(conversation),
                "first_message": message
            }
            
        except Exception as e:
            logger.error(f"Error in create_conversation_with_message: {str(e)}")
            return await self.handle_error("create_conversation_with_message", e)
        
conversation_service = ConversationService()