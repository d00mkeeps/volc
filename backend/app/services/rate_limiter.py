# app/services/rate_limiter.py
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from app.services.db.base_service import BaseDBService
from app.core.permissions import PermissionLevels
import logging

logger = logging.getLogger(__name__)


class RateLimiter(BaseDBService):
    """Core rate limiting service with JWT-based permission extraction"""

    # In app/services/rate_limiter.py - modify this method:

    # Update the existing method to handle empty JWTs gracefully:

    # Update the existing method to handle empty JWTs gracefully:

    def get_user_permission_from_jwt(self, jwt_token: str, user_id: str = None) -> str:
        """Extract permission level from JWT payload, with database fallback"""
        try:
            # Skip JWT parsing if token is empty/None
            if not jwt_token or jwt_token.strip() == "":
                logger.info("No JWT provided, using database lookup for permissions")
                if user_id:
                    admin_client = self.get_admin_client()
                    result = (
                        admin_client.table("user_profiles")
                        .select("permission_level")
                        .eq("auth_user_uuid", user_id)
                        .execute()
                    )
                    if result.data and len(result.data) > 0:
                        return result.data[0]["permission_level"]
                return PermissionLevels.TESTER

            # Try to get from JWT first
            decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})
            permission_level = decoded_token.get("permission_level")

            if permission_level and permission_level in [
                PermissionLevels.TESTER,
                PermissionLevels.ADMIN,
            ]:
                return permission_level

            # Fallback: Look up from database if not in JWT
            if user_id:
                logger.info(
                    f"Permission level not in JWT, looking up from database for user {user_id}"
                )
                admin_client = self.get_admin_client()
                result = (
                    admin_client.table("user_profiles")
                    .select("permission_level")
                    .eq("auth_user_uuid", user_id)
                    .execute()
                )

                if result.data and len(result.data) > 0:
                    return result.data[0]["permission_level"]

            return PermissionLevels.TESTER

        except Exception as e:
            logger.error(f"Error extracting permission from JWT: {str(e)}")
            return PermissionLevels.TESTER

    async def check_rate_limit(
        self, user_id: str, action_type: str, jwt_token: str
    ) -> Dict[str, Any]:
        """Main rate limiting logic with fixed-window algorithm"""
        try:
            # Get permission level from JWT (no DB lookup needed)
            permission_level = self.get_user_permission_from_jwt(jwt_token, user_id)

            # Get rate limit configuration
            limit_config = PermissionLevels.get_limit(action_type, permission_level)
            max_count = limit_config["count"]
            window_hours = limit_config["window_hours"]

            # Use admin client for rate limit operations (bypass RLS)
            admin_client = self.get_admin_client()

            # Get current rate limit record
            result = (
                admin_client.table("user_rate_limits")
                .select("*")
                .eq("user_id", user_id)
                .eq("action_type", action_type)
                .execute()
            )

            current_time = datetime.now(timezone.utc)
            window_duration = timedelta(hours=window_hours)

            if not result.data:
                # No existing record - create new one
                new_record = {
                    "user_id": user_id,
                    "action_type": action_type,
                    "count": 1,
                    "window_start": current_time.isoformat(),
                    "updated_at": current_time.isoformat(),
                }

                admin_client.table("user_rate_limits").insert(new_record).execute()

                return await self.format_response(
                    {
                        "allowed": True,
                        "remaining": max_count - 1,
                        "reset_at": (current_time + window_duration).isoformat(),
                        "permission_level": permission_level,
                    }
                )

            # Existing record found
            record = result.data[0]
            window_start = datetime.fromisoformat(
                record["window_start"].replace("Z", "+00:00")
            )
            current_count = record["count"]

            # Check if window has expired
            if current_time >= window_start + window_duration:
                # Reset window
                updated_record = {
                    "count": 1,
                    "window_start": current_time.isoformat(),
                    "updated_at": current_time.isoformat(),
                }

                admin_client.table("user_rate_limits").update(updated_record).eq(
                    "id", record["id"]
                ).execute()

                return await self.format_response(
                    {
                        "allowed": True,
                        "remaining": max_count - 1,
                        "reset_at": (current_time + window_duration).isoformat(),
                        "permission_level": permission_level,
                    }
                )

            # Within current window
            if current_count >= max_count:
                # Rate limit exceeded
                return await self.format_response(
                    {
                        "allowed": False,
                        "remaining": 0,
                        "reset_at": (window_start + window_duration).isoformat(),
                        "permission_level": permission_level,
                    }
                )

            # Increment count
            new_count = current_count + 1
            admin_client.table("user_rate_limits").update(
                {"count": new_count, "updated_at": current_time.isoformat()}
            ).eq("id", record["id"]).execute()

            return await self.format_response(
                {
                    "allowed": True,
                    "remaining": max_count - new_count,
                    "reset_at": (window_start + window_duration).isoformat(),
                    "permission_level": permission_level,
                }
            )

        except Exception as e:
            return await self.handle_error("check_rate_limit", e)


# Global instance
rate_limiter = RateLimiter()
