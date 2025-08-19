# app/core/permissions.py
from typing import Dict

class PermissionLevels:
    """Simple permission and rate limit configuration"""
    
    TESTER = "tester"
    ADMIN = "admin"
    
    # Rate limits: action_type -> {tester_limit, admin_limit, window_hours}
    RATE_LIMITS = {
        "workout_create": {"tester": 2, "admin": 20, "window_hours": 24},
        "message_send": {"tester": 10, "admin": 100, "window_hours": 24},
    }
    
    @classmethod
    def is_admin(cls, permission_level: str) -> bool:
        """Check if user has admin privileges"""
        return permission_level == cls.ADMIN
    
    @classmethod
    def get_limit(cls, action_type: str, permission_level: str) -> Dict[str, int]:
        """Get rate limit for action/permission combination"""
        if action_type not in cls.RATE_LIMITS:
            # Default limits for unknown actions
            return {"count": 10, "window_hours": 1}
        
        limits = cls.RATE_LIMITS[action_type]
        count = limits.get(permission_level, limits["tester"])  # Default to tester limits
        
        return {"count": count, "window_hours": limits["window_hours"]}