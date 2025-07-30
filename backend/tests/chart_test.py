# # test_chart_service.py
# import os
# import sys
# import json
# import asyncio
# from datetime import datetime
# from dotenv import load_dotenv

# # Add the project root directory to Python path
# project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# sys.path.insert(0, project_root)  # Use insert instead of append to prioritize

# # Now you can import from the main app structure
# from app.services.workout_analysis.graph_service import WorkoutGraphService
# from app.services.chart_generator.chart_service import ChartService
# from app.core.supabase.client import SupabaseClient
# from app.services.workout_analysis.metrics_calc import MetricsProcessor

# async def test_chart_generation():
#     # Load environment variables
#     load_dotenv()
    
#     # Get user ID
#     user_id = os.environ.get("DEVELOPMENT_USER_ID")
#     if not user_id:
#         print("Error: DEVELOPMENT_USER_ID not set in environment variables")
#         return
    
#     print(f"Using user ID: {user_id}")
    
#     # Initialize services
#     db = SupabaseClient()
#     chart_service = ChartService()
#     graph_service = WorkoutGraphService(db)
    
#     # Step 1: Fetch and format workout data
#     print("Fetching workout data...")
#     workouts_data = db.execute_query(
#         table_name="workouts",
#         filters={"user_id": user_id}
#     )
    
#     if not workouts_data:
#         print("No workouts found for user")
#         return
    
#     # Process each workout
#     processed_workouts = []
    
#     for workout in workouts_data:
#         # Fetch exercises for this workout
#         exercises_data = db.execute_query(
#             table_name="workout_exercises",
#             filters={"workout_id": workout["id"]}
#         )
        
#         workout_exercises = []
        
#         for exercise in exercises_data:
#             # Fetch sets for this exercise
#             sets_data = db.execute_query(
#                 table_name="workout_exercise_sets",
#                 filters={"exercise_id": exercise["id"]}
#             )
            
#             # Format exercise data
#             formatted_exercise = {
#                 "exercise_name": exercise["name"],  # Use exercise_name as expected by graph service
#                 "sets": [],
#                 "metrics": {
#                     "total_sets": len(sets_data),
#                     "total_volume": 0,
#                     "highest_1rm": 0
#                 }
#             }
            
#             # Process sets
#             for set_data in sets_data:
#                 weight = set_data.get("weight", 0) or 0
#                 reps = set_data.get("reps", 0) or 0
                
#                 volume = weight * reps
#                 estimated_1rm = weight * (1 + (reps/30)) if reps > 0 else 0
                
#                 if estimated_1rm > formatted_exercise["metrics"]["highest_1rm"]:
#                     formatted_exercise["metrics"]["highest_1rm"] = estimated_1rm
                
#                 formatted_set = {
#                     "weight": weight,
#                     "reps": reps,
#                     "volume": volume,
#                     "estimated_1rm": estimated_1rm
#                 }
                
#                 formatted_exercise["sets"].append(formatted_set)
#                 formatted_exercise["metrics"]["total_volume"] += volume
            
#             workout_exercises.append(formatted_exercise)
        
#         # Format workout data
#         formatted_workout = {
#             "id": workout["id"],
#             "date": workout["created_at"],
#             "name": workout["name"],
#             "exercises": workout_exercises
#         }
        
#         processed_workouts.append(formatted_workout)
    
#     # Step 2: Prepare workout data bundle
#     workout_data = {
#         "workouts": processed_workouts,
#         "metadata": {
#             "total_workouts": len(processed_workouts),
#             "total_exercises": sum(len(w["exercises"]) for w in processed_workouts),
#             "date_range": {
#                 "start": min([w["date"] for w in processed_workouts], default=None),
#                 "end": max([w["date"] for w in processed_workouts], default=None)
#             }
#         }
#     }
    
#     # Step 3: Calculate metrics using MetricsProcessor
#     print("Calculating workout metrics...")
#     metrics_processor = MetricsProcessor(workout_data)
#     workout_metrics = metrics_processor.process()
    
#     # Add metrics to workout data
#     workout_data['metrics'] = workout_metrics
#     print(f"Added metrics: {list(workout_metrics.keys())}")
    
