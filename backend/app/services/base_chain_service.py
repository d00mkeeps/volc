import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ChainService:
   def __init__(self):
       self.chain = None

   async def process_websocket(self, websocket: WebSocket) -> None:
       """Handle WebSocket connection and message processing"""
       try:
           await websocket.accept()
           logger.info("WebSocket connection accepted")

           while True:
               data = await websocket.receive_json()
               message = data.get('message', '')
               logger.info(f"Received websocket data: {data}")
               logger.info(f"Extracted message: {message}")

               try:
                   async for chunk in self.chain.process_message(message):
                       await websocket.send_json({
                           "type": "content",
                           "data": chunk
                       })

                   if self.chain.current_summary:
                       is_approved = await self.chain.analyze_sentiment(message)
                       if is_approved:
                           logger.info("Workout history approved")
                           await websocket.send_json({
                               "type": "workout_history_approved",
                               "data": self.chain.current_summary
                           })
                           await websocket.send_json({
                               "type": "done"
                           })
                           break

               except Exception as e:
                   logger.error(f"Error processing message: {str(e)}")
                   await websocket.send_json({
                       "type": "error",
                       "data": str(e)
                   })

       except Exception as e:
           logger.error(f"WebSocket error: {str(e)}")
       finally:
           try:
               await websocket.close()
           except:
               pass
           logger.info("WebSocket connection closed")