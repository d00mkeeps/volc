# app/services/extraction/workout_extractor.py
from asyncio.log import logger
import os
from typing import Any, List
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.prompts.workout_extractor import WORKOUT_EXTRACTOR_PROMPT
from .base_extractor import BaseExtractor
from app.schemas.workout import Workout
from app.core.examples.workout_extractor import WORKOUT_EXAMPLES
from langchain_core.utils.function_calling import tool_example_to_messages

class WorkoutExtractor(BaseExtractor[Workout]):
    def __init__(self, model: str = "claude-3-sonnet-20240229") -> None:

        load_dotenv()

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
                  
        self.extract_model = ChatAnthropic(
            model=model,
            api_key=api_key,  
        ).with_structured_output(Workout)
        
        self.example_messages = self._create_example_messages()

    def _create_example_messages(self) -> List[Any]:
        messages = []
        for text, output in WORKOUT_EXAMPLES:
            formatted_messages = tool_example_to_messages(text, [output])
            messages.extend(formatted_messages)
        return messages

    async def extract(self, conversation: List[HumanMessage | AIMessage]) -> Workout:
        conversation_text = self._format_conversation(conversation)
        messages = self.example_messages + [
            SystemMessage(content=WORKOUT_EXTRACTOR_PROMPT),
            HumanMessage(content=conversation_text)
        ]
        try:
            return await self.extract_model.ainvoke(messages)
        except Exception as e:
            logger.error(f"Workout extraction failed: {str(e)}")
            return Workout(name="", exercises=[])