# backend/app/services/cache/glossary_terms.py
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.services.db.glossary_service import glossary_service
import logging

logger = logging.getLogger(__name__)


class GlossaryTermCache:
    """
    In-memory cache for glossary terms.
    Terms rarely change, so we use a 24-hour TTL.
    """
    
    def __init__(self):
        self._cache: Optional[List[Dict]] = None
        self._cache_by_id: Optional[Dict[str, Dict]] = None
        self._last_refresh: Optional[datetime] = None
        self._cache_ttl = timedelta(hours=24)
    
    async def get_all_terms(self) -> List[Dict]:
        """Get all terms from cache (refreshes if stale)"""
        if self._should_refresh():
            await self.refresh()
        return self._cache or []
    
    async def get_term_by_id(self, term_id: str) -> Optional[Dict]:
        """Get single term by ID from cache"""
        if self._should_refresh():
            await self.refresh()
        return self._cache_by_id.get(term_id) if self._cache_by_id else None
    
    async def refresh(self):
        """Force refresh from database using admin client"""
        try:
            logger.info("🔄 Refreshing glossary cache")
            result = await glossary_service.get_all_glossary_terms_admin()
            
            if result.get("success"):
                self._cache = result.get("data", [])
                self._cache_by_id = {t["id"]: t for t in self._cache}
                self._last_refresh = datetime.now()
                logger.info(f"✅ Glossary cache refreshed: {len(self._cache)} terms")
            else:
                logger.error(f"❌ Failed to refresh glossary cache: {result.get('error')}")
        except Exception as e:
            logger.error(f"❌ Error refreshing glossary cache: {e}")
    
    def _should_refresh(self) -> bool:
        """Check if cache is stale or empty"""
        if not self._cache or not self._last_refresh:
            return True
        return datetime.now() - self._last_refresh > self._cache_ttl
    
    def get_cache_stats(self) -> Dict:
        """Return cache statistics for debugging"""
        return {
            "cached_terms": len(self._cache) if self._cache else 0,
            "last_refresh": self._last_refresh.isoformat() if self._last_refresh else None,
            "is_stale": self._should_refresh()
        }


glossary_cache = GlossaryTermCache()
