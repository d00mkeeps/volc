# app/api/endpoints/auth.py
from fastapi import APIRouter, Depends
from app.core.supabase.auth import get_current_user
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/auth")

class UserResponse(BaseModel):
    id: str
    email: str
    app_metadata: Dict[str, Any] = {}
    user_metadata: Dict[str, Any] = {}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(user = Depends(get_current_user)):
    """
    Get the current user's information
    This is useful for validating tokens on the client
    """
    return UserResponse(
        id=user.id,
        email=user.email,
        app_metadata=user.app_metadata if hasattr(user, 'app_metadata') else {},
        user_metadata=user.user_metadata if hasattr(user, 'user_metadata') else {}
    )