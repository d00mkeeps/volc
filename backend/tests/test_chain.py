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
    test_cases = [
        (
            "Show me my bench press and squats from the last 3 months",
            ExerciseQuery(
                exercises=["bench press", "squats"],
                timeframe="3 months"
            )
        ),
        (
            "How are my deadlifts progressing?",
            ExerciseQuery(
                exercises=["deadlifts"],
                timeframe="3 months"  # default
            )
        ),
        (
            "Check my pull-ups over the past year",
            ExerciseQuery(
                exercises=["pull-ups"],
                timeframe="12 months"
            )
        )
    ]
    
    print("\nTesting WorkoutAnalysisChain:")
    for query, expected_extraction in test_cases:
        print(f"\nTesting query: {query}")
        
        # Test extraction component
        print("Testing extraction...")
        extracted = await chain._extract_query(query)
        assert extracted is not None, "Extraction failed"
        assert isinstance(extracted, ExerciseQuery), "Incorrect extraction type"
        assert set(extracted.exercises) == set(expected_extraction.exercises), "Extracted exercises don't match"
        assert extracted.timeframe == expected_extraction.timeframe, "Extracted timeframe doesn't match"
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
        
        # Test full chain integration
        print("Testing full chain...")
        result = await chain.invoke(query, TEST_USER_ID)
        assert result is not None, "Full chain execution failed"
        assert "workouts" in result, "Missing workouts in chain result"
        assert "metadata" in result, "Missing metadata in chain result"
        
        # Print summary of results
        print("\nResults summary:")
        print(f"Total workouts: {result['metadata']['total_workouts']}")
        print(f"Total exercises: {result['metadata']['total_exercises']}")
        if result['workouts']:
            print("\nSample workout:")
            pprint(result['workouts'][0])
    
    print("\nAll tests passed successfully!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_workout_analysis_chain())