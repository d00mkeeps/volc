import logging
from fastapi import WebSocket
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from ..chains.workout_planning_chain import WorkoutPlanningChain
from ..db.message_service import MessageService

logger = logging.getLogger(__name__)

class WorkoutPlanningLLMService:
    """Service for LLM-based workout planning conversations"""
    
    def __init__(self, credentials=None, project_id=None):
        self._conversation_chains = {}  # Store chains by user_id for planning
        self.message_service = MessageService()
        self.credentials = credentials  
        self.project_id = project_id 
        
    def get_chain(self, user_id: str) -> WorkoutPlanningChain:
        """Get or create a planning conversation chain"""
        if user_id not in self._conversation_chains:
            # Initialize new LLM
            llm = ChatVertexAI(
                model="gemini-2.5-flash",
                streaming=True,
                max_retries=0,
                temperature=0,
                credentials=self.credentials,
                project=self.project_id
            )
                    
            # Create new planning chain
            self._conversation_chains[user_id] = WorkoutPlanningChain(
                llm=llm,
                user_id=user_id
            )
            
        return self._conversation_chains[user_id]
        
    async def process_websocket(self, websocket: WebSocket, user_id: str):
        """Process WebSocket connection for workout planning"""
        try:
            await websocket.accept()
            logger.info(f"Workout planning WebSocket connection accepted for user: {user_id}")
            
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Get or create planning chain
            chain = self.get_chain(user_id)

            # Load user profile into chain
            logger.info(f"Loading user profile for planning session: {user_id}")
            profile_loaded = await chain.load_user_profile()
            if profile_loaded:
                logger.info(f"User profile loaded successfully for planning: {user_id}")
            else:
                logger.info(f"No user profile available for planning: {user_id} - continuing with generic prompts")

            # Send proactive greeting message (no conversation_id yet)
            logger.info("New planning session - sending proactive greeting")
            
            full_response_content = ""
            async for response in chain.process_message("Start workout planning conversation"):
                await websocket.send_json(response)
                if response.get("type") == "content":
                    full_response_content += response.get("data", "")
            
            logger.info(f"Sent proactive planning greeting for user {user_id}")

            # Process messages (no saving for now since we don't have conversation_id)
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
                    
                    # RATE LIMIT CHECK FIRST
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
                    
                    # Process message through chain (no database saves for now)
                    full_ai_response = ""
                    async for response in chain.process_message(message):
                        await websocket.send_json(response)
                        if response.get("type") == "content":
                            full_ai_response += response.get("data", "")
                    
                    logger.info(f"Processed planning message for user {user_id}")
                    
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
            logger.error(f"Error in planning websocket: {str(e)}", exc_info=True)
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