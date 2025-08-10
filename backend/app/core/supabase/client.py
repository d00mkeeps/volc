from datetime import datetime
from supabase import create_client, Client
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
    _authenticated_clients: Dict[str, Client] = {}

    def __new__(cls):
        """Singleton pattern to ensure only one client instance is created."""
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        logger.info("Initializing SupabaseClient")
        
        # Load environment variables - try multiple paths
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
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        
        # Important: Check key validity
        if self.key and (len(self.key) < 20 or '.' not in self.key):
            logger.warning(f"Supabase key doesn't look valid: {self.key[:10]}... - using fallback")
            self.key = None
            
        logger.info(f"Supabase URL present: {self.url is not None}")
        logger.info(f"Supabase API key present: {self.key is not None}")
 
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
            
        # Create default client (unauthenticated)
        try:
            logger.info(f"Creating default Supabase client with URL: {self.url}")
            self.client = create_client(self.url, self.key)
            logger.info("Default Supabase client created successfully")
            
            # Test connection
            test_result = self.client.table('exercise_definitions').select('count').limit(1).execute()
            logger.info(f"Test query successful: {len(test_result.data) if hasattr(test_result, 'data') else 'No data'}")
            
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {str(e)}")
            raise
            
        self._initialized = True

    def get_authenticated_client(self, jwt_token: str) -> Client:
        """
        Get a Supabase client authenticated with the provided JWT token.
        Clients are cached by token for efficiency.
        """
        if not jwt_token:
            logger.warning("No JWT token provided, returning default client")
            return self.client
            
        # Check if we already have a client for this token
        if jwt_token in self._authenticated_clients:
            logger.debug("Returning cached authenticated client")
            return self._authenticated_clients[jwt_token]
        
        try:
            # Create new authenticated client
            logger.debug("Creating new authenticated Supabase client")
            auth_client = create_client(self.url, self.key)
            
            # Set the auth token
            auth_client.auth.set_session({
                'access_token': jwt_token,
                'token_type': 'bearer'
            })
            
            # Cache the client
            self._authenticated_clients[jwt_token] = auth_client
            logger.debug("Authenticated client created and cached")
            
            return auth_client
            
        except Exception as e:
            logger.error(f"Failed to create authenticated client: {str(e)}")
            # Fallback to default client
            return self.client

    def clear_auth_cache(self, jwt_token: Optional[str] = None):
        """
        Clear cached authenticated clients.
        If jwt_token is provided, only clear that specific client.
        If None, clear all cached clients.
        """
        if jwt_token:
            if jwt_token in self._authenticated_clients:
                del self._authenticated_clients[jwt_token]
                logger.debug(f"Cleared cached client for token")
        else:
            self._authenticated_clients.clear()
            logger.debug("Cleared all cached authenticated clients")

    def table(self, table_name: str):
        """Direct pass-through to the default client's table method"""
        logger.debug(f"Accessing table: {table_name}")
        return self.client.table(table_name)
    
    def rpc(self, function_name: str, params: dict = None):
        """Direct pass-through to the default client's rpc method"""
        logger.debug(f"Calling RPC function: {function_name}")
        return self.client.rpc(function_name, params or {})
    
    def from_(self, bucket: str):
        """Direct pass-through to the default client's storage.from_ method"""
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
        """Expose the auth namespace from the default client."""
        return self.client.auth
        
    @property
    def storage(self):
        """Expose the storage namespace from the default client."""
        return self.client.storage