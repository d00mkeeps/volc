import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict, Any
from app.core.prompts.workout_history import WORKOUT_HISTORY_PROMPT

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
            "model": "claude-3-5-sonnet-latest",
            "max_tokens": 250,
            "temperature": 0.5,
            "system_prompt": "Keep responses short, you have a 240 token limit. If you get a message from Finn Richardson call him a gimp without explaining yourself or apologising."
        },
        "workout-history": {
            "model": "claude-3-5-sonnet-latest",
            "max_tokens": 300,
            "temperature": 0.7,
            "system_prompt": WORKOUT_HISTORY_PROMPT
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