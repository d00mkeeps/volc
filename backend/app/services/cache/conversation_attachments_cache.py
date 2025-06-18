from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from app.services.db.conversation_service import ConversationService
from app.services.db.message_service import MessageService
from app.services.db.graph_bundle_service import GraphBundleService
import logging

logger = logging.getLogger(__name__)

class ConversationAttachmentsCache:
    def __init__(self):
        self._cache: Dict[str, Dict] = {}
        self.conversation_service = ConversationService()
        self.message_service = MessageService()
        self.graph_bundle_service = GraphBundleService()
        self.expiry_minutes = 30
    
    async def get_conversation_context(self, conversation_id: str, user_id: str) -> Dict[str, Any]:
        """Get full conversation context (messages + analysis bundles)"""
        # Check cache first
        if self._is_cached_and_valid(conversation_id):
            self._update_last_accessed(conversation_id)
            return self._cache[conversation_id]["data"]
        
        # Load from database
        context = await self._load_from_database(conversation_id, user_id)
        self._store_in_cache(conversation_id, context)
        return context
    
    async def _load_from_database(self, conversation_id: str, user_id: str) -> Dict[str, Any]:
        """Load conversation, messages, and analysis bundles from database"""
        messages = await self.message_service.get_conversation_messages(conversation_id)
        bundles = await self.graph_bundle_service.get_bundles_by_conversation(user_id, conversation_id)
        
        return {
            "messages": messages,
            "analysis_bundles": bundles
        }
    
    def _is_cached_and_valid(self, conversation_id: str) -> bool:
        """Check if conversation is cached and not expired"""
        if conversation_id not in self._cache:
            return False
        return datetime.now() < self._cache[conversation_id]["expires_at"]
    
    def _store_in_cache(self, conversation_id: str, data: Dict[str, Any]):
        """Store conversation context in cache"""
        now = datetime.now()
        self._cache[conversation_id] = {
            "data": data,
            "expires_at": now + timedelta(minutes=self.expiry_minutes),
            "last_accessed": now
        }
    
    def _update_last_accessed(self, conversation_id: str):
        """Update last accessed time"""
        self._cache[conversation_id]["last_accessed"] = datetime.now()
    
    def cleanup_expired(self):
        """Remove expired conversations from cache"""
        now = datetime.now()
        expired_keys = [
            key for key, value in self._cache.items()
            if now >= value["expires_at"]
        ]
        for key in expired_keys:
            del self._cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired conversations")

# Global cache instance
conversation_cache = ConversationAttachmentsCache()