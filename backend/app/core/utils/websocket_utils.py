"""
WebSocket utilities for LLM endpoints.

Provides shared functionality for WebSocket handlers including
memory extraction on disconnect.
"""
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def trigger_memory_extraction(
    user_id: str,
    conversation_id: str
) -> None:
    """
    Trigger memory extraction as a background task.
    
    This should be called when a WebSocket disconnects to extract
    and store conversation insights in the user's ai_memory.
    
    Args:
        user_id: User's ID
        conversation_id: Conversation ID
    """
    logger.info(f"Triggering memory extraction for conversation {conversation_id}")
    
    try:
        from app.services.memory.memory_service import MemoryExtractionService
        from app.api.endpoints.llm import get_google_credentials
        
        credentials_data = get_google_credentials()
        memory_service = MemoryExtractionService(
            credentials=credentials_data["credentials"],
            project_id=credentials_data["project_id"]
        )
        
        # Create background task
        asyncio.create_task(
            memory_service.extract_memory(user_id, conversation_id)
        )
        
        logger.info(f"✅ Memory extraction task created for conversation {conversation_id}")
        
    except Exception as e:
        logger.error(f"Failed to trigger memory extraction: {str(e)}", exc_info=True)
