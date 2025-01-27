import asyncio
import json
import logging
from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.prompts.sentiment_analysis import SENTIMENT_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
   def __init__(self, chat_model: ChatAnthropic):
       self.sentiment_prompt = ChatPromptTemplate.from_messages([
           SystemMessage(content=SENTIMENT_ANALYSIS_PROMPT),
           MessagesPlaceholder(variable_name="messages"),
           HumanMessage(content="{current_message}")
       ]).partial(current_message="")
       
       self.sentiment_chain = self.sentiment_prompt | chat_model

   async def analyze_sentiment(self, response: str, current_summary: Optional[dict], max_retries: int = 3) -> Optional[bool]:
       if not current_summary:
           return False

       sentiment_messages = [
           HumanMessage(content=f"""Summary: {json.dumps(current_summary, indent=2)}
User's Response: {response}""")
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