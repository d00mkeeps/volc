# from typing import Dict, List, Optional
# import logging
# from langchain_google_vertexai import ChatVertexAI
# from langchain_core.messages import BaseMessage, AIMessage
# from .base import BaseSentimentAnalyzer
# from app.core.prompts.workout_planning_sentiment import (
#     WORKOUT_APPROVAL_SYSTEM_PROMPT,
#     WORKOUT_APPROVAL_ANALYSIS_TEMPLATE
# )

# logger = logging.getLogger(__name__)

# class WorkoutPlanningSentimentAnalyzer(BaseSentimentAnalyzer):
#     """
#     Workout planning specific sentiment analyzer.
    
#     Handles approval detection for workout templates presented to users.
#     """
    
#     def __init__(self, llm: ChatVertexAI):
#         super().__init__(llm)
        
#     def _get_system_prompt(self) -> str:
#         """Get workout planning specific system prompt."""
#         return WORKOUT_APPROVAL_SYSTEM_PROMPT
        
#     async def analyze_approval(
#         self, 
#         message: str, 
#         messages: List[BaseMessage],
#         template_data: Dict
#     ) -> bool:
#         """
#         Analyze if user approves of a workout template.
        
#         Args:
#             message: User's response message
#             messages: Conversation message history  
#             template_data: The workout template that was presented
            
#         Returns:
#             bool: True if user approved, False otherwise
#         """
#         try:
#             # Verify we have the right context - last AI message should contain trigger phrase
#             if len(messages) < 2 or not isinstance(messages[-1], AIMessage):
#                 logger.warning("Invalid message context for approval analysis")
#                 return False
                
#             last_ai_message = messages[-1].content
            
#             # Only analyze if the last AI message asked for confirmation  
#             if "How does this workout look?" not in last_ai_message:
#                 logger.info("No approval trigger phrase found in last AI message")
#                 return False
                
#             # Enhanced context for analysis
#             context = {
#                 "template": template_data,
#                 "last_ai_message": last_ai_message  # Limit for context size
#             }
            
#             # Use base class sentiment analysis with workout-specific formatting
#             result = await self.analyze_sentiment(message, context)
            
#             if result is True:
#                 logger.info("✅ Workout template approval detected")
#                 return True
#             elif result is False:
#                 logger.info("❌ Workout template rejected or unclear response")
#                 return False
#             else:
#                 logger.warning("⚠️ Sentiment analysis failed, defaulting to no approval")
#                 return False
                
#         except Exception as e:
#             logger.error(f"Error in workout planning sentiment analysis: {str(e)}", exc_info=True)
#             return False
            


#     def _format_analysis_input(self, message: str, context: Optional[dict] = None) -> str:
#         """Format input for workout planning sentiment analysis using template."""
#         try:
#             if context and 'last_ai_message' in context:
#                 # Use the template from prompts
#                 ai_context = context['last_ai_message']
                
#                 # LOG THE TEMPLATE USAGE
#                 logger.info("🎯 WORKOUT SENTIMENT FORMATTING:")
#                 logger.info(f"   Template: '{WORKOUT_APPROVAL_ANALYSIS_TEMPLATE}'")
#                 logger.info(f"   AI context (last 200 chars): '{ai_context[-200:]}'")
#                 logger.info(f"   User message: '{message}'")
                
#                 formatted_input = WORKOUT_APPROVAL_ANALYSIS_TEMPLATE.format(user_message=message)
#                 logger.info(f"   Final formatted input: '{formatted_input}'")
#                 return formatted_input
#             else:
#                 # Fallback to simple format
#                 logger.info("🎯 USING FALLBACK FORMAT (no context)")
#                 fallback = f"User Response: {message}"
#                 logger.info(f"   Fallback input: '{fallback}'")
#                 return fallback
#         except Exception as e:
#             logger.error(f"Error formatting analysis input: {str(e)}", exc_info=True)
#             # Emergency fallback
#             return f"User said: '{message}'"