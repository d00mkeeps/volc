from pydantic_settings import BaseSettings
from typing import Dict, Any

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
        # Add more configurations as needed
    }

    def get_llm_config(self, config_name: str = "default") -> LLMConfig:
        config_data = self.LLM_CONFIGS.get(config_name, self.LLM_CONFIGS["default"])
        return LLMConfig(**config_data)

settings = Settings()