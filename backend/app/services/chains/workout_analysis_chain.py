import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.services.extraction.query_extractor import QueryExtractor
from app.services.workout_analysis.query_builder import WorkoutQueryBuilder
from app.services.chart_generator.chart_service import ChartService
from app.services.chart_generator.config_builder import generate_chart_config
from app.core.supabase.client import SupabaseClient
from app.schemas.exercise_query import ExerciseQuery

class WorkoutAnalysisChain:
    """Chain for analyzing workout data based on natural language queries."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.query_extractor = QueryExtractor()
        self.query_builder = WorkoutQueryBuilder(supabase_client)
        self.chart_service = ChartService()
        
        # Initialize LLM with proper configuration
        load_dotenv()
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            streaming=False,
            api_key=api_key,
        )
        
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
                
            result = await self.query_builder.fetch_exercise_data(
                user_id=user_id,
                query_params=query_params
            )
            return result
            
        except Exception as e:
            print(f"Error fetching workout data: {e}")
            return None
        
    async def generate_chart_config(self, workouts: Dict, original_query: str, llm):
        """Generate chart configuration using exercise selection."""
        return await generate_chart_config(
            workouts=workouts,
            original_query=original_query,
            llm=llm
        )

    async def invoke(self, query: str, user_id: str) -> Optional[Dict]:
        """Process a natural language query and return relevant workout data with chart."""
        try:
            # Extract parameters
            query_params = await self._extract_query(query)
            if not query_params:
                return None
                
            # Fetch data
            workout_data = await self._fetch_workout_data(query_params, user_id)
            if not workout_data:
                return None

            # Generate chart configuration
            chart_config = await generate_chart_config(
                workouts=workout_data,
                original_query=query,
                llm=self.llm
            )
            
            # Generate chart URL
            chart_url = self.chart_service.create_quickchart_url(config=chart_config)
            
            return {
                "data": workout_data,
                "chart": {
                    "url": chart_url,
                    "config": chart_config
                }
            }
            
        except Exception as e:
            print(f"Chain execution failed: {e}")
            return None