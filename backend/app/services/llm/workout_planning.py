# /app/services/llm/workout_planning.py

import logging
from fastapi import WebSocket
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from ..chains.workout_planning_chain import WorkoutPlanningChain
from ..db.message_service import MessageService
from .performance_profiler import PerformanceProfiler 
from app.tools.exercise_tool import get_exercises_by_muscle_groups

logger = logging.getLogger(__name__)

class WorkoutPlanningLLMService:
    """Service for LLM-based workout planning conversations"""
    
    def __init__(self, credentials=None, project_id=None, enable_profiling: bool = True):
        self._conversation_chains = {}
        self.message_service = MessageService()
        self.credentials = credentials  
        self.project_id = project_id
        self.enable_profiling = enable_profiling
        
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
            
            # Create chain with tools
            chain = WorkoutPlanningChain(
                llm=llm, 
                user_id=user_id,
                tools=[get_exercises_by_muscle_groups]
            )
            
            # NOTE: Sentiment analyzer removed - approval handled by UI buttons
            
            self._conversation_chains[user_id] = chain
            
        return self._conversation_chains[user_id]


    async def load_planning_context(self, user_id: str, profiler: PerformanceProfiler = None) -> dict:
        """Load planning context (user profile and recent workouts only)."""
        try:
            logger.info(f"Loading planning context for user: {user_id}")
            
            context = {
                # NOTE: No longer loading exercise_definitions!
                "user_profile": None,
                "recent_workouts": {
                    "workouts": [],
                    "patterns": {}
                }
            }
            
            # Load user profile
            if profiler:
                profiler.start_phase("load_user_profile_for_planning")
            from app.services.db.user_profile_service import UserProfileService
            profile_service = UserProfileService()
            profile_result = await profile_service.get_user_profile_admin(user_id)
            
            if profile_result.get('success') and profile_result.get('data'):
                context["user_profile"] = profile_result['data']
                logger.info(f"✅ Loaded user profile for planning")
                if profiler:
                    profiler.end_phase(loaded=True)
            else:
                logger.warning(f"❌ No user profile loaded: {profile_result.get('error', 'Unknown error')}")
                if profiler:
                    profiler.end_phase(loaded=False)
            
            # Load recent workouts
            if profiler:
                profiler.start_phase("load_recent_workouts")
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
                    "workout_frequency_per_week": round(total_workouts / 2, 1),
                    "most_frequent_exercises": sorted(exercise_frequency.items(), key=lambda x: x[1], reverse=True)[:5],
                    "exercise_variety": len(exercise_frequency)
                }
                
                logger.info(f"✅ Loaded {total_workouts} recent workouts with {len(exercise_frequency)} unique exercises")
                if profiler:
                    profiler.end_phase(
                        workout_count=total_workouts,
                        exercise_variety=len(exercise_frequency)
                    )
            else:
                logger.warning(f"❌ No recent workouts loaded: {workouts_result.get('error', 'Unknown error')}")
                if profiler:
                    profiler.end_phase(workout_count=0)
            
            # LOG FINAL CONTEXT SUMMARY
            logger.info(f"🎯 FINAL CONTEXT SUMMARY:")
            logger.info(f"   - Exercise definitions: SKIPPED (loaded via tool on-demand)")
            logger.info(f"   - User profile: {'✅' if context['user_profile'] else '❌'}")
            logger.info(f"   - Recent workouts: {context['recent_workouts']['patterns'].get('total_workouts', 0)}")
            
            return context
            
        except Exception as e:
            logger.error(f"❌ Error loading planning context: {str(e)}", exc_info=True)
            return {
                "user_profile": None,
                "recent_workouts": {"workouts": [], "patterns": {}}
            }
        

    async def process_websocket(self, websocket: WebSocket, user_id: str):
        """Process WebSocket connection for workout planning with template detection and approval workflow"""
        
        # Initialize profiler for connection setup
        profiler = PerformanceProfiler(f"planning-{user_id}", enabled=self.enable_profiling)
        
        try:
            profiler.start_phase("websocket_accept")
            await websocket.accept()
            logger.info(f"Workout planning WebSocket connection accepted for user: {user_id}")
            profiler.end_phase()
            
            profiler.start_phase("connection_confirmation")
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            profiler.end_phase()
            
            # Load planning context
            profiler.start_phase("context_loading")
            logger.info(f"Loading planning context for user: {user_id}")
            planning_context = await self.load_planning_context(user_id, profiler)
            profiler.end_phase(
                has_profile=planning_context["user_profile"] is not None,
                recent_workouts=planning_context["recent_workouts"]["patterns"].get("total_workouts", 0)
            )
            
            # Get or create planning chain
            profiler.start_phase("chain_initialization")
            chain = self.get_chain(user_id)
            profiler.end_phase()

            # Load user profile into chain
            profiler.start_phase("user_profile_loading")
            logger.info(f"Loading user profile for planning session: {user_id}")
            profile_loaded = await chain.load_user_profile()
            profiler.end_phase(profile_loaded=profile_loaded)
            
            if profile_loaded:
                logger.info(f"User profile loaded successfully for planning: {user_id}")
            else:
                logger.info(f"No user profile available for planning: {user_id} - continuing with generic prompts")

            # Load planning context into chain
            profiler.start_phase("context_injection")
            logger.info(f"Loading planning context into chain: {user_id}")
            await chain.load_planning_context(planning_context)
            profiler.end_phase()

            # Send proactive greeting
            profiler.start_phase("proactive_greeting_generation")
            logger.info("New planning session - sending proactive greeting with context")
            
            # Create a greeting-specific profiler for agent details
            greeting_profiler = PerformanceProfiler(
                f"planning-{user_id}-greeting",
                enabled=self.enable_profiling
            )
            greeting_profiler.start_phase("llm_processing")
            
            full_response_content = ""
            first_token = True
            
            async for response in chain.process_message(
                "Start workout planning conversation", 
                profiler=greeting_profiler
            ):
                if first_token and response.get("type") == "content":
                    profiler.end_phase()
                    profiler.start_phase("proactive_greeting_streaming")
                    greeting_profiler.end_phase()
                    greeting_profiler.start_phase("llm_streaming")
                    first_token = False
                
                if response.get("type") == "workout_template_approved":
                    logger.info(f"🎉 Initial template approved by user {user_id} (should not happen in greeting)")
                    await websocket.send_json(response)
                    continue
                    
                await websocket.send_json(response)
                if response.get("type") == "content":
                    full_response_content += response.get("data", "")
            
            if not first_token:
                profiler.end_phase(response_length=len(full_response_content))
                greeting_profiler.end_phase(
                    token_count=len(full_response_content.split()),
                    response_length=len(full_response_content)
                )
            
            logger.info(f"Sent contextual planning greeting for user {user_id}")
            
            # Log initial setup summary
            profiler.log_summary()
            greeting_profiler.log_summary()

            # Process ongoing conversation messages
            while True:
                data = await websocket.receive_json()
                
                # Create new profiler for each message
                message_profiler = PerformanceProfiler(
                    f"planning-{user_id}-msg",
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
                    
                    # Process message through chain with profiler
                    message_profiler.start_phase("llm_processing")
                    full_ai_response = ""
                    template_approved = False
                    first_token = True
                    token_count = 0
                    
                    async for response in chain.process_message(message, profiler=message_profiler):
                        if first_token and response.get("type") == "content":
                            message_profiler.end_phase()  # End llm_processing, agent callbacks logged details
                            message_profiler.start_phase("llm_streaming")
                            first_token = False
                        
                        # Handle template approval
                        if response.get("type") == "workout_template_approved":
                            logger.info(f"🎉 Workout template approved by user {user_id}")
                            logger.info(f"Template data: {response.get('data', {}).get('name', 'Unknown')}")
                            
                            await websocket.send_json({
                                "type": "workout_template_approved",
                                "data": response.get("data")
                            })
                            
                            template_approved = True
                            continue
                            
                        # Handle regular content
                        await websocket.send_json(response)
                        if response.get("type") == "content":
                            content = response.get("data", "")
                            full_ai_response += content
                            token_count += len(content.split())
                    
                    if not first_token:
                        message_profiler.end_phase(
                            token_count=token_count,
                            response_length=len(full_ai_response),
                            template_approved=template_approved
                        )
                    
                    # Log message completion
                    if template_approved:
                        logger.info(f"✅ Message processed with template approval for user {user_id}")
                    else:
                        logger.info(f"✅ Message processed normally for user {user_id}")
                        
                        if chain.current_template:
                            logger.info(f"📋 Current template: {chain.current_template.get('name', 'Unknown')}")
                            logger.info(f"🎯 Template presented: {chain.template_presented}")
                    
                    # Log message processing summary
                    message_profiler.log_summary()
                        
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