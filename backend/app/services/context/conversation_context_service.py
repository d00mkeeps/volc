from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from ...core.utils.conversation_attachments import load_conversation_context
from ..db.conversation_service import ConversationService
from ..db.message_service import MessageService
from ..db.context_service import ContextBundleService
from app.schemas.schemas import ConversationContext
import logging
import asyncio

logger = logging.getLogger(__name__)


class ConversationContextService:
    """
    Unified service for loading conversation context (messages + analysis bundles).

    Encapsulates caching logic and database operations behind a clean interface.
    Automatically handles:
    - Smart caching with 30-minute expiration
    - Fallback from cache to database
    - Retry logic for pending analysis
    - Type conversion from database formats to typed objects
    - Cache invalidation when new data is added
    - Both user (JWT) and server (admin) operations
    """

    def __init__(self):
        # In-memory cache for conversation contexts
        self._cache: Dict[str, Dict[str, Any]] = {}

        # Database services (used as fallback when cache misses)
        self.conversation_service = ConversationService()
        self.message_service = MessageService()
        self.context_bundle_service = ContextBundleService()

        # Cache configuration
        self.cache_expiry_minutes = 30
        self.pending_analysis_max_retries = 20  # 10 seconds at 500ms intervals

    async def load_context(
        self, conversation_id: str, jwt_token: str, user_id: Optional[str] = None
    ) -> ConversationContext:
        """Load complete conversation context (messages + bundles) using user JWT."""
        try:
            start_time = datetime.now()
            logger.info(
                f"🔄 UNIFIED SERVICE: Loading context for conversation: {conversation_id}"
            )

            # FAST PATH: Check cache first
            if self._is_cached_and_valid(conversation_id):
                elapsed = (datetime.now() - start_time).total_seconds()
                logger.info(
                    f"⚡ CACHE HIT: Context loaded in {elapsed:.2f}s for conversation: {conversation_id}"
                )
                self._update_last_accessed(conversation_id)
                return self._cache[conversation_id]["context"]

            # SLOW PATH: Cache miss - load from database
            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"💾 CACHE MISS: Loading from database for conversation: {conversation_id} (check took {elapsed:.2f}s)"
            )

            context = await self._load_from_database_with_retries(
                conversation_id, jwt_token, user_id
            )

            # Store in cache for future requests
            self._store_in_cache(conversation_id, context)

            total_elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"✅ UNIFIED SERVICE: Context loaded successfully in {total_elapsed:.2f}s - {len(context.messages)} messages, {len(context.bundles)} bundles"
            )

            return context
        except Exception as e:
            logger.error(f"Error loading conversation context: {str(e)}", exc_info=True)
            # Return empty context rather than crashing
            return ConversationContext(messages=[], bundles=[])

    async def load_context_admin(
        self, conversation_id: str, user_id: Optional[str] = None
    ) -> ConversationContext:
        """Load complete conversation context using admin client for server operations."""
        try:
            start_time = datetime.now()
            logger.info(
                f"🔄 ADMIN: Loading context for conversation: {conversation_id}"
            )

            # FAST PATH: Check cache first
            if self._is_cached_and_valid(conversation_id):
                elapsed = (datetime.now() - start_time).total_seconds()
                logger.info(
                    f"⚡ CACHE HIT: Admin context loaded in {elapsed:.2f}s for conversation: {conversation_id}"
                )
                self._update_last_accessed(conversation_id)
                return self._cache[conversation_id]["context"]

            # SLOW PATH: Cache miss - load from database with admin client
            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"💾 CACHE MISS: Loading from database with admin for conversation: {conversation_id} (check took {elapsed:.2f}s)"
            )

            context = await self._load_from_database_with_retries_admin(
                conversation_id, user_id
            )

            # Store in cache for future requests
            self._store_in_cache(conversation_id, context)

            total_elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"✅ ADMIN: Context loaded successfully in {total_elapsed:.2f}s - {len(context.messages)} messages, {len(context.bundles)} bundles"
            )

            return context
        except Exception as e:
            logger.error(
                f"Error loading admin conversation context: {str(e)}", exc_info=True
            )
            # Return empty context rather than crashing
            return ConversationContext(messages=[], bundles=[])

    async def refresh_context(
        self, conversation_id: str, jwt_token: str = None, user_id: Optional[str] = None
    ):
        """Force refresh context from database (invalidates cache). Handles both user and server operations."""
        logger.info(
            f"🔄 REFRESH: Force refreshing context for conversation: {conversation_id}"
        )

        # Remove from cache to force database reload
        self.invalidate_cache(conversation_id)

        # Load fresh context (will hit database since cache is cleared)
        if jwt_token:
            # User operation - use JWT
            await self.load_context(conversation_id, jwt_token, user_id)
        else:
            # Server operation - use admin client
            await self.load_context_admin(conversation_id, user_id)

        logger.info(
            f"✅ REFRESH: Context refreshed for conversation: {conversation_id}"
        )

    def invalidate_cache(self, conversation_id: str):
        """
        Remove specific conversation from cache.

        Call this when you know the conversation has changed.
        """
        if conversation_id in self._cache:
            del self._cache[conversation_id]
            logger.info(f"Invalidated cache for conversation: {conversation_id}")

    def cleanup_expired_cache(self):
        """
        Remove expired conversations from cache.

        Called automatically, but you can call manually for memory management.
        """
        now = datetime.now()
        expired_keys = [
            key for key, value in self._cache.items() if now >= value["expires_at"]
        ]

        for key in expired_keys:
            del self._cache[key]

        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired conversation contexts")

    # =========================
    # INTERNAL IMPLEMENTATION
    # =========================

    async def _load_from_database_with_retries(
        self, conversation_id: str, jwt_token: str, user_id: Optional[str]
    ) -> ConversationContext:
        """Load from database with retries using user JWT"""
        for attempt in range(self.pending_analysis_max_retries):
            # Try RPC approach first (more reliable, single call)
            try:
                context_result = await load_conversation_context(conversation_id)
                if context_result["success"]:
                    context = context_result["data"]
                    if context.bundles or not any(True for _ in context.bundles):
                        return context
                    await asyncio.sleep(0.5)
                    continue
            except Exception as e:
                logger.warning(f"RPC load failed: {str(e)}")

            # If RPC fails and we don't have user_id, can't use fallback
            if not user_id:
                logger.warning(
                    "No user_id provided, cannot use fallback loading method"
                )
                break

            # Try fallback method
            try:
                context = await self._load_via_separate_calls(
                    conversation_id, jwt_token, user_id
                )
                if context.bundles:
                    return context
                await asyncio.sleep(0.5)
            except Exception as e:
                logger.warning(f"Fallback load failed: {str(e)}")
                await asyncio.sleep(0.5)

        # Return what we can get
        try:
            context_result = await load_conversation_context(conversation_id)
            return (
                context_result["data"]
                if context_result["success"]
                else ConversationContext(messages=[], bundles=[])
            )
        except:
            return ConversationContext(messages=[], bundles=[])

    async def _load_from_database_with_retries_admin(
        self, conversation_id: str, user_id: Optional[str]
    ) -> ConversationContext:
        """Load from database with retries using admin client"""
        for attempt in range(self.pending_analysis_max_retries):
            try:
                # Use the conversation_attachments with admin client (it already uses admin client)
                context_result = await load_conversation_context(conversation_id)
                if context_result["success"]:
                    context = context_result["data"]
                    if context.bundles or not any(True for _ in context.bundles):
                        return context
                    await asyncio.sleep(0.5)
                    continue
            except Exception as e:
                logger.warning(f"Admin RPC load failed: {str(e)}")
                await asyncio.sleep(0.5)

        # Return what we can get
        try:
            context_result = await load_conversation_context(conversation_id)
            return (
                context_result["data"]
                if context_result["success"]
                else ConversationContext(messages=[], bundles=[])
            )
        except:
            return ConversationContext(messages=[], bundles=[])

    async def _load_via_separate_calls(
        self, conversation_id: str, jwt_token: str, user_id: Optional[str]
    ) -> ConversationContext:
        """
        Load context using separate database calls (fallback method).

        This replicates your original cache system's approach.
        """
        if not user_id:
            # Can't use separate calls without user_id
            raise ValueError("user_id required for separate call loading")

        # Load messages and bundles separately
        messages = await self.message_service.get_conversation_messages(
            conversation_id, jwt_token
        )
        bundles = await self.context_bundle_service.get_bundles_by_conversation(
            conversation_id, jwt_token
        )

        # Convert to proper typed objects (this is complex - RPC does it for us)
        from ..db.base_service import ConversationAttachmentsService

        service = ConversationAttachmentsService()

        langchain_messages = service._convert_messages_to_langchain(messages)
        workout_bundles = service._convert_bundles_to_workout_data(bundles)

        return ConversationContext(messages=langchain_messages, bundles=workout_bundles)

    def _is_cached_and_valid(self, conversation_id: str) -> bool:
        """Check if conversation is cached and not expired."""
        if conversation_id not in self._cache:
            return False
        return datetime.now() < self._cache[conversation_id]["expires_at"]

    def _store_in_cache(self, conversation_id: str, context: ConversationContext):
        """Store context in cache with expiration."""
        now = datetime.now()
        self._cache[conversation_id] = {
            "context": context,
            "expires_at": now + timedelta(minutes=self.cache_expiry_minutes),
            "last_accessed": now,
        }
        logger.info(
            f"💾 CACHED: Stored context for conversation: {conversation_id} (expires in {self.cache_expiry_minutes} min)"
        )

    def _update_last_accessed(self, conversation_id: str):
        """Update last accessed time for cache entry."""
        self._cache[conversation_id]["last_accessed"] = datetime.now()


# Single shared instance - you just import and use this
conversation_context_service = ConversationContextService()
