import logging, asyncio
from typing import Dict, List
from anthropic import Anthropic, AsyncAnthropic, AsyncStream
from app.core.llm_config import settings, LLMConfig

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process_message(self, messages: List[Dict[str, str]]) -> str:
        try:
            response = await self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                system=self.config.system_prompt,
                messages=messages
            )
            return response.content
        except Exception as e:
            logger.error(f"Error in LLM service: {str(e)}")
            raise

    async def process_message_stream(self, messages: List[Dict[str, str]]) -> AsyncStream:
        try:
            stream = await self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                system=self.config.system_prompt,
                messages=messages,
                stream=True
            )
            return stream
        except Exception as e:
            logger.error(f"Error in LLM service: {str(e)}")
            raise

class LLMServiceFactory:
    @staticmethod
    def create(config_name: str = "default") -> LLMService:
        config = settings.get_llm_config(config_name)
        return LLMService(config)