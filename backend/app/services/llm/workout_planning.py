import logging
from fastapi import WebSocket
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from ..chains.workout_planning_chain import WorkoutPlanningChain
from ..db.message_service import MessageService
from ..sentiment_analysis.workout_planning import WorkoutPlanningSentimentAnalyzer

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
                model="gemini-2.5-pro",
                streaming=True,
                max_retries=0,
                temperature=0,
                credentials=self.credentials,
                project=self.project_id
            )
                    
            # Create new planning chain with sentiment analyzer
            chain = WorkoutPlanningChain(llm=llm, user_id=user_id)
            
            # Initialize sentiment analyzer for approval detection
            sentiment_llm = ChatVertexAI(
                model="gemini-2.5-pro",
                streaming=False,  # Non-streaming for sentiment analysis
                max_retries=2,
                temperature=0,
                credentials=self.credentials,
                project=self.project_id
            )
            chain.sentiment_analyzer = WorkoutPlanningSentimentAnalyzer(sentiment_llm)
            
            self._conversation_chains[user_id] = chain
            
        return self._conversation_chains[user_id]

    async def load_planning_context(self, user_id: str) -> dict:
        """Load planning context including exercise definitions, user profile, and recent workout patterns."""
        try:
            logger.info(f"Loading planning context for user: {user_id}")
            
            context = {
                "exercise_definitions": [],
                "user_profile": None,
                "recent_workouts": {
                    "workouts": [],
                    "patterns": {}
                }
            }
            
            # Load exercise definitions using service class admin method
            from app.services.db.exercise_definition_service import ExerciseDefinitionService
            exercise_service = ExerciseDefinitionService()
            definitions_result = await exercise_service.get_all_exercise_definitions_admin()
            
            if definitions_result.get('success') and definitions_result.get('data'):
                context["exercise_definitions"] = definitions_result['data']
                logger.info(f"✅ Loaded {len(definitions_result['data'])} exercise definitions")
            else:
                logger.warning(f"❌ No exercise definitions loaded: {definitions_result.get('error', 'Unknown error')}")
            
            # Load user profile using existing service method
            from app.services.db.user_profile_service import UserProfileService
            profile_service = UserProfileService()
            profile_result = await profile_service.get_user_profile_admin(user_id)
            
            if profile_result.get('success') and profile_result.get('data'):
                context["user_profile"] = profile_result['data']
                logger.info(f"✅ Loaded user profile for planning")
            else:
                logger.warning(f"❌ No user profile loaded: {profile_result.get('error', 'Unknown error')}")
            
            # Load recent workouts using service class admin method
            from app.services.db.workout_service import WorkoutService
            workout_service = WorkoutService()
            workouts_result = await workout_service.get_user_workouts_admin(user_id, days_back=14)
            
            if workouts_result.get('success') and workouts_result.get('data'):
                recent_workouts = workouts_result['data']
                context["recent_workouts"]["workouts"] = recent_workouts
                
                # Analyze patterns
                exercise_frequency = {}
                total_workouts = len(recent_workouts)
                
                for workout in recent_workouts:
                    for exercise in workout.get("workout_exercises", []):
                        exercise_name = exercise.get("name")
                        if exercise_name:
                            exercise_frequency[exercise_name] = exercise_frequency.get(exercise_name, 0) + 1
                
                context["recent_workouts"]["patterns"] = {
                    "total_workouts": total_workouts,
                    "workout_frequency_per_week": round(total_workouts / 2, 1),  # Last 2 weeks
                    "most_frequent_exercises": sorted(exercise_frequency.items(), key=lambda x: x[1], reverse=True)[:5],
                    "exercise_variety": len(exercise_frequency)
                }
                
                logger.info(f"✅ Loaded {total_workouts} recent workouts with {len(exercise_frequency)} unique exercises")
                logger.info(f"📊 Recent workout patterns: {context['recent_workouts']['patterns']}")
            else:
                logger.warning(f"❌ No recent workouts loaded: {workouts_result.get('error', 'Unknown error')}")
            
            # LOG FINAL CONTEXT SUMMARY
            logger.info(f"🎯 FINAL CONTEXT SUMMARY:")
            logger.info(f"   - Exercise definitions: {len(context['exercise_definitions'])}")
            logger.info(f"   - User profile: {'✅' if context['user_profile'] else '❌'}")
            logger.info(f"   - Recent workouts: {context['recent_workouts']['patterns'].get('total_workouts', 0)}")
            
            return context
            
        except Exception as e:
            logger.error(f"❌ Error loading planning context: {str(e)}", exc_info=True)
            return {
                "exercise_definitions": [],
                "user_profile": None,
                "recent_workouts": {"workouts": [], "patterns": {}}
            }

    async def process_websocket(self, websocket: WebSocket, user_id: str):
        """Process WebSocket connection for workout planning with template detection and approval workflow"""
        try:
            await websocket.accept()
            logger.info(f"Workout planning WebSocket connection accepted for user: {user_id}")
            
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Load planning context BEFORE creating chain
            logger.info(f"Loading planning context for user: {user_id}")
            planning_context = await self.load_planning_context(user_id)
            
            # Get or create planning chain (includes sentiment analyzer)
            chain = self.get_chain(user_id)

            # Load user profile into chain (existing pattern)
            logger.info(f"Loading user profile for planning session: {user_id}")
            profile_loaded = await chain.load_user_profile()
            if profile_loaded:
                logger.info(f"User profile loaded successfully for planning: {user_id}")
            else:
                logger.info(f"No user profile available for planning: {user_id} - continuing with generic prompts")

            # Load planning context into chain
            logger.info(f"Loading planning context into chain: {user_id}")
            await chain.load_planning_context(planning_context)

            # Send proactive greeting message with context
            logger.info("New planning session - sending proactive greeting with context")
            
            full_response_content = ""
            async for response in chain.process_message("Start workout planning conversation"):
                # Handle special signals from enhanced process_message
                if response.get("type") == "workout_template_approved":
                    logger.info(f"🎉 Initial template approved by user {user_id} (should not happen in greeting)")
                    await websocket.send_json(response)
                    continue
                    
                await websocket.send_json(response)
                if response.get("type") == "content":
                    full_response_content += response.get("data", "")
            
            logger.info(f"Sent contextual planning greeting for user {user_id}")

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
                    
                    # Process message through enhanced chain with template detection and approval
                    full_ai_response = ""
                    template_approved = False
                    
                    async for response in chain.process_message(message):
                        # Handle special workout template approval signals
                        if response.get("type") == "workout_template_approved":
                            logger.info(f"🎉 Workout template approved by user {user_id}")
                            logger.info(f"Template data: {response.get('data', {}).get('name', 'Unknown')}")
                            
                            # Send approval signal to frontend with structured template data
                            await websocket.send_json({
                                "type": "workout_template_approved",
                                "data": response.get("data")
                            })
                            
                            template_approved = True
                            continue
                            
                        # Handle regular content and other response types
                        await websocket.send_json(response)
                        if response.get("type") == "content":
                            full_ai_response += response.get("data", "")
                    
                    # Log message processing completion
                    if template_approved:
                        logger.info(f"✅ Message processed with template approval for user {user_id}")
                    else:
                        logger.info(f"✅ Message processed normally for user {user_id}")
                        
                        # Log template state for debugging
                        if chain.current_template:
                            logger.info(f"📋 Current template: {chain.current_template.get('name', 'Unknown')}")
                            logger.info(f"🎯 Template presented: {chain.template_presented}")
                    
        except google.api_core.exceptions.ResourceExhausted as e:
            logger.error(f"Vertex AI rate limit exceeded: {str(e)}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "code": "rate_limit",
                        "message": f"AI service rate limit exceeded. Please try again later.",
                        "retry_after": 60
                    }
                })
            except Exception:
                logger.error("Failed to send rate limit error response")
                
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
            except Exception:
                logger.error("Failed to send error response or close websocket")

    def get_chain_state(self, user_id: str) -> dict:
        """Get current state of planning chain for debugging/monitoring"""
        if user_id in self._conversation_chains:
            chain = self._conversation_chains[user_id]
            return {
                "user_id": user_id,
                "messages_count": len(chain.messages),
                "has_template": chain.current_template is not None,
                "template_presented": chain.template_presented,
                "template_name": chain.current_template.get('name') if chain.current_template else None,
                "has_sentiment_analyzer": chain.sentiment_analyzer is not None,
                "has_user_profile": chain._user_profile is not None,
                "exercise_definitions_count": len(chain._exercise_definitions),
                "recent_workouts_count": chain._recent_workouts['patterns'].get('total_workouts', 0)
            }
        return {"error": "No chain found for user"}

    def reset_chain(self, user_id: str) -> bool:
        """Reset planning chain for user (useful for testing or fresh starts)"""
        try:
            if user_id in self._conversation_chains:
                del self._conversation_chains[user_id]
                logger.info(f"Reset planning chain for user: {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error resetting chain for user {user_id}: {str(e)}")
            return False

    async def test_approval_detection(self, user_id: str, test_message: str) -> dict:
        """Test method for approval detection (development/debugging use)"""
        try:
            chain = self.get_chain(user_id)
            
            if not chain.current_template or not chain.template_presented:
                return {
                    "error": "No template presented for testing",
                    "current_template": chain.current_template is not None,
                    "template_presented": chain.template_presented
                }
            
            # Test both sentiment analyzer and fallback
            sentiment_result = None
            if chain.sentiment_analyzer:
                sentiment_result = await chain.sentiment_analyzer.analyze_approval(
                    message=test_message,
                    messages=chain.messages,
                    template_data=chain.current_template
                )
            
            fallback_result = await chain._check_for_approval(test_message)
            
            return {
                "test_message": test_message,
                "sentiment_analyzer_result": sentiment_result,
                "fallback_result": fallback_result,
                "template_name": chain.current_template.get('name') if chain.current_template else None,
                "message_history_count": len(chain.messages)
            }
            
        except Exception as e:
            logger.error(f"Error in approval detection test: {str(e)}")
            return {"error": str(e)}