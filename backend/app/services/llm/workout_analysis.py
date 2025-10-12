import logging
from fastapi import WebSocket
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from ..chains.workout_analysis_chain import WorkoutAnalysisChain
from ..db.message_service import MessageService
from ..db.analysis_service import AnalysisBundleService
from .performance_profiler import PerformanceProfiler  # NEW

logger = logging.getLogger(__name__)

class WorkoutAnalysisLLMService:
    """Service for LLM interpretation of workout data"""
    
    def __init__(self, credentials=None, project_id=None, enable_profiling: bool = True):  # NEW
        self._conversation_chains = {}
        self.message_service = MessageService()
        self.analysis_bundle_service = AnalysisBundleService()
        self.credentials = credentials  
        self.project_id = project_id
        self.enable_profiling = enable_profiling  # NEW
        
    def get_chain(self, conversation_id: str, user_id: str = None) -> WorkoutAnalysisChain:
        """Get or create a conversation chain"""
        if conversation_id not in self._conversation_chains:
            llm = ChatVertexAI(
                model="gemini-2.5-flash",
                streaming=True,
                max_retries=0,
                temperature=0,
                credentials=self.credentials,
                project=self.project_id
            )
                    
            self._conversation_chains[conversation_id] = WorkoutAnalysisChain(
                llm=llm,
                user_id=user_id or conversation_id
            )
            
        return self._conversation_chains[conversation_id]
        
    async def process_websocket(self, websocket: WebSocket, conversation_id: str, user_id: str):
        """Process WebSocket connection for workout analysis interpretation"""
        
        # NEW: Initialize profiler
        profiler = PerformanceProfiler(conversation_id, enabled=self.enable_profiling)
        
        try:
            profiler.start_phase("websocket_accept")
            await websocket.accept()
            logger.info(f"WebSocket connection accepted for conversation: {conversation_id}")
            profiler.end_phase()
            
            profiler.start_phase("connection_confirmation")
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            profiler.end_phase()
            
            # Load conversation context
            profiler.start_phase("context_loading")
            from app.services.context.conversation_context_service import conversation_context_service
            
            logger.info("Loading conversation context via unified service")
            context = await conversation_context_service.load_context_admin(conversation_id, user_id)
            profiler.end_phase(
                messages_count=len(context.messages),
                bundles_count=len(context.bundles)
            )
            
            # Get or create conversation chain
            profiler.start_phase("chain_initialization")
            chain = self.get_chain(conversation_id, user_id)
            profiler.end_phase()

            # Load user profile
            profiler.start_phase("user_profile_loading")
            if conversation_id not in self._conversation_chains or not hasattr(chain, '_user_profile') or chain._user_profile is None:
                logger.info(f"Loading user profile for conversation: {conversation_id}")
                profile_loaded = await chain.load_user_profile()
                profiler.end_phase(profile_loaded=profile_loaded)
                if profile_loaded:
                    logger.info(f"User profile loaded successfully for conversation: {conversation_id}")
                else:
                    logger.info(f"No user profile available for conversation: {conversation_id}")
            else:
                profiler.end_phase(cached=True)

            # Load context into chain
            profiler.start_phase("context_injection")
            chain.load_conversation_context(context)
            if context.bundles:
                chain.load_bundles(context.bundles)
            profiler.end_phase()

            # Handle proactive message or existing conversation
            profiler.start_phase("conversation_flow_decision")
            if not context.messages and context.bundles:
                logger.info("New conversation with workout data - sending proactive analysis")
                profiler.end_phase(flow="proactive_message")
                
                profiler.start_phase("proactive_message_generation")
                full_response_content = ""
                first_token = True
                
                async for response in chain.process_message("Analyze my workout"):
                    if first_token and response.get("type") == "content":
                        profiler.end_phase()  # End generation, start streaming
                        profiler.start_phase("proactive_message_streaming")
                        first_token = False
                        
                    await websocket.send_json(response)
                    if response.get("type") == "content":
                        full_response_content += response.get("data", "")
                
                if not first_token:  # If we started streaming
                    profiler.end_phase(response_length=len(full_response_content))
                
                # Save message
                profiler.start_phase("save_proactive_message")
                if full_response_content:
                    await self.message_service.save_server_message(
                        conversation_id=conversation_id,
                        content=full_response_content,
                        sender="assistant"
                    )
                    await conversation_context_service.refresh_context(conversation_id, user_id)
                    logger.info(f"Saved proactive AI message for conversation {conversation_id}")
                profiler.end_phase()

            elif not context.messages and not context.bundles:
                logger.info("Empty conversation - waiting for user input")
                profiler.end_phase(flow="empty_conversation")
            else:
                logger.info(f"Existing conversation loaded with {len(context.messages)} messages and {len(context.bundles)} bundles")
                profiler.end_phase(flow="existing_conversation")

            # Log initial setup summary
            profiler.log_summary()
            
            # Process messages
            while True:
                data = await websocket.receive_json()
                
                # NEW: Start profiling each message
                message_profiler = PerformanceProfiler(
                    f"{conversation_id}-msg", 
                    enabled=self.enable_profiling
                )
                
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
                    
                    # Rate limit check
                    message_profiler.start_phase("rate_limit_check")
                    if user_id:
                        from app.services.rate_limiter import rate_limiter
                        rate_check = await rate_limiter.check_rate_limit(user_id, "message_send", "")
                        
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
                                    "message": f"Message rate limit exceeded. Try again at {rate_limit_data['reset_at']}",
                                    "remaining": 0,
                                    "reset_at": rate_limit_data["reset_at"]
                                }
                            })
                            continue
                    message_profiler.end_phase()
                    
                    # Save user message
                    message_profiler.start_phase("save_user_message")
                    user_msg = await self.message_service.save_server_message(
                        conversation_id=conversation_id,
                        content=message, 
                        sender="user"
                    )
                    if user_msg.get('success') != False:
                        logger.info(f"Saved user message with ID: {user_msg.get('id')}")
                    message_profiler.end_phase()
                    
                    # Process message through chain
                    message_profiler.start_phase("llm_processing")
                    full_ai_response = ""
                    first_token = True
                    token_count = 0
                    
                    async for response in chain.process_message(message):
                        if first_token and response.get("type") == "content":
                            message_profiler.end_phase()  # Time to first token
                            message_profiler.start_phase("llm_streaming")
                            first_token = False
                            
                        await websocket.send_json(response)
                        if response.get("type") == "content":
                            content = response.get("data", "")
                            full_ai_response += content
                            token_count += len(content.split())  # Rough count
                    
                    if not first_token:
                        message_profiler.end_phase(
                            token_count=token_count,
                            response_length=len(full_ai_response)
                        )
                    
                    # Save AI response
                    message_profiler.start_phase("save_ai_message")
                    if full_ai_response:
                        ai_msg = await self.message_service.save_server_message(
                            conversation_id=conversation_id,
                            content=full_ai_response,
                            sender="assistant" 
                        )
                        if ai_msg.get('success') != False:
                            logger.info(f"Saved AI response with ID: {ai_msg.get('id')}")
                    message_profiler.end_phase()
                    
                    # Log message processing summary
                    message_profiler.log_summary()
                    
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