import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from app.services.chains.workout_chain import WorkoutChain
from langchain_core.messages import HumanMessage, AIMessage

class ConversationService:
    def __init__(self, conversation_id: str):
        self.logger = logging.getLogger(__name__)
        self.conversation_id = conversation_id
        self.reset_chain()
        self.logger.debug(f"ConversationService initialized for conversation: {conversation_id}")

    def reset_chain(self):
        """Create a new chain instance"""
        self.chain = WorkoutChain()
        self.logger.info(f"Created new WorkoutChain for conversation: {self.conversation_id}")

    async def process_websocket(self, websocket: WebSocket, conversation_id: str):
        """Process WebSocket connection and handle messages."""
        try:
            self.logger.info(f"Starting message processing for conversation: {conversation_id}")
            
            # Send initial connection status
            await websocket.send_json({
                "type": "connection_status",
                "data": "connected"
            })

            # Wait for potential initialization message
            message_json = await websocket.receive_text()
            message_data = json.loads(message_json)
            
            if message_data.get('type') == 'initialize':
                # Reset chain for new conversation
                self.reset_chain()
                self.logger.info(f"Resetting chain for conversation: {conversation_id}")
                
                # Initialize conversation history
                for msg in message_data.get('messages', []):
                    if msg['sender'] == 'user':
                        self.chain.messages.append(HumanMessage(content=msg['content']))
                    else:
                        self.chain.messages.append(AIMessage(content=msg['content']))
                self.logger.info(f"Initialized conversation {conversation_id} with {len(message_data['messages'])} messages")
                
                # Get next message after initialization
                message_json = await websocket.receive_text()
                message_data = json.loads(message_json)

            # Rest of the existing code...
            while True:
                try:
                    if not message_data.get('message'):
                        message_json = await websocket.receive_text()
                        message_data = json.loads(message_json)
                    
                    user_message = message_data.get('message', '')
                    if not user_message:  # Skip empty messages
                        message_data = {}
                        continue
                        
                    self.logger.debug(f"Parsed message in {conversation_id}: {user_message[:100]}...")

                    # The chain will handle adding messages to its history
                    async for chunk in self.chain.process_message(user_message):
                        await websocket.send_json(chunk)
                        self.logger.debug(f"Sent chunk in {conversation_id}: {str(chunk)[:100]}...")
                    
                    # Reset message_data for next iteration
                    message_data = {}
                        
                except json.JSONDecodeError as e:
                    self.logger.error(f"Failed to parse JSON in {conversation_id}: {str(e)}")
                    self.logger.debug(f"Raw message that failed: {message_json[:100]}...")
                    await websocket.send_json({
                        "type": "error",
                        "data": "Invalid message format"
                    })
                    
        except WebSocketDisconnect as e:
            self.logger.error(
                f"WebSocket disconnected in {conversation_id} with code {e.code} "
                f"and reason: {e.reason}\n"
                f"Was clean: {getattr(e, 'wasClean', 'unknown')}"
            )
            raise
                    
        except Exception as e:
            self.logger.error(f"Fatal error in conversation {conversation_id}: {str(e)}", exc_info=True)
            try:
                await websocket.close(code=1011)
            except:
                self.logger.error("Failed to close websocket after error")
            raise