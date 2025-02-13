import pytest
from app.schemas.workout_query import ExerciseQuery
from app.services.workout_analysis.data_fetching.query_builder import WorkoutQueryBuilder
from app.core.supabase.client import SupabaseClient
from pprint import pprint

def test_fetch_exercise_data():
    from dotenv import load_dotenv
    import os
    
    load_dotenv()

    TEST_USER_ID = os.environ.get("DEVELOPMENT_USER_ID")
    print(f"\nUsing test user ID: {TEST_USER_ID}")
    
    supabase_client = SupabaseClient()
    
    builder = WorkoutQueryBuilder(supabase_client)
    query = ExerciseQuery(
        exercises=["squat", "bench"],
        timeframe="3 months"
    )
    
    result = builder.fetch_exercise_data(
        user_id=TEST_USER_ID, 
        query_params=query
    )
    
    print("\nQuery result:")
    pprint(result)
    
    if result:
        print(f"\nNumber of records: {len(result)}")
        if len(result) > 0:
            print("\nFirst record sample:")
            pprint(result[0])
    
    assert result is not None
    assert isinstance(result, list)