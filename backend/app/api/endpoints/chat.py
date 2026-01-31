from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Optional
import logging
from app.api.endpoints.llm import get_google_credentials
from app.services.llm.chat_action_service import ChatActionService


router = APIRouter()
logger = logging.getLogger(__name__)


def get_chat_action_service(credentials: dict = Depends(get_google_credentials)):
    return ChatActionService(
        credentials=credentials["credentials"], project_id=credentials["project_id"]
    )


@router.post("/api/v1/chat/quick-actions/{user_id}")
async def get_quick_chat_actions(
    user_id: str,
    messages: Optional[List[Dict[str, str]]] = Body(default=None),
    action_service: ChatActionService = Depends(get_chat_action_service),
):
    """
    Get dynamic, contextual chat actions for the user based on their active context.
    Accepts optional 'messages' payload to include recent conversation history without DB lookup.
    """
    try:
        logger.info(
            f"🚀 [ChatAPI] Fetching quick actions for user: {user_id} (Context: {len(messages) if messages else 0} msgs)"
        )
        actions = await action_service.generate_actions(user_id, messages=messages)
        logger.info(f"✅ [ChatAPI] Generated actions: {actions.get('actions', [])}")
        return {"actions": actions["actions"]}
    except Exception as e:
        logger.error(
            f"❌ [ChatAPI] Error generating actions for user {user_id}: {e}",
            exc_info=True,
        )
        # Return empty list or defaults on error to prevent frontend crash
        return {"actions": ["Ready to workout", "Help me plan", "Just chatting"]}
