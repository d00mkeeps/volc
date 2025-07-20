import logging
import asyncio
from typing import Dict, Any
from datetime import datetime

from ..schemas.workout_analysis import WorkoutAnalysisRequest
from .db.workout_service import WorkoutService
from .db.conversation_service import ConversationService
from .db.graph_bundle_service import GraphBundleService
from .workout_analysis.metrics_calc import MetricsProcessor
from .workout_analysis.correlation_service import CorrelationService
from .workout_analysis.graph_service import WorkoutGraphService
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import WorkoutDataBundle
from ..core.supabase.auth import get_current_user

logger = logging.getLogger(__name__)

class WorkoutAnalysisService:
    def __init__(self):
        self.workout_service = WorkoutService()
        self.conversation_service = ConversationService()
        self.graph_bundle_service = GraphBundleService()
        self.graph_service = WorkoutGraphService(self.workout_service)
        
    async def initiate_analysis_and_conversation(
        self, 
        request: WorkoutAnalysisRequest,
        user: Dict
    ) -> Dict[str, Any]:
        try:
            # 1. Create Conversation immediately
            conversation = await self.conversation_service.create_conversation(
                user_id=user.id,
                title=f"Analysis - {datetime.now().strftime('%b %d')}",
                config_name='workout-analysis'
            )
            conversation_id = conversation['id']

            # 2. Start background analysis task
            asyncio.create_task(self._perform_analysis_task(request, conversation_id, user.id))

            return {"conversation_id": conversation_id}

        except Exception as e:
            logger.error(f"Error initiating analysis and conversation: {e}", exc_info=True)
            raise

    async def _perform_analysis_task(self, request: WorkoutAnalysisRequest, conversation_id: str, user_id: str):
        try:
            logger.info(f"Starting analysis task for conversation: {conversation_id}")
            
            # Get workout data (already formatted from RPC)
            workout_data = await self._get_workout_data(request, user_id)
            
            if not workout_data or not workout_data.get("workouts"):
                logger.warning(f"No workout data for conversation {conversation_id}")
                return
            
            logger.info(f"Proceeding with analysis for {len(workout_data['workouts'])} workouts")

            # Process metrics directly (no formatter needed)
            metrics = MetricsProcessor(workout_data).process()
            workout_data["metrics"] = metrics
            
            # Rest remains the same...
            correlation_results = CorrelationService().analyze_exercise_correlations(workout_data)
            
            # Create metadata for bundle
            exercise_names = set()
            for workout in workout_data.get('workouts', []):
                for exercise in workout.get('exercises', []):
                    exercise_names.add(exercise.get('exercise_name', ''))

            from ..schemas.workout_data_bundle import BundleMetadata
            metadata = BundleMetadata(
                total_workouts=workout_data['metadata']['total_workouts'],
                total_exercises=workout_data['metadata']['total_exercises'], 
                date_range=workout_data['metadata']['date_range'],
                exercises_included=list(exercise_names)
            )
            

            # 4. Create Graph Bundle
            bundle_id = await new_uuid()
            bundle = WorkoutDataBundle(
                bundle_id=bundle_id,
                metadata=metadata,
                workout_data=workout_data,
                original_query="Workout Analysis",
                correlation_data=correlation_results,
                created_at=datetime.now()
            )
            
            # 5. Add charts to bundle
            await self.graph_service.add_charts_to_bundle(bundle)

            # 6. Save Graph Bundle to Conversation
            bundle_dict = bundle.model_dump()
            bundle_dict["conversationId"] = conversation_id
            await self.graph_bundle_service.save_graph_bundle(user_id, bundle_dict)

            logger.info(f"Analysis task completed for conversation {conversation_id}")

        except Exception as e:
            logger.error(f"Error during analysis task: {e}", exc_info=True)

    async def _get_workout_data(self, request: WorkoutAnalysisRequest, user_id: str) -> Dict[str, Any]:
        if request.exercise_definition_ids:
            return await self.workout_service.get_workout_history_by_definition_ids(
                user_id=user_id,
                definition_ids=request.exercise_definition_ids,
                timeframe="3 months"
            )
        return None