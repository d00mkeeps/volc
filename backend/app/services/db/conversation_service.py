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
            
            # Optional: Log to admin table
            admin_client = self.get_admin_client()
            admin_client.table("operation_logs").insert({
                "operation": "create_conversation",
                "user_id": user.id,
                "conversation_id": result.data[0]["id"]
            }).execute()
            
            return await self.format_response(result.data[0])
            
        except Exception as e:
            return await self.handle_error("create_conversation", e)
    
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

# Create service instance
conversation_service = ConversationService()