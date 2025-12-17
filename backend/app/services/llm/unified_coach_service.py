import logging
import json
import re
import asyncio
from typing import Dict, Any, List, AsyncGenerator
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect
import google.api_core.exceptions
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.services.context.shared_context_loader import SharedContextLoader
from app.services.llm.tool_selector import ToolSelector
from app.services.db.message_service import MessageService
from app.core.prompts.unified_coach import get_unified_coach_prompt
from app.tools.exercise_tool import get_exercises_by_muscle_groups, get_cardio_exercises
from app.core.utils.websocket_utils import trigger_memory_extraction


logger = logging.getLogger(__name__)


async def stream_text_gradually(
    text: str, 
    in_code_block: bool = False
) -> AsyncGenerator[tuple[str, bool], None]:
    """
    Stream text with adaptive speed based on content type.
    Returns tuple of (chunk, in_code_block_state)
    """
    words = text.split(' ')
    current_in_block = in_code_block
    
    for i in range(0, len(words), 2):
        chunk = words[i]
        if i + 1 < len(words):
            chunk += ' ' + words[i + 1]
            if i + 2 < len(words):
                chunk += ' '
        
        # Track backticks to detect code blocks
        backtick_count = chunk.count('```')
        if backtick_count > 0:
            current_in_block = not current_in_block
        
        yield chunk, current_in_block
        
        # Speed: 10ms normal, 2ms in code blocks (5x faster)
        delay = 0 if current_in_block else 0
        await asyncio.sleep(delay)

