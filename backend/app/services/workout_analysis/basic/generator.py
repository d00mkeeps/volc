import logging
from typing import Dict, Any

from app.services.db.workout_service import WorkoutService
from app.services.db.analysis_service import AnalysisBundleService
from app.services.workout_analysis.basic.processor import BasicBundleProcessor

logger = logging.getLogger(__name__)

class BasicBundleGenerator:
    """
    Orchestrates generation of basic user-level workout analysis bundles.
    
    Basic bundles analyze the last 30 days of workout data and include:
    - Top performers (strength/volume gains)
    - Consistency metrics
    - Short-term trends
    - Recent workout history
    """
    
    def __init__(self):
        self.workout_service = WorkoutService()
        self.analysis_service = AnalysisBundleService()
        self.processor = BasicBundleProcessor()
    
    async def generate_basic_bundle(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Generate a complete basic analysis bundle for a user.
        
        Flow:
        1. Create empty bundle (status='pending')
        2. Update to 'processing'
        3. Fetch last 30 days of workouts
        4. Process data through calculators
        5. Save complete bundle (status='complete')
        6. Cleanup old bundles
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'bundle_id': str, 'error': str}
        """
        bundle_id = None
        
        try:
            logger.info(f"🚀 Starting basic bundle generation for user: {user_id}")
            
            # 1. Create empty bundle
            bundle_result = await self.analysis_service.create_basic_bundle(user_id, jwt_token)
            
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
            logger.info(f"📊 Formatted workout data: {workout_data['metadata']['total_workouts']} workouts, "
                       f"{workout_data['metadata']['total_exercises']} exercises")
            
            # 4. Process data
            logger.info(f"🔬 Processing {workout_count} workouts through BasicBundleProcessor")
            complete_bundle = self.processor.process(
                bundle_id=bundle_id,
                user_id=user_id,
                raw_workout_data=workout_data
            )
            
            logger.info(f"✅ Processing complete. Bundle status: {complete_bundle.status}")
            
            # 5. Save complete bundle
            logger.info(f"💾 Saving complete bundle: {bundle_id}")
            save_result = await self.analysis_service.save_basic_bundle(
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
            
            # 6. Cleanup old bundles (keep only the latest)
            logger.info(f"🧹 Cleaning up old bundles for user: {user_id}")
            cleanup_result = await self.analysis_service.delete_old_basic_bundles(
                user_id, jwt_token, keep_latest=1
            )
            
            deleted_count = cleanup_result.get('data', {}).get('deleted_count', 0)
            logger.info(f"🧹 Deleted {deleted_count} old bundles")
            
            # Success!
            logger.info(f"🎉 Basic bundle generation complete for user {user_id}")
            return {
                'success': True,
                'bundle_id': bundle_id,
                'metadata': {
                    'workouts_analyzed': workout_count,
                    'old_bundles_deleted': deleted_count
                }
            }
            
        except Exception as e:
            logger.error(f"💥 Critical error generating basic bundle: {str(e)}", exc_info=True)
            
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
        Transform workout data from get_user_workouts_admin() format
        to the format expected by BasicBundleProcessor.
        
        Args:
            workouts: List of workout objects from database
            
        Returns:
            {
                'workouts': [...],
                'metadata': {
                    'total_workouts': int,
                    'total_exercises': int,
                    'date_range': {...},
                    'exercises_included': [...]
                }
            }
        """
        # Calculate metadata
        total_workouts = len(workouts)
        total_exercises = sum(len(w.get('workout_exercises', [])) for w in workouts)
        
        # Get unique exercise names
        exercise_names = set()
        for workout in workouts:
            for exercise in workout.get('workout_exercises', []):
                if exercise.get('name'):
                    exercise_names.add(exercise['name'])
        
        # Get date range
        workout_dates = [w.get('created_at') for w in workouts if w.get('created_at')]
        earliest_date = min(workout_dates) if workout_dates else None
        latest_date = max(workout_dates) if workout_dates else None
        
        return {
            'workouts': workouts,
            'metadata': {
                'total_workouts': total_workouts,
                'total_exercises': total_exercises,
                'date_range': {
                    'earliest': earliest_date,
                    'latest': latest_date
                },
                'exercises_included': sorted(list(exercise_names))
            }
        }