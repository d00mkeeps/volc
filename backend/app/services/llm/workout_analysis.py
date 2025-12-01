import logging
from fastapi import WebSocket
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from ..chains.workout_analysis_chain import WorkoutAnalysisChain
from ..db.message_service import MessageService
from ..db.analysis_service import AnalysisBundleService
from .performance_profiler import PerformanceProfiler
from ..telemetry.llm_logger import llm_telemetry_logger
import time

logger = logging.getLogger(__name__)

class WorkoutAnalysisLLMService:
    """Service for LLM interpretation of workout data"""
    
    def __init__(self, credentials=None, project_id=None, enable_profiling: bool = True):
        self._conversation_chains = {}
        self.message_service = MessageService()
        self.analysis_bundle_service = AnalysisBundleService()
        self.credentials = credentials  
        self.project_id = project_id
        self.enable_profiling = enable_profiling
        
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
        
        # Initialize profiler
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
            
            # Load conversation context (messages only)
            profiler.start_phase("context_loading")
            from app.services.context.conversation_context_service import conversation_context_service
            
            logger.info("Loading conversation context via unified service")
            context = await conversation_context_service.load_context_admin(conversation_id, user_id)
            profiler.end_phase(
                messages_count=len(context.messages),
                bundles_count=0  # We don't use conversation bundles anymore
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
            
            # Load user's basic bundle (instead of conversation-specific bundles)
            from app.services.workout_analysis.schemas import UserContextBundle
           

            # Load user's basic bundle (deserialization handled by analysis_service)
            bundle_result = await self.analysis_bundle_service.get_latest_analysis_bundle_admin(user_id)
            if bundle_result.get('success') and bundle_result.get('data'):
                # bundle is already a UserContextBundle Pydantic object
                bundle = bundle_result['data']
                chain.load_bundles([bundle])
                logger.info(f"✅ Loaded basic bundle {bundle.id} for user {user_id}")
            else:
                logger.info(f"ℹ️  No basic bundle found for user {user_id}")




            profiler.end_phase()

            # Handle conversation flow (no proactive messages)
            profiler.start_phase("conversation_flow_decision")
            has_messages = len(context.messages) > 0
            has_bundle = bundle_result.get('success') and bundle_result.get('data')
            
            if not has_messages and has_bundle:
                logger.info("New conversation with workout data - bundle available for context")
                profiler.end_phase(flow="new_conversation_with_bundle")
            elif not has_messages and not has_bundle:
                logger.info("Empty conversation - waiting for user input")
                profiler.end_phase(flow="empty_conversation")
            else:
                logger.info(f"Existing conversation loaded with {len(context.messages)} messages")
                profiler.end_phase(flow="existing_conversation")

            # Log initial setup summary
            profiler.log_summary()
            
            # Process messages
            while True:
                data = await websocket.receive_json()
                
                # Start profiling each message
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
                    llm_start_time = time.time()
                    full_ai_response = ""
                    first_token = True
                    token_count = 0
                    input_tokens = 0
                    output_tokens = 0
                    
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
                        
                        # Capture token usage from response metadata if available
                        if response.get("type") == "complete":
                            metadata = response.get("data", {})
                            if "usage_metadata" in metadata:
                                usage = metadata["usage_metadata"]
                                input_tokens = usage.get("input_tokens", 0)
                                output_tokens = usage.get("output_tokens", 0)
                    
                    llm_latency_ms = int((time.time() - llm_start_time) * 1000)
                    
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
                    
                    # Log LLM telemetry
                    # If we didn't get token counts from metadata, estimate them
                    if input_tokens == 0 and output_tokens == 0:
                        # Rough estimation: ~4 chars per token
                        input_tokens = len(message) // 4
                        output_tokens = len(full_ai_response) // 4
                    
                    await llm_telemetry_logger.log_llm_request(
                        path=f"/api/llm/workout-analysis/{conversation_id}",
                        user_id=user_id,
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        latency_ms=llm_latency_ms,
                        model_name="gemini-2.5-flash",
                        status_code=200
                    )
                    
                    
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
            
            # Trigger memory extraction on disconnect
            if "WebSocketDisconnect" in str(type(e).__name__) or "1006" in str(e):
                from app.core.utils.websocket_utils import trigger_memory_extraction
                await trigger_memory_extraction(user_id, conversation_id)
            
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