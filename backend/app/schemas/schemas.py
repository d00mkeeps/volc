from typing import List, NamedTuple
from ..services.workout_analysis.schemas import UserContextBundle
from langchain_core.messages import BaseMessage


class ConversationContext(NamedTuple):
    """Structured conversation context data"""

    messages: List[BaseMessage]
    bundles: List[UserContextBundle]
