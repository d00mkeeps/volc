from datetime import datetime
import uuid
from supabase import create_client
from typing import Optional, Dict, Any, List
import os
import logging
from dotenv import load_dotenv
from ...schemas.workout_data_bundle import WorkoutDataBundle

logger = logging.getLogger(__name__)

def _convert_datetime_to_iso(obj):
    """Recursively convert datetime objects and custom models to JSON-serializable format."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, 'model_dump'):  # Handle Pydantic models with model_dump method
        return obj.model_dump()
    elif isinstance(obj, dict):
        return {k: _convert_datetime_to_iso(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_datetime_to_iso(item) for item in obj]
    return obj

class SupabaseClient:
    _instance = None

    def __new__(cls):
        """Singleton pattern to ensure only one client instance is created."""
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            # Load environment variables
            load_dotenv()
            
            # Get Supabase credentials
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_KEY")
            
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
                
            cls._instance.client = create_client(url, key)
        return cls._instance

    def execute_query(self, table_name: str, query_type: str = "select", 
                          columns: str = "*", filters: Optional[Dict[str, Any]] = None):
        """Execute a query on Supabase.

        Args:
            table_name (str): Name of the table to query
            query_type (str): Type of query (select, insert, update, delete)
            columns (str): Columns to select/update
            filters (dict, optional): Query filters to apply

        Returns:
            dict: Query results or None if query fails
        """
        try:
            query = self.client.table(table_name)

            if query_type == "select":
                query = query.select(columns)
            
            # Apply filters if provided
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)

            result = query.execute()
            return result.data

        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return None

    def insert_data(self, table_name: str, data: Dict[str, Any]):
        """Insert data into a table.

        Args:
            table_name (str): Name of the table
            data (dict): Data to insert

        Returns:
            dict: Insert result or None if insert fails
        """
        try:
            result = self.client.table(table_name).insert(data).execute()
            return result.data
        except Exception as e:
            logger.error(f"Data insertion failed: {e}")
            return None

    def update_data(self, table_name: str, data: Dict[str, Any], 
                         filters: Dict[str, Any]):
        """Update data in a table.

        Args:
            table_name (str): Name of the table
            data (dict): Data to update
            filters (dict): Update filters

        Returns:
            dict: Update result or None if update fails
        """
        try:
            query = self.client.table(table_name).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
                
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Data update failed: {e}")
            return None

    def delete_data(self, table_name: str, filters: Dict[str, Any]):
        """Delete data from a table.

        Args:
            table_name (str): Name of the table
            filters (dict): Delete filters

        Returns:
            dict: Delete result or None if deletion fails
        """
        try:
            query = self.client.table(table_name).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
                
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Data deletion failed: {e}")
            return None

    async def get_conversation_bundle_id(self, conversation_id: str) -> Optional[str]:
        """Get bundle ID linked to conversation through attachments.
        
        Args:
            conversation_id: ID of the conversation
            
        Returns:
            Bundle ID if found, None otherwise
        """
        try:
            result = self.execute_query(
                table_name='conversation_attachments',
                query_type='select',
                columns='attachment_id',
                filters={
                    'conversation_id': conversation_id,
                    'attachment_type': 'workout_bundle'
                }
            )
            
            if result and len(result) > 0:
                return result[0]['attachment_id']
            return None
        except Exception as e:
            logger.error(f"Error fetching bundle ID: {e}")
            return None

    async def get_workout_bundle(self, bundle_id: str) -> Optional[Dict]:
        """Fetch workout bundle data by ID.
        
        Args:
            bundle_id: ID of the workout bundle
            
        Returns:
            Bundle data if found, None otherwise
        """
        try:
            result = self.execute_query(
                table_name='graph_bundles',
                query_type='select',
                columns='*',
                filters={'id': bundle_id}
            )
            
            if result and len(result) > 0:
                # Convert to format expected by WorkoutDataBundle
                bundle_data = {
                    'bundle_id': result[0]['id'],
                    'metadata': result[0]['metadata'],
                    'workout_data': result[0]['workout_data'],
                    'original_query': result[0]['original_query'],
                    'chart_url': result[0]['chart_url'],
                    'created_at': result[0]['created_at'],
                    # Initialize new fields to ensure compatibility
                    'chart_urls': {},
                    'correlation_data': None,
                    'consistency_metrics': {'score': 0, 'streak': 0, 'avg_gap': 0},
                    'top_performers': {'strength': [], 'volume': [], 'frequency': []}
                }
                return bundle_data
            return None
        except Exception as e:
            logger.error(f"Error fetching workout bundle: {e}")
            return None
        
    async def create_workout_bundle_with_link(self, bundle: WorkoutDataBundle, user_id: str, conversation_id: str) -> Dict[str, Any]:
        try:
            logger.info(f"Linking bundle {bundle.bundle_id} to conversation {conversation_id}")
            # Extract user_id from workout data if not provided
            if not user_id and bundle.workout_data.get('workouts'):
                user_id = bundle.workout_data.get('workouts', [{}])[0].get('user_id', '')
            
            if not user_id:
                logger.error("No user ID provided for bundle creation")
                return {'success': False, 'error': 'Missing user ID'}
            
            # Store complete workout data instead of just references
            processed_workout_data = _convert_datetime_to_iso(bundle.workout_data)
            
            # Prepare bundle data for RPC, converting datetime objects
            params = {
                'p_bundle_id': str(bundle.bundle_id),
                'p_user_id': str(user_id),
                'p_conversation_id': str(conversation_id),
                'p_metadata': _convert_datetime_to_iso(bundle.metadata.model_dump() if hasattr(bundle.metadata, 'model_dump') else bundle.metadata),
                'p_workout_data': processed_workout_data,  # Store the complete workout data
                'p_original_query': bundle.original_query,
                'p_chart_url': bundle.chart_url,
                'p_chart_urls': bundle.chart_urls or {}
            }
            
            # Handle additional optional fields
            if hasattr(bundle, 'consistency_metrics') and bundle.consistency_metrics:
                params['p_consistency_metrics'] = _convert_datetime_to_iso(bundle.consistency_metrics)
            
            if hasattr(bundle, 'top_performers') and bundle.top_performers:
                params['p_top_performers'] = _convert_datetime_to_iso(bundle.top_performers)

            logger.info(f"Sending bundle-conversation link request: bundle_id={bundle.bundle_id}, conversation_id={conversation_id}")
            
            # Execute RPC and log the response for debugging
            response = self.client.rpc('create_workout_bundle_with_link', params).execute()
            logger.debug(f"RPC response: {response.data if hasattr(response, 'data') else 'No data'}")
            
            # Process response
            if hasattr(response, 'data') and response.data:
                result = response.data
                if isinstance(result, list) and len(result) > 0:
                    result = result[0]
                
                # Add detailed success logging
                if result.get('success', False):
                    logger.info(f"✅ Successfully linked bundle {bundle.bundle_id} to conversation {conversation_id}")
                else:
                    logger.error(f"❌ Failed to link bundle to conversation: {result.get('error', 'Unknown error')}")
                
                return result
            else:
                logger.error(f"❌ Empty response when linking bundle {bundle.bundle_id} to conversation {conversation_id}")
                return {'success': False, 'error': 'Empty response'}
        
        except Exception as e:
            logger.error(f"❌ Exception while linking bundle {bundle.bundle_id} to conversation {conversation_id}: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
        
    async def fetch_conversation_messages(self, conversation_id: str) -> List[Dict]:
        """Fetch conversation messages from the database.
        
        Args:
            conversation_id: ID of the conversation
            
        Returns:
            List of message objects in conversation order
        """
        try:
            # Query messages table directly
            result = self.execute_query(
                table_name='messages',
                query_type='select',
                columns='*',
                filters={'conversation_id': conversation_id}
            )
            
            if not result:
                logger.warning(f"No messages found for conversation {conversation_id}")
                return []
            
            # Sort messages by conversation_sequence to ensure proper order
            sorted_messages = sorted(result, key=lambda msg: msg.get('conversation_sequence', 0))
            
            # Transform to the format expected by the conversation chain
            formatted_messages = []
            for msg in sorted_messages:
                formatted_messages.append({
                    'id': msg.get('id'),
                    'conversation_id': conversation_id,
                    'content': msg.get('content', ''),
                    'sender': msg.get('sender', 'unknown'),
                    'conversation_sequence': msg.get('conversation_sequence', 0),
                    'timestamp': msg.get('timestamp')
                })
                
            return formatted_messages
        except Exception as e:
            logger.error(f"Error fetching conversation messages: {str(e)}", exc_info=True)
            return []