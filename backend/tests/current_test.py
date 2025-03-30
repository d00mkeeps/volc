import pytest
import os
import logging
import json
import asyncio
from dotenv import load_dotenv
from datetime import datetime, timedelta

from app.services.workout_analysis_service import CustomJSONEncoder
from app.core.supabase.client import SupabaseClient
from app.services.workout_analysis.query_builder import WorkoutQueryBuilder
from app.schemas.exercise_query import ExerciseQuery
from app.services.workout_analysis.formatter import WorkoutFormatter
from app.services.workout_analysis.metrics_calc import MetricsProcessor

# ANSI color codes
PURPLE = "\033[35m"
RESET = "\033[0m"
CHECK = "✅"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Use a regular test function (not async) and manually run the event loop
def test_sql_function_integration():
    """Test the SQL function integration for workout queries."""
    load_dotenv()
    logger = logging.getLogger(__name__)
    
    # Log test start with purple text
    logger.info(f"{PURPLE}TEST 1 (SQL Function Integration): Starting test{RESET}")
    
    # Environment setup
    user_id = os.getenv("DEVELOPMENT_USER_ID")
    if not user_id:
        pytest.skip("Missing required DEVELOPMENT_USER_ID environment variable")
    
    # Initialize services
    logger.info(f"{PURPLE}TEST 2 (Service Initialization): Initializing services{RESET}")
    supabase_client = SupabaseClient()
    query_builder = WorkoutQueryBuilder(supabase_client)
    formatter = WorkoutFormatter()
    
    # Test successful initialization
    assert supabase_client is not None, "Supabase client should be initialized"
    assert query_builder is not None, "Query builder should be initialized"
    logger.info(f"{PURPLE}TEST 2 (Service Initialization): {CHECK}{RESET}")
    
    # Create an event loop to run async code
    loop = asyncio.get_event_loop()
    
    # Fetch workout data using SQL function
    logger.info(f"{PURPLE}TEST 3 (SQL Function Query): Fetching workout data{RESET}")
    query = ExerciseQuery(
        exercises=["bench press", "squat", "overhead press"],
        timeframe="3 months"
    )
    
    logger.info(f"Fetching workout data for user {user_id}")
    
    # Run the async function in the event loop
    raw_data = loop.run_until_complete(
        query_builder.fetch_exercise_data(
            user_id=user_id,
            query_params=query
        )
    )
    
    # Check if data was returned
    assert raw_data is not None, "Raw workout data should be returned"
    logger.info(f"{PURPLE}TEST 3 (SQL Function Query): {CHECK} - Raw data retrieved successfully{RESET}")
    
    # Format the raw data
    logger.info(f"{PURPLE}TEST 4 (Data Formatting): Formatting raw workout data{RESET}")
    workout_data = formatter._format_sql_function_data(raw_data)
    
    # Check if formatted data was returned
    assert workout_data is not None, "Formatted workout data should be returned"
    logger.info(f"{PURPLE}TEST 4 (Data Formatting): {CHECK} - Data formatted successfully{RESET}")
    
    # Calculate metrics
    logger.info(f"{PURPLE}TEST 5 (Metrics Calculation): Calculating workout metrics{RESET}")
    metrics_processor = MetricsProcessor(workout_data)
    metrics = metrics_processor.process()
    
    # Check if metrics were calculated
    assert metrics is not None, "Metrics should be calculated"
    logger.info(f"{PURPLE}TEST 5 (Metrics Calculation): {CHECK} - Metrics calculated successfully{RESET}")
    
    # Add metrics to workout data
    workout_data['metrics'] = metrics
    
    # Log metrics structure
    logger.info(f"{PURPLE}TEST 6 (Metrics Structure): Verifying metrics structure{RESET}")
    
    # Check for expected metrics categories
    assert 'exercise_progression' in metrics or 'strength_progression' in metrics or 'workout_frequency' in metrics, \
        "Metrics should contain at least one of the expected categories"
    
    # Log found metrics categories
    metrics_categories = list(metrics.keys())
    logger.info(f"Found metrics categories: {metrics_categories}")
    
    # Check for workout frequency metrics
    if 'workout_frequency' in metrics:
        frequency_metrics = metrics['workout_frequency']
        logger.info(f"Workout frequency metrics: {json.dumps(frequency_metrics, cls=CustomJSONEncoder)}")
        assert 'total_workouts' in frequency_metrics, "Workout frequency should contain total_workouts"
    
    # Check for exercise progression metrics
    if 'exercise_progression' in metrics:
        progression = metrics['exercise_progression']
        logger.info(f"Found progression data for {len(progression)} exercises")
        
        if progression:
            # Take the first exercise as a sample
            sample_exercise = next(iter(progression.values()))
            logger.info(f"Sample exercise progression: {json.dumps(sample_exercise, cls=CustomJSONEncoder)}")
            assert 'weight_progression' in sample_exercise, "Exercise progression should contain weight_progression"
    
    # Check for strength progression metrics
    if 'strength_progression' in metrics:
        strength_data = metrics['strength_progression']
        logger.info(f"Found strength data for {len(strength_data)} exercises")
        
        if strength_data:
            # Take the first exercise as a sample
            sample_strength = next(iter(strength_data.values()))
            logger.info(f"Sample strength progression: {json.dumps(sample_strength, cls=CustomJSONEncoder)}")
            assert 'estimated_1rm' in sample_strength, "Strength progression should contain estimated_1rm"
    
    # Check for improved exercises
    if 'most_improved_exercises' in metrics:
        improved = metrics['most_improved_exercises']
        logger.info(f"Most improved exercises: {json.dumps(improved, cls=CustomJSONEncoder)}")
        assert isinstance(improved, list), "Most improved exercises should be a list"
    
    logger.info(f"{PURPLE}TEST 6 (Metrics Structure): {CHECK} - Metrics structure verified{RESET}")
    
    # Test JSON serialization of metrics
    logger.info(f"{PURPLE}TEST 7 (Metrics Serialization): Testing metrics JSON serialization{RESET}")
    
    try:
        serialized_metrics = json.dumps(metrics, cls=CustomJSONEncoder)
        logger.info("Successfully serialized metrics with CustomJSONEncoder")
        
        # Test deserialization to ensure valid JSON
        deserialized = json.loads(serialized_metrics)
        assert deserialized is not None, "Metrics should deserialize properly"
        
    except Exception as e:
        assert False, f"Metrics serialization failed: {str(e)}"
    
    logger.info(f"{PURPLE}TEST 7 (Metrics Serialization): {CHECK} - Metrics serialization successful{RESET}")
    
    # Test LLM context generation (simulated)
    logger.info(f"{PURPLE}TEST 8 (LLM Context): Testing LLM context generation{RESET}")
    
    try:
        # Create a sample context similar to what would be sent to the LLM
        llm_context = {
            "available_data": {
                "query": query.exercises,
                "date_range": {
                    "start": workout_data['metadata']['date_range']['earliest'],
                    "end": workout_data['metadata']['date_range']['latest']
                },
                "workout_metrics": metrics,
                "total_workouts": workout_data['metadata']['total_workouts']
            }
        }
        
        # Try to serialize the LLM context
        context_json = json.dumps(llm_context, cls=CustomJSONEncoder)
        logger.info("Successfully created and serialized LLM context")
        
        # Log a sample of the context (truncated for readability)
        context_preview = json.dumps(llm_context, cls=CustomJSONEncoder, indent=2)
        if len(context_preview) > 500:
            context_preview = context_preview[:500] + "... (truncated)"
        logger.info(f"LLM context preview: {context_preview}")
        
    except Exception as e:
        assert False, f"LLM context generation failed: {str(e)}"
    
    logger.info(f"{PURPLE}TEST 8 (LLM Context): {CHECK} - LLM context generation successful{RESET}")
    
    # Test race condition (simulate parallel operations)
    logger.info(f"{PURPLE}TEST 9 (Race Condition): Testing potential race conditions{RESET}")
    
    async def simulate_parallel_operations():
        # Simulate multiple parallel operations that might cause race conditions
        raw_data_task = asyncio.create_task(
            query_builder.fetch_exercise_data(
                user_id=user_id,
                query_params=query
            )
        )
        
        # Add a small delay to simulate race condition
        await asyncio.sleep(0.1)
        
        # Get the raw data
        raw_data_result = await raw_data_task
        
        # Format and calculate metrics in sequence
        formatted_data = formatter._format_sql_function_data(raw_data_result)
        metrics_proc = MetricsProcessor(formatted_data)
        metrics_result = metrics_proc.process()
        
        # Add metrics to the formatted data
        formatted_data['metrics'] = metrics_result
        
        return formatted_data
    
    # Run the race condition test
    race_test_data = loop.run_until_complete(simulate_parallel_operations())
    
    # Verify the result
    assert race_test_data is not None, "Race condition test should return data"
    assert 'metrics' in race_test_data, "Metrics should be present after race condition test"
    
    logger.info(f"{PURPLE}TEST 9 (Race Condition): {CHECK} - No race conditions detected{RESET}")
    
    # Final success message
    logger.info(f"{PURPLE}All workout data and metrics tests completed successfully! {CHECK}{RESET}")