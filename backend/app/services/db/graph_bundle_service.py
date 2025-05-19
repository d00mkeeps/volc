from datetime import datetime
import uuid
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
        
    async def save_graph_bundle(self, user_id: str, bundle: dict) -> dict:
        """Save a graph bundle to the database and link it to a conversation."""
        try:
            # Generate a bundle_id if not provided
            bundle_id = bundle.get('bundle_id')
            if not bundle_id:
                bundle_id = str(uuid.uuid4())
                bundle['bundle_id'] = bundle_id
            elif isinstance(bundle_id, uuid.UUID):
                # Convert UUID to string if it's a UUID object
                bundle['bundle_id'] = str(bundle_id)
                bundle_id = str(bundle_id)
            
            logger.info(f"Saving graph bundle: {bundle_id}")
            
            # Convert objects to JSON-serializable types
            def convert_for_json(data):
                """Recursively convert objects to JSON-serializable types."""
                if isinstance(data, dict):
                    return {k: convert_for_json(v) for k, v in data.items()}
                elif isinstance(data, list):
                    return [convert_for_json(item) for item in data]
                elif isinstance(data, uuid.UUID):
                    return str(data)
                elif isinstance(data, datetime):
                    return data.isoformat()
                # Handle NumPy types if present
                elif hasattr(data, "item"):  # Catches np.float64, np.int64, np.bool_, etc.
                    return data.item()  # Converts to native Python types
                else:
                    return data
            
            # Convert bundle for JSON serialization
            converted_bundle = convert_for_json(bundle)
            
            # Extract fields from bundle to match schema structure
            insert_data = {
                "id": bundle_id,
                "user_id": user_id,
                "metadata": converted_bundle.get("metadata", {}),
                "workout_data": converted_bundle.get("workout_data", {}),
                "original_query": converted_bundle.get("original_query", "Workout analysis"),
                "chart_url": converted_bundle.get("chart_url"),
                "chart_urls": converted_bundle.get("chart_urls", {}),
                "consistency_metrics": converted_bundle.get("consistency_metrics", {}),
                "top_performers": converted_bundle.get("top_performers", {}),
                "created_at": datetime.now().isoformat()
            }
            
            # Add conversation_id if provided
            conversation_id = bundle.get("conversationId")
            if conversation_id:
                insert_data["conversation_id"] = conversation_id
            
            # Save to database with matching schema columns
            result = await self.supabase.table("graph_bundles").insert(insert_data).execute()
            
            # Check for successful response
            if hasattr(result, 'data') and result.data:
                logger.info(f"Bundle saved successfully with ID: {bundle_id}")
                return {"success": True, "bundle_id": bundle_id}
            else:
                logger.warning(f"Bundle may not have been saved properly. Result: {result}")
                return {"success": False, "error": "Database insertion yielded no data", "bundle_id": bundle_id}
                
        except Exception as e:
            logger.error(f"Error saving graph bundle: {str(e)}")
            return {"success": False, "error": str(e)}