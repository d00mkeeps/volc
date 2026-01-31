from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.cache.conversation_attachments_cache import conversation_cache

scheduler = AsyncIOScheduler()


def start_cleanup_job():
    scheduler.add_job(
        conversation_cache.cleanup_expired, "interval", minutes=30, id="cache_cleanup"
    )
    scheduler.start()
