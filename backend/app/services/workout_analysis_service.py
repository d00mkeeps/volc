import logging
import asyncio
from typing import Dict, Any

from ..schemas.workout_analysis import WorkoutAnalysisRequest
from .db.workout_service import WorkoutService
from .db.conversation_service import ConversationService
from .db.graph_bundle_service import GraphBundleService
from .workout_analysis.metrics_calc import MetricsProcessor
from .workout_analysis.correlation_service import CorrelationService
from .workout_analysis.graph_service import WorkoutGraphService
from ..core.utils.id_gen import new_uuid
from ..schemas.workout_data_bundle import WorkoutDataBundle, BundleMetadata, CorrelationData

logger = logging.getLogger(__name__)

class WorkoutAnalysisService:
    def __init__(self):
        self.workout_service = WorkoutService()
        self.conversation_service = ConversationService()
        self.graph_bundle_service = GraphBundleService()
        self.graph_service = WorkoutGraphService(self.workout_service)
        
    async def initiate_analysis_and_conversation(self, request: WorkoutAnalysisRequest) -> Dict[str, Any]:
        try:
            # 1. Create Conversation immediately
            conversation = await self.conversation_service.create_conversation(
                user_id=request.user_id,
                title=f"{request.workout_data.get('name', 'Workout')} Analysis",
                config_name='workout-analysis'
            )
            conversation_id = conversation['id']

            # 2. Start background analysis task
            asyncio.create_task(self._perform_analysis_task(request, conversation_id))

            return {"conversation_id": conversation_id}

        except Exception as e:
            logger.error(f"Error initiating analysis and conversation: {e}", exc_info=True)
            raise

    async def _perform_analysis_task(self, request: WorkoutAnalysisRequest, conversation_id: str):
        try:
            # 1. Get Workout Data
            workout_data = await self._get_workout_data(request)
            if not workout_data or not workout_data.get("workouts"):
                logger.warning(f"No workout data for analysis task for conversation {conversation_id}")
                return

            # 2. Perform Analysis
            metrics = MetricsProcessor(workout_data).process()
            workout_data["metrics"] = metrics
            correlation_results = CorrelationService().analyze_exercise_correlations(workout_data)

            # 3. Create Graph Bundle
            bundle = await self.graph_service._prepare_enhanced_bundle(
                workout_data=workout_data,
                original_query=request.message,
                correlation_results=correlation_results
            )
            await self.graph_service.add_charts_to_bundle(bundle)

            # 4. Save Graph Bundle to Conversation
            bundle_dict = bundle.model_dump()
            bundle_dict["conversationId"] = conversation_id
            await self.graph_bundle_service.save_graph_bundle(request.user_id, bundle_dict)

            logger.info(f"Analysis task completed for conversation {conversation_id}")

        except Exception as e:
            logger.error(f"Error during background analysis task for conversation {conversation_id}: {e}", exc_info=True)

    async def _get_workout_data(self, request: WorkoutAnalysisRequest) -> Dict[str, Any]:
        if request.workout_data:
            return request.workout_data
        elif request.exercise_names:
            return await self.workout_service.get_workout_history_by_exercises(
                user_id=request.user_id,
                exercises=request.exercise_names,
                timeframe=request.timeframe
            )
        return None

