
import pytest
import os
import logging
import asyncio
import json
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from datetime import datetime, timedelta

from app.services.workout_analysis_service import CustomJSONEncoder, WorkoutAnalysisService
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
           
       # Log correlation structure for debugging
       logger.info(f"Correlation result keys: {list(correlation_results.keys())}")
       if correlation_results.get('summary'):
           sample_corr = correlation_results['summary'][0]
           logger.info(f"Sample correlation entry: {sample_corr}")
           logger.info(f"Sample correlation types: {[(k, type(v).__name__) for k, v in sample_corr.items()]}")
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

   # Test JSON serialization
   logger.info("\n=== Testing JSON Serialization ===")
   
   # Test full response serialization
   for idx, response in enumerate(responses):
       logger.info(f"Testing response {idx+1}/{len(responses)} of type: {response['type']}")
       try:
           serialized = json.dumps(response)
           logger.info(f"✓ Successfully serialized with standard JSON encoder")
       except TypeError as e:
           logger.error(f"✗ Standard JSON serialization failed: {e}")
           
           # Test with CustomJSONEncoder
           try:
               serialized = json.dumps(response, cls=CustomJSONEncoder)
               logger.info(f"✓ Successfully serialized with CustomJSONEncoder")
           except TypeError as e:
               logger.error(f"✗ CustomJSONEncoder serialization failed: {e}")
               
               # Find problematic key
               for key, value in response.items():
                   try:
                       json.dumps({key: value}, cls=CustomJSONEncoder)
                   except TypeError:
                       logger.error(f"  Problem key: '{key}', type: {type(value)}")
                       
                       # If it's a dict, go deeper
                       if isinstance(value, dict):
                           for subkey, subvalue in value.items():
                               try:
                                   json.dumps({subkey: subvalue}, cls=CustomJSONEncoder) 
                               except TypeError:
                                   logger.error(f"    Problem subkey: '{subkey}', type: {type(subvalue)}")
                                   
                                   # If it's a custom boolean, show its representation
                                   if isinstance(subvalue, bool) or str(type(subvalue)).find('bool') != -1:
                                       logger.error(f"    Boolean representation: {repr(subvalue)}, dir: {dir(subvalue)}")
   
   # Test specific serialization of bundle
   if bundle_responses:
       logger.info("\nTesting bundle serialization specifically:")
       bundle = bundle_responses[0]
       
       # Test correlation_data specifically
       if 'correlation_data' in bundle.get('data', {}):
           corr_data = bundle['data']['correlation_data']
           logger.info(f"Correlation data keys: {list(corr_data.keys() if corr_data else [])}")
           
           try:
               serialized = json.dumps({'correlation_data': corr_data}, cls=CustomJSONEncoder)
               logger.info("✓ Successfully serialized correlation_data")
           except TypeError as e:
               logger.error(f"✗ Failed to serialize correlation_data: {e}")
               # Try each key in correlation_data
               if corr_data:
                   for key, value in corr_data.items():
                       try:
                           json.dumps({key: value}, cls=CustomJSONEncoder)
                       except TypeError:
                           logger.error(f"  Problem with correlation_data['{key}']")
                           if key == 'summary' and isinstance(value, list) and value:
                               logger.error(f"  Summary entry sample: {value[0]}")
                               logger.error(f"  Summary entry types: {[(k, type(v).__name__) for k, v in value[0].items()]}")

   # Bundle should successfully serialize with the fixed encoder
   for response in responses:
       try:
           serialized = json.dumps(response, cls=CustomJSONEncoder)
       except TypeError as e:
           assert False, f"JSON serialization failed: {str(e)}"

   if "heatmap_base64" in bundle_responses[0]["data"]["correlation_data"]:
       logger.info("\nHeatmap base64 (first 50 chars):")
       logger.info(bundle_responses[0]["data"]["correlation_data"]["heatmap_base64"][:50])