from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ExerciseDefinitionCache:
    """
    In-memory cache for exercise definitions.
    Refreshes hourly to keep data current without DB hits on every request.
    """
    
    _cache: Optional[List[Dict[str, Any]]] = None
    _last_refresh: Optional[datetime] = None
    _refresh_interval = 3600  # 1 hour in seconds
    
    @classmethod
    async def get_all_exercises(cls) -> List[Dict[str, Any]]:
        """
        Get all cached exercises, refresh if stale or empty.
        
        Returns:
            List of exercise definition dicts
        """
        now = datetime.now()
        
        # First load or cache expired
        if cls._cache is None or \
           cls._last_refresh is None or \
           (now - cls._last_refresh).total_seconds() > cls._refresh_interval:
            await cls.refresh()
        
        return cls._cache or []
    
    @classmethod
    async def refresh(cls) -> bool:
        """
        Force refresh the cache from database.
        
        Returns:
            bool: True if refresh successful
        """
        try:
            from app.services.db.exercise_definition_service import ExerciseDefinitionService
            
            service = ExerciseDefinitionService()
            result = await service.get_all_exercise_definitions_admin()
            
            if result.get('success') and result.get('data'):
                cls._cache = result['data']
                cls._last_refresh = datetime.now()
                logger.info(f"✅ Exercise cache refreshed: {len(cls._cache)} exercises loaded")
                return True
            else:
                logger.error(f"❌ Failed to refresh exercise cache: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception refreshing exercise cache: {str(e)}", exc_info=True)
            return False
    
    @classmethod
    def get_cache_stats(cls) -> Dict[str, Any]:
        """Get cache statistics for monitoring/debugging"""
        return {
            "cached_count": len(cls._cache) if cls._cache else 0,
            "last_refresh": cls._last_refresh.isoformat() if cls._last_refresh else None,
            "seconds_since_refresh": (datetime.now() - cls._last_refresh).total_seconds() if cls._last_refresh else None,
            "is_stale": cls._is_stale()
        }
    
    @classmethod
    def _is_stale(cls) -> bool:
        """Check if cache is stale"""
        if cls._last_refresh is None:
            return True
        return (datetime.now() - cls._last_refresh).total_seconds() > cls._refresh_interval


# Singleton instance for easy import
exercise_cache = ExerciseDefinitionCache()