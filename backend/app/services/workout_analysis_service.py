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
from ..core.supabase.client import SupabaseClient
from .workout_analysis.query_builder import WorkoutQueryBuilder
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
    
    def __init__(self, llm: ChatAnthropic, supabase_client: SupabaseClient):
        self.graph_service = WorkoutGraphService(supabase_client)
        self.supabase_client = supabase_client
        self.llm = llm
        self.conversation_chain = None

    async def _send_json_safe(self, websocket: WebSocket, data: Dict[str, Any]):
        """Helper method to safely serialize and send JSON with datetime and UUID objects."""
        try:
            logger.debug(f"Attempting to serialize data of type: {type(data)}")
            for key, value in data.items():
                logger.debug(f"Key: {key}, Value type: {type(value)}")
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
                
                logger.info(f"Extracted {len(exercises)} exercise names: {exercises[:5]}")
                
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
                
                # Initialize query builder
                query_builder = WorkoutQueryBuilder(self.supabase_client)
                
                # Create query parameters - fetch 3 months of data by default
                from app.schemas.exercise_query import ExerciseQuery
                query = ExerciseQuery(
                    exercises=exercises,
                    timeframe="3 months"
                )
                
                # Fetch historical workout data using the actual user ID
                logger.info(f"Fetching historical workout data for user {user_id}")
                workout_data = await query_builder.fetch_exercise_data(
                    user_id=user_id,
                    query_params=query
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
                    conversation_id=conversation_id  # Add this parameter
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
            else:
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
        conversation_id: str = None,  # Add this parameter
        user_profile: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Analyze workout with optional user profile data."""
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

            # In your analyze_workout method, after creating the bundle:

# Link bundle to conversation
            if conversation_id:
                await self.supabase_client.link_bundle_to_conversation(
                    user_id, 
                    conversation_id, 
                    str(bundle.bundle_id)
                )
                logger.info(f"Linked bundle {bundle.bundle_id} to conversation {conversation_id}")
            
            # Always generate charts for workout analysis
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
            
            # First yield the data bundle
            yield {
                "type": "workout_data_bundle", 
                "data": bundle.model_dump()
            }
            
            # Then generate analysis with LLM
            async for response in self.conversation_chain.process_message(message):
                yield response
                    
        except Exception as e:
            logger.error(f"Error analyzing workout: {str(e)}", exc_info=True)
            yield {
                "type": "error", 
                "data": {
                    "code": "analysis_error",
                    "message": f"Failed to analyze workout: {str(e)}"
                }
            }

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
            consistency_metrics={
                "score": consistency_data.get('score', 0) if hasattr(consistency_data, 'get') else consistency_data,
                "streak": consistency_data.get('streak', 0) if hasattr(consistency_data, 'get') else 0,
                "avg_gap": consistency_data.get('avg_gap', 0)
            },
            top_performers={
                "strength": top_strength,
                "volume": top_volume,
                "frequency": top_frequency
            }
        )
        
        return bundle