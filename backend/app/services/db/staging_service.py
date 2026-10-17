# backend/app/services/db/staging_service.py
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from app.services.db.base_service import BaseDBService

logger = logging.getLogger(__name__)

# In-memory store fallback in case table hasn't been migrated in Supabase yet
_memory_staged_workouts: Dict[str, Dict[str, Any]] = {}


class StagingService(BaseDBService):
    """
    Database service for managing staged workouts in Supabase.
    Includes in-memory fallback for local development before migration runs.
    """

    async def create_staged_workout(
        self,
        user_id: str,
        raw_text: str,
        reference_timestamp: str,
        parsed_workout: Dict[str, Any],
        jwt_token: str,
    ) -> Dict[str, Any]:
        """
        Creates a new staged workout record.
        """
        record_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        row_data = {
            "id": record_id,
            "user_id": user_id,
            "raw_text": raw_text,
            "reference_timestamp": reference_timestamp,
            "status": "staging",
            "parsed_workout": parsed_workout,
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        try:
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("staged_workouts").insert(row_data).execute()
            if hasattr(result, "data") and result.data:
                logger.info(f"Saved staged workout to DB: {record_id}")
                return result.data[0]
        except Exception as e:
            logger.warning(
                f"Could not persist staged workout to DB ({e}). Falling back to memory store."
            )

        # Fallback to in-memory store
        _memory_staged_workouts[record_id] = row_data
        return row_data

    async def get_staged_workout(
        self, stage_id: str, jwt_token: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a staged workout by ID.
        """
        try:
            user_client = self.get_user_client(jwt_token)
            result = (
                user_client.table("staged_workouts")
                .select("*")
                .eq("id", stage_id)
                .execute()
            )
            if hasattr(result, "data") and result.data:
                return result.data[0]
        except Exception as e:
            logger.warning(f"DB lookup failed for staged workout {stage_id}: {e}")

        # Check in-memory store
        if stage_id in _memory_staged_workouts:
            return _memory_staged_workouts[stage_id]

        return None

    async def update_staged_workout(
        self,
        stage_id: str,
        status: Optional[str] = None,
        parsed_workout: Optional[Dict[str, Any]] = None,
        jwt_token: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Updates a staged workout status or parsed payload.
        """
        updates: Dict[str, Any] = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if status:
            updates["status"] = status
        if parsed_workout is not None:
            updates["parsed_workout"] = parsed_workout

        try:
            if jwt_token:
                user_client = self.get_user_client(jwt_token)
                result = (
                    user_client.table("staged_workouts")
                    .update(updates)
                    .eq("id", stage_id)
                    .execute()
                )
                if hasattr(result, "data") and result.data:
                    return result.data[0]
        except Exception as e:
            logger.warning(f"DB update failed for staged workout {stage_id}: {e}")

        # Fallback memory store update
        if stage_id in _memory_staged_workouts:
            _memory_staged_workouts[stage_id].update(updates)
            return _memory_staged_workouts[stage_id]

        return None

    async def list_staged_workouts(
        self, user_id: str, jwt_token: str, status: Optional[str] = "staging"
    ) -> List[Dict[str, Any]]:
        """
        Lists staged workouts for a user.
        """
        try:
            user_client = self.get_user_client(jwt_token)
            query = (
                user_client.table("staged_workouts")
                .select("*")
                .eq("user_id", user_id)
            )
            if status:
                query = query.eq("status", status)
            result = query.order("created_at", desc=True).execute()
            if hasattr(result, "data") and result.data:
                return result.data
        except Exception as e:
            logger.warning(f"DB list failed for user {user_id}: {e}")

        # Fallback to memory store
        results = [
            item
            for item in _memory_staged_workouts.values()
            if item.get("user_id") == user_id
            and (status is None or item.get("status") == status)
        ]
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results
