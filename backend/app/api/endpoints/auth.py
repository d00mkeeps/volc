from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
from app.core.supabase.client import SupabaseClient
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr

# Simple authentication service that passes through to Supabase
class SupabaseAuthService:
    def __init__(self):
        self.supabase = SupabaseClient()
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        try:
            result = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            # Handle object response format instead of dictionary
            if hasattr(result, 'session') and result.session is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Convert response to a serializable dictionary
            if hasattr(result, 'model_dump'):
                # For Pydantic models with model_dump method
                return result.model_dump()
            elif hasattr(result, 'dict'):
                # For older Pydantic models with dict method
                return result.dict()
            elif hasattr(result, '__dict__'):
                # For regular Python objects
                return {
                    "session": {
                        "access_token": result.session.access_token if hasattr(result.session, 'access_token') else None,
                        "refresh_token": result.session.refresh_token if hasattr(result.session, 'refresh_token') else None,
                        "user": {
                            "id": result.user.id if hasattr(result.user, 'id') else None,
                            "email": result.user.email if hasattr(result.user, 'email') else None
                        } if hasattr(result, 'user') else None
                    } if hasattr(result, 'session') else None
                }
            else:
                # Fallback to just returning the result directly
                return result
                
        except Exception as e:
            logger.error(f"Sign in error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
    
    def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        try:
            result = self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            # Handle object response format
            if hasattr(result, 'error') and result.error:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.error
                )
            
            # Convert response to a serializable dictionary
            if hasattr(result, 'model_dump'):
                return result.model_dump()
            elif hasattr(result, 'dict'):
                return result.dict()
            elif hasattr(result, '__dict__'):
                return {
                    "user": {
                        "id": result.user.id if hasattr(result.user, 'id') else None,
                        "email": result.user.email if hasattr(result.user, 'email') else None
                    } if hasattr(result, 'user') else None,
                    "session": {
                        "access_token": result.session.access_token if hasattr(result.session, 'access_token') else None
                    } if hasattr(result, 'session') else None
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Sign up error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    def sign_out(self, token: str) -> Dict[str, Any]:
        try:
            self.supabase.auth.sign_out(token)
            return {"success": True}
        except Exception as e:
            logger.error(f"Sign out error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )
    
    def reset_password(self, email: str) -> Dict[str, Any]:
        try:
            self.supabase.auth.reset_password_for_email(email)
            return {"success": True}
        except Exception as e:
            logger.error(f"Reset password error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )
    
    def get_user(self, token: str) -> Dict[str, Any]:
        try:
            result = self.supabase.auth.get_user(token)
            
            # Handle object response format
            if result is None or (hasattr(result, 'error') and result.error):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            # Convert response to a serializable dictionary
            if hasattr(result, 'model_dump'):
                return result.model_dump()
            elif hasattr(result, 'dict'):
                return result.dict()
            elif hasattr(result, '__dict__'):
                return {
                    "id": result.id if hasattr(result, 'id') else None,
                    "email": result.email if hasattr(result, 'email') else None,
                    "app_metadata": result.app_metadata if hasattr(result, 'app_metadata') else None,
                    "user_metadata": result.user_metadata if hasattr(result, 'user_metadata') else None
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Get user error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )

# API routes - all are synchronous now
@router.post("/sign-in")
def sign_in(request: SignInRequest):
    """
    Sign in a user with email and password
    """
    auth_service = SupabaseAuthService()
    return auth_service.sign_in(request.email, request.password)

@router.post("/sign-up")
def sign_up(request: SignUpRequest):
    """
    Register a new user
    """
    auth_service = SupabaseAuthService()
    return auth_service.sign_up(request.email, request.password)

@router.post("/sign-out")
def sign_out(authorization: str = Depends(lambda x: x.split(' ')[1] if 'Bearer' in x else x)):
    """
    Sign out a user
    """
    auth_service = SupabaseAuthService()
    return auth_service.sign_out(authorization)

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    """
    Reset a user's password
    """
    auth_service = SupabaseAuthService()
    return auth_service.reset_password(request.email)

@router.get("/me")
def get_current_user(authorization: str = Depends(lambda x: x.split(' ')[1] if 'Bearer' in x else x)):
    """
    Get the current user's information
    """
    auth_service = SupabaseAuthService()
    return auth_service.get_user(authorization)