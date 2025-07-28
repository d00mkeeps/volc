import logging
import asyncio
from typing import Dict, Any
from datetime import datetime

from ..schemas.workout_analysis import WorkoutAnalysisRequest
from .db.workout_service import WorkoutService
from .db.conversation_service import ConversationService
from .db.analysis_service import AnalysisBundleService
from .workout_analysis.correlation_service import CorrelationService
# from .workout_analysis.graph_service import WorkoutGraphService
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import WorkoutDataBundle

logger = logging.getLogger(__name__)

class WorkoutAnalysisService:
    def __init__(self):
        self.workout_service = WorkoutService()
        self.conversation_service = ConversationService()
        self.analysis_bundle_service = AnalysisBundleService()
        # self.graph_service = WorkoutGraphService(self.workout_service)
        
    async def initiate_analysis_and_conversation(
        self, 
        request: WorkoutAnalysisRequest,
        user: Dict
    ) -> Dict[str, Any]:
        try:
            conversation = await self.conversation_service.create_conversation(
                user_id=user.id,
                title=f"Analysis - {datetime.now().strftime('%b %d')}",
                config_name='workout-analysis'
            )
            conversation_id = conversation['id']

            asyncio.create_task(self._perform_analysis_task(request, conversation_id, user.id))

            return {"conversation_id": conversation_id}

        except Exception as e:
            logger.error(f"Error initiating analysis and conversation: {e}", exc_info=True)
            raise
    async def _get_workout_data(self, request: WorkoutAnalysisRequest, user_id: str) -> Dict[str, Any]:
        if request.exercise_definition_ids:
            return await self.workout_service.get_workout_history_by_definition_ids(
                user_id=user_id,
                definition_ids=request.exercise_definition_ids,
            )
        return None 
    
    async def _perform_analysis_task(self, request: WorkoutAnalysisRequest, conversation_id: str, user_id: str):
        bundle_id = None
        try:
            logger.info(f"Starting analysis task for conversation: {conversation_id}")
            
            # 1. Create empty bundle immediately
            bundle_result = await self.analysis_bundle_service.create_empty_bundle(conversation_id, user_id)
            if not bundle_result.get("success"):
                logger.error(f"Failed to create empty bundle: {bundle_result.get('error')}")
                return
            
            bundle_id = bundle_result["bundle_id"]
            logger.info(f"Created empty bundle: {bundle_id}")
            
            # 2. Update status to in_progress
            await self.analysis_bundle_service.update_bundle_status(bundle_id, 'in_progress')
            
            # 3. Get full workout data (for calculations)
            full_workout_data = await self._get_workout_data(request, user_id)
            
            if not full_workout_data or not full_workout_data.get("workouts"):
                logger.warning(f"No workout data for conversation {conversation_id}")
                await self.analysis_bundle_service.update_bundle_status(
                    bundle_id, 'failed', 'No workout data found'
                )
                return
            
            logger.info(f"Proceeding with analysis for {len(full_workout_data['workouts'])} workouts")
            
            # 4. Extract lightweight workouts (name, date, notes only)
            lightweight_workouts = [
                {
                    "name": workout.get("name", ""),
                    "date": workout.get("date", "")[:10] if workout.get("date") else "",
                    "notes": workout.get("notes", "")
                }
                for workout in full_workout_data.get("workouts", [])
            ]
            
            # 5. Store lightweight workouts
            await self.analysis_bundle_service.update_bundle_field(bundle_id, 'workouts', lightweight_workouts)
            
            # 6. Generate metadata (from full data)
            exercise_names = set()
            for workout in full_workout_data.get('workouts', []):
                for exercise in workout.get('exercises', []):
                    exercise_names.add(exercise.get('exercise_name', ''))

            from ..schemas.workout_data_bundle import BundleMetadata
            metadata = BundleMetadata(
                total_workouts=full_workout_data['metadata']['total_workouts'],
                total_exercises=full_workout_data['metadata']['total_exercises'], 
                date_range=full_workout_data['metadata']['date_range'],
                exercises_included=list(exercise_names)
            )
            
            # 7. Update bundle with metadata
            await self.analysis_bundle_service.update_bundle_field(bundle_id, 'metadata', metadata.model_dump())
            
            # 8. Calculate top_performers (from full data, before we discard it)
            from .workout_analysis.graph_service import WorkoutGraphService
            graph_service = WorkoutGraphService(self.workout_service)
            
            # Create temporary bundle for calculations
            temp_bundle = WorkoutDataBundle(
                id=bundle_id,
                metadata=metadata,
                workouts=lightweight_workouts,  # This won't be used for calculations
                created_at=datetime.now(),
                status='in_progress'
            )
            temp_bundle.raw_workouts = full_workout_data  # Use full data for calculations
            
            top_strength = graph_service._get_top_performers(temp_bundle, "1rm_change", 3)
            top_volume = graph_service._get_top_performers(temp_bundle, "volume_change", 3)
            
            top_performers = {
                "strength": top_strength,
                "volume": top_volume,
                "frequency": []  # Can calculate this from lightweight data if needed
            }
            
            await self.analysis_bundle_service.update_bundle_field(bundle_id, 'top_performers', top_performers)
            
            # 9. Perform correlation analysis (from full data)
            correlation_results = CorrelationService().analyze_exercise_correlations(full_workout_data)
            
            # 10. Update bundle with correlation data
            if correlation_results:
                await self.analysis_bundle_service.update_bundle_field(bundle_id, 'correlation_data', correlation_results)
            
            # 11. Mark as complete
            await self.analysis_bundle_service.update_bundle_status(bundle_id, 'complete')
            
            logger.info(f"Analysis task completed successfully for conversation {conversation_id}")

        except Exception as e:
            logger.error(f"Error during analysis task: {e}", exc_info=True)
            
            # Mark bundle as failed if we created one
            if bundle_id:
                try:
                    await self.analysis_bundle_service.update_bundle_status(
                        bundle_id, 'failed', str(e)
                    )
                except Exception as cleanup_error:
                    logger.error(f"Failed to mark bundle as failed: {cleanup_error}")