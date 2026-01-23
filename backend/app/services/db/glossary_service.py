# backend/app/services/db/glossary_service.py
from app.services.db.base_service import BaseDBService
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class GlossaryService(BaseDBService):
    """Service for glossary term database operations"""
    
    async def get_all_glossary_terms(self, jwt_token: str) -> Dict[str, Any]:
        """Get all glossary terms using user client (RLS-protected)"""
        try:
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("glossary_term") \
                .select("id, term, description, metadata") \
                .order("term") \
                .execute()
            return await self.format_response(result.data)
        except Exception as e:
            return await self.handle_error("get_all_glossary_terms", e)
    
    async def get_all_glossary_terms_admin(self) -> Dict[str, Any]:
        """Get all glossary terms using admin client (for cache)"""
        try:
            admin_client = self.get_admin_client()
            result = admin_client.table("glossary_term") \
                .select("id, term, description, metadata") \
                .order("term") \
                .execute()
            return await self.format_response(result.data)
        except Exception as e:
            return await self.handle_error("get_all_glossary_terms_admin", e)


glossary_service = GlossaryService()
