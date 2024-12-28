import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from app.services.chains.workout_chain import WorkoutChain

class ConversationService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.chain = WorkoutChain()
        self.logger.debug(f"ConversationService initialized with chain: {self.chain}")

    async def process_websocket(self, websocket: WebSocket, conversation_id: str):
        """Process WebSocket connection and handle messages."""
        try:
            self.logger.info(f"Starting message processing for conversation: {conversation_id}")
            self.logger.debug(f"Chain state: {self.chain}")
            
            while True:
                try:
                    self.logger.debug(f"Waiting for message in conversation: {conversation_id}")
                    message_json = await websocket.receive_text()
                    self.logger.info(f"Received message in {conversation_id}: {message_json[:100]}...")
                    
                    try:
                        message_data = json.loads(message_json)
                        user_message = message_data.get('message', '')
                        self.logger.debug(f"Parsed message in {conversation_id}: {user_message[:100]}...")

                        # Check for workout approval
                        if self.chain.current_summary:
                            self.logger.debug(f"Checking workout approval for {conversation_id}")
                            is_approved = await self.chain.analyze_sentiment(user_message)
                            if is_approved:
                                self.logger.info(f"Workout approved in {conversation_id}")
                                await websocket.send_json({
                                    "type": "workout_approved",
                                    "data": self.chain.current_summary
                                })
                                continue

                        # Process message through workout chain
                        self.logger.debug(f"Processing message through chain for {conversation_id}")
                        async for chunk in self.chain.process_message(user_message):
                            await websocket.send_json(chunk)
                            self.logger.debug(f"Sent chunk in {conversation_id}: {str(chunk)[:100]}...")
                            
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
                    break
                    
                except Exception as e:
                    self.logger.error(f"Error processing message in {conversation_id}: {str(e)}", exc_info=True)
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "data": "An error occurred processing your message"
                        })
                    except:
                        self.logger.error("Failed to send error message to client")
                        break
                        
        except Exception as e:
            self.logger.error(f"Fatal error in conversation {conversation_id}: {str(e)}", exc_info=True)
            try:
                await websocket.close(code=1011)
            except:
                self.logger.error("Failed to close websocket after error")
            raise