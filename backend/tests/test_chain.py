from langchain_anthropic import ChatAnthropic
import pytest
from dotenv import load_dotenv
import os
import logging
from typing import AsyncGenerator, Dict, Any

from app.services.workout_analysis_service import WorkoutAnalysisService
from app.core.supabase.client import SupabaseClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
@pytest.mark.asyncio
async def test_workout_analysis_service():
    load_dotenv()
    logger = logging.getLogger(__name__)
    logger.info("\nStarting workout analysis service test")
    
    # Validate environment
    user_id = os.getenv("DEVELOPMENT_USER_ID")
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not user_id or not api_key:
        pytest.skip("Missing required environment variables")
    
    llm = ChatAnthropic(
        model="claude-3-5-sonnet-20241022",
        streaming=True,
        api_key=api_key,
    )

    # Initialize service
    supabase_client = SupabaseClient()
    service = WorkoutAnalysisService(llm = llm, 
                                    supabase_client=supabase_client)
    
    test_cases = [
        # Case 1: Graph + Analysis
        {
            "query": "Show me my bench press progress over the last 3 months",
            "generate_graph": True,
            "expected_types": ["graph", "content"]
        },
        # Case 2: Graph + Analysis
        {
            "query": "How are my squats improving?",
            "generate_graph": True,
            "expected_types": ["graph", "content"]
        },
        # Case 3: Analysis only
        {
            "query": "What muscle groups have I been focusing on recently?",
            "generate_graph": False,
            "expected_types": ["content", "graph", "error"]
        }
    ]
    
    async def collect_response(generator: AsyncGenerator[Dict[str, Any], None]) -> list:
        responses = []
        async for response in generator:
            responses.append(response)
            # Only log non-chunk debugging info
            if response.get('type') == 'debug':
                logger.info(f"\nDebug Info: {response.get('data', {})}")
        return responses

    for case in test_cases:
        print(f"\nTesting query: {case['query']}")

                # Add debug logging for the raw data
        if case['generate_graph']:
            query = await service.graph_service.query_extractor.extract(case['query'])
            if query:
                raw_data = await service.graph_service.query_builder.fetch_exercise_data(
                    user_id=user_id,
                    query_params=query
                )
                print("\nRaw workout data from Supabase:")
                print(raw_data)

        responses = await collect_response(
            service.process_query(
                user_id=user_id,
                message=case['query'],
                generate_graph=case['generate_graph']
            )
        )
        # Verify response types
        response_types = [r["type"] for r in responses if r["type"] != "loading_start"]
        for expected_type in case["expected_types"]:
            assert expected_type in response_types, f"Missing {expected_type} in response"
            
        # Verify graph URL when expected
        if case["generate_graph"]:
            graph_responses = [r for r in responses if r["type"] == "graph"]
            assert len(graph_responses) == 1, "Should have exactly one graph response"
            assert "url" in graph_responses[0]["data"], "Graph response missing URL"
            print(f"Graph URL: {graph_responses[0]['data']['url']}")
        
        # Print conversation content
        content_responses = [r["data"] for r in responses if r["type"] == "content"]
        print("Conversation response:", "".join(content_responses))
        
        # Verify no errors
        error_responses = [r for r in responses if r["type"] == "error"]
        assert len(error_responses) == 0, f"Received errors: {error_responses}"

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_workout_analysis_service())