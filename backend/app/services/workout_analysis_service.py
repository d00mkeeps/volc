# app/services/workout_analysis_service.py

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import traceback

from .job_store import job_store
from .db.workout_service import WorkoutService
from .db.graph_bundle_service import GraphBundleService
from .workout_analysis.metrics_calc import MetricsProcessor
from .workout_analysis.correlation_service import CorrelationService
from .workout_analysis.graph_service import WorkoutGraphService
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import WorkoutDataBundle, BundleMetadata, CorrelationData

logger = logging.getLogger(__name__)

class WorkoutAnalysisService:
    """Service that handles asynchronous workout data analysis"""
    
    def __init__(
        self, 
        workout_service: WorkoutService = None,
        graph_bundle_service: GraphBundleService = None
    ):
        self.workout_service = workout_service or WorkoutService()
        self.graph_bundle_service = graph_bundle_service or GraphBundleService()
        self.graph_service = WorkoutGraphService(self.workout_service)
        self.correlation_service = CorrelationService()
    
    async def create_analysis_job(self, user_id: str, parameters: Dict[str, Any]) -> str:
        """Create a new workout analysis job"""
        # Create job in the store
        job_id = job_store.create_job(
            job_type="workout_analysis",
            user_id=user_id, 
            parameters=parameters
        )
        
        # Start job processing in the background
        asyncio.create_task(self._process_job(job_id))
        
        return job_id
        
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a job"""
        return job_store.get_job(job_id)
    
    async def get_user_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all workout analysis jobs for a user"""
        return job_store.get_jobs_by_user(user_id, job_type="workout_analysis")
    
    async def _process_job(self, job_id: str):
        """Process a workout analysis job"""
        job = job_store.get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        try:
            # Mark job as running
            job_store.update_job(job_id, {"status": "running"})
            
            # Get parameters
            parameters = job["parameters"]
            user_id = parameters.get("user_id")
            workout_data = parameters.get("workout_data")
            exercise_names = parameters.get("exercise_names", [])
            timeframe = parameters.get("timeframe", "3 months")
            conversation_id = parameters.get("conversation_id")
            
            # Step 1: Get workout data if not provided
            if not workout_data and exercise_names:
                job_store.update_job(job_id, {
                    "progress": 10,
                    "status_message": "Retrieving workout history"
                })
                
                workout_data = await self.workout_service.get_workout_history_by_exercises(
                    user_id=user_id,
                    exercises=exercise_names,
                    timeframe=timeframe
                )
            
            # Check if we have workout data
            if not workout_data or not workout_data.get("workouts", []):
                job_store.update_job(job_id, {
                    "status": "failed",
                    "error": "No workout data available for analysis",
                    "status_message": "Failed to retrieve workout data"
                })
                return
                
            # Step 2: Calculate metrics
            job_store.update_job(job_id, {
                "progress": 30,
                "status_message": "Calculating performance metrics"
            })
            
            metrics_processor = MetricsProcessor(workout_data)
            metrics = metrics_processor.process()
            workout_data["metrics"] = metrics
            
            # Step 3: Analyze correlations
            job_store.update_job(job_id, {
                "progress": 50,
                "status_message": "Analyzing exercise correlations"
            })
            
            correlation_results = self.correlation_service.analyze_exercise_correlations(workout_data)
            
            # Step 4: Create workout bundle
            job_store.update_job(job_id, {
                "progress": 70,
                "status_message": "Preparing analysis bundle"
            })
            
            bundle = await self._prepare_enhanced_bundle(
                workout_data=workout_data,
                original_query=parameters.get("message", "Analyze my workout"),
                correlation_results=correlation_results
            )
            
            # Step 5: Generate charts
            job_store.update_job(job_id, {
                "progress": 85,
                "status_message": "Generating visualizations"
            })
            
            chart_urls = await self.graph_service.add_charts_to_bundle(
                bundle=bundle,
                llm=None  # No LLM needed for chart generation
            )
            
            if chart_urls:
                bundle.chart_urls = chart_urls
                # For backward compatibility
                bundle.chart_url = chart_urls.get("strength_progress")
            
            # Step 6: Link to conversation if needed
            if conversation_id:
                job_store.update_job(job_id, {
                    "progress": 95,
                    "status_message": "Linking analysis to conversation"
                })
                
                # Convert bundle to dict for saving
                if hasattr(bundle, "model_dump"):
                    bundle_dict = bundle.model_dump()
                elif hasattr(bundle, "dict"):
                    bundle_dict = bundle.dict()
                else:
                    bundle_dict = dict(bundle)
                    
                bundle_dict["conversationId"] = conversation_id
                
                # Save to database
                result = await self.graph_bundle_service.save_graph_bundle(
                    user_id=user_id,
                    bundle=bundle_dict
                )
                
                if result.get("success", False):
                    # Refresh conversation cache
                    from app.services.cache.conversation_attachments_cache import conversation_cache
                    conversation_cache._cache.pop(conversation_id, None)  # Force reload on next access
                    logger.info(f"Bundle saved and cache refreshed for conversation: {conversation_id}")
                else:
                    logger.warning(f"Failed to link bundle to conversation: {result.get('error')}")
            
            # Step 7: Complete job
            if hasattr(bundle, "model_dump"):
                result_data = bundle.model_dump()
            elif hasattr(bundle, "dict"):
                result_data = bundle.dict()
            else:
                result_data = dict(bundle)
                
            job_store.update_job(job_id, {
                "status": "completed",
                "progress": 100,
                "result": result_data,
                "status_message": "Analysis complete"
            })
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}", exc_info=True)
            job_store.update_job(job_id, {
                "status": "failed",
                "error": f"Analysis failed: {str(e)}",
                "status_message": "Error during analysis"
            })
    async def _prepare_enhanced_bundle(self, workout_data, original_query, correlation_results=None):
        """
        Prepare an enhanced workout data bundle with consistency metrics and top performers.
        
        Args:
            workout_data: The workout data dictionary
            original_query: The original query or message
            correlation_results: Optional correlation analysis results
            
        Returns:
            An enhanced WorkoutDataBundle
        """
        # Generate a new bundle ID
        bundle_id = await new_uuid()
        
        # Extract dates for consistency calculation
        workout_dates = []
        for workout in workout_data.get('workouts', []):
            date_str = workout.get('date', '')
            if date_str:
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    workout_dates.append(date)
                except (ValueError, TypeError):
                    # Skip invalid dates
                    continue
        
        # Calculate consistency metrics
        from .workout_analysis.metrics_calc import WorkoutFrequencyCalculator
        frequency_calculator = WorkoutFrequencyCalculator(workout_data)
        consistency_data = frequency_calculator._calculate_consistency(workout_dates)
        avg_days_between = workout_data.get('metrics', {}).get('workout_frequency', {}).get('avg_days_between', 0)
        
        # Process top performers
        # Get top performers for strength and volume
        top_strength = self.graph_service._get_top_performers(workout_data, metric="1rm_change", limit=3)
        top_volume = self.graph_service._get_top_performers(workout_data, metric="volume_change", limit=3)
        
        # For top frequency exercises (simple count approach)
        exercise_frequency = {}
        for workout in workout_data.get('workouts', []):
            for exercise in workout.get('exercises', []):
                name = exercise.get('exercise_name', '')
                if not name:
                    continue
                    
                if name not in exercise_frequency:
                    exercise_frequency[name] = 0
                exercise_frequency[name] += 1
        
        # Convert to top performers format
        top_frequency = []
        for name, count in sorted(exercise_frequency.items(), key=lambda x: x[1], reverse=True)[:3]:
            top_frequency.append({
                'name': name,
                'first_value': float(count),
                'last_value': float(count),
                'change': 0.0,
                'change_percent': 0.0
            })
        
        # Create bundle
        bundle = WorkoutDataBundle(
            bundle_id=bundle_id,
            metadata=BundleMetadata(
                total_workouts=workout_data['metadata']['total_workouts'],
                total_exercises=workout_data['metadata']['total_exercises'],
                date_range=workout_data['metadata']['date_range'],
                exercises_included=workout_data['metadata'].get('exercises_included', [])
            ),
            workout_data=workout_data,
            original_query=original_query,
            created_at=datetime.now(),
            correlation_data=CorrelationData(**correlation_results) if correlation_results else None,
            chart_urls={},  # Will be populated by add_charts_to_bundle
            consistency_metrics={
                "score": consistency_data.get('score', 0) if hasattr(consistency_data, 'get') else consistency_data,
                "streak": consistency_data.get('streak', 0) if hasattr(consistency_data, 'get') else 0,
                "avg_gap": avg_days_between
            },
            top_performers={
                "strength": top_strength,
                "volume": top_volume,
                "frequency": top_frequency
            }
        )
        
        return bundle