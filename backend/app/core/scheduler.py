from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.cache.conversation_attachments_cache import conversation_cache
from app.services.admin.analytics_aggregator import analytics_aggregator
from app.services.telemetry.keep_alive_service import keep_alive_service
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def start_scheduler_jobs():
    """Start scheduled background jobs"""
    try:
        # Cache cleanup every 30 minutes
        scheduler.add_job(
            conversation_cache.cleanup_expired,
            "interval",
            minutes=30,
            id="cache_cleanup",
            replace_existing=True,
        )
        # Hourly admin metrics query with admin key
        scheduler.add_job(
            analytics_aggregator.refresh_metrics,
            "interval",
            hours=1,
            id="hourly_admin_analytics",
            replace_existing=True,
        )
        # Supabase keep-alive & telemetry ping every 4 hours
        scheduler.add_job(
            keep_alive_service.ping,
            "interval",
            hours=4,
            id="supabase_keep_alive",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("✅ Background scheduler initialized (cache cleanup, admin analytics & Supabase keep-alive).")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
