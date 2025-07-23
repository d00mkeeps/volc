from datetime import datetime
import uuid
from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class AnalysisBundleService(BaseDBService):
    """
    Service for handling analysis bundle operations in the database
    """
    
    async def get_bundles_by_conversation(self, user_id: str, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Get all analysis bundles for a specific conversation
        """
        try:
            logger.info(f"Getting analysis bundles for conversation: {conversation_id}")
            
            # Query using Supabase client
            result = self.supabase.table("analysis_bundles") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("conversation_id", conversation_id) \
                .order("created_at", desc=True) \
                .execute()
                
            if not hasattr(result, 'data') or not result.data:
                logger.info(f"No analyses found for conversation: {conversation_id}")
                return []
                
            # Transform data similar to client-side transformation
            formatted_bundles = []
            for bundle in result.data:
                formatted_bundles.append({
                    "bundle_id": bundle["id"],
                    "metadata": bundle.get("metadata", {}),
                    "workout_data": bundle.get("workout_data", {}),
                    "original_query": bundle.get("original_query", ""),
                    "chart_url": bundle.get("chart_url"),
                    "chart_urls": bundle.get("chart_urls", {}),
                    "top_performers": bundle.get("top_performers", {}),
                    "consistency_metrics": bundle.get("consistency_metrics", {}),
                    "created_at": bundle.get("created_at"),
                    "conversationId": conversation_id
                })
                
            logger.info(f"Retrieved {len(formatted_bundles)} analyses")
            return formatted_bundles
        except Exception as e:
            logger.error(f"Error getting analysis bundles: {str(e)}")
            return await self.handle_error("get_bundles_by_conversation", e)

    async def delete_analysis_bundle(self, user_id: str, bundle_id: str) -> Dict[str, Any]:
        """
        Delete a analysis bundle
        """
        try:
            logger.info(f"Deleting analysis bundle: {bundle_id}")
            
            result = self.supabase.table("analysis_bundles") \
                .delete() \
                .eq("id", bundle_id) \
                .eq("user_id", user_id) \
                .execute()
                
            # Check for data in response
            if hasattr(result, 'data'):
                logger.info(f"Successfully deleted analysis bundle: {bundle_id}")
                return {"success": True}
            else:
                logger.error(f"Failed to delete bundle: No data returned")
                return {"success": False, "error": "No data returned"}
                
        except Exception as e:
            logger.error(f"Error deleting analysis bundle: {str(e)}")
            return await self.handle_error("delete_analysis_bundle", e)

    async def delete_conversation_bundles(self, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """
        Delete all analysis bundles for a conversation
        """
        try:
            logger.info(f"Deleting all analysis bundles for conversation: {conversation_id}")
            
            result = self.supabase.table("analysis_bundles") \
                .delete() \
                .eq("user_id", user_id) \
                .eq("conversation_id", conversation_id) \
                .execute()
                
            # Check for data in response
            if hasattr(result, 'data'):
                logger.info(f"Successfully deleted all analysis bundles for conversation: {conversation_id}")
                return {"success": True}
            else:
                logger.error(f"Failed to delete conversation bundles: No data returned")
                return {"success": False, "error": "No data returned"}
                
        except Exception as e:
            logger.error(f"Error deleting conversation bundles: {str(e)}")
            return await self.handle_error("delete_conversation_bundles", e)
        
    async def save_analysis_bundle(self, user_id: str, bundle: dict) -> dict:
        try:
            bundle_id = str(bundle.get('bundle_id', uuid.uuid4()))
            
            logger.info(f"Saving analysis bundle: {bundle_id}")
            
            # Convert objects to JSON-serializable types
            def convert_for_json(data):
                if isinstance(data, dict):
                    return {k: convert_for_json(v) for k, v in data.items()}
                elif isinstance(data, list):
                    return [convert_for_json(item) for item in data]
                elif isinstance(data, uuid.UUID):
                    return str(data)
                elif isinstance(data, datetime):
                    return data.isoformat()
                elif hasattr(data, "item"):  # NumPy types
                    return data.item()
                else:
                    return data
            
            converted_bundle = convert_for_json(bundle)
            
            insert_data = {
                "id": bundle_id,
                "user_id": user_id,
                "conversation_id": converted_bundle.get("conversationId"),
                "metadata": converted_bundle.get("metadata", {}),
                "raw_workouts": converted_bundle.get("raw_workouts", {}),
                "top_performers": converted_bundle.get("top_performers", {}),
                "consistency_metrics": converted_bundle.get("consistency_metrics", {}),
                "correlation_data": converted_bundle.get("correlation_data", {}),
                "chart_urls": converted_bundle.get("chart_urls", {}),
                "created_at": datetime.now().isoformat()
            }
            
            result = self.supabase.table("analysis_bundles").insert(insert_data).execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Bundle saved successfully with ID: {bundle_id}")
                return {"success": True, "bundle_id": bundle_id}
            else:
                logger.warning(f"Bundle may not have been saved properly. Result: {result}")
                return {"success": False, "error": "Database insertion yielded no data", "bundle_id": bundle_id}
                
        except Exception as e:
            logger.error(f"Error saving analysis bundle: {str(e)}")
            return {"success": False, "error": str(e)}