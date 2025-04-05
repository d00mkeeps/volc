from supabase import create_client
from supabase.client import Client
from typing import Optional, Dict, Any, List
import os
import logging
from dotenv import load_dotenv
from datetime import datetime

logger = logging.getLogger(__name__)

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

    async def link_bundle_to_conversation(self, user_id: str, conversation_id: str, bundle_id: str) -> bool:
        """Create attachment link between conversation and bundle.
        
        Args:
            user_id: ID of the user
            conversation_id: ID of the conversation
            bundle_id: ID of the bundle to link
            
        Returns:
            True if successful, False otherwise
        """
        try:
            attachment_data = {
                'user_id': user_id,
                'conversation_id': conversation_id,
                'attachment_id': bundle_id,
                'attachment_type': 'workout_bundle'
            }
            
            result = self.insert_data('conversation_attachments', attachment_data)
            return result is not None
        except Exception as e:
            logger.error(f"Error linking bundle to conversation: {e}")
            return False