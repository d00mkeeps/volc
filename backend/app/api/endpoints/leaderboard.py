from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.core.supabase.auth import get_current_user, get_jwt_token
from app.services.db.base_service import BaseDBService

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


class LeaderboardService(BaseDBService):
    async def get_bicep_leaderboard(self, jwt_token: str):
        """Get bicep leaderboard with rankings"""
        try:
            # Use user client for RLS
            user_client = self.get_user_client(jwt_token)
            result = (
                user_client.table("leaderboard_biceps_with_users").select("*").execute()
            )

            # Add rank
            leaderboard = []
            for idx, entry in enumerate(result.data or []):
                leaderboard.append({**entry, "rank": idx + 1})

            return await self.format_response(leaderboard)

        except Exception as e:
            return await self.handle_error("get_bicep_leaderboard", e)


# Create service instance
leaderboard_service = LeaderboardService()


@router.get("/biceps")
async def get_bicep_leaderboard(
    user=Depends(get_current_user), jwt_token: str = Depends(get_jwt_token)
):
    """Get bicep leaderboard rankings"""
    result = await leaderboard_service.get_bicep_leaderboard(jwt_token)

    if result.get("success"):
        return result.get("data", [])
    else:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Unknown error"),
        )
