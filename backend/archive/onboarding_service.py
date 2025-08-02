import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from langchain_anthropic import ChatAnthropic
from backend.archive.onboarding_chain import OnboardingChain
from langchain_core.messages import HumanMessage, AIMessage

logger = logging.getLogger(__name__)

class OnboardingService:
    """
    Service that handles onboarding conversation through WebSockets.
    Extracts user information and tracks onboarding progress.
    """
    
    def __init__(self, llm: ChatAnthropic):
        """Initialize service with LLM model."""
        self.chain = OnboardingChain(llm=llm)
        self.logger = logging.getLogger(__name__)

    async def process_websocket(self, websocket: WebSocket, data: Dict[str, Any] = None) -> None:
        """Process WebSocket connection and handle messages (legacy method for backward compatibility)."""
        try:
            self.logger.info("Processing WebSocket messages")
            
            # Send initial connection confirmation
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })

            # Process messages in a loop
            while True:
                # Receive and parse message
                data = await websocket.receive_json()
                await self.process_message(websocket, data)

        except WebSocketDisconnect:
            self.logger.info("WebSocket disconnected")
        except Exception as e:
            self.logger.error(f"WebSocket error: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": "Error processing your message"
                })
            except:
                # Connection might already be closed
                pass
        finally:
            self.logger.info("WebSocket connection closed")
    
    async def process_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """
        Process individual WebSocket messages.
        
        Args:
            websocket: The WebSocket connection
            data: The parsed message data
        """
        try:
            message_type = data.get('type', '')
            
            if message_type == 'initialize':
                await self._handle_initialize_message(websocket, data)
            elif message_type == 'heartbeat':
                # Simple acknowledgment for heartbeat messages
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": datetime.now().isoformat()
                })
            elif 'message' in data:
                await self._handle_regular_message(websocket, data)
            else:
                self.logger.warning(f"Unknown message format: {data}")
                await websocket.send_json({
                    "type": "error",
                    "data": "Unknown message format"
                })
        
        except Exception as e:
            self.logger.error(f"Error processing message: {str(e)}", exc_info=True)
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": f"Error processing message: {str(e)}"
                })
            except:
                # Connection might be closed
                pass

    async def _handle_initialize_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle initialization messages with conversation history."""
        messages = data.get('messages', [])
        self.logger.info(f"Initializing with {len(messages)} messages")
        
        # Reset conversation for new session
        self.chain.messages = []
        
        # Process historical messages
        for msg in messages:
            if msg['sender'] == 'user':
                self.chain.messages.append(HumanMessage(content=msg['content']))
            else:
                self.chain.messages.append(AIMessage(content=msg['content']))
        
        # Process last message if it's from user
        if messages and messages[-1]['sender'] == 'user':
            last_message = messages[-1]['content']
            async for chunk in self.chain.process_message(last_message):
                await websocket.send_json(chunk)
    
    async def _handle_regular_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle regular conversation messages."""
        message = data.get('message', '')
        self.logger.info(f"Processing message: {message}")
        
        # Check for summary approval
        if self.chain.current_summary:
            is_approved = await self.chain.analyze_sentiment(message, self.chain.current_summary)
            if is_approved:
                await websocket.send_json({
                    "type": "workout_history_approved",
                    "data": self.chain.current_summary
                })
        
        # Process message and stream response
        async for chunk in self.chain.process_message(message):
            await websocket.send_json(chunk)
        
        # Extract data after processing
        try:
            extracted_data = await self.chain.extract_data()
            if extracted_data:
                await self.chain.update_state(extracted_data)
        except Exception as e:
            self.logger.error(f"Error extracting data: {str(e)}", exc_info=True)