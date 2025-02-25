import json
from typing import AsyncGenerator, Dict, Any, List
import logging
from datetime import datetime
import uuid
from langchain_core.messages import HumanMessage, AIMessage
from fastapi import WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.graph_service import WorkoutGraphService
from app.services.chains.workout_analysis_chain import WorkoutAnalysisChain
from app.core.supabase.client import SupabaseClient

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

    async def process_websocket(self, websocket: WebSocket, user_id: str):
        """Process WebSocket connection and handle messages."""
        try:
            # Helper method to safely serialize and send JSON with datetime and UUID objects
            async def send_json_safe(data):
                json_str = json.dumps(data, cls=CustomJSONEncoder)
                await websocket.send_text(json_str)
            
            # Send connection confirmation
            await send_json_safe({
                "type": "connection_status",
                "data": "connected"
            })

            # Initial message handling
            message_json = await websocket.receive_text()
            message_data = json.loads(message_json)
            
            if message_data.get('type') == 'initialize':
                # Initialize conversation
                messages = message_data.get('messages', [])
                await self._handle_initialization(messages, user_id)
                
                # Process the latest message from initialization data
                if messages:
                    latest_message = messages[-1]
                    if latest_message['sender'] == 'user':
                        async for response in self.process_query(
                            user_id=user_id,
                            message=latest_message['content'],
                            generate_graph=message_data.get("generate_graph", False)
                        ):
                            await send_json_safe(response)

            # Loop for subsequent messages
            while True:
                message_json = await websocket.receive_text()
                message_data = json.loads(message_json)
                
                if message := message_data.get('message'):
                    async for response in self.process_query(
                        user_id=user_id,
                        message=message,
                        generate_graph=message_data.get("generate_graph", False)
                    ):
                        await send_json_safe(response)

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"Error in websocket handler: {str(e)}", exc_info=True)
            raise

    # Rest of the class remains unchanged
    
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