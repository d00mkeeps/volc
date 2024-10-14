import logging
from anthropic import Anthropic
from app.core.llm_config import settings, LLMConfig

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, config: LLMConfig):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.config = config

    async def process_message(self, messages):
        try:
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                system=self.config.system_prompt,
                messages=messages,
                temperature=self.config.temperature,
            )
            logger.info(f"LLM Response: {response.content}")
            return response.content
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            raise

class LLMServiceFactory:
    @staticmethod
    def create(config_name: str = "default") -> LLMService:
        config = settings.get_llm_config(config_name)
        return LLMService(config)