from datetime import datetime
from supabase import create_client
from typing import Optional, Dict, Any
import os, logging
from dotenv import load_dotenv
from pathlib import Path

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
            
            # Load environment variables - try multiple paths
            logger.info("Loading environment variables for Supabase client")
            project_root = Path(__file__).parent.parent.parent.parent.absolute()
            env_paths = [
                Path.cwd() / '.env',
                project_root / '.env',
                Path(__file__).parent.parent.parent.absolute() / '.env'
            ]
            
            for env_path in env_paths:
                if env_path.exists():
                    logger.info(f"Found .env at: {env_path}")
                    load_dotenv(dotenv_path=env_path)
                    break
            
            # Get Supabase credentials
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_KEY")
            
            # Important: Check key validity
            if key and (len(key) < 20 or '.' not in key):
                logger.warning(f"Supabase key doesn't look valid: {key[:10]}... - using fallback")
                key = None
                
            logger.info(f"Supabase URL present: {url is not None}")
            logger.info(f"Supabase API key present: {key is not None}")
     
         
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables or hardcoded")
                
            # Create client
            try:
                logger.info(f"Creating Supabase client with URL: {url}")
                logger.info(f"Supabase key length: {len(key)} characters")
                cls._instance.client = create_client(url, key)
                logger.info("Supabase client created successfully")
                
                # Test connection
                test_result = cls._instance.client.table('exercise_definitions').select('count').limit(1).execute()
                logger.info(f"Test query successful: {len(test_result.data) if hasattr(test_result, 'data') else 'No data'}")
                
            except Exception as e:
                logger.error(f"Failed to create Supabase client: {str(e)}")
                raise
                
        return cls._instance
    def table(self, table_name: str):
        """Direct pass-through to the underlying client's table method"""
        logger.debug(f"Accessing table: {table_name}")
        return self.client.table(table_name)
    
    def rpc(self, function_name: str, params: dict = None):
        """Direct pass-through to the underlying client's rpc method"""
        logger.debug(f"Calling RPC function: {function_name}")
        return self.client.rpc(function_name, params or {})
    
    def from_(self, bucket: str):
        """Direct pass-through to the underlying client's storage.from_ method"""
        logger.debug(f"Accessing storage bucket: {bucket}")
        return self.client.storage.from_(bucket)
    
    # Keep existing helper methods for backward compatibility
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
            logger.debug(f"Executing {query_type} query on table {table_name}")
            query = self.client.table(table_name)

            if query_type == "select":
                query = query.select(columns)
            
            # Apply filters if provided
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)

            result = query.execute()
            logger.debug(f"Query executed successfully, got {len(result.data)} results")
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
            logger.debug(f"Inserting data into table {table_name}")
            result = self.client.table(table_name).insert(data).execute()
            logger.debug("Data inserted successfully")
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
            logger.debug(f"Updating data in table {table_name}")
            query = self.client.table(table_name).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
                
            result = query.execute()
            logger.debug("Data updated successfully")
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
            logger.debug(f"Deleting data from table {table_name}")
            query = self.client.table(table_name).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
                
            result = query.execute()
            logger.debug("Data deleted successfully")
            return result.data
        except Exception as e:
            logger.error(f"Data deletion failed: {e}")
            return None

    @property
    def auth(self):
        """Expose the auth namespace from the official Supabase client."""
        return self.client.auth
        
    # Add any other properties or methods to expose from the underlying client
    @property
    def storage(self):
        """Expose the storage namespace from the official Supabase client."""
        return self.client.storage