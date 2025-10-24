"""
Analysis Bundle Database Service

Handles all database operations for workout analysis bundles.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from app.core.supabase.client import get_user_client, get_admin_client

logger = logging.getLogger(__name__)

class AnalysisBundleService:
    """Service for managing workout analysis bundles in the database."""
    
    def __init__(self):
        pass
    
    def get_user_client(self, jwt_token: str):
        """Get Supabase client with user's JWT token."""
        return get_user_client(jwt_token)
    
    def get_admin_client(self):
        """Get Supabase admin client."""
        return get_admin_client()
    
    async def create_analysis_bundle(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Create an empty analysis bundle with 'pending' status.
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'data': {'bundle_id': str}, 'error': str}
        """
        try:
            from uuid import uuid4
            bundle_id = str(uuid4())
            
            logger.info(f"Creating analysis bundle: {bundle_id} for user: {user_id}")
            
            user_client = self.get_user_client(jwt_token)
            
            result = user_client.table('analysis_bundles').insert({
                'id': bundle_id,
                'user_id': user_id,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat(),
                'metadata': {},
                'workouts': {},
                'top_performers': {},
                'consistency_metrics': {},
                'correlation_data': None,
                'chart_urls': {}
            }).execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Analysis bundle created successfully with ID: {bundle_id}")
                return {
                    'success': True,
                    'data': {
                        'bundle_id': bundle_id
                    }
                }
            else:
                error = "Failed to create bundle: No data returned"
                logger.error(error)
                return {
                    'success': False,
                    'error': error
                }
                
        except Exception as e:
            logger.error(f"Error creating analysis bundle: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    async def update_bundle_status(
        self,
        bundle_id: str,
        status: str,
        jwt_token: str,
        error_msg: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update bundle status (pending/processing/complete/failed).
        
        Args:
            bundle_id: Bundle ID to update
            status: New status
            jwt_token: JWT for authentication
            error_msg: Optional error message if status is 'failed'
            
        Returns:
            {'success': bool, 'error': str}
        """
        try:
            logger.info(f"Updating bundle {bundle_id} status to: {status}")
            
            user_client = self.get_user_client(jwt_token)
            
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # If failed, store error in metadata
            if status == 'failed' and error_msg:
                update_data['metadata'] = {'errors': [error_msg]}
            
            result = user_client.table('analysis_bundles') \
                .update(update_data) \
                .eq('id', bundle_id) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Bundle status updated successfully: {bundle_id} -> {status}")
                return {'success': True}
            else:
                error = "Failed to update bundle status: No data returned"
                logger.error(error)
                return {
                    'success': False,
                    'error': error
                }
                
        except Exception as e:
            logger.error(f"Error updating bundle status: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    async def save_analysis_bundle(
        self,
        bundle_id: str,
        bundle: Any,  # WorkoutAnalysisBundle
        jwt_token: str
    ) -> Dict[str, Any]:
        """
        Save the complete analysis bundle to database.
        
        Maps the WorkoutAnalysisBundle schema to the database structure.
        
        Args:
            bundle_id: Bundle ID
            bundle: WorkoutAnalysisBundle object
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'error': str}
        """
        try:
            logger.info(f"Saving analysis bundle: {bundle_id}")
            
            user_client = self.get_user_client(jwt_token)
            
            # Convert bundle to dict for database storage
            bundle_dict = bundle.model_dump(mode='json')
            
            # Map new schema to existing database columns
            # The DB has these JSON columns:
            # - metadata (maps to bundle.metadata)
            # - workouts (maps to bundle.recent_workouts + general_workout_data)
            # - top_performers (maps to bundle.strength_data + volume_data top performers)
            # - consistency_metrics (maps to bundle.consistency_data)
            # - correlation_data (maps to bundle.correlation_insights)
            
            # Build the database structure
            db_metadata = {
                'bundle_type': bundle_dict['metadata']['bundle_type'],
                'created_at': bundle_dict['metadata']['created_at'],
                'data_window': bundle_dict['metadata']['data_window'],
                'errors': bundle_dict['metadata']['errors']
            }
            
            # Store complete workout data (general + recent)
            db_workouts = {
                'general_workout_data': bundle_dict['general_workout_data'],
                'recent_workouts': bundle_dict['recent_workouts']
            }
            
            # Store all performance data together
            db_top_performers = {
                'strength_data': bundle_dict['strength_data'],
                'volume_data': bundle_dict['volume_data'],
                'muscle_group_balance': bundle_dict.get('muscle_group_balance')
            }
            
            # Consistency metrics
            db_consistency = bundle_dict['consistency_data']
            
            # Correlation data (if exists)
            db_correlation = bundle_dict.get('correlation_insights')
            
            # Update the bundle
            update_data = {
                'status': bundle_dict['status'],
                'metadata': db_metadata,
                'workouts': db_workouts,
                'top_performers': db_top_performers,
                'consistency_metrics': db_consistency,
                'correlation_data': db_correlation,
                'chart_urls': {},  # Charts to be added later
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = user_client.table('analysis_bundles') \
                .update(update_data) \
                .eq('id', bundle_id) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Analysis bundle saved successfully: {bundle_id}")
                return {'success': True}
            else:
                error = "Failed to save bundle: No data returned"
                logger.error(error)
                return {
                    'success': False,
                    'error': error
                }
                
        except Exception as e:
            logger.error(f"Error saving analysis bundle: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_latest_analysis_bundle(
        self,
        user_id: str,
        jwt_token: str
    ) -> Dict[str, Any]:
        """
        Get the most recent completed analysis bundle for a user.
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'data': dict, 'error': str}
        """
        try:
            logger.info(f"Fetching latest analysis bundle for user: {user_id}")
            
            user_client = self.get_user_client(jwt_token)
            
            result = user_client.table('analysis_bundles') \
                .select('*') \
                .eq('user_id', user_id) \
                .eq('status', 'complete') \
                .is_('conversation_id', 'null') \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                bundle = result.data[0]
                logger.info(f"Found analysis bundle: {bundle['id']}")
                return {
                    'success': True,
                    'data': bundle
                }
            else:
                logger.info(f"No analysis bundle found for user: {user_id}")
                return {
                    'success': False,
                    'error': 'No bundle found'
                }
                
        except Exception as e:
            logger.error(f"Error fetching analysis bundle: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    

    """
    FIXED: Analysis Bundle Database Service

    ADD THIS METHOD to your existing AnalysisBundleService class in:
    /services/db/analysis_service.py
    """

    async def get_latest_analysis_bundle_admin(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get the most recent completed analysis bundle for a user (admin access).
        
        Used for server-side operations like WebSocket LLM connections where we
        don't have a user JWT token.
        
        Args:
            user_id: User's ID
            
        Returns:
            {'success': bool, 'data': dict, 'error': str}
        """
        try:
            logger.info(f"Fetching latest analysis bundle (admin) for user: {user_id}")
            
            admin_client = self.get_admin_client()
            
            result = admin_client.table('analysis_bundles') \
                .select('*') \
                .eq('user_id', user_id) \
                .eq('status', 'complete') \
                .is_('conversation_id', 'null') \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                bundle = result.data[0]
                logger.info(f"Found analysis bundle (admin): {bundle['id']}")
                return {
                    'success': True,
                    'data': bundle
                }
            else:
                logger.info(f"No analysis bundle found (admin) for user: {user_id}")
                return {
                    'success': False,
                    'error': 'No bundle found'
                }
                
        except Exception as e:
            logger.error(f"Error fetching analysis bundle (admin): {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }




    async def delete_old_analysis_bundles(
        self,
        user_id: str,
        jwt_token: str,
        keep_latest: int = 1
    ) -> Dict[str, Any]:
        """
        Delete old analysis bundles, keeping only the most recent N bundles.
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            keep_latest: Number of recent bundles to keep
            
        Returns:
            {'success': bool, 'data': {'deleted_count': int}, 'error': str}
        """
        try:
            logger.info(f"Cleaning up old analysis bundles for user: {user_id}, keeping latest {keep_latest}")
            
            user_client = self.get_user_client(jwt_token)
            
            # Get all bundles for this user (not attached to conversations)
            result = user_client.table('analysis_bundles') \
                .select('id, created_at') \
                .eq('user_id', user_id) \
                .is_('conversation_id', 'null') \
                .order('created_at', desc=True) \
                .execute()
            
            if not hasattr(result, 'data') or not result.data:
                logger.info("No bundles found to clean up")
                return {
                    'success': True,
                    'data': {'deleted_count': 0}
                }
            
            all_bundles = result.data
            
            # Keep only the latest N bundles
            if len(all_bundles) <= keep_latest:
                logger.info(f"Only {len(all_bundles)} bundles exist, no cleanup needed")
                return {
                    'success': True,
                    'data': {'deleted_count': 0}
                }
            
            # Get IDs of bundles to delete (all except the latest N)
            bundles_to_delete = [b['id'] for b in all_bundles[keep_latest:]]
            
            # Delete old bundles
            delete_result = user_client.table('analysis_bundles') \
                .delete() \
                .in_('id', bundles_to_delete) \
                .execute()
            
            deleted_count = len(bundles_to_delete)
            logger.info(f"Deleted {deleted_count} old analysis bundles for user: {user_id}")
            
            return {
                'success': True,
                'data': {'deleted_count': deleted_count}
            }
            
        except Exception as e:
            logger.error(f"Error deleting old analysis bundles: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }