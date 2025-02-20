from typing import List, Optional, Union
from dotenv import load_dotenv
from fastapi import logger
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
- Always output exercise names in singular form (e.g. "squat" not "squats", "calf raise" not "calf raises")
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
                    exercises=["bench press", "squat"],  # Note: singular forms
                    timeframe="12 months"
                )
            ),
            (
                "How are my deadlifts progressing?",
                ExerciseQuery(
                    exercises=["deadlift"],  # Note: singular form
                    timeframe="3 months"  # default
                )
            )
        ]
# In query_extractor.py
    async def extract(self, input_query: Union[str, List[HumanMessage | AIMessage]]) -> Optional[ExerciseQuery]:
        try:
            # Handle string input
            if isinstance(input_query, str):
                messages = [
                    SystemMessage(content=QUERY_EXTRACTOR_PROMPT),
                    *[msg for example in self.examples 
                    for msg in tool_example_to_messages(example[0], [example[1]])],
                    HumanMessage(content=input_query)
                ]
            else:
                # Handle message list input
                conversation_text = self._format_conversation(input_query)
                messages = [
                    SystemMessage(content=QUERY_EXTRACTOR_PROMPT),
                    *[msg for example in self.examples 
                    for msg in tool_example_to_messages(example[0], [example[1]])],
                    HumanMessage(content=conversation_text)
                ]
            
            result = await self.extract_model.ainvoke(messages)
            return result
                
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return None