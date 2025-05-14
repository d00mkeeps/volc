import json
from typing import AsyncGenerator, Dict, Any, List, Optional
import logging
from datetime import datetime
import uuid
import anthropic
from langchain_core.messages import HumanMessage, AIMessage
from fastapi import WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.graph_service import WorkoutGraphService
from app.services.chains.workout_analysis_chain import WorkoutAnalysisChain
from app.services.db.graph_bundle_service import GraphBundleService
from app.services.db.workout_service import WorkoutService
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import BundleMetadata, CorrelationData, WorkoutDataBundle
from .workout_analysis.correlation_service import CorrelationService
from .workout_analysis.metrics_calc import MetricsProcessor, WorkoutFrequencyCalculator

logger = logging.getLogger(__name__)
PURPLE = "\033[35m"
RESET = "\033[0m"

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        # Handle NumPy types
        if hasattr(obj, "item"):  # Catches np.float64, np.int64, np.bool_, etc.
            return obj.item()  # Converts to native Python types
        return super().default(obj)

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class WorkoutAnalysisService:
    """
    Service that coordinates workout data analysis through both graph generation
    and conversational analysis.
    """
    
    def __init__(
        self, 
        llm: ChatAnthropic, 
        workout_service: WorkoutService,
        graph_bundle_service: GraphBundleService
    ):
        self.workout_service = workout_service
        self.graph_bundle_service = graph_bundle_service
        
        # Pass workout_service to graph_service
        self.graph_service = WorkoutGraphService(workout_service)
        
        self.llm = llm
        self.conversation_chain = None

    async def _send_json_safe(self, websocket: WebSocket, data: Dict[str, Any]):
        """Helper method to safely serialize and send JSON with datetime and UUID objects."""
        try:
            for key, value in data.items():
                if isinstance(value, dict) and key == "data":
                    logger.debug(f"Contents of data field (keys): {list(value.keys())}")
            
            json_str = json.dumps(data, cls=CustomJSONEncoder)
            await websocket.send_text(json_str)
        except TypeError as e:
            logger.error(f"JSON serialization error: {e}")
            # Try to identify the problematic part
            problematic_keys = []
            for key, value in data.items():
                try:
                    json.dumps({key: value}, cls=CustomJSONEncoder)
                except TypeError:
                    problematic_keys.append(key)
                    logger.error(f"Problem serializing key: {key}, value type: {type(value)}")
            
            logger.error(f"Problematic keys: {problematic_keys}")
            # Send simplified error response
            await websocket.send_text(json.dumps({
                "type": "error",
                "data": {"message": "Error serializing response data"}
            }))

    async def process_websocket(self, websocket: WebSocket, user_id: str):
        """Process WebSocket connection and handle messages (legacy method for backward compatibility)."""
        try:
            # Send connection confirmation
            await self._send_json_safe(websocket, {
                "type": "connection_status",
                "data": "connected"
            })

            # Loop for messages
            while True:
                message_json = await websocket.receive_text()
                message_data = json.loads(message_json)
                
                # Process individual message
                await self.process_message(websocket, message_data, user_id)

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding message: {str(e)}")
            try:
                await self._send_json_safe(websocket, {
                    "type": "error",
                    "data": {"message": "Invalid JSON format"}
                })
            except:
                pass
        except Exception as e:
            logger.error(f"Error in websocket handler: {str(e)}", exc_info=True)
            try:
                await self._send_json_safe(websocket, {
                    "type": "error",
                    "data": {"message": f"Server error: {str(e)}"}
                })
            except:
                pass
    
    async def process_message(self, websocket: WebSocket, data: Dict[str, Any], conversation_id: str):
        """
        Process individual WebSocket messages.
        
        Args:
            websocket: The WebSocket connection
            data: The parsed message data
            user_id: The ID of the current user
        """
        try:
            message_type = data.get('type', '')
            
            # Handle different message types
            if message_type == 'initialize':
                await self._handle_initialize_message(websocket, data, conversation_id)
            elif message_type == 'analyze_workout':
                await self._handle_analyze_workout_message(websocket, data, conversation_id)
            elif message_type == 'heartbeat':
                # Simple acknowledgment for heartbeat messages
                await self._send_json_safe(websocket, {
                    "type": "heartbeat_ack",
                    "timestamp": datetime.now().isoformat()
                })
            elif 'message' in data:
                await self._handle_regular_message(websocket, data, conversation_id)
            else:
                logger.warning(f"Unknown message format: {data}")
                await self._send_json_safe(websocket, {
                    "type": "error",
                    "data": {"message": "Unknown message format"}
                })
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            await self._send_json_safe(websocket, {
                "type": "error",
                "data": {"message": f"Server error: {str(e)}"}
            })
    
    async def _handle_initialize_message(self, websocket: WebSocket, data: Dict[str, Any], user_id: str):
        """Handle initialization messages with conversation history."""
        messages = data.get('messages', [])
        await self._handle_initialization(messages, user_id)
        
        # Process the latest message from initialization data if it exists
        if messages and messages[-1]['sender'] == 'user':
            latest_message = messages[-1]
            async for response in self.process_query(
                user_id=user_id,
                message=latest_message['content'],
                generate_graph=data.get("generate_graph", False)
            ):
                await self._send_json_safe(websocket, response)
    async def _handle_analyze_workout_message(self, websocket: WebSocket, data: Dict[str, Any], conversation_id: str):
        """Handle workout analysis messages with historical context integration."""
        logger.info("=== WORKOUT ANALYSIS REQUEST RECEIVED ===")
        logger.info(f"Message keys: {list(data.keys())}")
        
        data_str = data.get('data')
        client_conversation_id = data.get('conversation_id')  # Extract client-provided conversation ID

        conversation_id_to_use = client_conversation_id or conversation_id
        logger.info(f"Using conversation ID: {conversation_id_to_use} (client-provided: {client_conversation_id is not None})")

        if data_str:
            try:
                logger.info(f"Data string length: {len(data_str)}")
                logger.info(f"Data preview: {data_str[:200]}...")
                
                # Parse the incoming workout
                single_workout = json.loads(data_str)
                logger.info(f"✅ Successfully parsed workout data")
                logger.info(f"Workout name: {single_workout.get('name', 'Unknown')}")
                logger.info(f"Workout ID: {single_workout.get('id', 'Unknown')}")
                
                # Extract the actual user ID from the workout
                user_id = single_workout.get('user_id')
                if not user_id:
                    logger.error("❌ No user ID found in workout data")
                    await self._send_json_safe(websocket, {
                        "type": "error", 
                        "data": {
                            "code": "missing_user_id",
                            "message": "No user ID found in workout data"
                        }
                    })
                    return
                    
                logger.info(f"Using user ID from workout: {user_id}")
                
                # Extract exercise names from the incoming workout
                exercises = []
                for ex in single_workout.get('workout_exercises', []):
                    if ex.get('name'):
                        exercises.append(ex.get('name').lower())
                
                logger.info(f"Extracted {len(exercises)} exercise names: {exercises}")
                
                if not exercises:
                    logger.error("❌ No exercises found in workout data")
                    await self._send_json_safe(websocket, {
                        "type": "error", 
                        "data": {
                            "code": "invalid_workout",
                            "message": "No exercises found in workout data"
                        }
                    })
                    return
                
                # Fetch historical workout data using WorkoutService
                logger.info(f"Fetching historical workout data for user {user_id}")
                workout_data = await self.workout_service.get_workout_history_by_exercises(
                    user_id=user_id,
                    exercises=exercises,
                    timeframe="3 months"
                )
                
                if not workout_data:
                    logger.error("❌ No historical workout data found")
                    await self._send_json_safe(websocket, {
                        "type": "error", 
                        "data": {
                            "code": "no_history",
                            "message": "No workout history found for analysis"
                        }
                    })
                    return
                
                logger.info(f"✅ Retrieved {workout_data['metadata']['total_workouts']} historical workouts")
            
                logger.info(f"{PURPLE}Calculating workout metrics in message handler{RESET}")
                try:
                    metrics_processor = MetricsProcessor(workout_data)
                    calculated_metrics = metrics_processor.process()
                    workout_data['metrics'] = calculated_metrics
                    logger.info(f"{PURPLE}✅ Successfully added metrics to workout data{RESET}")
                    logger.info(f"{PURPLE}Metrics categories: {list(calculated_metrics.keys())}{RESET}")
                    
                    # Log a sample of each metrics category
                    for category, values in calculated_metrics.items():
                        if isinstance(values, dict) and values:
                            sample_key = next(iter(values))
                            logger.info(f"{PURPLE}Sample {category}: {sample_key} = {str(values[sample_key])[:100]}...{RESET}")
                        elif isinstance(values, list) and values:
                            logger.info(f"{PURPLE}Sample {category}: {str(values[0])[:100]}...{RESET}")
                except Exception as e:
                    logger.error(f"{PURPLE}❌ Failed to calculate metrics: {str(e)}{RESET}", exc_info=True)
                    # Continue without metrics rather than failing the whole request
                
                # Now process with the complete dataset
                message_text = data.get('message', 'Analyze my workout')
                async for response in self.analyze_workout(
                    user_id=user_id,
                    workout_data=workout_data,
                    message=message_text,
                    conversation_id=conversation_id_to_use  # Pass the conversation ID for linking
                ):
                    await self._send_json_safe(websocket, response)

            except anthropic.RateLimitError as e:
                # Specific handler for rate limit errors
                retry_after = int(getattr(e, 'response', {}).headers.get("retry-after", 60))
                logger.error(f"❌ Rate limit exceeded. Retry after: {retry_after}s")
                await self._send_json_safe(websocket, {
                    "type": "error", 
                    "data": {
                        "code": "rate_limit",
                        "message": f"Service temporarily unavailable due to high demand. Please try again in {retry_after} seconds.",
                        "retry_after": retry_after
                    }
                })
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse workout data: {str(e)}")
                logger.error(f"Raw data preview: {data_str[:100]}")
                await self._send_json_safe(websocket, {
                    "type": "error",
                    "data": {
                        "code": "invalid_format",
                        "message": "Invalid workout data format"
                    }
                })
            except Exception as e:
                logger.error(f"❌ Error processing workout data: {str(e)}", exc_info=True)
                await self._send_json_safe(websocket, {
                    "type": "error", 
                    "data": {
                        "code": "processing_error",
                        "message": f"Error analyzing workout: {str(e)}"
                    }
                })
        else:
            logger.error("❌ No workout data received in 'analyze_workout' message")
            logger.error(f"Available message data: {data}")
            await self._send_json_safe(websocket, {
                "type": "error", 
                "data": {
                    "code": "missing_data",
                    "message": "No workout data provided"
                }
            })
    async def _handle_regular_message(self, websocket: WebSocket, data: Dict[str, Any], user_id: str):
        """Handle regular conversation messages."""
        message = data.get('message', '')
        async for response in self.process_query(
            user_id=user_id,
            message=message,
            generate_graph=data.get("generate_graph", False)
        ):
            await self._send_json_safe(websocket, response)

    # Keep the existing methods unchanged
    async def _handle_initialization(self, messages: List[Dict], conversation_id: str):
        """Initialize conversation chain with history."""
        self.conversation_chain = WorkoutAnalysisChain(
            llm=self.llm,
            user_id=conversation_id
        )
        
        # Process conversation history
        for msg in messages:
            if msg['sender'] == 'user':
                self.conversation_chain.messages.append(HumanMessage(content=msg['content']))
            elif msg['sender'] == 'assistant':
                self.conversation_chain.messages.append(AIMessage(content=msg['content']))

        logger.info(f"Initialized conversation with {len(messages)} messages")
        
    async def process_query(
        self,
        user_id: str,
        message: str,
        generate_graph: bool = False,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        try:
            logger.info("="*50)
            logger.info("Starting new query processing:")
            logger.info(f"User ID: {user_id}")
            logger.info(f"Message: {message}")
            logger.info(f"Generate graph: {generate_graph}")
            logger.info("="*50)

            # Use existing conversation chain or create new one if none exists
            if not self.conversation_chain:
                self.conversation_chain = WorkoutAnalysisChain(
                    llm=self.llm,
                    user_id=user_id
                )

            if generate_graph:
                logger.info("\nAttempting to create workout bundle...")
                # We keep using the existing create_workout_bundle
                bundle = await self.graph_service.create_workout_bundle(
                    user_id=user_id,
                    query_text=message
                )
                    
                if not bundle:
                    yield {
                        "type": "error",
                        "data": {
                            "code": "bundle_creation_failed",
                            "message": "Failed to retrieve workout data"
                        }
                    }
                    return

                logger.info("\nBundle created successfully!")
                logger.info("-"*50)
                logger.info(f"Bundle ID: {bundle.bundle_id}")
                logger.info(f"Original query: {bundle.original_query}")
                logger.info(f"Metadata: {bundle.metadata}")
                logger.info("-"*50)
                
                # Calculate metrics for the workout data
                logger.info(f"Calculating advanced workout metrics")
                metrics_processor = MetricsProcessor(bundle.workout_data)
                workout_metrics = metrics_processor.process()
                bundle.workout_data['metrics'] = workout_metrics
                
                # Calculate consistency metrics and get top performers
                # These will be added to the bundle
                logger.info(f"Enhancing bundle with consistency metrics and top performers")
                workout_dates = []
                for workout in bundle.workout_data.get('workouts', []):
                    date_str = workout.get('date', '')
                    if date_str:
                        try:
                            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                            workout_dates.append(date)
                        except (ValueError, TypeError):
                            continue
                            
                # Calculate consistency metrics
                frequency_calculator = WorkoutFrequencyCalculator(bundle.workout_data)
                consistency_data = frequency_calculator._calculate_consistency(workout_dates)
                
                # Get top performers
                top_strength = self.graph_service._get_top_performers(bundle.workout_data, "1rm_change", 3)
                top_volume = self.graph_service._get_top_performers(bundle.workout_data, "volume_change", 3)
                
                # Add to bundle
                bundle.consistency_metrics = consistency_data
                bundle.top_performers = {
                    "strength": top_strength,
                    "volume": top_volume,
                    "frequency": []  # Skip frequency for now in this flow
                }
                
                logger.info("\nAttempting to add bundle to conversation chain...")
                if not await self.conversation_chain.add_data_bundle(bundle):
                    yield {
                        "type": "error",
                        "data": {
                            "code": "bundle_add_failed",
                            "message": "Failed to process workout data"
                        }
                    }
                    return
                
                logger.info("\nAttempting to generate charts...")
                chart_urls = await self.graph_service.add_charts_to_bundle(
                    bundle=bundle,
                    llm=self.llm
                )
                
                if not chart_urls:
                    yield {
                        "type": "error",
                        "data": {
                            "code": "chart_generation_failed",
                            "message": "Failed to generate graph visualizations"
                        }
                    }
                    return

                # Update bundle with chart URLs
                bundle.chart_urls = chart_urls
                # For backward compatibility
                bundle.chart_url = chart_urls.get("strength_progress")
                
                logger.info(f"Bundle ID: {bundle.bundle_id} prepared with charts")     
                yield {
                    "type": "workout_data_bundle",
                    "data": bundle.model_dump()
                }

            logger.info("\nProcessing message with conversation chain...")
            async for response in self.conversation_chain.process_message(message):
                yield response

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": {
                    "code": "processing_error",
                    "message": "An error occurred processing your request"
                }
            }
    async def analyze_workout(
        self, 
        user_id: str,
        workout_data: Dict[str, Any],
        message: str,
        conversation_id: str = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Analyze workout with optional user profile data."""
        bundle = None
        response_count = 0
        full_response = ""
        link_success = False
        
        try:
            logger.info(f"Starting workout analysis for user {user_id}")
            
            # Initialize conversation chain if needed
            if not self.conversation_chain:
                self.conversation_chain = WorkoutAnalysisChain(llm=self.llm, user_id=user_id)
            
            # Add user profile context if available
            if user_profile:
                logger.info(f"Adding user profile data to analysis")
                self.conversation_chain.add_user_context(user_profile)
            
            # Run correlation analysis
            correlation_service = CorrelationService()
            correlation_results = correlation_service.analyze_exercise_correlations(workout_data)
            logger.info(f"Correlation analysis complete: found {len(correlation_results.get('summary', []))} significant correlations")

            # Calculate metrics for the workout data
            logger.info(f"{PURPLE}Calculating advanced workout metrics{RESET}")
            metrics_processor = MetricsProcessor(workout_data)
            workout_metrics = metrics_processor.process()
            workout_data['metrics'] = workout_metrics
            logger.info(f"{PURPLE}Added metrics to workout data: {list(workout_metrics.keys())}{RESET}")
            
            # Create enhanced bundle
            logger.info("Creating enhanced workout bundle")
            bundle = await self._prepare_enhanced_bundle(
                workout_data=workout_data, 
                original_query=message,
                correlation_results=correlation_results
            )
            
            # Add bundle to conversation
            await self.conversation_chain.add_data_bundle(bundle)

            # Generate charts - MOVED UP before database save
            logger.info("Generating multiple charts")
            chart_urls = await self.graph_service.add_charts_to_bundle(
                bundle=bundle,
                llm=self.llm
            )
            
            if chart_urls:
                logger.info(f"Generated {len(chart_urls)} charts")
                # Update bundle with chart URLs
                bundle.chart_urls = chart_urls
                # For backward compatibility
                bundle.chart_url = chart_urls.get("strength_progress")
                # Enhance message with chart information
                chart_types = ", ".join(chart_urls.keys())
                charts_info = f"Several visualizations have been generated for this workout data and are available in the sidebar. Available charts include: {chart_types}. You can reference these visualizations in your analysis and direct the user to check them in the sidebar for more detailed insights."
                enhanced_message = f"{message}\n\n{charts_info}"
                message = enhanced_message
            else:
                logger.info("No charts were generated")
                
            # First yield the data bundle WITH charts
            yield {
                "type": "workout_data_bundle", 
                "data": bundle.model_dump()
            }
            
            # AFTER yielding to client, save to database
            if conversation_id:
                # Convert bundle to dictionary for saving
                if hasattr(bundle, "model_dump"):
                    bundle_dict = bundle.model_dump()
                elif hasattr(bundle, "dict"):
                    bundle_dict = bundle.dict()
                else:
                    bundle_dict = dict(bundle)
                    
                # Set the conversationId field explicitly
                bundle_dict["conversationId"] = conversation_id
                
                # Use the service to save the bundle
                result = await self.graph_bundle_service.save_graph_bundle(
                    user_id=user_id,
                    bundle=bundle_dict
                )

                link_success = result.get('success', False)
                if link_success:
                    logger.info(f"✅ Bundle {bundle.bundle_id} successfully linked to conversation {conversation_id}")
                else:
                    logger.warning(f"⚠️ Failed to link bundle {bundle.bundle_id} to conversation {conversation_id}: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error during bundle preparation: {str(e)}", exc_info=True)
            yield {
                "type": "error", 
                "data": {
                    "code": "bundle_preparation_error",
                    "message": f"Failed to prepare workout data: {str(e)}"
                }
            }
            return  # Exit early if bundle preparation fails
                
        # Separate try/except for LLM processing
        try:
            # Then generate analysis with LLM
            async for chunk in self.conversation_chain.process_message(message):
                try:
                    # Handle AIMessageChunk objects from LangChain
                    if hasattr(chunk, 'content'):
                        content = chunk.content
                        if content:  # Skip empty chunks
                            yield {
                                "type": "content",
                                "data": {
                                    "content": content
                                }
                            }
                            full_response += content
                    # Handle string responses
                    elif isinstance(chunk, str):
                        yield {
                            "type": "content", 
                            "data": {
                                "content": chunk
                            }
                        }
                        full_response += chunk
                    # Handle dictionary responses
                    elif isinstance(chunk, dict) and 'type' in chunk:
                        yield chunk
                        if chunk.get('type') == 'content' and 'data' in chunk:
                            # The issue might be here - chunk['data'] could be a string
                            data = chunk.get('data')
                            if isinstance(data, dict):
                                content = data.get('content', '')
                            elif isinstance(data, str):
                                content = data
                            else:
                                content = ''
                                
                            if content:
                                full_response += content
                    else:
                        logger.warning(f"Skipping unexpected chunk type: {type(chunk)}")
                        
                    response_count += 1
                except Exception as chunk_error:
                    logger.error(f"Error processing individual chunk: {str(chunk_error)}")
                    # Continue processing other chunks
        except Exception as e:
            logger.error(f"Error during LLM response streaming: {str(e)}", exc_info=True)
            yield {
                "type": "content",
                "data": {
                    "content": "I've analyzed your workout data but encountered an issue generating the detailed analysis. Your workout metrics and charts are still available for review."
                }
            }
        
        # Always log the bundle and response information, regardless of errors
        try:
            if bundle:
                logger.info("="*80)
                logger.info(f"WORKOUT ANALYSIS COMPLETE - SUMMARY:")
                logger.info(f"User ID: {user_id}")
                logger.info(f"Conversation ID: {conversation_id}")
                logger.info(f"Bundle ID: {bundle.bundle_id}")
                logger.info(f"Bundle-Conversation Link: {'✅ Established' if link_success else '❌ Failed'}")
                logger.info(f"Total LLM response chunks: {response_count}")
                
                # Log the complete response text
                logger.info("COMPLETE AI RESPONSE:")
                logger.info("-"*40)
                logger.info(full_response)
                logger.info("-"*40)
                logger.info(f"Response length: {len(full_response)} characters")
                
                # Log bundle details
                logger.info("BUNDLE DETAILS:")
                logger.info(f"Metrics categories: {list(bundle.workout_data.get('metrics', {}).keys())}")
                logger.info(f"Chart URLs: {bundle.chart_urls}")
                logger.info(f"Top performers: {bundle.top_performers}")
                logger.info(f"Consistency metrics: {bundle.consistency_metrics}")
                
                # Dump the bundle to a separate log entry for complete reference
                logger.info("COMPLETE BUNDLE JSON:")
                try:
                    bundle_json = json.dumps(bundle.model_dump(), cls=CustomJSONEncoder)
                    logger.info(f"{bundle_json[:1000]}... [truncated]")
                    logger.info(f"Complete bundle size: {len(bundle_json)} bytes")
                except Exception as e:
                    logger.error(f"Failed to serialize bundle for logging: {str(e)}")
                logger.info("="*80)
        except Exception as e:
            logger.error(f"Error logging final bundle state: {str(e)}")
    async def _prepare_enhanced_bundle(self, workout_data, original_query, correlation_results=None):
        """
        Prepare an enhanced workout data bundle with consistency metrics and top performers.
        
        Args:
            workout_data: The workout data dictionary
            original_query: The original query or message
            correlation_results: Optional correlation analysis results
            
        Returns:
            An enhanced WorkoutDataBundle
        """
        # Generate a new bundle ID
        bundle_id = await new_uuid()
        
        # Extract dates for consistency calculation
        workout_dates = []
        for workout in workout_data.get('workouts', []):
            date_str = workout.get('date', '')
            if date_str:
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    workout_dates.append(date)
                except (ValueError, TypeError):
                    # Skip invalid dates
                    continue
        
        # Calculate consistency metrics
        frequency_calculator = WorkoutFrequencyCalculator(workout_data)
        consistency_data = frequency_calculator._calculate_consistency(workout_dates)
        avg_days_between = workout_data.get('metrics', {}).get('workout_frequency', {}).get('avg_days_between', 0)
        
        # Process top performers
        # Get top performers for strength and volume
        top_strength = self.graph_service._get_top_performers(workout_data, metric="1rm_change", limit=3)
        top_volume = self.graph_service._get_top_performers(workout_data, metric="volume_change", limit=3)
        
        # For top frequency exercises (simple count approach)
        exercise_frequency = {}
        for workout in workout_data.get('workouts', []):
            for exercise in workout.get('exercises', []):
                name = exercise.get('exercise_name', '')
                if not name:
                    continue
                    
                if name not in exercise_frequency:
                    exercise_frequency[name] = 0
                exercise_frequency[name] += 1
        
        # Convert to top performers format
        top_frequency = []
        for name, count in sorted(exercise_frequency.items(), key=lambda x: x[1], reverse=True)[:3]:
            top_frequency.append({
                'name': name,
                'first_value': float(count),
                'last_value': float(count),
                'change': 0.0,
                'change_percent': 0.0
            })

            
        
        # Create bundle
        bundle = WorkoutDataBundle(
            bundle_id=bundle_id,
            metadata=BundleMetadata(
                total_workouts=workout_data['metadata']['total_workouts'],
                total_exercises=workout_data['metadata']['total_exercises'],
                date_range=workout_data['metadata']['date_range'],
                exercises_included=workout_data['metadata'].get('exercises_included', [])
            ),
            workout_data=workout_data,
            original_query=original_query,
            created_at=datetime.now(),
            correlation_data=CorrelationData(**correlation_results) if correlation_results else None,
            # Add enhanced data
            chart_urls={},  # Will be populated by add_charts_to_bundle
# In _prepare_enhanced_bundle method


            consistency_metrics={
                "score": consistency_data.get('score', 0) if hasattr(consistency_data, 'get') else consistency_data,
                "streak": consistency_data.get('streak', 0) if hasattr(consistency_data, 'get') else 0,
                # Here's the fix - use avg_days_between instead of avg_gap
                "avg_gap": avg_days_between
            },
            top_performers={
                "strength": top_strength,
                "volume": top_volume,
                "frequency": top_frequency
            }
        )
        
        return bundle