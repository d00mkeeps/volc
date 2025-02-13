from pydantic import BaseModel
from typing import List
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from backend.app.services.extraction.base_extractor import BaseExtractor

class ExerciseQuery(BaseModel):
    exercises: List[str]
    timeframe: str = "3 months"

QUERY_EXTRACTOR_PROMPT = """Extract the exercises and timeframe from workout queries.
- If no timeframe given, use "3 months"
- Convert timeframes to SQL intervals (e.g. "last year" -> "12 months")
- Return all mentioned exercises the user wants to analyze"""

class QueryExtractor(BaseExtractor[ExerciseQuery]):
    def __init__(self, model: str = "claude-3-sonnet-20240229"):
        self.extract_model = ChatAnthropic(model=model).with_structured_output(ExerciseQuery)

    async def extract(self, conversation: List[HumanMessage | AIMessage]) -> ExerciseQuery:
        conversation_text = self._format_conversation(conversation)
        messages = [
            SystemMessage(content=QUERY_EXTRACTOR_PROMPT),
            HumanMessage(content=conversation_text)
        ]
        return await self.extract_model.ainvoke(messages)