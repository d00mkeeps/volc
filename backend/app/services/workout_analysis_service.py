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
            
            # 3. Get workout data
            raw_workout_data = await self._get_workout_data(request, user_id)
            
            if not raw_workout_data or not raw_workout_data.get("workouts"):
                logger.warning(f"No workout data for conversation {conversation_id}")
                await self.analysis_bundle_service.update_bundle_status(
                    bundle_id, 'failed', 'No workout data found'
                )
                return
            
            logger.info(f"Proceeding with analysis for {len(raw_workout_data['workouts'])} workouts")
            
            # 4. Update bundle with raw workout data
            await self.analysis_bundle_service.update_bundle_field(bundle_id, 'raw_workouts', raw_workout_data)
            
            # 5. Generate metadata
            exercise_names = set()
            for workout in raw_workout_data.get('workouts', []):
                for exercise in workout.get('exercises', []):
                    exercise_names.add(exercise.get('exercise_name', ''))

            from ..schemas.workout_data_bundle import BundleMetadata
            metadata = BundleMetadata(
                total_workouts=raw_workout_data['metadata']['total_workouts'],
                total_exercises=raw_workout_data['metadata']['total_exercises'], 
                date_range=raw_workout_data['metadata']['date_range'],
                exercises_included=list(exercise_names)
            )
            
            # 6. Update bundle with metadata
            await self.analysis_bundle_service.update_bundle_field(bundle_id, 'metadata', metadata.model_dump())
            
            # 7. Perform correlation analysis
            correlation_results = CorrelationService().analyze_exercise_correlations(raw_workout_data)
            
            # 8. Update bundle with correlation data
            if correlation_results:
                await self.analysis_bundle_service.update_bundle_field(bundle_id, 'correlation_data', correlation_results)
            
            # 9. Add charts if enabled (currently commented out)
            # if charts_enabled:
            #     await self.graph_service.add_charts_to_bundle(bundle_id)
            
            # 10. Mark as complete
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