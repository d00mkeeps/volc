import logging
import asyncio
from fastapi import WebSocket
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from ..chains.workout_analysis_chain import WorkoutAnalysisChain
from ..db.message_service import MessageService
from ..db.analysis_service import AnalysisBundleService

logger = logging.getLogger(__name__)

class WorkoutAnalysisLLMService:
    """Service for LLM interpretation of workout data"""
    
    def __init__(self):
        self._conversation_chains = {}  # Store chains by conversation_id
        self.message_service = MessageService()
        self.analysis_bundle_service = AnalysisBundleService()
        
    def get_chain(self, conversation_id: str, user_id: str = None) -> WorkoutAnalysisChain:
        """Get or create a conversation chain"""
        if conversation_id not in self._conversation_chains:
            # Initialize new LLM
            llm = ChatVertexAI(
                model="gemini-2.5-flash",
                streaming=True,
                max_retries=0,
                temperature=0
            )
                    
            # Create new chain
            self._conversation_chains[conversation_id] = WorkoutAnalysisChain(
                llm=llm,
                user_id=user_id or conversation_id
            )
            
        return self._conversation_chains[conversation_id]
        
    async def process_websocket(self, websocket: WebSocket, conversation_id: str, user_id: str):
        """Process WebSocket connection for workout analysis interpretation"""
        try:
            await websocket.accept()
            logger.info(f"WebSocket connection accepted for conversation: {conversation_id}")
            
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Load complete conversation context with unified service
            from app.services.context.conversation_context_service import conversation_context_service
            
            logger.info("Loading conversation context via unified service")
            context = await conversation_context_service.load_context_admin(conversation_id, user_id)
            
            # Get or create conversation chain
            chain = self.get_chain(conversation_id, user_id)

            # Load user profile into chain (NEW - load once when chain is created)
            if conversation_id not in self._conversation_chains or not hasattr(chain, '_user_profile') or chain._user_profile is None:
                logger.info(f"Loading user profile for conversation: {conversation_id}")
                profile_loaded = await chain.load_user_profile()
                if profile_loaded:
                    logger.info(f"User profile loaded successfully for conversation: {conversation_id}")
                else:
                    logger.info(f"No user profile available for conversation: {conversation_id} - continuing without user context")

            # Load context into the chain
            chain.load_conversation_context(context)
            if context.bundles:
                chain.load_bundles(context.bundles)

            # Decide conversation flow based on loaded context
            if not context.messages and context.bundles:
                # New conversation WITH workout data - send proactive message
                logger.info("New conversation with workout data - sending proactive analysis")
                
                # Send proactive message (DON'T save the dummy message, only the AI response)
                full_response_content = ""
                async for response in chain.process_message("Analyze my workout"):
                    await websocket.send_json(response)
                    if response.get("type") == "content":
                        full_response_content += response.get("data", "")
                
                # Save the AI's response as the first message
                if full_response_content:
                    await self.message_service.save_server_message(
                        conversation_id=conversation_id,
                        content=full_response_content,
                        sender="assistant"
                    )
                    # Refresh context after saving message
                    await conversation_context_service.refresh_context(conversation_id, user_id)
                    logger.info(f"Saved proactive AI message for conversation {conversation_id}")

            elif not context.messages and not context.bundles:
                # Empty conversation - wait for user input
                logger.info("Empty conversation - waiting for user input")

            else:
                # Existing conversation - context already loaded
                logger.info(f"Existing conversation loaded with {len(context.messages)} messages and {len(context.bundles)} bundles")

            # Process messages
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Handle regular messages
                if data.get('type') == 'message' or 'message' in data:
                    message = data.get('message', '')
                    
                    # RATE LIMIT CHECK FIRST - before any processing
                    if user_id:  # Only rate limit if we have a user_id
                        from app.services.rate_limiter import rate_limiter
                        rate_check = await rate_limiter.check_rate_limit(user_id, "message_send", "")  # Empty JWT
                        
                        if not rate_check.get("success", False):
                            logger.error(f"Rate limiter error: {rate_check.get('error')}")
                            await websocket.send_json({
                                "type": "error", 
                                "data": {"message": "Rate limiting error"}
                            })
                            continue
                            
                        rate_limit_data = rate_check["data"]
                        if not rate_limit_data["allowed"]:
                            logger.info(f"Message rate limit exceeded for user {user_id}")
                            await websocket.send_json({
                                "type": "error",
                                "data": {
                                    "code": "rate_limit",
                                    "message": f"Message rate limit exceeded. You have sent too many messages. Try again at {rate_limit_data['reset_at']}",
                                    "remaining": 0,
                                    "reset_at": rate_limit_data["reset_at"]
                                }
                            })
                            continue  # Skip all processing - no LLM, no database saves
                    
                    # Only proceed if rate limit passed (or no user_id for testing)
                    # Save user message to database
                    user_msg = await self.message_service.save_server_message(
                        conversation_id=conversation_id,
                        content=message, 
                        sender="user"
                    )
                    if user_msg.get('success') != False:
                        logger.info(f"Saved user message with ID: {user_msg.get('id')}")
                    
                    # Process message through chain and collect AI response
                    full_ai_response = ""
                    async for response in chain.process_message(message):
                        await websocket.send_json(response)
                        if response.get("type") == "content":
                            full_ai_response += response.get("data", "")
                    
                    # Save AI response to database
                    if full_ai_response:
                        ai_msg = await self.message_service.save_server_message(
                            conversation_id=conversation_id,
                            content=full_ai_response,
                            sender="assistant" 
                        )
                        if ai_msg.get('success') != False:
                            logger.info(f"Saved AI response with ID: {ai_msg.get('id')}")
        except google.api_core.exceptions.ResourceExhausted as e:
            logger.error(f"Rate limit exceeded: {str(e)}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "code": "rate_limit",
                        "message": f"Rate limit exceeded. Please try again later.",
                        "retry_after": 60
                    }
                })
            except:
                pass
                
        except Exception as e:
            logger.error(f"Error in LLM websocket: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "message": f"Connection error: {str(e)}"
                    }
                })
                await websocket.close(code=1011)
            except:
                pass