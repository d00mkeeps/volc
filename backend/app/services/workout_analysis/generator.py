"""
Workout Analysis Bundle Generator

Orchestrates generation of comprehensive user-level workout analysis bundles.
Bundles are regenerated after each workout creation/deletion to ensure data freshness.
"""

import logging
from typing import Dict, Any

from app.services.db.workout_service import WorkoutService
from app.services.db.analysis_service import AnalysisBundleService
from app.services.workout_analysis.processor import AnalysisBundleProcessor

logger = logging.getLogger(__name__)


class AnalysisBundleGenerator:
    """
    Orchestrates generation of comprehensive workout analysis bundles.
    
    Analysis bundles include:
    - General workout data and statistics
    - Recent workout history (last 14 days with full detail)
    - Volume metrics and trends
    - Strength progression (e1RM tracking)
    - Consistency metrics
    - Muscle group balance
    - Correlation insights (coming soon)
    """
    
    def __init__(self):
        self.workout_service = WorkoutService()
        self.analysis_service = AnalysisBundleService()
        self.processor = AnalysisBundleProcessor()
    
    async def generate_analysis_bundle(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Generate a complete analysis bundle for a user.
        
        Flow:
        1. Create empty bundle (status='pending')
        2. Update to 'processing'
        3. Fetch last 30 days of workouts
        4. Fetch exercise definitions from cache
        5. Process data through AnalysisBundleProcessor
        6. Save complete bundle (status='complete')
        7. Cleanup old bundles
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'bundle_id': str, 'error': str}
        """
        bundle_id = None
        
        try:
            logger.info(f"🚀 Starting analysis bundle generation for user: {user_id}")
            
            # 1. Create empty bundle
            bundle_result = await self.analysis_service.create_analysis_bundle(user_id, jwt_token)
            
            if not bundle_result.get('success'):
                error = bundle_result.get('error', 'Unknown error')
                logger.error(f"❌ Failed to create empty bundle: {error}")
                return {
                    'success': False,
                    'error': f'Failed to create bundle: {error}'
                }
            
            bundle_id = bundle_result['data']['bundle_id']
            logger.info(f"✅ Created empty bundle: {bundle_id}")
            
            # 2. Update to processing
            await self.analysis_service.update_bundle_status(bundle_id, 'processing', jwt_token)
            logger.info(f"📊 Bundle {bundle_id} marked as processing")
            
            # 3. Fetch last 30 days of workouts using admin method
            logger.info(f"📥 Fetching last 30 days of workouts for user: {user_id}")
            raw_result = await self.workout_service.get_user_workouts_admin(
                user_id=user_id,
                days_back=30
            )
            
            # Check if we have data
            if not raw_result or not raw_result.get('success'):
                error = raw_result.get('error', 'No workout data returned') if raw_result else 'No workout data'
                logger.warning(f"⚠️  Failed to fetch workouts for user {user_id}: {error}")
                await self.analysis_service.update_bundle_status(
                    bundle_id, 'failed', jwt_token, error_msg=error
                )
                return {
                    'success': False,
                    'error': error,
                    'bundle_id': bundle_id
                }
            
            workouts = raw_result.get('data', [])
            workout_count = len(workouts)
            logger.info(f"📥 Fetched {workout_count} workouts")
            
            if workout_count == 0:
                error = 'No workouts found in last 30 days'
                logger.warning(f"⚠️  {error}")
                await self.analysis_service.update_bundle_status(
                    bundle_id, 'failed', jwt_token, error_msg=error
                )
                return {
                    'success': False,
                    'error': error,
                    'bundle_id': bundle_id
                }
            
            # Transform data to match processor format
            workout_data = self._format_workout_data(workouts)
            logger.info(f"📊 Formatted {workout_count} workouts for processing")
            
            # 4. Fetch exercise definitions from cache (generator is async)
            logger.info(f"📥 Fetching exercise definitions from cache")
            from app.services.cache.exercise_definitions import exercise_cache
            exercise_definitions = await exercise_cache.get_all_exercises()
            logger.info(f"✅ Loaded {len(exercise_definitions)} exercise definitions from cache")
            
            # 5. Process data (pass exercise definitions to processor)
            logger.info(f"🔬 Processing {workout_count} workouts through AnalysisBundleProcessor")
            complete_bundle = self.processor.process(
                bundle_id=bundle_id,
                user_id=user_id,
                raw_workout_data=workout_data,
                exercise_definitions=exercise_definitions
            )
            
            logger.info(f"✅ Processing complete. Bundle status: {complete_bundle.status}")
            
            # 6. Save complete bundle
            logger.info(f"💾 Saving complete bundle: {bundle_id}")
            save_result = await self.analysis_service.save_analysis_bundle(
                bundle_id, complete_bundle, jwt_token
            )
            
            if not save_result.get('success'):
                error = save_result.get('error', 'Unknown save error')
                logger.error(f"❌ Failed to save bundle: {error}")
                return {
                    'success': False,
                    'error': f'Failed to save bundle: {error}',
                    'bundle_id': bundle_id
                }
            
            logger.info(f"✅ Bundle saved successfully: {bundle_id}")
            
            # 7. Cleanup old bundles (keep only the latest)
            logger.info(f"🧹 Cleaning up old bundles for user: {user_id}")
            cleanup_result = await self.analysis_service.delete_old_analysis_bundles(
                user_id, jwt_token, keep_latest=1
            )
            
            deleted_count = cleanup_result.get('data', {}).get('deleted_count', 0)
            logger.info(f"🧹 Deleted {deleted_count} old bundles")
            
            # Success!
            logger.info(f"🎉 Analysis bundle generation complete for user {user_id}")
            return {
                'success': True,
                'bundle_id': bundle_id,
                'metadata': {
                    'workouts_analyzed': workout_count,
                    'old_bundles_deleted': deleted_count
                }
            }
            
        except Exception as e:
            logger.error(f"💥 Critical error generating analysis bundle: {str(e)}", exc_info=True)
            
            # Mark bundle as failed if we created one
            if bundle_id:
                try:
                    await self.analysis_service.update_bundle_status(
                        bundle_id, 'failed', jwt_token, error_msg=str(e)
                    )
                except Exception as cleanup_error:
                    logger.error(f"Failed to mark bundle as failed: {cleanup_error}")
            
            return {
                'success': False,
                'error': str(e),
                'bundle_id': bundle_id
            }
    
    def _format_workout_data(self, workouts: list) -> Dict[str, Any]:
        """
        Prepare workout data for the processor.
        
        The processor expects a simple structure with 'workouts' key.
        No need for complex metadata calculation here - the processor handles it.
        
        Args:
            workouts: List of workout objects from database
            
        Returns:
            {'workouts': [...]}
        """
        return {
            'workouts': workouts
        }