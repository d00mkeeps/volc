import json
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from app.services.chains.workout_chain import WorkoutChain
from langchain_core.messages import HumanMessage, AIMessage

class ConversationService:
    def __init__(self, api_key = None):
        self.logger = logging.getLogger(__name__)
        self.api_key = api_key
        self.reset_chain()

    def reset_chain(self):
        """Create a new chain instance"""
        if self.api_key:
            self.chain = WorkoutChain(api_key=self.api_key)
        else: 
            raise ValueError('API key is required')

    async def process_websocket(self, websocket: WebSocket):
        """Process WebSocket connection and handle messages (legacy method for backward compatibility)."""
        try:        
            # Send initial connection status
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })

            # Process messages in a loop
            while True:
                message_json = await websocket.receive_text()
                message_data = json.loads(message_json)
                await self.process_message(websocket, message_data)

        except WebSocketDisconnect as e:
            self.logger.error(f"WebSocket disconnected with code {getattr(e, 'code', 'unknown')}" 
                             f" and reason: {getattr(e, 'reason', 'unknown')}")
            raise
    
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
        self.logger.debug(f"Processing initialization with {len(data.get('messages', []))} messages...")
        
        # Reset chain for new conversation
        self.reset_chain()
        
        # Initialize conversation history
        messages = data.get('messages', [])
        for msg in messages:
            if msg['sender'] == 'user':
                self.chain.messages.append(HumanMessage(content=msg['content']))
            else:
                self.chain.messages.append(AIMessage(content=msg['content']))
        
        self.logger.info(f"Initialized conversation with {len(messages)} messages")

        # Process the last message immediately
        if messages and messages[-1]['sender'] == 'user':
            last_message = messages[-1]['content']
            self.logger.debug(f"Processing initial message: {last_message[:100]}...")
            async for chunk in self.chain.process_message(last_message):
                await websocket.send_json(chunk)
                self.logger.debug(f"Sent initial chunk: {chunk}")
    
    async def _handle_regular_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Handle regular conversation messages."""
        message = data.get('message', '')
        self.logger.debug(f"Processing message: {message[:100]}...")
        async for chunk in self.chain.process_message(message):
            await websocket.send_json(chunk)
            self.logger.debug(f"Sent chunk: {chunk}")