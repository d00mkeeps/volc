import logging
import asyncio
from typing import Dict, Any, Optional
from app.services.db.user_profile_service import UserProfileService
from app.services.db.context_service import ContextBundleService
from app.services.cache.glossary_terms import glossary_cache

logger = logging.getLogger(__name__)

class SharedContextLoader:
    """
    Loads all shared context once per WebSocket connection.
    Replaces duplicated context loading across separate services.
    """
    
    # Simple in-memory cache: {user_id: {'data': context, 'timestamp': float}}
    _cache: Dict[str, Dict] = {}
    _CACHE_TTL = 300  # 5 minutes

    def __init__(self):
        self.profile_service = UserProfileService()
        self.bundle_service = ContextBundleService()
    
    @classmethod
    def invalidate_bundle_cache(cls, user_id: str):
        """Invalidate cache for a specific user"""
        if user_id in cls._cache:
            logger.info(f"🧹 Invalidating shared context cache for user: {user_id}")
            del cls._cache[user_id]

    async def load_all(self, user_id: str) -> Dict[str, Any]:
        """
        Load all shared context for a user in parallel.
        Uses in-memory cache to reduce database load.
        
        Returns:
            {
                "user_id": str,
                "profile": dict | None,
                "bundle": UserContextBundle | None,
                "glossary_terms": list,
                "has_profile": bool,
                "has_bundle": bool
            }
        """
        import time
        
        # Check cache
        if user_id in self._cache:
            cache_entry = self._cache[user_id]
            if time.time() - cache_entry['timestamp'] < self._CACHE_TTL:
                logger.info(f"✅ Served shared context from cache for user: {user_id}")
                return cache_entry['data']
        
        logger.info(f"🔄 Loading shared context for user: {user_id}")
        
        # Run fetches in parallel
        profile_task = self.profile_service.get_user_profile_admin(user_id)
        bundle_task = self.bundle_service.get_latest_context_bundle_admin(user_id)
        glossary_task = glossary_cache.get_all_terms()
        
        results = await asyncio.gather(profile_task, bundle_task, glossary_task, return_exceptions=True)
        
        profile_result = results[0]
        bundle_result = results[1]
        glossary_result = results[2]
        
        context = {
            "user_id": user_id,
            "profile": None,
            "bundle": None,
            "glossary_terms": [],
            "has_profile": False,
            "has_bundle": False
        }
        
        # Process Profile Result
        if isinstance(profile_result, Exception):
            logger.error(f"❌ Failed to load profile: {str(profile_result)}")
        elif isinstance(profile_result, dict) and profile_result.get('success') and profile_result.get('data'):
            context["profile"] = profile_result['data']
            context["has_profile"] = True
            logger.info("✅ User profile loaded")
        else:
            logger.warning(f"⚠️ Profile load returned success=False or no data: {profile_result}")

        # Process Bundle Result
        if isinstance(bundle_result, Exception):
            logger.error(f"❌ Failed to load bundle: {str(bundle_result)}")
        elif isinstance(bundle_result, dict) and bundle_result.get('success') and bundle_result.get('data'):
            context["bundle"] = bundle_result['data']
            context["has_bundle"] = True
            logger.info("✅ Analysis bundle loaded")
        else:
            logger.warning(f"⚠️ Bundle load returned success=False or no data: {bundle_result}")
        
        # Process Glossary Result
        if isinstance(glossary_result, Exception):
            logger.error(f"❌ Failed to load glossary: {str(glossary_result)}")
        elif isinstance(glossary_result, list):
            context["glossary_terms"] = glossary_result
            logger.info(f"✅ Glossary loaded ({len(glossary_result)} terms)")
        else:
            logger.warning(f"⚠️ Glossary load returned unexpected format: {type(glossary_result)}")
            
        # Update cache
        self._cache[user_id] = {
            'data': context,
            'timestamp': time.time()
        }
            
        return context

