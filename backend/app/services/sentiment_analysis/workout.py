# workout.py
import json
import logging
from .base import BaseSentimentAnalyzer
from typing import Dict, List
from langchain_core.messages import HumanMessage, AIMessage

logger = logging.Logger(__name__)
class WorkoutSentimentAnalyzer(BaseSentimentAnalyzer):
    async def analyze_sentiment(self, message: str, current_summary: Dict, messages: List[HumanMessage | AIMessage] = None) -> bool:
        """Analyze if user approves of the workout summary."""
        if not current_summary:
            return False
            
        if messages:
            if len(messages) < 2 or not isinstance(messages[-2], AIMessage):
                return False
                
            last_ai_message = messages[-2].content
            
            # Only analyze if the last message asked for confirmation
            if "Does this look correct?" not in last_ai_message:
                return False
                
            sentiment_messages = [
                HumanMessage(content=f"""Last AI Message: {last_ai_message}
        User Response: {message}""")
            ]
        else:
            # Fallback to base class format
            sentiment_messages = [
                HumanMessage(content=f"""Summary: {json.dumps(current_summary, indent=2)}
    User's Response: {message}""")
            ]

        try:
            result = await self.sentiment_chain.ainvoke({"messages": sentiment_messages})
            response = result.content.strip()
            logger.info(f"Sentiment analysis raw response: '{response}'")
            return response == "APPROVE"
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return False