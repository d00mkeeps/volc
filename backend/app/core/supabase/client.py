# backend/app/core/supabase/client.py
import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

class SupabaseClientFactory:
    """Simple factory for creating Supabase clients with proper context"""
    
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.anon_key = os.environ.get("SUPABASE_ANON_KEY")
        
        if not all([self.url, self.anon_key]):
            raise ValueError("Missing required Supabase environment variables")
        logger.info("SupabaseClientFactory initialized successfully")
    
    def get_user_client(self, jwt_token: str) -> Client:
        """Get client with user context for RLS operations"""
        client = create_client(self.url, self.anon_key)
        client.auth.set_session(access_token=jwt_token, refresh_token="")
        return client

# Global instance
supabase_factory = SupabaseClientFactory()