class UnifiedCoachService:
    """
    Unified coaching service that handles all coaching modes
    (planning, analysis, tracking) through a single conversation interface.
    """
    
    def __init__(self, credentials=None, project_id=None):
        self.credentials = credentials
        self.project_id = project_id
        
        # Main response model (Gemini 2.5 Flash)
        self.response_model = ChatVertexAI(
            model="gemini-2.5-flash",
            streaming=True,
            temperature=0,
            credentials=credentials,
            project=project_id
        )
        
        # Shared services
        self.context_loader = SharedContextLoader()
        self.tool_selector = ToolSelector(credentials=credentials, project_id=project_id)
        self.message_service = MessageService()
        
        # Tool registry (tools that can be executed)
        self.tool_executors = {
            "get_exercises_by_muscle_groups": get_exercises_by_muscle_groups,
            "get_cardio_exercises": get_cardio_exercises
        }
    


    async def process_websocket(self, websocket: WebSocket, conversation_id: str, user_id: str):
        """Main WebSocket processing loop"""
        try:
            await websocket.accept()
            logger.info(f"🔌 Unified coach connected for user: {user_id}")
            
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Load conversation context
            logger.info(f"📚 Loading conversation context for: {conversation_id}")
            from app.services.context.conversation_context_service import conversation_context_service
            context = await conversation_context_service.load_context_admin(conversation_id, user_id)
            
            # Load shared context ONCE
            logger.info(f"📦 Loading shared context for user: {user_id}")
            shared_context = await self.context_loader.load_all(user_id)
            formatted_context = self._format_shared_context(shared_context)
            logger.info(f"✅ Context formatted and ready")
            
            # Initialize message history
            message_history = []
            for msg in context.messages:
                role = "user" if msg.type == "human" else "assistant"
                message_history.append({
                    "role": role,
                    "content": msg.content
                })
            
            logger.info(f"✅ Loaded {len(message_history)} messages from DB")
            
            # Initialize streaming task tracker
            current_stream_task = None
            
            # AUTO-RESPONSE: Handle pending user message
            if message_history and message_history[-1]["role"] == "user":
                last_user_msg = message_history[-1]["content"]
                logger.info(f"🚀 Found pending user message - Auto-responding")
                
                message = last_user_msg
                full_response = ""
                
                # Execute tools
                tool_calls = await self.tool_selector.select_tools(message, message_history[:-1])
                tool_results = {}
                if tool_calls:
                    logger.info(f"🔧 Executing {len(tool_calls)} tools")
                    tool_tasks = [self._execute_tool(tc["name"], tc["args"]) for tc in tool_calls]
                    results = await asyncio.gather(*tool_tasks, return_exceptions=True)
                    for tc, result in zip(tool_calls, results):
                        if not isinstance(result, Exception):
                            tool_results[tc['name']] = result
                
                # Build prompt and stream
                prompt = self._build_prompt(
                    message=message,
                    message_history=message_history[:-1],
                    formatted_context=formatted_context,
                    tool_results=tool_results
                )
                
                logger.info("🤖 Generating response for pending message...")
                
                async def stream_pending():
                    nonlocal full_response
                    in_code_block = False
                    async for chunk in self.response_model.astream(prompt):
                        content = chunk.content
                        if content:
                            full_response += content
                            async for word, in_code_block in stream_text_gradually(content, in_code_block):
                                await websocket.send_json({
                                    "type": "content",
                                    "data": word
                                })
                
                current_stream_task = asyncio.create_task(stream_pending())
                
                try:
                    await current_stream_task
                    
                    if not current_stream_task.cancelled():
                        components = self._extract_json_components(full_response)
                        for component in components:
                            await websocket.send_json(component)
                            
                        await websocket.send_json({
                            "type": "complete",
                            "data": {"length": len(full_response)}
                        })
                        
                        if full_response:
                            await self.message_service.save_server_message(
                                conversation_id=conversation_id,
                                content=full_response,
                                sender="assistant"
                            )
                        
                        message_history.append({
                            "role": "assistant",
                            "content": full_response
                        })
                        
                        if len(message_history) > 10:
                            message_history = message_history[-10:]
                            
                except asyncio.CancelledError:
                    logger.info("Pending stream cancelled")
                except Exception as e:
                    logger.error(f"Error processing pending message: {e}")
                    await websocket.send_json({"type": "error", "data": {"message": str(e)}})
                finally:
                    current_stream_task = None
            
            # Main message processing loop
            while True:
                try:
                    # Create receive task
                    receive_task = asyncio.create_task(websocket.receive_json())
                    
                    # If stream is active, race it against incoming messages
                    if current_stream_task:
                        try:
                            done, pending = await asyncio.wait(
                                {current_stream_task, receive_task},
                                return_when=asyncio.FIRST_COMPLETED
                            )
                            
                            stream_finished = current_stream_task in done
                            
                            if stream_finished:
                                # Stream completed normally
                                if not current_stream_task.cancelled():
                                    # Extract and send components
                                    components = self._extract_json_components(full_response)
                                    for component in components:
                                        await websocket.send_json(component)
                                        logger.info(f"📊 Sent component: {component['type']}")
                                    
                                    # Send completion
                                    await websocket.send_json({
                                        "type": "complete",
                                        "data": {"length": len(full_response)}
                                    })
                                    
                                    # Save to DB
                                    if full_response:
                                        ai_msg = await self.message_service.save_server_message(
                                            conversation_id=conversation_id,
                                            content=full_response,
                                            sender="assistant"
                                        )
                                        if ai_msg.get('success') != False:
                                            logger.info(f"💾 Saved AI response with ID: {ai_msg.get('id')}")
                                    
                                    # Update history
                                    message_history.append({"role": "user", "content": message})
                                    message_history.append({"role": "assistant", "content": full_response})
                                    
                                    if len(message_history) > 10:
                                        message_history = message_history[-10:]
                                    
                                    logger.info(f"✅ Message processed successfully")
                                
                                # Cancel pending receive
                                try:
                                    receive_task.cancel()
                                    await receive_task
                                except asyncio.CancelledError:
                                    pass
                                
                                current_stream_task = None
                                continue
                            
                            else:
                                # Message arrived during stream
                                data = receive_task.result()
                                
                                if data.get('type') == 'cancel':
                                    cancel_reason = data.get('reason', 'user_requested')
                                    logger.info(f"🛑 Cancel during stream: {cancel_reason}")
                                    
                                    # Cancel stream
                                    current_stream_task.cancel()
                                    try:
                                        await current_stream_task
                                    except asyncio.CancelledError:
                                        pass
                                    
                                    # Save partial if user requested
                                    if cancel_reason == 'user_requested' and full_response.strip():
                                        logger.info(f"💾 Saving partial response ({len(full_response)} chars)")
                                        await self.message_service.save_server_message(
                                            conversation_id=conversation_id,
                                            content=full_response + " [cancelled]",
                                            sender="assistant"
                                        )
                                        
                                        message_history.append({"role": "user", "content": message})
                                        message_history.append({"role": "assistant", "content": full_response + " [cancelled]"})
                                        
                                        if len(message_history) > 10:
                                            message_history = message_history[-10:]
                                    else:
                                        logger.info("🗑️ Discarding partial response")
                                    
                                    # Send ack
                                    await websocket.send_json({
                                        "type": "cancelled",
                                        "reason": cancel_reason
                                    })
                                    
                                    current_stream_task = None
                                    continue
                                
                                else:
                                    # Other message during stream
                                    logger.warning(f"Unexpected message during stream: {data.get('type')}")
                                    current_stream_task.cancel()
                                    current_stream_task = None
                                    # Fall through to handle message
                        
                        except WebSocketDisconnect:
                            logger.info("WebSocket disconnected during stream")
                            if current_stream_task:
                                current_stream_task.cancel()
                            break
                        
                        except asyncio.CancelledError:
                            logger.info("Stream cancelled")
                            current_stream_task = None
                            try:
                                receive_task.cancel()
                                await receive_task
                            except asyncio.CancelledError:
                                pass
                            continue
                        
                        except google.api_core.exceptions.ResourceExhausted as e:
                            logger.error(f"Vertex AI rate limit: {str(e)}")
                            await websocket.send_json({
                                "type": "error",
                                "data": {
                                    "code": "rate_limit",
                                    "message": "AI service rate limit exceeded.",
                                    "retry_after": 60
                                }
                            })
                            current_stream_task = None
                            try:
                                receive_task.cancel()
                                await receive_task
                            except asyncio.CancelledError:
                                pass
                            continue
                    
                    else:
                        # No active stream - wait for message
                        try:
                            data = await receive_task
                        except WebSocketDisconnect:
                            logger.info("WebSocket disconnected")
                            break
                        except Exception as e:
                            error_msg = str(e).lower()
                            if "disconnect" in error_msg:
                                logger.info("Disconnect detected")
                                break
                            logger.error(f"Receive error: {str(e)}")
                            continue
                    
                    # Handle heartbeat
                    if data.get('type') == 'heartbeat':
                        await websocket.send_json({
                            "type": "heartbeat_ack",
                            "timestamp": data.get('timestamp')
                        })
                        continue
                    
                    # Handle regular messages
                    message = data.get('message', '')
                    if not message:
                        continue
                    
                    logger.info(f"📨 Processing message: {message[:80]}...")
                    
                    # Save user message
                    user_msg = await self.message_service.save_server_message(
                        conversation_id=conversation_id,
                        content=message,
                        sender="user"
                    )
                    if user_msg.get('success') != False:
                        logger.info(f"💾 Saved user message")
                    
                    # Tool selection
                    tool_calls = await self.tool_selector.select_tools(message, message_history)
                    tool_results = {}
                    if tool_calls:
                        logger.info(f"🔧 Executing {len(tool_calls)} tools")
                        tool_tasks = [self._execute_tool(tc["name"], tc["args"]) for tc in tool_calls]
                        results = await asyncio.gather(*tool_tasks, return_exceptions=True)
                        
                        for tc, result in zip(tool_calls, results):
                            if not isinstance(result, Exception):
                                tool_results[tc["name"]] = result
                    else:
                        logger.info("✨ No tools needed")
                    
                    # Build prompt
                    prompt = self._build_prompt(
                        message=message,
                        message_history=message_history,
                        formatted_context=formatted_context,
                        tool_results=tool_results
                    )
                    
                    # Start streaming
                    logger.info("🤖 Generating response...")
                    full_response = ""
                    
                    async def stream_and_process():
                        nonlocal full_response
                        in_code_block = False
                        
                        async for chunk in self.response_model.astream(prompt):
                            content = chunk.content
                            if content:
                                full_response += content
                                async for word, in_code_block in stream_text_gradually(content, in_code_block):
                                    await websocket.send_json({
                                        "type": "content",
                                        "data": word
                                    })
                    
                    current_stream_task = asyncio.create_task(stream_and_process())
                
                except WebSocketDisconnect:
                    logger.info("WebSocket disconnected in main loop")
                    if current_stream_task:
                        current_stream_task.cancel()
                    break
                
                except Exception as e:
                    error_msg = str(e).lower()
                    if "disconnect" in error_msg:
                        logger.info(f"Disconnect via exception: {e}")
                        if current_stream_task:
                            current_stream_task.cancel()
                        break
                    logger.error(f"Loop error: {str(e)}", exc_info=True)
                    break
        
        except WebSocketDisconnect as e:
            logger.info(f"WebSocket closed: code={e.code}")
            await trigger_memory_extraction(user_id, conversation_id)
                
        except Exception as e:
            logger.error(f"Error in unified coach: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": str(e)}
                })
            except:
                pass
            
            await trigger_memory_extraction(user_id, conversation_id)


        except WebSocketDisconnect as e:
            if e.code in [1000, 1001]:
                logger.info(f"WebSocket closed normally: code={e.code}")
            else:
                logger.warning(f"WebSocket disconnected unexpectedly: code={e.code}")
            
            await trigger_memory_extraction(user_id, conversation_id)
                
        except Exception as e:
            logger.error(f"Error in unified coach: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": str(e)}
                })
            except:
                pass
            
            await trigger_memory_extraction(user_id, conversation_id)


    async def _execute_tool(self, tool_name: str, args: Dict) -> Any:
        """Execute a specific tool with the given arguments"""
        if tool_name not in self.tool_executors:
            logger.error(f"Unknown tool: {tool_name}")
            return []
        
        try:
            tool_func = self.tool_executors[tool_name]
            # LangChain tools are called with ainvoke
            result = await tool_func.ainvoke(args)
            return result
        except Exception as e:
            logger.error(f"Tool {tool_name} execution failed: {str(e)}")
            return []
    
    def _format_shared_context(self, shared_context: Dict) -> Dict[str, str]:
        """
        Format all shared context into strings ONCE at connection init.
        Returns dict of pre-formatted strings to reuse on every message.
        """
        bundle = shared_context.get("bundle")
        profile = shared_context.get("profile")
        
        # Format user profile
        if profile:
            name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
            age = profile.get('age', 'Not provided')
            units = "imperial (lb/mi)" if profile.get('is_imperial') else "metric (kg/km)"
            user_profile_text = f"Name: {name or 'Not provided'}, Age: {age}, Units: {units}"
        else:
            user_profile_text = "No profile available"
        
        # Format AI memory
        if bundle and hasattr(bundle, 'ai_memory') and bundle.ai_memory:
            memory_notes = bundle.ai_memory.get('notes', [])
            if memory_notes:
                memory_lines = []
                # Group by category
                categorized = {}
                for note in memory_notes:
                    category = note.get('category', 'general')
                    if category not in categorized:
                        categorized[category] = []
                    categorized[category].append(note)
                
                for category, notes in categorized.items():
                    memory_lines.append(f"**{category.title()}:**")
                    for note in notes:
                        text = note.get('text', '')
                        date = note.get('date', '')
                        memory_lines.append(f"- {text} (noted: {date})")
                
                ai_memory_text = "\n".join(memory_lines)
            else:
                ai_memory_text = "No memory available"
        else:
            ai_memory_text = "No memory available"
        
        # Format workout history with FULL DETAILS
        if bundle and hasattr(bundle, 'recent_workouts'):
            recent = bundle.recent_workouts[:5]  # Last 5 workouts
            if recent:
                workout_lines = []
                for w in recent:
                    date_str = w.date.strftime('%b %d, %Y') if hasattr(w.date, 'strftime') else str(w.date)
                    name = w.name or 'Unnamed Workout'
                    
                    # Build exercise list with full details
                    exercise_details = []
                    if hasattr(w, 'exercises') and w.exercises:
                        for ex in w.exercises:
                            # Format sets info
                            sets_info = []
                            if hasattr(ex, 'sets') and ex.sets:
                                for s in ex.sets:
                                    reps = s.reps if hasattr(s, 'reps') else 'N/A'
                                    weight = f"{s.weight}kg" if hasattr(s, 'weight') and s.weight else 'bodyweight'
                                    sets_info.append(f"{reps}x{weight}")
                            
                            sets_str = ", ".join(sets_info) if sets_info else "No sets"
                            ex_name = ex.name if hasattr(ex, 'name') else 'Unknown exercise'
                            exercise_details.append(f"    - {ex_name}: {sets_str}")
                    
                    exercises_str = "\n".join(exercise_details) if exercise_details else "    - No exercises"
                    
                    # Add workout notes if present
                    notes_str = f"\n  Notes: {w.notes}" if hasattr(w, 'notes') and w.notes else ""
                    
                    workout_lines.append(
                        f"- {date_str}: {name}{notes_str}\n"
                        f"{exercises_str}"
                    )
                
                workout_history_text = "\n\n".join(workout_lines)
            else:
                workout_history_text = "No workout history available"
        else:
            workout_history_text = "No workout history available"
        
        # Format strength progression (e1RM data for top exercises)
        strength_prog_text = ""
        if bundle and hasattr(bundle, 'strength_data') and bundle.strength_data:
            strength_data = bundle.strength_data
            if hasattr(strength_data, 'exercise_strength_progress') and strength_data.exercise_strength_progress:
                # Get top 5 exercises by best e1RM
                exercises_with_best = []
                for ex_prog in strength_data.exercise_strength_progress:
                    if hasattr(ex_prog, 'e1rm_time_series') and ex_prog.e1rm_time_series:
                        best_point = max(ex_prog.e1rm_time_series, key=lambda x: x.estimated_1rm)
                        exercises_with_best.append({
                            'exercise': ex_prog.exercise,
                            'best_e1rm': best_point.estimated_1rm,
                            'time_series': ex_prog.e1rm_time_series
                        })
                
                if exercises_with_best:
                    top_exercises = sorted(exercises_with_best, key=lambda x: x['best_e1rm'], reverse=True)[:5]
                    strength_lines = ["**Top Exercise Strength Progression (e1RM):**"]
                    
                    for ex_data in top_exercises:
                        # Get first and last points for change calculation
                        if len(ex_data['time_series']) > 1:
                            first = ex_data['time_series'][0]
                            last = ex_data['time_series'][-1]
                            change_kg = last.estimated_1rm - first.estimated_1rm
                            change_pct = (change_kg / first.estimated_1rm * 100) if first.estimated_1rm > 0 else 0
                            change_str = f"+{change_kg:.1f}kg (+{change_pct:.1f}%)" if change_kg >= 0 else f"{change_kg:.1f}kg ({change_pct:.1f}%)"
                            
                            # Show last 3 data points for recent trend
                            recent_points = ex_data['time_series'][-3:]
                            points_str = ", ".join([
                                f"{p.date.strftime('%b %d') if hasattr(p.date, 'strftime') else str(p.date)}: {p.estimated_1rm:.1f}kg"
                                for p in recent_points
                            ])
                            
                            strength_lines.append(
                                f"- {ex_data['exercise']}: Best {ex_data['best_e1rm']:.1f}kg | Change: {change_str} | Recent: {points_str}"
                            )
                        else:
                            strength_lines.append(
                                f"- {ex_data['exercise']}: {ex_data['best_e1rm']:.1f}kg (single data point)"
                            )
                    
                    strength_prog_text = "\n".join(strength_lines)
        
        if not strength_prog_text:
            strength_prog_text = "No strength progression data available"
        
        return {
            "user_profile": user_profile_text,
            "ai_memory": ai_memory_text,
            "workout_history": workout_history_text,
            "strength_progression": strength_prog_text
        }
    
    def _build_prompt(
        self,
        message: str,
        message_history: List[Dict],
        formatted_context: Dict[str, str],
        tool_results: Dict
    ) -> List:
        """Build the complete prompt with PRE-FORMATTED context and tool results"""
        
        # Get base prompt
        system_prompt = get_unified_coach_prompt()
        
        # Format available exercises (from tool results - dynamic per message)
        if "get_exercises_by_muscle_groups" in tool_results:
            exercises = tool_results["get_exercises_by_muscle_groups"]
            if exercises:
                exercise_lines = [f"**{len(exercises)} exercises available:**"]
                for ex in exercises[:30]:  # Limit to 30 to avoid token explosion
                    exercise_lines.append(
                        f"- {ex['standard_name']} (ID: {ex['id']}, Muscles: {', '.join(ex.get('primary_muscles', []))})"
                    )
                available_exercises_text = "\n".join(exercise_lines)
            else:
                available_exercises_text = "No exercises available (ask user which muscles to target)"
        elif "get_cardio_exercises" in tool_results:
            exercises = tool_results["get_cardio_exercises"]
            if exercises:
                exercise_lines = [f"**{len(exercises)} cardio exercises available:**"]
                for ex in exercises[:20]:
                    exercise_lines.append(
                        f"- {ex['standard_name']} (ID: {ex['id']}, Type: {ex.get('base_movement', 'N/A')})"
                    )
                available_exercises_text = "\n".join(exercise_lines)
            else:
                available_exercises_text = "No cardio exercises available"
        else:
            available_exercises_text = "No exercises fetched yet. If user wants to plan a workout, ask which muscles to target."
        
        # Inject ALL context into system prompt (pre-formatted + dynamic tools)
        system_prompt = system_prompt.format(
            user_profile=formatted_context["user_profile"],
            ai_memory=formatted_context["ai_memory"],
            workout_history=formatted_context["workout_history"],
            strength_progression=formatted_context["strength_progression"],
            available_exercises=available_exercises_text
        )
        
        # Build messages list
        messages = [SystemMessage(content=system_prompt)]
        
        # Add message history
        for msg in message_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        return messages

        messages = [SystemMessage(content=system_prompt)]
        
        # Add message history
        for msg in message_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        return messages
    
    def _extract_json_components(self, response: str) -> List[Dict]:
        """Extract JSON code blocks from response (workout_template, chart_data, etc.)"""
        components = []
        
        try:
            # Find all JSON code blocks
            json_pattern = r'```json\s*(.*?)\s*```'
            matches = re.findall(json_pattern, response, re.DOTALL)
            
            for json_str in matches:
                try:
                    parsed = json.loads(json_str.strip())
                    
                    # Check if it's a valid component (has type and data)
                    if parsed.get('type') and parsed.get('data'):
                        components.append(parsed)
                        logger.info(f"Extracted component: {parsed['type']}")
                
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON component: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error extracting components: {str(e)}")
        
        return components
