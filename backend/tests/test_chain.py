import pytest
from dotenv import load_dotenv
import os
from pprint import pprint

from app.core.supabase.client import SupabaseClient
from app.services.chains.workout_analysis_chain import WorkoutAnalysisChain
from app.schemas.exercise_query import ExerciseQuery

@pytest.mark.asyncio
async def test_workout_analysis_chain():
    # Load environment variables  
    load_dotenv()
    
    # Get test user ID and validate environment
    TEST_USER_ID = os.environ.get("DEVELOPMENT_USER_ID")
    if not TEST_USER_ID:
        pytest.skip("DEVELOPMENT_USER_ID not found in environment variables")
        
    # Initialize chain
    supabase_client = SupabaseClient()
    chain = WorkoutAnalysisChain(supabase_client)
    
    # Test cases with expected structures
    # Test cases with expected structures
    test_cases = [
        (
            "Show me my bench press progress",
            ExerciseQuery(
                exercises=["bench press"]  # timeframe will default to "3 months"
            ),
            ["Bench Press", "Incline Dumbbell Bench Press"]
        ),
        (
            "How are my squats progressing?",
            ExerciseQuery(
                exercises=["squat"]
            ),
            ["Squat"]
        ),
        (
            "Show my progress on upper body pushing exercises",
            ExerciseQuery(
                exercises=["push"]
            ),
            ["Bench Press", "Incline Dumbbell Bench Press", "Dips", "Triceps Pushdowns"]
        )
    ]
    
    print("\nTesting WorkoutAnalysisChain:")
    for query, expected_extraction, expected_selections in test_cases:
        print(f"\nTesting query: {query}")
        
        # Test extraction component
        print("Testing extraction...")
        extracted = await chain._extract_query(query)
        assert extracted is not None, "Extraction failed"
        assert isinstance(extracted, ExerciseQuery), "Incorrect extraction type"
        print(f"Extraction successful: {extracted}")
        
        print("Testing database query...")
        db_result = await chain._fetch_workout_data(
            query_params=extracted, 
            user_id=TEST_USER_ID 
        )
        assert db_result is not None, "Database query failed"
        assert "workouts" in db_result, "Missing workouts in result"
        assert "metadata" in db_result, "Missing metadata in result"
        print(f"Database query successful")
        print(f"Found {db_result['metadata']['total_workouts']} workouts")
        
        # Test exercise selection
        print("Testing exercise selection...")
        chart_config = await chain.generate_chart_config(
            workouts=db_result,
            original_query=query,
            llm=chain.llm
        )
        assert chart_config is not None, "Chart configuration generation failed"
        assert "datasets" in chart_config, "Missing datasets in chart config"
        
        # Check if at least one of the expected exercises is included
        selected_exercises = [dataset["label"].lower() for dataset in chart_config["datasets"]]
        found_match = any(
            expected.lower() in selected_exercises 
            for expected in expected_selections
        )
        assert found_match, f"Selected exercises {selected_exercises} don't contain any expected {expected_selections}"
        
        # Test full chain integration
        print("Testing full chain...")
        result = await chain.invoke(query, TEST_USER_ID)
        assert result is not None, "Full chain execution failed"
        assert "data" in result, "Missing data in chain result"
        assert "chart" in result, "Missing chart in chain result"
        assert "url" in result["chart"], "Missing chart URL"
        assert "config" in result["chart"], "Missing chart configuration"
        
        # Print summary of results
        print("\nResults summary:")
        print(f"Total workouts: {result['data']['metadata']['total_workouts']}")
        print(f"Total exercises: {result['data']['metadata']['total_exercises']}")
        print(f"Selected exercises: {[d['label'] for d in result['chart']['config']['datasets']]}")
        print(f"\033[92mChart URL generated: {result['chart']['url']}\033[0m")        
        if result['data']['workouts']:
            print("\nSample workout:")
            pprint(result['data']['workouts'][0])

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_workout_analysis_chain())