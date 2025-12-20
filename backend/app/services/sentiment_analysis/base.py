# from typing import Optional
# import logging
# import asyncio
# from langchain_google_vertexai import ChatVertexAI
# from langchain_core.messages import HumanMessage, SystemMessage
# from langchain_core.prompts import ChatPromptTemplate

# logger = logging.getLogger(__name__)

# class BaseSentimentAnalyzer:
#     """
#     Base class for sentiment analysis using current LLM patterns.
#     """
    
#     def __init__(self, llm: ChatVertexAI):
#         self.llm = llm
#         # Simplified prompt structure with better constraints
#         self.sentiment_prompt = ChatPromptTemplate.from_messages([
#             ("system", "{system_prompt}\n\nCRITICAL: You must respond with ONLY one word: either 'APPROVE' or 'REJECT'. Do not provide any explanation, analysis, or additional text."),
#             ("human", "{analysis_input}")
#         ])
#     async def analyze_sentiment(
#         self,
#         message: str,
#         context: Optional[dict] = None,
#         max_retries: int = 3
#     ) -> Optional[bool]:
#         """Analyze sentiment with better error handling and constraints."""
#         try:
#             analysis_input = self._format_analysis_input(message, context)
#             system_prompt = self._get_system_prompt()
            
#             # ADD DETAILED LOGGING HERE
#             logger.info("🔍 SENTIMENT ANALYSIS DEBUG:")
#             logger.info(f"   User message: '{message}'")
#             logger.info(f"   Context keys: {list(context.keys()) if context else 'None'}")
#             logger.info(f"   System prompt: '{system_prompt}'")
#             logger.info(f"   Analysis input: '{analysis_input}'")
            
#             for attempt in range(max_retries):
#                 try:
#                     formatted_messages = self.sentiment_prompt.format_messages(
#                         system_prompt=system_prompt,
#                         analysis_input=analysis_input
#                     )
                    
#                     # LOG THE ACTUAL MESSAGES BEING SENT
#                     logger.info("📤 SENDING TO LLM:")
#                     for i, msg in enumerate(formatted_messages):
#                         logger.info(f"   Message {i+1} ({type(msg).__name__}): '{msg.content}'")
                    
#                     response = await self.llm.ainvoke(formatted_messages)
#                     response_text = response.content.strip().upper()
                    
#                     # LOG THE RESPONSE
#                     logger.info(f"📥 RAW LLM RESPONSE: '{response_text}'")
                    
#                     # More robust response parsing
#                     if "APPROVE" in response_text:
#                         logger.info(f"✅ Sentiment analysis: APPROVE (raw: '{response_text[:50]}...')")
#                         return True
#                     elif "REJECT" in response_text:
#                         logger.info(f"❌ Sentiment analysis: REJECT (raw: '{response_text[:50]}...')")
#                         return False
#                     else:
#                         logger.warning(f"⚠️ Unexpected sentiment response: '{response_text[:100]}...', defaulting to reject")
#                         return False
#                 except Exception as e:
#                     if "overloaded_error" in str(e) and attempt < max_retries - 1:
#                         await asyncio.sleep(1 * (attempt + 1))
#                         continue
#                     raise e
#         except Exception as e:
#             logger.error(f"Error in sentiment analysis: {str(e)}", exc_info=True)
#             return None


#     def _get_system_prompt(self) -> str:
#         """Get system prompt for sentiment analysis."""
#         return """You are analyzing if a user approves or rejects a proposal.

# Examples:
# - "Looks good!" → APPROVE
# - "Yes, that's perfect!" → APPROVE  
# - "Sounds great!" → APPROVE
# - "Can we change [exercise]?" → REJECT
# - "I'm not sure..." → REJECT
# - "Actually, I'd like to do something else instead" → REJECT

# Respond with exactly one word: APPROVE or REJECT."""
    
#     def _format_analysis_input(self, message: str, context: Optional[dict] = None) -> str:
#         """Format input for sentiment analysis."""
#         return f"User said: '{message}'\n\nDoes this show approval or rejection?"