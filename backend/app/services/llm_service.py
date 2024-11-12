# llm_service.py
from typing import Dict, List, AsyncGenerator
from anthropic import AsyncAnthropic
from app.core.llm_config import settings, LLMConfig
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        logger.info(f"LLMService initialized with config: {self.config.model}")
        logger.debug(f"Using system prompt: {self.config.system_prompt[:50]}...")

    async def process_message_stream(self, websocket: WebSocket, messages: List[Dict[str, str]]) -> None:
        try:
            logger.info(f"Processing message stream with model: {self.config.model}")
            
            stream = await self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                system=self.config.system_prompt,
                messages=messages,
                stream=True
            )
            
            logger.info("Stream created successfully")
            current_message = ""
            
            async for chunk in stream:
                if chunk.type == "content_block_delta":
                    current_message += chunk.delta.text
                    try:
                        await websocket.send_json({
                            "type": "content",
                            "data": chunk.delta.text
                        })
                        
                        # Special handling for workout history
                        if "DAVEGROHL" in current_message and self.config.system_prompt == settings.LLM_CONFIGS["workout-history"]["system_prompt"]:
                            await websocket.send_json({
                                "type": "workout_history_approved"
                            })
                            await websocket.send_json({
                                "type": "done"
                            })
                            break
                            
                    except Exception as e:
                        logger.error(f"Error sending chunk: {str(e)}")
                        break
                        
                elif chunk.type == "message_stop":
                    await websocket.send_json({
                        "type": "done"
                    })
                    
        except Exception as e:
            logger.error(f"Error in LLM service: {str(e)}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "data": str(e)
                })
            except Exception:
                logger.error("Could not send error message")

class LLMServiceFactory:
    @staticmethod
    def create(config_name: str = "default") -> LLMService:
        logger.info(f"Creating LLMService with config: {config_name}")
        config = settings.get_llm_config(config_name)
        return LLMService(config)