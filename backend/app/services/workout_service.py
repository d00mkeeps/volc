'''# app/services/workout_service.py
from fastapi import WebSocket
import logging
from typing import Dict, Any
from .chains.workout_chain import WorkoutChain

class WorkoutService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.chain = WorkoutChain()

    async def process_websocket(self, websocket: WebSocket) -> None:
        try:
            await websocket.accept()
            self.logger.info("Started workout session")

            while True:
                data = await websocket.receive_json()
                message = data.get('message', '')
                
                # Check for workout approval and signal if approved
                if self.chain.current_summary:
                    is_approved = await self.chain.analyze_sentiment(message)
                    if is_approved:
                        await websocket.send_json({
                            "type": "workout_approved",
                            "data": self.chain.current_summary
                        })

                # Process message through LLM
                async for chunk in self.chain.process_message(message):
                    await websocket.send_json(chunk)

        except Exception as e:
            self.logger.error(f"WebSocket error: {str(e)}")
            
        finally:
            try:
                await websocket.close()
            except:
                pass'''