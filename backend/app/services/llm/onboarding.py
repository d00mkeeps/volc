import logging
from fastapi import WebSocket
import google.api_core.exceptions
from starlette.websockets import WebSocketDisconnect
from langchain_google_vertexai import ChatVertexAI
from ..chains.onboarding_chain import OnboardingChain

logger = logging.getLogger(__name__)


class OnboardingLLMService:
    """Service for LLM-based onboarding conversations"""
    
    def __init__(self, credentials=None, project_id=None):
        self._conversation_chains = {}
        self.credentials = credentials
        self.project_id = project_id
        
    def get_chain(self, user_id: str) -> OnboardingChain:
        """Get or create an onboarding conversation chain"""
        if user_id not in self._conversation_chains:
            # Initialize new LLM
            llm = ChatVertexAI(
                model="gemini-2.5-flash",
                streaming=True,
                max_retries=0,
                temperature=0.7,  # Slightly higher for more natural conversation
                credentials=self.credentials,
                project=self.project_id
            )
            
            # Create chain
            chain = OnboardingChain(llm=llm, user_id=user_id)
            self._conversation_chains[user_id] = chain
            
        return self._conversation_chains[user_id]
    
    async def process_websocket(self, websocket: WebSocket, user_id: str):
        """Process WebSocket connection for onboarding"""
        
        try:
            await websocket.accept()
            logger.info(f"Onboarding WebSocket connection accepted for user: {user_id}")
            
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Get or create onboarding chain
            chain = self.get_chain(user_id)
            
            # Track if we need to send greeting
            first_message = True
            
            # Process ongoing conversation messages
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
                    conversation_history = data.get('conversation_history', [])
                    
                    # On first message, check if we should send greeting
                    if first_message:
                        first_message = False
                        
                        if len(conversation_history) == 0:
                            # New conversation - send greeting first
                            logger.info("📝 New onboarding conversation - sending greeting")
                            
                            async for response in chain.process_message("Start onboarding conversation"):
                                await websocket.send_json(response)
                            
                            logger.info(f"Sent onboarding greeting for user {user_id}")
                        else:
                            # Reconnection - restore history
                            logger.info(f"🔄 Reconnection detected ({len(conversation_history)} messages) - restoring history")
                            
                            from langchain_core.messages import HumanMessage, AIMessage
                            
                            for hist_msg in conversation_history:
                                sender = hist_msg.get('sender')
                                content = hist_msg.get('content', '')
                                
                                if sender == 'user':
                                    chain.messages.append(HumanMessage(content=content))
                                elif sender == 'assistant':
                                    chain.messages.append(AIMessage(content=content))
                            
                            logger.info(f"✅ Restored {len(chain.messages)} messages to chain")
                    
                    # Skip greeting trigger message
                    if message == "__GREETING_TRIGGER__":
                        logger.info("Skipping greeting trigger message")
                        continue
                    
                    # Rate limit check
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
                    
                    # Process message through chain
                    async for response in chain.process_message(message):
                        # Handle onboarding completion
                        if response.get("type") == "onboarding_complete":
                            logger.info(f"🎉 Onboarding completed for user {user_id}")
                            logger.info(f"Profile data: {response.get('data')}")
                            await websocket.send_json(response)
                            continue
                            
                        # Handle regular content
                        await websocket.send_json(response)
                    
                    logger.info(f"✅ Message processed for user {user_id}")
                            
        except google.api_core.exceptions.ResourceExhausted as e:
            logger.error(f"Vertex AI rate limit exceeded: {str(e)}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "code": "rate_limit",
                        "message": "AI service rate limit exceeded. Please try again later.",
                        "retry_after": 60
                    }
                })
            except Exception:
                logger.error("Failed to send rate limit error response")
        
        except WebSocketDisconnect as e:
            # Normal closure (1000) or client-initiated close (1001) are expected
            if e.code in [1000, 1001]:
                logger.info(f"WebSocket closed normally: code={e.code}, reason={e.reason}")
            else:
                logger.warning(f"WebSocket disconnected unexpectedly: code={e.code}, reason={e.reason}")
                
        except Exception as e:
            logger.error(f"Error in onboarding websocket: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "message": f"Connection error: {str(e)}"
                    }
                })
                await websocket.close(code=1011)
            except Exception:
                logger.error("Failed to send error response or close websocket")
    
    def reset_chain(self, user_id: str) -> bool:
        """Reset onboarding chain for user (useful for testing or restarts)"""
        try:
            if user_id in self._conversation_chains:
                del self._conversation_chains[user_id]
                logger.info(f"Reset onboarding chain for user: {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error resetting chain for user {user_id}: {str(e)}")
            return False
    
    def get_chain_state(self, user_id: str) -> dict:
        """Get current state of onboarding chain for debugging/monitoring"""
        if user_id in self._conversation_chains:
            chain = self._conversation_chains[user_id]
            return {
                "user_id": user_id,
                "messages_count": len(chain.messages),
                "is_complete": chain.is_complete,
                "has_profile_data": chain.profile_data is not None,
                "profile_data": chain.profile_data
            }
        return {"error": "No chain found for user"}