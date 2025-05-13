# app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase.client import SupabaseClient
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate JWT token and return user information
    """
    try:
        token = credentials.credentials
        # Use Supabase client to verify the token
        supabase_client = SupabaseClient()
        
        # Verify token and get user info from Supabase
        user_response = supabase_client.auth.get_user(token)
        
        # Check if user_response and user_response.user exist and have an id property
        if not user_response or not hasattr(user_response, 'user') or not user_response.user or not hasattr(user_response.user, 'id'):
            logger.warning("Invalid authentication credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_response.user
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )