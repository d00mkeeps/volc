from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class GraphBundleService(BaseDBService):
    """
    Service for handling graph bundle operations in the database
    """
    
    async def get_bundles_by_conversation(self, user_id: str, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Get all graph bundles for a specific conversation
        """
        try:
            logger.info(f"Getting graph bundles for conversation: {conversation_id}")
            
            # Query using Supabase client
            result = self.supabase.table("graph_bundles") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("conversation_id", conversation_id) \
                .order("created_at", desc=True) \
                .execute()
                
            if not hasattr(result, 'data') or not result.data:
                logger.info(f"No graph bundles found for conversation: {conversation_id}")
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
                
            logger.info(f"Retrieved {len(formatted_bundles)} graph bundles")
            return formatted_bundles
        except Exception as e:
            logger.error(f"Error getting graph bundles: {str(e)}")
            return await self.handle_error("get_bundles_by_conversation", e)

    async def delete_graph_bundle(self, user_id: str, bundle_id: str) -> Dict[str, Any]:
        """
        Delete a graph bundle
        """
        try:
            logger.info(f"Deleting graph bundle: {bundle_id}")
            
            result = self.supabase.table("graph_bundles") \
                .delete() \
                .eq("id", bundle_id) \
                .eq("user_id", user_id) \
                .execute()
                
            # Check for data in response
            if hasattr(result, 'data'):
                logger.info(f"Successfully deleted graph bundle: {bundle_id}")
                return {"success": True}
            else:
                logger.error(f"Failed to delete bundle: No data returned")
                return {"success": False, "error": "No data returned"}
                
        except Exception as e:
            logger.error(f"Error deleting graph bundle: {str(e)}")
            return await self.handle_error("delete_graph_bundle", e)

    async def delete_conversation_bundles(self, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """
        Delete all graph bundles for a conversation
        """
        try:
            logger.info(f"Deleting all graph bundles for conversation: {conversation_id}")
            
            result = self.supabase.table("graph_bundles") \
                .delete() \
                .eq("user_id", user_id) \
                .eq("conversation_id", conversation_id) \
                .execute()
                
            # Check for data in response
            if hasattr(result, 'data'):
                logger.info(f"Successfully deleted all graph bundles for conversation: {conversation_id}")
                return {"success": True}
            else:
                logger.error(f"Failed to delete conversation bundles: No data returned")
                return {"success": False, "error": "No data returned"}
                
        except Exception as e:
            logger.error(f"Error deleting conversation bundles: {str(e)}")
            return await self.handle_error("delete_conversation_bundles", e)
        

    async def save_graph_bundle(self, user_id: str, bundle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save a workout data bundle to the database
        """
        try:
            logger.info(f"Saving graph bundle: {bundle.get('bundle_id')}")
            
            # Prepare insert data
            insert_data = {
                "id": bundle["bundle_id"],
                "user_id": user_id,
                "conversation_id": bundle["conversationId"],
                "metadata": bundle.get("metadata", {}),
                "workout_data": bundle.get("workout_data", {}),
                "original_query": bundle.get("original_query", ""),
                "chart_url": bundle.get("chart_url"),
                "chart_urls": bundle.get("chart_urls", {}),
                "top_performers": bundle.get("top_performers", {}),
                "consistency_metrics": bundle.get("consistency_metrics", {}),
                "created_at": bundle.get("created_at") or None  # Will use server timestamp if None
            }
            
            # Insert into database
            result = self.supabase.table("graph_bundles") \
                .insert(insert_data) \
                .execute()
            
            # Check if the response has data (success)
            if hasattr(result, 'data') and result.data:
                logger.info(f"Bundle saved successfully with conversation ID: {bundle['conversationId']}")
                return {"success": True, "bundle_id": bundle["bundle_id"]}
            else:
                # If we get here, something went wrong but didn't raise an exception
                logger.error(f"Failed to save bundle, no data returned")
                return {"success": False, "error": "No data returned"}
                
        except Exception as e:
            logger.error(f"Error saving graph bundle: {str(e)}")
            return await self.handle_error("save_graph_bundle", e)