import json
import logging
from fastapi import WebSocket

from app.services.chains.workout_chain import WorkoutChain


class ConversationService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.chain = WorkoutChain()

    async def process_websocket(self, websocket: WebSocket, conversation_id: str):
        try:
            await websocket.accept()
            self.logger.info(f"Started conversation session: {conversation_id}")

            while True:
                message_json = await websocket.receive_text()
                
                try:
                    message_data = json.loads(message_json)
                    user_message = message_data.get('message', '')

                    # Check for workout approval
                    if self.chain.current_summary:
                        is_approved = await self.chain.analyze_sentiment(user_message)
                        if is_approved:
                            await websocket.send_json({
                                "type": "workout_approved",
                                "data": self.chain.current_summary
                            })
                            continue

                    # Process message through workout chain
                    async for chunk in self.chain.process_message(user_message):
                        await websocket.send_json(chunk)

                except json.JSONDecodeError:
                    self.logger.error("Failed to parse message JSON")
                    await websocket.send_json({
                        "type": "error",
                        "data": "Invalid message format"
                    })

        except Exception as e:
            self.logger.error(f"Error in conversation {conversation_id}: {str(e)}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": "An error occurred processing your message"
                })
            except:
                pass