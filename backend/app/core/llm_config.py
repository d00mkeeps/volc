import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict, Any

logger = logging.getLogger(__name__)

class LLMConfig(BaseSettings):
    model: str
    max_tokens: int
    temperature: float
    system_prompt: str

class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    LLM_CONFIGS: Dict[str, Dict[str, Any]] = {
        "default": {
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": 250,
            "temperature": 0.5,
            "system_prompt": "Default system prompt here"
        },
        "welcome": {
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": 250,
            "temperature": 0.5,
            "system_prompt": "Welcome scenario system prompt here"
        }
    }
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def get_llm_config(self, config_name: str = "default") -> LLMConfig:
        logger.info(f"Getting LLM config for: {config_name}")
        config_data = self.LLM_CONFIGS.get(config_name, self.LLM_CONFIGS["default"])
        logger.debug(f"Config data: {config_data}")
        return LLMConfig(**config_data)

settings = Settings()
logger.info("Settings initialized")