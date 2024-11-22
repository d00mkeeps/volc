import json
import re
from typing import Dict, List, AsyncGenerator, Optional
from anthropic import AsyncAnthropic
from app.core.llm_config import settings, LLMConfig
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

# llm_service.py
class LLMService:
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        logger.info(f"LLMService initialized with config: {self.config.model}")
        logger.debug(f"Using system prompt: {self.config.system_prompt[:50]}...")

    def _extract_workout_history(self, text: str) -> Optional[Dict]:
        """Extract and parse workout history from XML tags."""
        try:
            pattern = r'<WorkoutHistory>(.*?)</WorkoutHistory>'
            match = re.search(pattern, text, re.DOTALL)
            
            if match:
                json_str = match.group(1).strip()
                try:
                    data = json.loads(json_str)
                    logger.info("Successfully parsed workout history")
                    return data
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON in workout history: {json_str}")
                    return None
            return None
            
        except Exception as e:
            logger.error(f"Unexpected error parsing workout history: {str(e)}")
            logger.debug(f"Problematic text content: {text[:200]}...")
            return None

    async def process_message_stream(self, websocket: WebSocket, messages: List[Dict[str, str]]) -> None:
        """Process messages and stream responses."""
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
                        
                        workout_history = self._extract_workout_history(current_message)
                        if workout_history:
                            logger.info("Workout history detected and parsed")
                            await websocket.send_json({
                                "type": "workout_history_approved",
                                "data": workout_history
                            })
                            await websocket.send_json({
                                "type": "done"
                            })
                            break
                            
                    except Exception as e:
                        logger.error(f"Error processing chunk: {str(e)}")
                        logger.debug(f"Problematic chunk: {chunk.delta.text[:100]}...")
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