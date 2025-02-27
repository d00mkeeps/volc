import json
import logging
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
        """Process WebSocket connection and handle messages."""
        try:        
            # Send initial connection status
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })

            # Wait for initial message
            message_json = await websocket.receive_text()
            message_data = json.loads(message_json)
            
            if message_data.get('type') == 'initialize':
                self.logger.debug(f"Processing initialization with {len(message_data.get('messages', []))} messages...")
                
                # Reset chain for new conversation
                self.reset_chain()
                
                # Initialize conversation history
                messages = message_data.get('messages', [])
                for msg in messages:
                    if msg['sender'] == 'user':
                        self.chain.messages.append(HumanMessage(content=msg['content']))
                    else:
                        self.chain.messages.append(AIMessage(content=msg['content']))
                
                self.logger.info(f"Initialized conversation with {len(messages)} messages")

                # Process the last message immediately
                if messages and messages[-1]['sender'] =='user':
                    last_message = messages[-1]['content']
                    self.logger.debug(f"Processing initial message: {last_message[:100]}...")
                    async for chunk in self.chain.process_message(last_message):
                        await websocket.send_json(chunk)
                        self.logger.debug(f"Sent initial chunk: {chunk}")

            while True:
                message_json = await websocket.receive_text()
                message_data = json.loads(message_json)
                
                if message := message_data.get('message'):
                    self.logger.debug(f"Processing message: {message[:100]}...")
                    async for chunk in self.chain.process_message(message):
                        await websocket.send_json(chunk)
                        self.logger.debug(f"Sent chunk: {chunk}")

        except WebSocketDisconnect as e:
            self.logger.error(f"WebSocket disconnected with code {e.code} and reason: {e.reason}")
            raise