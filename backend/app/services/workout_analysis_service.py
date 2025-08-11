import logging
import asyncio
from typing import Dict, Any
from datetime import datetime

from ..schemas.workout_analysis import WorkoutAnalysisRequest
from .db.workout_service import WorkoutService
from .db.conversation_service import ConversationService
from .db.analysis_service import AnalysisBundleService
from .workout_analysis.main_processor import WorkoutDataProcessor

logger = logging.getLogger(__name__)

class WorkoutAnalysisService:
    def __init__(self):
        self.workout_service = WorkoutService()
        self.conversation_service = ConversationService()
        self.analysis_bundle_service = AnalysisBundleService()
        
    async def initiate_analysis_and_conversation(
        self, 
        request: WorkoutAnalysisRequest,
        user: Dict,
        jwt_token: str
    ) -> Dict[str, Any]:
        try:
            conversation = await self.conversation_service.create_conversation(
                title=f"Analysis - {datetime.now().strftime('%b %d')}",
                config_name='workout-analysis',
                user=user,
                jwt_token=jwt_token
            )
            
            logger.info(f"Conversation service returned: {conversation}")
            
            # Check if it's an error response - fix the condition
            if not conversation.get('success', True) or conversation.get('error'):  # Changed: check if error is truthy
                logger.error(f"Conversation creation failed: {conversation}")
                raise Exception(f"Failed to create conversation: {conversation.get('error', 'Unknown error')}")
            
            # Extract the ID from the data field
            conversation_id = conversation['data']['id']

            asyncio.create_task(self._perform_analysis_task(request, conversation_id, user.id, jwt_token))

            return {"conversation_id": conversation_id}

        except Exception as e:
            logger.error(f"Error initiating analysis and conversation: {e}", exc_info=True)
            raise

    async def _get_workout_data(self, request: WorkoutAnalysisRequest, user_id: str, jwt_token: str) -> Dict[str, Any]:
        if request.exercise_definition_ids:
            result = await self.workout_service.get_workout_history_by_definition_ids(
                user_id=user_id,
                definition_ids=request.exercise_definition_ids,
                jwt_token=jwt_token
            )
            
            # Unwrap the response to get the actual workout data
            if result and result.get("success") and result.get("data"):
                return result["data"]  # Extract the actual workout data
            elif result:
                return result  # Fallback in case it's not wrapped
                
        return None
    async def _perform_analysis_task(self, request: WorkoutAnalysisRequest, conversation_id: str, user_id: str, jwt_token: str):
        bundle_id = None
        try:
            logger.info(f"Starting analysis task for conversation: {conversation_id}")
            
            # 1. Create empty bundle immediately
            bundle_result = await self.analysis_bundle_service.create_empty_bundle(conversation_id, user_id, jwt_token)
            if not bundle_result.get("success"):
                logger.error(f"Failed to create empty bundle: {bundle_result.get('error')}")
                return
            
            bundle_id = bundle_result["data"]["bundle_id"]
            logger.info(f"Created empty bundle: {bundle_id}")
            
            # 2. Update status to in_progress
            await self.analysis_bundle_service.update_bundle_status(bundle_id, 'in_progress', jwt_token)
            
            # 3. Get raw workout data
            raw_workout_data = await self._get_workout_data(request, user_id, jwt_token)
            
            if not raw_workout_data or not raw_workout_data.get("workouts"):
                logger.warning(f"No workout data for conversation {conversation_id}")
                await self.analysis_bundle_service.update_bundle_status(
                    bundle_id, 'failed', jwt_token, 'No workout data found'
                )
                return
            
            logger.info(f"Processing analysis for {len(raw_workout_data['workouts'])} workouts")
            
            # 4. Process raw data into complete bundle using main processor
            processor = WorkoutDataProcessor()
            complete_bundle = processor.process(bundle_id, conversation_id, user_id, raw_workout_data)
            
            # 5. Save the complete bundle to database
            save_result = await self.analysis_bundle_service.save_analysis_bundle(bundle_id, complete_bundle, jwt_token)
            
            if save_result.get("success"):
                logger.info(f"Analysis task completed successfully for conversation {conversation_id}")
            else:
                logger.error(f"Failed to save complete bundle: {save_result.get('error')}")
                await self.analysis_bundle_service.update_bundle_status(
                    bundle_id, 'failed', jwt_token, f"Bundle save failed: {save_result.get('error')}"
                )
                
        except Exception as e:
            logger.error(f"Error during analysis task: {e}", exc_info=True)
            
            # Mark bundle as failed if we created one
            if bundle_id:
                try:
                    await self.analysis_bundle_service.update_bundle_status(
                        bundle_id, 'failed', jwt_token, str(e)
                    )
                except Exception as cleanup_error:
                    logger.error(f"Failed to mark bundle as failed: {cleanup_error}")