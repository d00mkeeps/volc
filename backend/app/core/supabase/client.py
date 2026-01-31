# backend/app/core/supabase/client.py
import os
import logging
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
current_file = Path(__file__)
backend_dir = current_file.parents[3]
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)


class SupabaseClientFactory:
    """Simple factory for creating Supabase clients with proper context"""

    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.anon_key = os.environ.get("SUPABASE_KEY")  # Changed from SUPABASE_ANON_KEY
        self.service_key = os.environ.get("SUPABASE_SERVICE_KEY")

        if not all([self.url, self.anon_key]):
            print(f"🔍 SUPABASE_URL: {self.url}")
            print(f"🔍 SUPABASE_KEY: {'***' if self.anon_key else None}")
            print(f"🔍 .env path: {env_path}")
            print(f"🔍 .env exists: {env_path.exists()}")
            raise ValueError("Missing required Supabase environment variables")

        if not self.service_key:
            logger.warning(
                "SUPABASE_SERVICE_KEY not found - admin operations will not be available"
            )

        logger.info("SupabaseClientFactory initialized successfully")

    def get_user_client(self, jwt_token: str) -> Client:
        """Get client with user context for RLS operations"""
        client = create_client(self.url, self.anon_key)
        client.auth.set_session(access_token=jwt_token, refresh_token="")
        return client

    def get_admin_client(self) -> Client:  # Add this method
        """Get client with service role for backend operations"""
        if not self.service_key:
            raise ValueError("SUPABASE_SERVICE_KEY not configured")
        return create_client(self.url, self.service_key)


# Global instance
supabase_factory = SupabaseClientFactory()


def get_user_client(jwt_token: str) -> Client:
    """Get client with user context for RLS operations"""
    return supabase_factory.get_user_client(jwt_token)


def get_admin_client() -> Client:
    """Get client with service role for backend operations"""
    return supabase_factory.get_admin_client()
