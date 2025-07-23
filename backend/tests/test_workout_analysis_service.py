# tests/test_workout_analysis_service.py
import os
import sys
import asyncio
import logging
import uuid
from datetime import datetime

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now we can import from app
from app.services.job_store import job_store
from app.services.workout_analysis_service import WorkoutAnalysisService
from app.services.db.workout_service import WorkoutService
from backend.app.services.db.analysis_service import GraphBundleService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("workout_analysis_test")

async def test_workout_analysis_service():
    """
    Test the complete workflow of the workout analysis service:
    1. Fetch real workout data using your workout service
    2. Create an analysis job
    3. Wait for job completion
    4. Validate the analysis results
    """
    logger.info("=== STARTING WORKOUT ANALYSIS SERVICE TEST ===")
    
    # Setup: Initialize services
    workout_service = WorkoutService()
    graph_bundle_service = GraphBundleService()
    analysis_service = WorkoutAnalysisService(
        workout_service=workout_service,
        graph_bundle_service=graph_bundle_service
    )
    
    # Start the job cleanup task
    await job_store.start_cleanup_task()
    
    # Use a real test user ID with workout data
    test_user_id = os.getenv("TEST_USER_ID", "1e2d6190-5d52-4f48-974c-7a5a43a50bf3")
    logger.info(f"Using test user ID: {test_user_id}")
    
    # Step 1: Fetch real workout data using your service
    logger.info("\n--- Step 1: Fetching workout data ---")
    
    # Use exercises that are likely to exist in your test data
    exercise_names = ["bench press", "squat", "deadlift"]
    logger.info(f"Fetching workout data for exercises: {exercise_names}")
    
    try:
        workout_data = await workout_service.get_workout_history_by_exercises(
            user_id=test_user_id,
            exercises=exercise_names,
            timeframe="3 months"
        )
        
        if not workout_data or not workout_data.get("workouts", []):
            logger.error("❌ No workout data found for the test user. Test cannot proceed.")
            return False
        
        # Log the data we found
        workouts_count = len(workout_data.get("workouts", []))
        exercises_count = sum(len(w.get("exercises", [])) for w in workout_data.get("workouts", []))
        logger.info(f"✓ Found {workouts_count} workouts with a total of {exercises_count} exercises")
    
    except Exception as e:
        logger.error(f"❌ Error fetching workout data: {str(e)}")
        logger.error("Creating minimal test workout data instead")
        
        # Create minimal test data
        workout_data = create_test_workout_data(test_user_id)
        logger.info(f"Created test data with {len(workout_data['workouts'])} workouts")
    
    # Step 2: Create an analysis job
    logger.info("\n--- Step 2: Creating analysis job ---")
    
    # Create a test conversation ID
    test_conversation_id = str(uuid.uuid4())
    logger.info(f"Test conversation ID: {test_conversation_id}")
    
    # Parameters for the job
    job_parameters = {
        "user_id": test_user_id,
        "workout_data": workout_data,
        "message": "Analyze my workout progress over time",
        "conversation_id": test_conversation_id
    }
    
    # Create the job
    job_id = await analysis_service.create_analysis_job(
        user_id=test_user_id,
        parameters=job_parameters
    )
    
    if not job_id:
        logger.error("❌ Failed to create analysis job")
        return False
        
    logger.info(f"✓ Created analysis job with ID: {job_id}")
    
    # Step 3: Poll for job completion
    logger.info("\n--- Step 3: Waiting for job to complete ---")
    
    max_attempts = 30  # Maximum number of polling attempts
    attempt = 0
    completed_job = None
    
    while attempt < max_attempts:
        # Get job status
        job = await analysis_service.get_job_status(job_id)
        
        if not job:
            logger.error(f"❌ Job {job_id} not found")
            return False
        
        status = job.get("status")
        progress = job.get("progress")
        status_message = job.get("status_message", "")
        
        logger.info(f"Job status: {status}, progress: {progress}%, message: {status_message}")
        
        # Check if job is complete
        if status == "completed":
            logger.info("✓ Job completed successfully!")
            completed_job = job
            break
        elif status == "failed":
            logger.error(f"❌ Job failed: {job.get('error')}")
            return False
        
        # Wait before polling again
        attempt += 1
        await asyncio.sleep(2)  # 2 second delay between polls
    
    if not completed_job:
        logger.error("❌ Job did not complete within the timeout period")
        return False
    
    # Step 4: Validate the analysis results
    logger.info("\n--- Step 4: Validating analysis results ---")
    
    result = completed_job.get("result", {})
    
    # Check for required components
    required_components = [
        "bundle_id",
        "workout_data",
        "chart_urls",
        "consistency_metrics",
        "top_performers"
    ]
    
    # Validate each component
    for component in required_components:
        if component in result:
            logger.info(f"✓ Result contains {component}")
        else:
            logger.error(f"❌ Result missing required component: {component}")
            return False
    
    # Check for metrics in workout data
    if "metrics" in result.get("workout_data", {}):
        metrics = result["workout_data"]["metrics"]
        logger.info(f"✓ Result contains metrics with {len(metrics)} categories")
        
        # Log the metrics categories
        logger.info(f"  Metrics categories: {list(metrics.keys())}")
    else:
        logger.error("❌ Result missing workout metrics")
        return False
    
    # Check for chart URLs
    chart_urls = result.get("chart_urls", {})
    if chart_urls:
        logger.info(f"✓ Result contains {len(chart_urls)} chart URLs")
        logger.info(f"  Chart types: {list(chart_urls.keys())}")
    else:
        logger.warning("⚠️ Result contains no chart URLs")
    
    # Check for top performers
    top_performers = result.get("top_performers", {})
    if top_performers:
        logger.info(f"✓ Result contains top performers for {len(top_performers)} categories")
        logger.info(f"  Top performer categories: {list(top_performers.keys())}")
    else:
        logger.error("❌ Result missing top performers data")
        return False
    
    # Test successful!
    logger.info("\n=== TEST SUMMARY ===")
    logger.info("✅ Workout analysis service test completed successfully")
    logger.info(f"✅ Job created, processed, and completed with valid results")
    logger.info(f"✅ All required components validated")
    
    return True

