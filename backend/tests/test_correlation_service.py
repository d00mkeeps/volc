# tests/test_real_workout_correlation.py

import pytest
import os
import logging
import asyncio
import json
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from datetime import datetime, timedelta

from app.services.workout_analysis_service import WorkoutAnalysisService
from app.core.supabase.client import SupabaseClient
from app.services.workout_analysis.query_builder import WorkoutQueryBuilder
from app.schemas.exercise_query import ExerciseQuery
from app.services.workout_analysis.correlation_service import CorrelationService

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@pytest.mark.asyncio
async def test_real_workout_correlation():
    """Test correlation analysis with real workout data from Supabase."""
    load_dotenv()
    logger = logging.getLogger(__name__)
    
    # Environment setup
    user_id = os.getenv("DEVELOPMENT_USER_ID")
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not user_id or not api_key:
        pytest.skip("Missing required environment variables")
    
    # Initialize services
    supabase_client = SupabaseClient()
    query_builder = WorkoutQueryBuilder(supabase_client)
    
    # Fetch workout data for a 3-month period
    query = ExerciseQuery(
        exercises=["bench press", "squat", "overhead press", "deadlift"],
        timeframe="3 months"
    )
    
    logger.info(f"Fetching workout data for user {user_id}")
    workout_data = await query_builder.fetch_exercise_data(
        user_id=user_id,
        query_params=query
    )
    
    if not workout_data:
        pytest.skip("No workout data found for the specified exercises")
    
    # Log found workout data
    logger.info(f"Found {workout_data['metadata']['total_workouts']} workouts")
    logger.info(f"Exercises found: {set(exercise['exercise_name'] for workout in workout_data['workouts'] for exercise in workout['exercises'])}")
    logger.info(f"Date range: {workout_data['metadata']['date_range']['earliest']} to {workout_data['metadata']['date_range']['latest']}")
    
    # Run correlation analysis directly
    correlation_service = CorrelationService()
    correlation_results = correlation_service.analyze_exercise_correlations(workout_data)
    
    # Log correlation findings
    if correlation_results and correlation_results.get('summary'):
        logger.info("\nCorrelation findings:")
        for corr in correlation_results['summary']:
            logger.info(f"{corr['exercise1']} and {corr['exercise2']}: {corr['correlation']:.2f} with {corr['optimal_lag_weeks']} week lag")
    else:
        logger.info("No significant correlations found")
    
    # Test end-to-end with WorkoutAnalysisService
    llm = ChatAnthropic(model="claude-3-7-sonnet-20250219", streaming=True, api_key=api_key)
    service = WorkoutAnalysisService(llm=llm, supabase_client=supabase_client)
    
    async def collect_responses(generator):
        return [response async for response in generator]
    
    responses = await collect_responses(
        service.analyze_workout(
            user_id=user_id,
            workout_data=workout_data,
            message="What correlations do you see between my exercises? Focus on bench press, squat, and overhead press relationships."
        )
    )
    
    # Check for successful processing
    bundle_responses = [r for r in responses if r["type"] == "workout_data_bundle"]
    assert len(bundle_responses) > 0, "Should have bundle response"
    
    # Print LLM analysis
    content_responses = [r for r in responses if r["type"] == "content"]
    content = "".join([r["data"] for r in content_responses])
    logger.info(f"\nLLM Analysis: {content[:500]}...")

    if "heatmap_base64" in bundle_responses[0]["data"]["correlation_data"]:
        print("\nHeatmap base64 (first 50 chars):")
        print(bundle_responses[0]["data"]["correlation_data"]["heatmap_base64"])

if __name__ == "__main__":
    asyncio.run(test_real_workout_correlation())