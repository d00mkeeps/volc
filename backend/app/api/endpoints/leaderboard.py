# /backend/app/api/endpoints/leaderboard.py

from fastapi import APIRouter
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
async def get_bicep_leaderboard():
    service = LeaderboardService()
    return await service.get_bicep_leaderboard()