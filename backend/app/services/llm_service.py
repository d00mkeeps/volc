import logging, asyncio
from typing import Dict, List, AsyncGenerator
from anthropic import AsyncAnthropic
from app.core.llm_config import settings, LLMConfig
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        logger.info(f"LLMService initialized with config: {config}")

    async def process_message_stream(self, websocket: WebSocket, messages: List[Dict[str, str]]) -> None:
        try:
            logger.info(f"Processing message stream with config: {self.config}")
            logger.debug(f"Messages: {messages}")
            
            stream = await self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                system=self.config.system_prompt,
                messages=messages,
                stream=True
            )
            
            logger.info("Stream created successfully")
            
            # Buffer to accumulate the last message
            current_message = ""
            
            async for chunk in stream:
                if chunk.type == "content_block_delta":
                    current_message += chunk.delta.text
                    
                    # Check if this chunk completes "DAVEGROHL"
                    if current_message.strip() == "DAVEGROHL":
                        # Send completion signal instead of the text
                        await websocket.send_json({
                            "type": "workout_history_complete"
                        })
                        # Don't continue processing this message
                        break
                    else:
                        # Send normal content
                        await websocket.send_json({
                            "type": "content",
                            "data": chunk.delta.text
                        })
                        
                elif chunk.type == "message_stop":
                    # Only send done if we haven't sent workout_history_complete
                    if current_message.strip() != "DAVEGROHL":
                        await websocket.send_json({
                            "type": "done"
                        })
                    
        except Exception as e:
            logger.error(f"Error in LLM service: {str(e)}")
            await websocket.send_json({
                "type": "error",
                "data": str(e)
            })

class LLMServiceFactory:
    @staticmethod
    def create(config_name: str = "default") -> LLMService:
        logger.info(f"Creating LLMService with config: {config_name}")
        config = settings.get_llm_config(config_name)
        return LLMService(config)