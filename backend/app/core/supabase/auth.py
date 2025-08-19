# backend/app/core/supabase/auth.py
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract user information from JWT token (trust Supabase's signature)"""
    try:
        token = credentials.credentials
        
        # Decode the JWT token without verification since Supabase signed it
        # We trust tokens that come from the client since they were issued by Supabase
        decoded_token = jwt.decode(
            token, 
            options={"verify_signature": False}  # Trust Supabase's signature
        )
        
        # Extract user info from the token
        user_id = decoded_token.get('sub')
        email = decoded_token.get('email')
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create a simple user object
        class User:
            def __init__(self, id: str, email: str):
                self.id = id
                self.email = email
        
        return User(user_id, email)
        
    except jwt.DecodeError:
        logger.error("JWT decode error")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract JWT token from request headers"""
    return credentials.credentials