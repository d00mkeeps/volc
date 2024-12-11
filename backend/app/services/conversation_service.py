# app/services/conversation_service.py
from fastapi import WebSocket
import logging
from typing import Dict, Any
import json

class ConversationService:
    """
    Handles regular chat conversations, keeping them separate from the onboarding flow.
    Each conversation is identified by a unique ID and can maintain its own state.
    """
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def process_websocket(self, websocket: WebSocket, conversation_id: str):
        """
        Processes an individual WebSocket connection for a specific conversation.
        Currently just echoes messages with a visual indicator.
        """
        try:
            # Accept the WebSocket connection
            await websocket.accept()
            self.logger.info(f"Started conversation session: {conversation_id}")

            # Keep the connection alive and process messages
            while True:
                # Wait for a message from the client
                message_json = await websocket.receive_text()
                
                try:
                    # Parse the incoming message
                    message_data = json.loads(message_json)
                    user_message = message_data.get('message', '')
                    
                    # Log the received message in dark green (using ANSI color codes)
                    print(f"\033[32m[Conversation {conversation_id}] Received: {user_message}\033[0m")

                    # Send a simple response back
                    response = {
                        "type": "content",
                        "data": f"Received your message in conversation {conversation_id}: {user_message}"
                    }
                    await websocket.send_json(response)

                    # Signal that we're done processing
                    await websocket.send_json({"type": "done"})

                except json.JSONDecodeError:
                    self.logger.error("Failed to parse message JSON")
                    await websocket.send_json({
                        "type": "error",
                        "data": "Invalid message format"
                    })

        except Exception as e:
            self.logger.error(f"Error in conversation {conversation_id}: {str(e)}")
            # Try to send an error message if the connection is still open
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": "An error occurred processing your message"
                })
            except:
                pass