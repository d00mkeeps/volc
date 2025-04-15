# test_workout_bundle.py
import asyncio
import uuid
import logging

# Import necessary components
from app.core.supabase.client import SupabaseClient
from app.services.workout_analysis.query_builder import WorkoutQueryBuilder
from app.schemas.exercise_query import ExerciseQuery
from app.services.workout_analysis_service import WorkoutAnalysisService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bundle_test")

async def test_workout_bundle_flow():
    """Test the complete workout bundle flow with our new optimizations."""
    
    # Initialize components
    supabase_client = SupabaseClient()
    query_builder = WorkoutQueryBuilder(supabase_client)
    
    # 1. Test workout data retrieval by exercise name
    logger.info("STEP 1: Retrieving workout data by exercise name")
    
    # Use your test user ID
    test_user_id = '1e2d6190-5d52-4f48-974c-7a5a43a50bf3'
    
    # Create a query for specific exercises
    query = ExerciseQuery(
        exercises=["bench press", "squat"],  # Use exercises you know exist in your test data
        timeframe="3 months"
    )
    
    # Fetch the workout data
    workout_data = await query_builder.fetch_exercise_data(
        user_id=test_user_id,
        query_params=query
    )
    
    if not workout_data:
        logger.error("Failed to retrieve workout data")
        return
    
    # Log basic stats about the data retrieved
    total_workouts = workout_data['metadata']['total_workouts']
    total_exercises = workout_data['metadata']['total_exercises']
    logger.info(f"Retrieved {total_workouts} workouts with {total_exercises} exercises")
    
    # 2. Create a workout bundle with IDs instead of full data
    logger.info("\nSTEP 2: Creating workout bundle with ID references")
    
    # Create a mock WorkoutAnalysisService just for testing (we don't need LLM here)
    mock_service = WorkoutAnalysisService(llm=None, supabase_client=supabase_client)
    
    # Create enhanced bundle
    bundle = await mock_service._prepare_enhanced_bundle(
        workout_data=workout_data,
        original_query="Test query for bench press and squat progress"
    )
    
    # Verify the bundle has workout IDs and exercise IDs
    logger.info(f"Bundle created with {len(bundle.workout_ids)} workout IDs")
    logger.info(f"Bundle includes {len(bundle.exercise_ids)} exercise IDs")
    
    # Print sample IDs for verification
    logger.info(f"Sample workout ID: {bundle.workout_ids[0] if bundle.workout_ids else 'None'}")
    logger.info(f"Sample exercise ID: {bundle.exercise_ids[0] if bundle.exercise_ids else 'None'}")
    
    # Validate exercise mapping
    logger.info(f"Exercise mapping has {len(bundle.exercise_mapping)} entries")
    
    # 3. Create a "diet" bundle for client
    logger.info("\nSTEP 3: Creating diet bundle for client")
    
    client_bundle = bundle.client_version()
    
    # Check client bundle doesn't contain full workout data
    logger.info(f"Client bundle keys: {list(client_bundle.keys())}")
    
    if "workout_data" in client_bundle:
        logger.error("ERROR: Client bundle contains full workout data!")
    else:
        logger.info("✓ Client bundle correctly excludes full workout data")
    
    # 4. Store the bundle in the database
    logger.info("\nSTEP 4: Storing bundle in database")
    
    # Create a conversation ID for testing
    test_conversation_id = str(uuid.uuid4())
    
    # Link bundle to conversation
    result = await supabase_client.create_workout_bundle_with_link(
        bundle=bundle,
        user_id=test_user_id,
        conversation_id=test_conversation_id
    )
    
    if not result.get('success'):
        logger.error(f"ERROR: Failed to store bundle: {result.get('error')}")
        return
    
    logger.info(f"✓ Bundle successfully stored with ID: {result.get('bundle_id')}")
    
    # 5. Retrieve the bundle from the database
    logger.info("\nSTEP 5: Retrieving bundle from database")
    
    # Get bundle ID from conversation
    bundle_id = await supabase_client.get_conversation_bundle_id(test_conversation_id)
    
    if not bundle_id:
        logger.error("ERROR: Failed to retrieve bundle ID from conversation")
        return
    
    logger.info(f"Retrieved bundle ID: {bundle_id}")
    
    # Get the bundle
    stored_bundle = await supabase_client.get_workout_bundle(bundle_id)
    
    if not stored_bundle:
        logger.error("ERROR: Failed to retrieve bundle from database")
        return
    
    logger.info(f"✓ Retrieved bundle with ID: {stored_bundle.get('bundle_id')}")
    
    # 6. Reconstruct full workout data from IDs
    logger.info("\nSTEP 6: Reconstructing full workout data from IDs")
    
    # Extract IDs from stored bundle
    workout_ids = stored_bundle.get('workout_data', {}).get('workout_ids', [])
    exercise_ids = stored_bundle.get('workout_data', {}).get('exercise_ids', [])
    exercise_mapping = stored_bundle.get('workout_data', {}).get('exercise_mapping', {})
    
    logger.info(f"Reconstructing from {len(workout_ids)} workout IDs and {len(exercise_ids)} exercise IDs")
    
    # Get full data using our new function
    reconstructed_data = await supabase_client.get_workout_data_from_ids(
        workout_ids=workout_ids,
        exercise_ids=exercise_ids,
        exercise_mapping=exercise_mapping
    )
    
    if not reconstructed_data:
        logger.error("ERROR: Failed to reconstruct workout data")
        return
    
    # Verify reconstructed data
    reconstructed_workouts = len(reconstructed_data.get('workouts', []))
    reconstructed_exercises = reconstructed_data.get('metadata', {}).get('total_exercises', 0)
    
    logger.info(f"✓ Reconstructed {reconstructed_workouts} workouts with {reconstructed_exercises} exercises")
    
    # 7. Compare original and reconstructed data
    logger.info("\nSTEP 7: Comparing original and reconstructed data")
    
    # Count original workouts and exercises
    original_workout_ids = set(w.get('id') for w in workout_data.get('workouts', []))
    original_exercise_count = sum(len(w.get('exercises', [])) for w in workout_data.get('workouts', []))
    
    # Count reconstructed workouts and exercises
    reconstructed_workout_ids = set(w.get('id') for w in reconstructed_data.get('workouts', []))
    reconstructed_exercise_count = sum(len(w.get('exercises', [])) for w in reconstructed_data.get('workouts', []))
    
    logger.info(f"Original data: {len(original_workout_ids)} workouts with {original_exercise_count} exercises")
    logger.info(f"Reconstructed data: {len(reconstructed_workout_ids)} workouts with {reconstructed_exercise_count} exercises")
    
    # Check if all workout IDs match
    matching_workouts = original_workout_ids.intersection(reconstructed_workout_ids)
    logger.info(f"Matching workout IDs: {len(matching_workouts)} of {len(original_workout_ids)}")
    
    # Success message if all tests pass
    logger.info("\nTEST SUMMARY:")
    if (len(matching_workouts) == len(original_workout_ids) and 
        reconstructed_exercise_count == original_exercise_count):
        logger.info("✅ All tests PASSED! The workout bundle optimization is working correctly.")
    else:
        logger.info("❌ Tests FAILED. There are discrepancies between original and reconstructed data.")

if __name__ == "__main__":
    # Run the test
    asyncio.run(test_workout_bundle_flow())