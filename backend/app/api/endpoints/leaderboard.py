from fastapi import APIRouter, Request, Depends
from typing import Dict, Any
from app.core.supabase.auth import get_current_user
from app.core.utils.jwt_utils import extract_jwt_from_request
from app.services.db.base_service import BaseDBService

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])

class LeaderboardService(BaseDBService):
    async def get_bicep_leaderboard(self):
        result = self.supabase.table("leaderboard_biceps_with_users").select("*").execute()
        # Add rank
        leaderboard = []
        for idx, entry in enumerate(result.data or []):
            leaderboard.append({
                **entry,
                "rank": idx + 1
            })
        return leaderboard

@router.get("/biceps")
async def get_bicep_leaderboard(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    jwt_token = extract_jwt_from_request(request)
    service = LeaderboardService(jwt_token=jwt_token)
    return await service.get_bicep_leaderboard()