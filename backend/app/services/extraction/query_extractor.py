from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.utils.function_calling import tool_example_to_messages
from .base_extractor import BaseExtractor
from ...schemas.exercise_query import ExerciseQuery
import os

QUERY_EXTRACTOR_PROMPT = """You are an expert at extracting exercise query information from natural language.
Extract exercises and timeframe from workout queries following these rules:
- Default timeframe is "3 months" if none specified
- Extract all exercise names mentioned that the user wants to analyze
- Timeframe should be in format "<number> <unit>" where unit is days/months/years
- Normalize timeframe phrases (e.g. "last year" -> "12 months", "past week" -> "7 days")"""

class QueryExtractor(BaseExtractor[ExerciseQuery]):
    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):

        load_dotenv()

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        self.extract_model = ChatAnthropic(
            model=model,
            api_key=api_key
            ).with_structured_output(ExerciseQuery)
        
        self.examples = [
            (
                "Show me my bench press and squats from the last year",
                ExerciseQuery(
                    exercises=["bench press", "squats"],
                    timeframe="12 months"
                )
            ),
            (
                "How are my deadlifts progressing?",
                ExerciseQuery(
                    exercises=["deadlifts"],
                    timeframe="3 months"  # default
                )
            )
        ]

    async def extract(self, conversation: List[HumanMessage | AIMessage]) -> Optional[ExerciseQuery]:
        try:
            conversation_text = self._format_conversation(conversation)
            
            # Create messages with examples
            example_messages = []
            for txt, tool_call in self.examples:
                example_messages.extend(
                    tool_example_to_messages(txt, [tool_call])
                )
            
            messages = [
                SystemMessage(content=QUERY_EXTRACTOR_PROMPT),
                *example_messages,
                HumanMessage(content=conversation_text)
            ]
            
            result = await self.extract_model.ainvoke(messages)
            return result
            
        except Exception as e:
            print(f"Extraction failed: {e}")
            return None