import json
from typing import AsyncGenerator, Dict, Any, List, Optional
import logging
from datetime import datetime
import uuid
from langchain_core.messages import HumanMessage, AIMessage
from fastapi import WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.graph_service import WorkoutGraphService
from app.services.chains.workout_analysis_chain import WorkoutAnalysisChain
from app.core.supabase.client import SupabaseClient
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import BundleMetadata, CorrelationData, WorkoutDataBundle
from ..services.workout_analysis.correlation_service import CorrelationService

logger = logging.getLogger(__name__)

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime and UUID objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

import json
from typing import AsyncGenerator, Dict, Any, List, Optional
import logging
from datetime import datetime
import uuid
from langchain_core.messages import HumanMessage, AIMessage
from fastapi import WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.graph_service import WorkoutGraphService
from app.services.chains.workout_analysis_chain import WorkoutAnalysisChain
from app.core.supabase.client import SupabaseClient
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import BundleMetadata, CorrelationData, WorkoutDataBundle
from ..services.workout_analysis.correlation_service import CorrelationService

logger = logging.getLogger(__name__)

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime and UUID objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
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
        self.llm = llm
        self.conversation_chain = None

    async def _send_json_safe(self, websocket: WebSocket, data: Dict[str, Any]):
        """Helper method to safely serialize and send JSON with datetime and UUID objects."""
        json_str = json.dumps(data, cls=CustomJSONEncoder)
        await websocket.send_text(json_str)

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
    
    async def process_message(self, websocket: WebSocket, data: Dict[str, Any], user_id: str):
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
                await self._handle_initialize_message(websocket, data, user_id)
            elif message_type == 'analyze_workout':
                await self._handle_analyze_workout_message(websocket, data, user_id)
            elif message_type == 'heartbeat':
                # Simple acknowledgment for heartbeat messages
                await self._send_json_safe(websocket, {
                    "type": "heartbeat_ack",
                    "timestamp": datetime.now().isoformat()
                })
            elif 'message' in data:
                await self._handle_regular_message(websocket, data, user_id)
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
    
    async def _handle_analyze_workout_message(self, websocket: WebSocket, data: Dict[str, Any], user_id: str):
        """Handle workout analysis messages."""
        logger.info("=== WORKOUT ANALYSIS REQUEST RECEIVED ===")
        logger.info(f"Message keys: {list(data.keys())}")
        
        data_str = data.get('data')
        if data_str:
            try:
                logger.info(f"Data string length: {len(data_str)}")
                logger.info(f"Data preview: {data_str[:200]}...")
                
                workout_data = json.loads(data_str)
                logger.info(f"✅ Successfully parsed workout data")
                logger.info(f"Workout name: {workout_data.get('name', 'Unknown')}")
                logger.info(f"Workout ID: {workout_data.get('id', 'Unknown')}")
                logger.info(f"Exercise count: {len(workout_data.get('workout_exercises', []))}")
                
                # Log a sample of exercises
                exercises = workout_data.get('workout_exercises', [])
                if exercises:
                    for i, ex in enumerate(exercises[:3]):
                        logger.info(f"Exercise {i+1}: {ex.get('name', 'Unknown')} - {len(ex.get('workout_exercise_sets', []))} sets")
                
                async for response in self.analyze_workout(
                    user_id=user_id,
                    workout_data=workout_data,
                    message=data.get('message', 'Analyze my workout')
                ):
                    await self._send_json_safe(websocket, response)
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse workout data: {str(e)}")
                logger.error(f"Raw data preview: {data_str[:100]}")
                await self._send_json_safe(websocket, {
                    "type": "error",
                    "data": {"message": "Invalid workout data format"}
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
    async def _handle_initialization(self, messages: List[Dict], user_id: str):
        """Initialize conversation chain with history."""
        self.conversation_chain = WorkoutAnalysisChain(
            llm=self.llm,
            user_id=user_id
        )
        
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
                
                logger.info("\nAttempting to generate chart...")
                chart_url = await self.graph_service.add_chart_to_bundle(
                    bundle=bundle,
                    llm=self.llm
                )
                
                if not chart_url:
                    yield {
                        "type": "error",
                        "data": {
                            "code": "chart_generation_failed",
                            "message": "Failed to generate graph visualization"
                        }
                    }
                    return

                bundle.chart_url = chart_url
                logger.info(f"Bundle ID: {bundle.bundle_id} prepared with chart URL: {bundle.chart_url}")     
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
            
            # Create bundle
            bundle_id = await new_uuid()
            bundle = WorkoutDataBundle(
                bundle_id=bundle_id,
                metadata=BundleMetadata(
                    total_workouts=workout_data['metadata']['total_workouts'],
                    total_exercises=workout_data['metadata']['total_exercises'],
                    date_range=workout_data['metadata']['date_range'],
                    exercises_included=list(set(
                        exercise.get('exercise_name', '').lower() 
                        for workout in workout_data.get('workouts', [])
                        for exercise in workout.get('exercises', [])
                    ))
                ),
                workout_data=workout_data,
                original_query=message,
                created_at=datetime.now(),
                correlation_data=CorrelationData(**correlation_results) if correlation_results else None
            )
            
            # Add bundle to conversation
            await self.conversation_chain.add_data_bundle(bundle)
            
            # Always generate chart for workout analysis
            chart_url = await self.graph_service.add_chart_to_bundle(
                bundle=bundle,
                llm=self.llm
            )
            
            if chart_url:
                bundle.chart_url = chart_url
                logger.info(f"Chart generated: {chart_url}")
            
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