#     # Create a simple bundle-like structure
#     bundle = type('WorkoutDataBundle', (), {
#         "bundle_id": "test-bundle-id",
#         "workout_data": workout_data,
#         "chart_urls": {},
#         "chart_url": None
#     })
    
#     # Step 4: Generate charts using different methods
#     print("\nTesting chart generation...")
    
#     # Debug helper function
#     def debug_chart_config(config, name="Chart Config"):
#         """Helper to debug chart configurations"""
#         print(f"\n--- DEBUG: {name} ---")
        
#         # Extract key statistics to verify data integrity
#         labels = config.get("labels", [])
#         datasets = config.get("datasets", [])
        
#         print(f"Labels: {len(labels)} date points")
#         print(f"Datasets: {len(datasets)} exercises")
        
#         for idx, dataset in enumerate(datasets):
#             data = dataset.get("data", [])
#             label = dataset.get("label", f"Dataset {idx}")
            
#             # Check for None values which cause validation errors
#             none_count = sum(1 for d in data if d is None)
            
#             print(f"  {label}: {len(data)} data points, {none_count} None values")
            
#             # Show some sample data
#             if data:
#                 print(f"    Sample values: {data[:3]}...")
                
#         print("------------------------")
    
#     # Test 1: Generate all charts at once using add_charts_to_bundle
#     print("\n--- Testing add_charts_to_bundle ---")
#     try:
#         # Mock LLM if needed
#         mock_llm = type('MockLLM', (), {"complete": lambda p: "Test"})
        
#         # Before generating charts, ensure our top performers are correctly identified
#         top_strength = graph_service._get_top_performers(workout_data, "1rm_change", 3)
#         top_volume = graph_service._get_top_performers(workout_data, "volume_change", 3)
        
#         print(f"Top strength performers: {[ex['name'] for ex in top_strength]}")
#         print(f"Top volume performers: {[ex['name'] for ex in top_volume]}")
        
#         # Generate the charts
#         chart_urls = await graph_service.add_charts_to_bundle(
#             bundle=bundle,
#             llm=mock_llm
#         )
        
#         if chart_urls:
#             print(f"✅ Generated {len(chart_urls)} charts:")
            
#             # Update bundle
#             bundle.chart_urls = chart_urls
#             bundle.chart_url = chart_urls.get("strength_progress")
#         else:
#             print("❌ Failed to generate charts with add_charts_to_bundle")
#     except Exception as e:
#         print(f"❌ Error in add_charts_to_bundle: {str(e)}")
    
#     # Test 2: Test individual chart generation methods
#     print("\n--- Testing individual chart methods ---")
    
#     try:
#         # Test strength chart
#         print("\nTesting strength chart...")
#         strength_config = graph_service._generate_strength_chart_config(top_strength, workout_data)
#         debug_chart_config(strength_config, "Strength Chart")
#         strength_url = chart_service.create_quickchart_url(config=strength_config)
#         print(f"✅ Strength chart URL: {strength_url}")
        
#         # Test volume chart
#         print("\nTesting volume chart...")
#         volume_config = graph_service._generate_volume_chart_config(top_volume, workout_data)
#         debug_chart_config(volume_config, "Volume Chart")
#         volume_url = chart_service.create_quickchart_url(config=volume_config)
#         print(f"✅ Volume chart URL: {volume_url}")
        
#         # Test frequency chart
#         print("\nTesting frequency chart...")
#         workout_dates = [w.get('date', '') for w in workout_data.get('workouts', [])]
#         frequency_config = graph_service._generate_frequency_chart_config(workout_dates)
#         debug_chart_config(frequency_config, "Frequency Chart")
#         frequency_url = chart_service.create_quickchart_url(config=frequency_config)
#         print(f"✅ Frequency chart URL: {frequency_url}")
        
#     except Exception as e:
#         import traceback
#         print(f"❌ Error testing individual chart methods: {str(e)}")
#         print(traceback.format_exc())
    
#     print("\nChart testing complete!")

# if __name__ == "__main__":
#     asyncio.run(test_chart_generation())