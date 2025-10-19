from datetime import datetime
import uuid
from app.services.db.base_service import BaseDBService
from typing import Dict, List, Any
import logging

from app.services.workout_analysis.schemas import WorkoutDataBundle

logger = logging.getLogger(__name__)

class AnalysisBundleService(BaseDBService):
    """
    Service for handling analysis bundle operations in the database
    """
    
    async def get_bundles_by_conversation(self, conversation_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get all analysis bundles for a specific conversation
        """
        try:
            logger.info(f"Getting analysis bundles for conversation: {conversation_id}")
            
            # Query using authenticated Supabase client - RLS handles user filtering
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .select("*") \
                .eq("conversation_id", conversation_id) \
                .order("created_at", desc=True) \
                .execute()
                
            if not hasattr(result, 'data') or not result.data:
                logger.info(f"No analyses found for conversation: {conversation_id}")
                return await self.format_response([])
                
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
            return await self.format_response(formatted_bundles)
            
        except Exception as e:
            logger.error(f"Error getting analysis bundles: {str(e)}")
            return await self.handle_error("get_bundles_by_conversation", e)

    async def delete_analysis_bundle(self, bundle_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Delete a analysis bundle
        """
        try:
            logger.info(f"Deleting analysis bundle: {bundle_id}")
            
            # RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .delete() \
                .eq("id", bundle_id) \
                .execute()
                
            logger.info(f"Successfully deleted analysis bundle: {bundle_id}")
            return await self.format_response({"success": True})
                
        except Exception as e:
            logger.error(f"Error deleting analysis bundle: {str(e)}")
            return await self.handle_error("delete_analysis_bundle", e)

    async def delete_conversation_bundles(self, conversation_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Delete all analysis bundles for a conversation
        """
        try:
            logger.info(f"Deleting all analysis bundles for conversation: {conversation_id}")
            
            # RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .delete() \
                .eq("conversation_id", conversation_id) \
                .execute()
                
            logger.info(f"Successfully deleted all analysis bundles for conversation: {conversation_id}")
            return await self.format_response({"success": True})
                
        except Exception as e:
            logger.error(f"Error deleting conversation bundles: {str(e)}")
            return await self.handle_error("delete_conversation_bundles", e)
        
    async def create_empty_bundle(self, conversation_id: str, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Create an empty analysis bundle with 'pending' status
        """
        try:
            bundle_id = str(uuid.uuid4())
            logger.info(f"Creating empty analysis bundle: {bundle_id} for conversation: {conversation_id}")
            
            insert_data = {
                "id": bundle_id,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "status": "pending",
                "metadata": {},
                "workouts": {},
                "top_performers": {},
                "consistency_metrics": {},
                "correlation_data": {},
                "chart_urls": {},
                "created_at": datetime.now().isoformat()
            }
            
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles").insert(insert_data).execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Empty bundle created successfully with ID: {bundle_id}")
                return await self.format_response({"success": True, "bundle_id": bundle_id})
            else:
                logger.error(f"Failed to create empty bundle")
                return await self.handle_error("create_empty_bundle", Exception("Database insertion failed"))
                
        except Exception as e:
            logger.error(f"Error creating empty analysis bundle: {str(e)}")
            return await self.handle_error("create_empty_bundle", e)

    async def update_bundle_status(self, bundle_id: str, status: str, jwt_token: str, error_msg: str = None) -> Dict[str, Any]:
        """
        Update the status of an analysis bundle
        """
        try:
            logger.info(f"Updating bundle {bundle_id} status to: {status}")
            
            update_data = {"status": status}
            if error_msg:
                update_data["error_message"] = error_msg
                
            # RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .update(update_data) \
                .eq("id", bundle_id) \
                .execute()
                
            logger.info(f"Bundle status updated successfully: {bundle_id} -> {status}")
            return await self.format_response({"success": True})
                
        except Exception as e:
            logger.error(f"Error updating bundle status: {str(e)}")
            return await self.handle_error("update_bundle_status", e)

    async def update_bundle_field(self, bundle_id: str, field_name: str, data: Any, jwt_token: str) -> Dict[str, Any]:
        """
        Update a specific field in an analysis bundle
        """
        try:
            logger.info(f"Updating bundle {bundle_id} field: {field_name}")
            
            # Convert data for JSON serialization
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
            
            converted_data = convert_for_json(data)
            
            # RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .update({field_name: converted_data}) \
                .eq("id", bundle_id) \
                .execute()
                
            logger.info(f"Bundle field updated successfully: {bundle_id}.{field_name}")
            return await self.format_response({"success": True})
                
        except Exception as e:
            logger.error(f"Error updating bundle field: {str(e)}")
            return await self.handle_error("update_bundle_field", e)
            
    async def save_analysis_bundle(self, bundle_id: str, bundle: 'WorkoutDataBundle', jwt_token: str) -> dict:

        """Update an existing bundle with complete processed data."""
        try:
            logger.info(f"Updating analysis bundle: {bundle_id}")
            
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
                elif hasattr(data, "model_dump"):  # Pydantic models
                    return convert_for_json(data.model_dump())
                elif hasattr(data, "item"):  # NumPy types
                    return data.item()
                else:
                    return data
            
            # Convert WorkoutDataBundle to JSON-safe format
            update_data = {
                "metadata": convert_for_json(bundle.metadata),
                "workouts": convert_for_json(bundle.workouts),
                "top_performers": convert_for_json(bundle.top_performers),
                "consistency_metrics": convert_for_json(bundle.consistency_metrics),
                "correlation_data": convert_for_json(bundle.correlation_data),
                "chart_urls": convert_for_json(bundle.chart_urls),
                "status": bundle.status,
                "created_at": bundle.created_at.isoformat()
            }
            
            # UPDATE existing bundle instead of INSERT - RLS handles user access control
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .update(update_data) \
                .eq("id", bundle_id) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Bundle updated successfully: {bundle_id}")
                
                # Refresh context cache since we updated a bundle
                from app.services.context.conversation_context_service import conversation_context_service
                # Extract conversation_id from bundle or result if available
                conversation_id = getattr(bundle, 'conversation_id', None)
                if conversation_id:
                    await conversation_context_service.refresh_context(conversation_id)
                
                return {"success": True, "bundle_id": bundle_id}
            else:
                logger.warning(f"Bundle update yielded no data. Result: {result}")
                return {"success": False, "error": "Database update yielded no data", "bundle_id": bundle_id}
                
        except Exception as e:
            logger.error(f"Error updating analysis bundle: {str(e)}")
            return {"success": False, "error": str(e)}
        

# ==================== BASIC BUNDLE METHODS ====================

    async def create_basic_bundle(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Create an empty basic analysis bundle for a user with 'pending' status.
        Basic bundles are user-level (conversation_id = NULL).
        """
        try:
            bundle_id = str(uuid.uuid4())
            logger.info(f"Creating basic bundle: {bundle_id} for user: {user_id}")
            
            insert_data = {
                "id": bundle_id,
                "user_id": user_id,
                "conversation_id": None,  # Basic bundles aren't tied to conversations
                "type": "basic",
                "status": "pending",
                "metadata": {},
                "workouts": {},
                "top_performers": {},
                "consistency_metrics": {},
                "correlation_data": {},
                "chart_urls": {},
                "created_at": datetime.now().isoformat()
            }
            
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles").insert(insert_data).execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Basic bundle created successfully with ID: {bundle_id}")
                return await self.format_response({"success": True, "bundle_id": bundle_id})
            else:
                logger.error(f"Failed to create basic bundle")
                return await self.handle_error("create_basic_bundle", Exception("Database insertion failed"))
                
        except Exception as e:
            logger.error(f"Error creating basic bundle: {str(e)}")
            return await self.handle_error("create_basic_bundle", e)

    async def get_latest_basic_bundle(self, user_id: str, jwt_token: str) -> Dict[str, Any]:
        """
        Get the most recent basic bundle for a user.
        Returns the latest bundle with status='complete'.
        """
        try:
            logger.info(f"Getting latest basic bundle for user: {user_id}")
            
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("type", "basic") \
                .eq("status", "complete") \
                .is_("conversation_id", "null") \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
                
            if not hasattr(result, 'data') or not result.data:
                logger.info(f"No basic bundle found for user: {user_id}")
                return await self.format_response(None)
            
            bundle = result.data[0]
            logger.info(f"Retrieved basic bundle {bundle['id']} for user {user_id}")
            return await self.format_response(bundle)
            
        except Exception as e:
            logger.error(f"Error getting latest basic bundle: {str(e)}")
            return await self.handle_error("get_latest_basic_bundle", e)

    async def save_basic_bundle(self, bundle_id: str, bundle: 'WorkoutDataBundle', jwt_token: str) -> Dict[str, Any]:
        """
        Update an existing basic bundle with complete processed data.
        Similar to save_analysis_bundle but for basic bundles.
        """
        try:
            logger.info(f"Saving basic bundle: {bundle_id}")
            
            # Convert objects to JSON-serializable types (reuse existing helper)
            def convert_for_json(data):
                if isinstance(data, dict):
                    return {k: convert_for_json(v) for k, v in data.items()}
                elif isinstance(data, list):
                    return [convert_for_json(item) for item in data]
                elif isinstance(data, uuid.UUID):
                    return str(data)
                elif isinstance(data, datetime):
                    return data.isoformat()
                elif hasattr(data, "model_dump"):  # Pydantic models
                    return convert_for_json(data.model_dump())
                elif hasattr(data, "item"):  # NumPy types
                    return data.item()
                else:
                    return data
            
            # Convert WorkoutDataBundle to JSON-safe format
            update_data = {
                "metadata": convert_for_json(bundle.metadata),
                "workouts": convert_for_json(bundle.workouts),
                "top_performers": convert_for_json(bundle.top_performers),
                "consistency_metrics": convert_for_json(bundle.consistency_metrics),
                "correlation_data": convert_for_json(bundle.correlation_data),
                "chart_urls": convert_for_json(bundle.chart_urls),
                "status": bundle.status,
                "created_at": bundle.created_at.isoformat()
            }
            
            user_client = self.get_user_client(jwt_token)
            result = user_client.table("analysis_bundles") \
                .update(update_data) \
                .eq("id", bundle_id) \
                .execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Basic bundle saved successfully: {bundle_id}")
                return await self.format_response({"success": True, "bundle_id": bundle_id})
            else:
                logger.warning(f"Basic bundle update yielded no data. Result: {result}")
                return await self.handle_error("save_basic_bundle", Exception("Database update yielded no data"))
                
        except Exception as e:
            logger.error(f"Error saving basic bundle: {str(e)}")
            return await self.handle_error("save_basic_bundle", e)

    async def delete_old_basic_bundles(self, user_id: str, jwt_token: str, keep_latest: int = 1) -> Dict[str, Any]:
        """
        Delete old basic bundles for a user, keeping only the N most recent.
        
        Args:
            user_id: User's ID
            jwt_token: JWT for authentication
            keep_latest: Number of recent bundles to keep (default: 1)
        """
        try:
            logger.info(f"Cleaning up old basic bundles for user: {user_id}, keeping latest {keep_latest}")
            
            user_client = self.get_user_client(jwt_token)
            
            # Get all basic bundles for user, ordered by creation date
            all_bundles = user_client.table("analysis_bundles") \
                .select("id, created_at") \
                .eq("user_id", user_id) \
                .eq("type", "basic") \
                .is_("conversation_id", "null") \
                .order("created_at", desc=True) \
                .execute()
            
            if not hasattr(all_bundles, 'data') or not all_bundles.data:
                logger.info(f"No basic bundles found for user: {user_id}")
                return await self.format_response({"deleted_count": 0})
            
            # Skip the N most recent, delete the rest
            bundles_to_delete = all_bundles.data[keep_latest:]
            
            if not bundles_to_delete:
                logger.info(f"No old bundles to delete for user: {user_id}")
                return await self.format_response({"deleted_count": 0})
            
            bundle_ids = [b["id"] for b in bundles_to_delete]
            
            # Delete old bundles
            result = user_client.table("analysis_bundles") \
                .delete() \
                .in_("id", bundle_ids) \
                .execute()
            
            deleted_count = len(bundle_ids)
            logger.info(f"Deleted {deleted_count} old basic bundles for user: {user_id}")
            return await self.format_response({"deleted_count": deleted_count, "deleted_ids": bundle_ids})
            
        except Exception as e:
            logger.error(f"Error deleting old basic bundles: {str(e)}")
            return await self.handle_error("delete_old_basic_bundles", e)