# workout.py
import asyncio
import logging
from .base import BaseSentimentAnalyzer
from typing import Optional, List
from langchain_core.messages import HumanMessage, AIMessage

logger = logging.Logger(__name__)
class WorkoutSentimentAnalyzer(BaseSentimentAnalyzer):
    async def analyze_sentiment(
        self,
        response: str,
        current_summary: Optional[dict],
        messages: List[HumanMessage | AIMessage],
        max_retries: int = 3
    ) -> Optional[bool]:
        if not current_summary or len(messages) < 2 or not isinstance(messages[-2], AIMessage):
            return False

        sentiment_messages = [
            HumanMessage(content=f"""Last AI Message: {messages[-2].content}
User Response: {response}

Only return APPROVE if both:
1. The AI's last message contains a workout summary
2. The user's response indicates approval""")
        ]

        for attempt in range(max_retries):
            try:
                result = await self.sentiment_chain.ainvoke({"messages": sentiment_messages})
                return result.content.strip() == "APPROVE"
            except Exception as e:
                if "overloaded_error" in str(e) and attempt < max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))
                    continue
                logger.error(f"Error in sentiment analysis: {str(e)}")
                return False