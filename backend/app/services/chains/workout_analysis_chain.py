from typing import Optional, Dict, Any, AsyncGenerator
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.services.extraction.query_extractor import QueryExtractor
from app.services.workout_analysis.query_builder import WorkoutQueryBuilder
from app.core.supabase.client import SupabaseClient
from app.schemas.exercise_query import ExerciseQuery

class WorkoutAnalysisChain:
    """Chain for analyzing workout data based on natural language queries."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.query_extractor = QueryExtractor()
        self.query_builder = WorkoutQueryBuilder(supabase_client)
        
        # Create prompts and chains
        self._initialize_prompts_and_chains()

    def _initialize_prompts_and_chains(self) -> None:
        """Sets up the conversation prompts and chains."""
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="Extract workout query parameters and fetch relevant data."),
            MessagesPlaceholder(variable_name="messages"),
            HumanMessage(content="{query}")
        ])
        
        self.chain = self.prompt | self.query_extractor.extract_model

    async def _extract_query(self, query: str) -> Optional[ExerciseQuery]:
        """Extract structured parameters from natural language query."""
        try:
            messages = [HumanMessage(content=query)]
            result = await self.query_extractor.extract(messages)
            
            # Add debug prints
            print(f"Raw extraction result: {result}")
            print(f"Result type: {type(result)}")
            
            # Ensure we return an ExerciseQuery
            if not isinstance(result, ExerciseQuery):
                return ExerciseQuery(**result) if result else None
                
            return result
        except Exception as e:
            print(f"Query extraction failed: {e}")
            return None

    async def _fetch_workout_data(self, query_params: ExerciseQuery, user_id: str) -> Optional[Dict]:
        """Fetch workout data using extracted parameters."""
        try:
            if not query_params:
                return None
                
            result = self.query_builder.fetch_exercise_data(
                user_id=user_id,
                query_params=query_params
            )
            return result
            
        except Exception as e:
            print(f"Error fetching workout data: {e}")
            return None

    async def invoke(self, query: str, user_id: str) -> Optional[Dict]:
        """Process a natural language query and return relevant workout data."""
        try:
            # Extract parameters
            query_params = await self._extract_query(query)
            if not query_params:
                return None
                
            # Fetch data
            result = await self._fetch_workout_data(query_params, user_id)
            return result
            
        except Exception as e:
            print(f"Chain execution failed: {e}")
            return None

    """
    Future Features:
    
    async def _generate_workout_charts(self, workout_data: Dict):
        # Generate charts using QuickChart API
        pass
        
    async def _analyze_workout_trends(self, workout_data: Dict):
        # LLM Analysis using structured prompting
        pass
        
    async def _generate_report(self, 
        workout_data: Dict,
        charts: Dict,
        analysis: Dict
    ) -> Dict:
        # Combine all components into a structured report
        pass
    """