def create_test_workout_data(user_id: str):
    """Create minimal test workout data if fetching fails"""
    # Create sample workout timestamps
    now = datetime.now()
    two_weeks_ago = int((now.timestamp() - (14 * 24 * 60 * 60)) * 1000)
    one_week_ago = int((now.timestamp() - (7 * 24 * 60 * 60)) * 1000)
    
    return {
        "workouts": [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": "Test Workout 1",
                "date": two_weeks_ago,
                "completed_at": two_weeks_ago + (60 * 60 * 1000),  # 1 hour later
                "exercises": [
                    {
                        "id": str(uuid.uuid4()),
                        "exercise_name": "bench press",
                        "sets": [
                            {"weight": 135, "reps": 10},
                            {"weight": 155, "reps": 8},
                            {"weight": 175, "reps": 6}
                        ]
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "exercise_name": "squat",
                        "sets": [
                            {"weight": 185, "reps": 8},
                            {"weight": 205, "reps": 6},
                            {"weight": 225, "reps": 4}
                        ]
                    }
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": "Test Workout 2",
                "date": one_week_ago,
                "completed_at": one_week_ago + (60 * 60 * 1000),  # 1 hour later
                "exercises": [
                    {
                        "id": str(uuid.uuid4()),
                        "exercise_name": "bench press",
                        "sets": [
                            {"weight": 145, "reps": 8},
                            {"weight": 165, "reps": 6},
                            {"weight": 185, "reps": 4}
                        ]
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "exercise_name": "squat",
                        "sets": [
                            {"weight": 195, "reps": 8},
                            {"weight": 215, "reps": 6},
                            {"weight": 235, "reps": 4}
                        ]
                    }
                ]
            }
        ],
        "metadata": {
            "total_workouts": 2,
            "total_exercises": 4,
            "date_range": {
                "start": two_weeks_ago,
                "end": one_week_ago
            },
            "exercises_included": ["bench press", "squat"]
        }
    }

async def main():
    """Main test function"""
    try:
        success = await test_workout_analysis_service()
        exit_code = 0 if success else 1
        logger.info(f"\nTest {'PASSED' if success else 'FAILED'}")
    except Exception as e:
        logger.error(f"Unhandled test exception: {str(e)}", exc_info=True)
        exit_code = 1
    
    # Return appropriate exit code
    return exit_code

if __name__ == "__main__":
    # Run the test directly with Python
    exit_code = asyncio.run(main())
    exit(exit_code)