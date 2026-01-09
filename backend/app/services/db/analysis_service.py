"""
Analysis Bundle Database Service

Handles all database operations for workout analysis bundles.

Location: /app/services/db/analysis_service.py
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from app.core.supabase.client import get_user_client, get_admin_client
from ..workout_analysis.schemas import UserContextBundle

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
    
    def _default_metadata(self) -> Dict[str, Any]:
        """Return default metadata structure for NULL/missing metadata."""
        return {
            'bundle_type': 'standard',
            'created_at': datetime.utcnow().isoformat(),
            'data_window': 'No data',
            'errors': []
        }
    
    def _default_general_workout_data(self) -> Dict[str, Any]:
        """Return default general workout data structure for NULL/missing data."""
        return {
            'total_workouts': 0,
            'total_exercises_unique': 0,
            'date_range': {
                'earliest': datetime.utcnow().isoformat(),
                'latest': datetime.utcnow().isoformat()
            },
            'exercises_included': [],
            'exercise_frequency': {'by_sets': {}}
        }
    
    def _default_volume_data(self) -> Dict[str, Any]:
        """Return default volume data structure for NULL/missing data."""
        return {
            'total_volume_kg': 0.0,
            'today_volume_kg': 0.0,
            'volume_by_exercise_over_time': []
        }
    
    def _default_consistency_data(self) -> Dict[str, Any]:
        """Return default consistency data structure for NULL/missing data."""
        return {
            'avg_days_between': 0.0,
            'variance': None
        }
    
    def _deserialize_bundle(self, db_row: Dict[str, Any]) -> 'UserContextBundle':
        """
        Deserialize database row into UserContextBundle Pydantic object.
        
        Transforms the nested database structure into the flat Pydantic structure.
        Handles both old and new database structures for backwards compatibility.
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService._deserialize_bundle()
        
        Args:
            db_row: Raw database row dict
            
        Returns:
            UserContextBundle Pydantic object
        """
        from ..workout_analysis.schemas import UserContextBundle
        
        # Extract nested data from database columns (handle NULL values)
        # Use 'or {}' to handle both missing keys AND None values
        workouts_data = db_row.get('workouts') or {}
        top_performers_data = db_row.get('top_performers') or {}
        
        # Build flat structure for Pydantic
        # Use helper methods to provide complete default objects that satisfy Pydantic validation
        flat_bundle = {
            'id': db_row['id'],
            'user_id': db_row['user_id'],
            'status': db_row.get('status') or 'complete',
            'metadata': db_row.get('metadata') or self._default_metadata(),
            
            # Un-nest workouts data with proper defaults
            'general_workout_data': workouts_data.get('general_workout_data') or self._default_general_workout_data(),
            'recent_workouts': workouts_data.get('recent_workouts') or [],
            
            # Un-nest top_performers data with proper defaults
            'strength_data': top_performers_data.get('strength_data') or {'exercise_strength_progress': []},
            'volume_data': top_performers_data.get('volume_data') or self._default_volume_data(),
            
            # Other fields (already flat) with proper NULL handling
            'consistency_data': db_row.get('consistency_metrics') or self._default_consistency_data(),
            'muscle_group_balance': db_row.get('muscle_group_balance'),
            'correlation_insights': db_row.get('correlation_data'),
            'chart_urls': db_row.get('chart_urls') or {},
            'ai_memory': db_row.get('ai_memory')
        }
        
        # Deserialize into Pydantic model
        return UserContextBundle.model_validate(flat_bundle)
    
    async def create_analysis_bundle(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Create an empty analysis bundle with 'pending' status.
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.create_analysis_bundle()
        
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
            
            # Fetch latest bundle to copy memory from
            latest_bundle_result = await self.get_latest_analysis_bundle(user_id, jwt_token)
            initial_memory = {"notes": []}
            
            if latest_bundle_result.get("success") and latest_bundle_result.get("data"):
                latest_bundle = latest_bundle_result["data"]
                if latest_bundle.ai_memory:
                    initial_memory = latest_bundle.ai_memory
                    logger.info(f"Copying memory from previous bundle for user {user_id}")

            result = user_client.table('user_context_bundles').insert({
                'id': bundle_id,
                'user_id': user_id,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat(),
                'metadata': {},
                'workouts': {},
                'top_performers': {},
                'consistency_metrics': {},
                'correlation_data': None,
                'muscle_group_balance': None,
                'chart_urls': {},
                'ai_memory': initial_memory
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
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.update_bundle_status()
        
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
            
            result = user_client.table('user_context_bundles') \
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
        bundle: Any,  # UserContextBundle
        jwt_token: str
    ) -> Dict[str, Any]:
        """
        Save the complete analysis bundle to database.
        
        Maps the UserContextBundle schema to the database structure.
        Uses nested structure in 'workouts' and 'top_performers' columns.
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.save_analysis_bundle()
        
        Args:
            bundle_id: Bundle ID
            bundle: UserContextBundle object
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'error': str}
        """
        try:
            logger.info(f"Saving analysis bundle: {bundle_id}")
            
            user_client = self.get_user_client(jwt_token)
            
            # Convert bundle to dict for database storage
            bundle_dict = bundle.model_dump(mode='json')
            
            # Build the database structure
            db_metadata = {
                'bundle_type': bundle_dict['metadata']['bundle_type'],
                'created_at': bundle_dict['metadata']['created_at'],
                'data_window': bundle_dict['metadata']['data_window'],
                'errors': bundle_dict['metadata']['errors']
            }
            
            # Store complete workout data (general + recent) in 'workouts' column
            db_workouts = {
                'general_workout_data': bundle_dict['general_workout_data'],
                'recent_workouts': bundle_dict['recent_workouts']
            }
            
            # Store all performance data in 'top_performers' column
            db_top_performers = {
                'strength_data': bundle_dict['strength_data'],
                'volume_data': bundle_dict['volume_data']
            }

            # Extract other fields
            db_muscle_group_balance = bundle_dict.get('muscle_group_balance')
            db_consistency = bundle_dict['consistency_data']
            db_correlation = bundle_dict.get('correlation_insights')
            
            update_data = {
                'status': bundle_dict['status'],
                'metadata': db_metadata,
                'workouts': db_workouts,
                'top_performers': db_top_performers,
                'consistency_metrics': db_consistency,
                'correlation_data': db_correlation,
                'muscle_group_balance': db_muscle_group_balance,
                'chart_urls': {},
                'ai_memory': bundle_dict.get('ai_memory'),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = user_client.table('user_context_bundles') \
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
    async def save_analysis_bundle_admin(
        self,
        bundle_id: str,
        bundle: Any  # UserContextBundle
    ) -> Dict[str, Any]:
        """
        Save the complete analysis bundle to database (admin access).
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.save_analysis_bundle_admin()
        
        Args:
            bundle_id: Bundle ID
            bundle: UserContextBundle object
            
        Returns:
            {'success': bool, 'error': str}
        """
        try:
            logger.info(f"Saving analysis bundle (admin): {bundle_id}")
            
            admin_client = self.get_admin_client()
            
            # Convert bundle to dict for database storage
            bundle_dict = bundle.model_dump(mode='json')
            
            # Build the database structure
            db_metadata = {
                'bundle_type': bundle_dict['metadata']['bundle_type'],
                'created_at': bundle_dict['metadata']['created_at'],
                'data_window': bundle_dict['metadata']['data_window'],
                'errors': bundle_dict['metadata']['errors']
            }
            
            # Store complete workout data (general + recent) in 'workouts' column
            db_workouts = {
                'general_workout_data': bundle_dict['general_workout_data'],
                'recent_workouts': bundle_dict['recent_workouts']
            }
            
            # Store all performance data in 'top_performers' column
            db_top_performers = {
                'strength_data': bundle_dict['strength_data'],
                'volume_data': bundle_dict['volume_data']
            }

            # Extract other fields
            db_muscle_group_balance = bundle_dict.get('muscle_group_balance')
            db_consistency = bundle_dict['consistency_data']
            db_correlation = bundle_dict.get('correlation_insights')
            
            update_data = {
                'status': bundle_dict['status'],
                'metadata': db_metadata,
                'workouts': db_workouts,
                'top_performers': db_top_performers,
                'consistency_metrics': db_consistency,
                'correlation_data': db_correlation,
                'muscle_group_balance': db_muscle_group_balance,
                'chart_urls': {},
                'ai_memory': bundle_dict.get('ai_memory'),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = admin_client.table('user_context_bundles') \
                .update(update_data) \
                .eq('id', bundle_id) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Analysis bundle saved successfully (admin): {bundle_id}")
                return {'success': True}
            else:
                error = "Failed to save bundle (admin): No data returned"
                logger.error(error)
                return {
                    'success': False,
                    'error': error
                }
                
        except Exception as e:
            logger.error(f"Error saving analysis bundle (admin): {str(e)}", exc_info=True)
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
        
        Returns a properly deserialized UserContextBundle Pydantic object.
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.get_latest_analysis_bundle()
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            
        Returns:
            {'success': bool, 'data': UserContextBundle, 'error': str}
        """
        try:
            logger.info(f"Fetching latest analysis bundle for user: {user_id}")
            
            user_client = self.get_user_client(jwt_token)
            
            result = user_client.table('user_context_bundles') \
                .select('*') \
                .eq('user_id', user_id) \
                .eq('status', 'complete') \
                .is_('conversation_id', 'null') \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                db_row = result.data[0]
                logger.info(f"Found analysis bundle: {db_row['id']}")
                
                # Deserialize into Pydantic object
                bundle = self._deserialize_bundle(db_row)
                
                return {
                    'success': True,
                    'data': bundle  # Now returns UserContextBundle object
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
    
    async def get_latest_analysis_bundle_admin(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get the most recent completed analysis bundle for a user (admin access).
        
        Used for server-side operations like WebSocket LLM connections where we
        don't have a user JWT token.
        
        Returns a properly deserialized UserContextBundle Pydantic object.
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.get_latest_analysis_bundle_admin()
        
        Args:
            user_id: User's ID
            
        Returns:
            {'success': bool, 'data': UserContextBundle, 'error': str}
        """
        try:
            logger.info(f"Fetching latest analysis bundle (admin) for user: {user_id}")
            
            admin_client = self.get_admin_client()
            
            result = admin_client.table('user_context_bundles') \
                .select('*') \
                .eq('user_id', user_id) \
                .eq('status', 'complete') \
                .is_('conversation_id', 'null') \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                db_row = result.data[0]
                logger.info(f"Found analysis bundle (admin): {db_row['id']}")
                
                # Deserialize into Pydantic object
                bundle = self._deserialize_bundle(db_row)
                
                return {
                    'success': True,
                    'data': bundle  # Now returns UserContextBundle object
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
    
    async def delete_old_user_context_bundles(
        self,
        user_id: str,
        jwt_token: str,
        keep_latest: int = 1
    ) -> Dict[str, Any]:
        """
        Delete old analysis bundles, keeping only the most recent N bundles.
        
        Location: /app/services/db/analysis_service.py
        Method: AnalysisBundleService.delete_old_user_context_bundles()
        
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
            result = user_client.table('user_context_bundles') \
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
            delete_result = user_client.table('user_context_bundles') \
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
            return {
                'success': False,
                'error': str(e)
            }

    async def append_onboarding_notes(
        self, 
        user_id: str, 
        notes: list[Dict[str, str]], 
        jwt_token: str
    ) -> Dict[str, Any]:
        """
        Append onboarding notes to user's latest context bundle.
        Creates bundle if none exists.
        
        Args:
            user_id: Auth user UUID
            notes: List of dicts with 'text', 'date', 'category'
            jwt_token: User JWT token
        """
        try:
            logger.info(f"Appending onboarding notes for user {user_id}")
            
            # Get latest bundle
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("user_context_bundles") \
                .select("*") \
                .eq("user_id", user_id) \
                .is_("conversation_id", "null") \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            
            if result.data and len(result.data) > 0:
                # Update existing bundle
                bundle = result.data[0]
                current_memory = bundle.get("ai_memory") or {"notes": []}
                # Ensure notes list exists
                if "notes" not in current_memory:
                    current_memory["notes"] = []
                current_memory["notes"].extend(notes)
                
                update_result = user_client.table("user_context_bundles") \
                    .update({"ai_memory": current_memory}) \
                    .eq("id", bundle["id"]) \
                    .execute()
                    
                logger.info(f"Updated bundle {bundle['id']} with onboarding notes")
                return await self.format_response(update_result.data[0]) if hasattr(self, 'format_response') else {'success': True, 'data': update_result.data[0]}
            else:
                # Create new bundle
                from uuid import uuid4
                new_bundle = {
                    "id": str(uuid4()),
                    "user_id": user_id,
                    "conversation_id": None,
                    "ai_memory": {"notes": notes},
                    "status": "completed",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                insert_result = user_client.table("user_context_bundles") \
                    .insert(new_bundle) \
                    .execute()
                    
                logger.info(f"Created new bundle with onboarding notes for user {user_id}")
                return await self.format_response(insert_result.data[0]) if hasattr(self, 'format_response') else {'success': True, 'data': insert_result.data[0]}
                
        except Exception as e:
            logger.error(f"Error appending onboarding notes: {str(e)}")
            # Handle if handle_error exists, otherwise return dict
            if hasattr(self, 'handle_error'):
                return await self.handle_error("append_onboarding_notes", e)
            return {'success': False, 'error': str(e)}