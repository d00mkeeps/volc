# backend/app/services/workout_history_service.py
import logging
from fastapi import WebSocket, WebSocketDisconnect
from app.services.workout_history_chain import WorkoutHistoryChain

logger = logging.getLogger(__name__)

class WorkoutHistoryService:
    def __init__(self):
        self.chain = WorkoutHistoryChain()

    async def process_websocket(self, websocket: WebSocket) -> None:
        """Handle WebSocket connection and message processing"""
        try:
            await websocket.accept()
            logger.info("WebSocket connection accepted")

            while True:
                data = await websocket.receive_json()
                message = data.get('message', '')
                logger.info(f"Received message: {message}")

                # Check for summary and analyze sentiment before processing message
                if self.chain.current_summary:
                    is_approved = await self.chain.analyze_sentiment(message)
                    if is_approved:
                        await websocket.send_json({
                            "type": "workout_history_approved",
                            "data": self.chain.current_summary
                        })

                # Always process the message through the LLM
                async for chunk in self.chain.process_message(message):
                    await websocket.send_json(chunk)

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")
        finally:
            try:
                await websocket.close()
            except:
                pass
            logger.info("WebSocket connection closed")