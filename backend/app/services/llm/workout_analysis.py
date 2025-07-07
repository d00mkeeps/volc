# app/services/llm/workout_analysis.py

import logging
from typing import Dict, Any, AsyncGenerator
from fastapi import WebSocket
import anthropic
from langchain_anthropic import ChatAnthropic
from ...schemas.workout_data_bundle import WorkoutDataBundle
from ..chains.workout_analysis_chain import WorkoutAnalysisChain
from ..db.message_service import MessageService
from ..db.graph_bundle_service import GraphBundleService

logger = logging.getLogger(__name__)

class WorkoutAnalysisLLMService:
    """Service for LLM interpretation of workout data"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self._conversation_chains = {}  # Store chains by conversation_id
        self.message_service = MessageService()
        self.graph_bundle_service = GraphBundleService()
        
    def get_chain(self, conversation_id: str, user_id: str = None) -> WorkoutAnalysisChain:
        """Get or create a conversation chain"""
        if conversation_id not in self._conversation_chains:
            # Initialize new LLM
            llm = ChatAnthropic(
                model="claude-3-7-sonnet-20250219",
                streaming=True,
                api_key=self.api_key,
                max_retries=0
            )
            
            # Create new chain
            self._conversation_chains[conversation_id] = WorkoutAnalysisChain(
                llm=llm,
                user_id=user_id or conversation_id
            )
            
        return self._conversation_chains[conversation_id]
    
    async def process_websocket(self, websocket: WebSocket, conversation_id: str):
        """Process WebSocket connection for workout analysis interpretation"""
        try:
            await websocket.accept()
            logger.info(f"WebSocket connection accepted for conversation: {conversation_id}")
            
            # Send connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })
            
            # Get or create conversation chain
            chain = self.get_chain(conversation_id)
            
            # Fetch existing messages
            existing_messages = await self.message_service.get_conversation_messages(conversation_id)
            
            # If no messages, this is a new conversation - send proactive message
            if not existing_messages:
                logger.info(f"No existing messages for {conversation_id}, sending proactive analysis message.")
                
                # Retry logic for analysis bundle
                analysis_bundle = None
                max_retries = 10
                retry_delay = 0.5 # seconds
                for i in range(max_retries):
                    bundles = await self.graph_bundle_service.get_bundles_by_conversation(conversation_id)
                    if bundles:
                        analysis_bundle = bundles[0] # Assuming we need the first bundle
                        break
                    logger.info(f"Analysis bundle not found for conversation {conversation_id}, retrying in {retry_delay}s... (Attempt {i+1}/{max_retries})")
                    await asyncio.sleep(retry_delay)

                if analysis_bundle:
                    await chain.add_data_bundle(analysis_bundle)
                    logger.info(f"Added analysis bundle to conversation {conversation_id} for proactive message.")
                    
                    full_response_content = ""
                    async for response in chain.process_message("Analyze my workout"):
                        await websocket.send_json(response)
                        if response.get("type") == "message_delta":
                            full_response_content += response.get("data", "")
                    
                    # Save the AI's response as the first message
                    if full_response_content:
                        await self.message_service.save_message(
                            conversation_id=conversation_id,
                            user_id=chain.user_id, # Assuming chain has user_id
                            message_content=full_response_content,
                            message_type="ai"
                        )
                        logger.info(f"Saved proactive AI message for conversation {conversation_id}")
                else:
                    logger.error(f"Failed to retrieve analysis bundle for conversation {conversation_id} after {max_retries} retries.")
                    await websocket.send_json({
                        "type": "error",
                        "data": {
                            "message": "Failed to retrieve workout analysis data. Please try again later."
                        }
                    })
            else:
                # Load existing messages into the chain
                chain.load_messages(existing_messages)
                logger.info(f"Loaded {len(existing_messages)} existing messages for {conversation_id}")

            # Process messages
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'heartbeat':
                    await websocket.send_json({
                        "type": "heartbeat_ack",
                        "timestamp": data.get('timestamp')
                    })
                    continue
                
                # Handle analysis bundle
                if data.get('type') == 'analysis_bundle':
                    bundle_data = data.get('bundle')
                    message = data.get('message', 'Analyze this workout data')
                    
                    # Add bundle to conversation context
                    if bundle_data:
                        try:
                            # Convert dict to WorkoutDataBundle if needed
                            if not isinstance(bundle_data, WorkoutDataBundle):
                                bundle = WorkoutDataBundle(**bundle_data)
                            else:
                                bundle = bundle_data
                                
                            await chain.add_data_bundle(bundle)
                            logger.info(f"Added analysis bundle to conversation {conversation_id}")
                        except Exception as e:
                            logger.error(f"Error adding bundle to conversation: {str(e)}")
                            await websocket.send_json({
                                "type": "error",
                                "data": {
                                    "message": f"Failed to process analysis data: {str(e)}"
                                }
                            })
                            continue
                    
                    # Process message with bundle context
                    async for response in chain.process_message(message):
                        await websocket.send_json(response)
                
                # Handle regular messages
                elif data.get('type') == 'message' or 'message' in data:
                    message = data.get('message', '')
                    
                    # Process message
                    async for response in chain.process_message(message):
                        await websocket.send_json(response)
                
        except anthropic.RateLimitError as e:
            logger.error(f"Rate limit exceeded: {str(e)}")
            try:
                retry_after = int(getattr(e, 'response', {}).headers.get("retry-after", 60))
                await websocket.send_json({
                    "type": "error",
                    "data": {
                        "code": "rate_limit",
                        "message": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                        "retry_after": retry_after
                    }
                })
            except:
                pass
                
        except Exception as e:
            logger.error(f"Error in LLM websocket: {str(e)}", exc_info=True)
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