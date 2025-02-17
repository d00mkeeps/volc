from typing import List
from pydantic import BaseModel, Field

class ExerciseSelection(BaseModel):
    """Selected exercises from available data based on user query."""
    exercises: List[str] = Field(description="Names of exercises relevant to the query")
    reasoning: str = Field(description="Explanation of why these exercises were selected")

class ExerciseSelector:
    SELECTION_PROMPT = """Given a user's query about their workout progress and a list of available exercises, select the exercises that are most relevant to their request.

    USER QUERY: {query}

    AVAILABLE EXERCISES:
    {exercise_list}

    REQUIREMENTS:
    - Only select exercises that are directly relevant to the user's query
    - If the query mentions specific exercises, prioritize exact matches
    - If the query is general (e.g., "upper body progress"), select all relevant exercises
    - Ignore exercises that don't match the query's intent
    - Explain your selection reasoning
    - Do not make assumptions about exercises not in the available list

    IMPORTANT: Do not generate or hallucinate any data values. Your role is only to select relevant exercises from the provided list.

    Select exercises and explain your reasoning using the ExerciseSelection schema."""

    def __init__(self, llm):
        self.llm = llm

    async def select_exercises(self, query: str, available_exercises: List[str]) -> ExerciseSelection:
        """Select relevant exercises based on user query."""
        formatted_exercises = "\n".join([f"- {exercise}" for exercise in available_exercises])
        
        prompt = self.SELECTION_PROMPT.format(
            query=query,
            exercise_list=formatted_exercises
        )
        
        structured_llm = self.llm.with_structured_output(ExerciseSelection)
        return structured_llm.invoke(prompt)  