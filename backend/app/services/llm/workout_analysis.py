# app/services/llm/workout_analysis.py

import logging
import asyncio
from fastapi import WebSocket
import anthropic
from langchain_anthropic import ChatAnthropic
from ...schemas.workout_data_bundle import WorkoutDataBundle
from ..chains.workout_analysis_chain import WorkoutAnalysisChain
from ..db.message_service import MessageService
from ..db.analysis_service import AnalysisBundleService

logger = logging.getLogger(__name__)

class WorkoutAnalysisLLMService:
    """Service for LLM interpretation of workout data"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self._conversation_chains = {}  # Store chains by conversation_id
        self.message_service = MessageService()
        self.analysis_bundle_service = AnalysisBundleService()
    
    def _filter_bundle_for_llm(self, bundle_data: dict) -> dict:
        """Remove empty fields from bundle for LLM context"""
        return {
            "metadata": bundle_data.get("metadata", {}),
            "top_performers": bundle_data.get("top_performers", {}),
            "chart_urls": bundle_data.get("chart_urls", {})
            # Skip correlation_data and consistency_metrics
        }
        
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
            
            # Load complete conversation context with retry logic for pending analysis
            from app.core.utils.conversation_attachments import load_conversation_context

            max_attempts = 20  # 10 seconds at 500ms intervals
            context = None

            for attempt in range(max_attempts):
                logger.info(f"Loading conversation context (attempt {attempt + 1}/{max_attempts})")
                
                context_result = await load_conversation_context(conversation_id)
                if not context_result["success"]:
                    logger.error(f"Failed to load conversation context: {context_result['error']}")
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Failed to load conversation history"}
                    })
                    return
                
                context = context_result["data"]
                
                # Check if we have complete bundles or no pending ones
                if context.bundles or not any(True for _ in context.bundles):  # Has complete bundles or no bundles at all
                    logger.info(f"Context loaded successfully with {len(context.bundles)} bundles")
                    break
                
                # If we have pending/in_progress bundles, wait and retry
                logger.info("Found pending analysis, waiting 500ms before retry...")
                await asyncio.sleep(0.5)

            if context is None:
                logger.error("Failed to load conversation context after all retries")
                await websocket.send_json({
                    "type": "error", 
                    "data": {"message": "Failed to load conversation after retries"}
                })
                return

            # Get or create conversation chain
            chain = self.get_chain(conversation_id)

            # Load context into the chain
            chain.load_conversation_context(context)
            if context.bundles:
                chain.load_bundles(context.bundles)

            # Decide conversation flow based on loaded context
            if not context.messages and context.bundles:
                # New conversation WITH workout data - send proactive message
                logger.info("New conversation with workout data - sending proactive analysis")
                
                full_response_content = ""
                async for response in chain.process_message("Analyze my workout"):
                    await websocket.send_json(response)
                    if response.get("type") == "message_delta":
                        full_response_content += response.get("data", "")
                
                # Save the AI's response as the first message
                if full_response_content:
                    await self.message_service.save_message(
                        conversation_id=conversation_id,
                        user_id=chain.user_id,
                        message_content=full_response_content,
                        message_type="ai"
                    )
                    logger.info(f"Saved proactive AI message for conversation {conversation_id}")

            elif not context.messages and not context.bundles:
                # Empty conversation - wait for user input
                logger.info("Empty conversation - waiting for user input")

            else:
                # Existing conversation - context already loaded
                logger.info(f"Existing conversation loaded with {len(context.messages)} messages and {len(context.bundles)} bundles")

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
                            
                            filtered_bundle = self._filter_bundle_for_llm(bundle_data)
                            await chain.add_data_bundle(filtered_bundle)
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