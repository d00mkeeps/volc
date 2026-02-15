"""
Test Account Service

Admin database functions for creating and managing test accounts.
Uses service role to bypass RLS.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import uuid4

# Import from main app
from app.core.supabase.client import get_admin_client

logger = logging.getLogger(__name__)


class TestAccountService:
    """Service for creating and seeding test accounts (admin access)"""

    def get_admin_client(self):
        """Get Supabase admin client"""
        return get_admin_client()

    async def create_test_user(
        self, email: str, password: str, first_name: str = "Test"
    ) -> Dict[str, Any]:
        """
        Create a new user via Supabase auth.admin API.

        Returns: {'success': bool, 'data': {'user_id': str}, 'error': str}
        """
        try:
            logger.info(f"Creating test user: {email}")
            admin_client = self.get_admin_client()

            # Create user via auth admin API
            result = admin_client.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,  # Skip email verification
                    "user_metadata": {"first_name": first_name},
                }
            )

            if result.user:
                user_id = result.user.id
                logger.info(f"Created test user: {user_id}")
                return {"success": True, "data": {"user_id": user_id}}
            else:
                return {"success": False, "error": "Failed to create user"}

        except Exception as e:
            logger.error(f"Error creating test user: {str(e)}")
            return {"success": False, "error": str(e)}

    async def create_conversation_for_user(
        self, user_id: str, title: str = "Test Conversation", config_name: str = "coach"
    ) -> Dict[str, Any]:
        """
        Create a conversation for a user (admin access).

        Returns: {'success': bool, 'data': {'conversation_id': str}, 'error': str}
        """
        try:
            logger.info(f"Creating conversation for user: {user_id}")
            admin_client = self.get_admin_client()

            result = (
                admin_client.table("conversations")
                .insert(
                    {
                        "user_id": user_id,
                        "title": title,
                        "config_name": config_name,
                        "status": "active",
                    }
                )
                .execute()
            )

            if result.data:
                conv_id = result.data[0]["id"]
                logger.info(f"Created conversation: {conv_id}")
                return {"success": True, "data": {"conversation_id": conv_id}}
            else:
                return {"success": False, "error": "Failed to create conversation"}

        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            return {"success": False, "error": str(e)}

    async def seed_user_profile(
        self,
        user_id: str,
        first_name: str,
        dob: str,
        is_imperial: bool = False,
        permission_level: str = "tester",
        height_cm: Optional[float] = None,
        weight_kg: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Seed user profile with basic data.

        Returns: {'success': bool, 'data': dict, 'error': str}
        """
        try:
            logger.info(f"Seeding profile for user: {user_id}")
            admin_client = self.get_admin_client()

            profile_data = {
                "auth_user_uuid": user_id,
                "first_name": first_name,
                "dob": dob,
                "is_imperial": is_imperial,
                "permission_level": permission_level,
                "completed_onboarding_tour": False,
            }

            if height_cm is not None:
                profile_data["height_cm"] = height_cm
            if weight_kg is not None:
                profile_data["current_weight_kg"] = weight_kg

            # Upsert profile
            result = (
                admin_client.table("user_profiles")
                .upsert(profile_data, on_conflict="auth_user_uuid")
                .execute()
            )

            if result.data:
                logger.info(f"Seeded profile for user: {user_id}")
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Failed to seed profile"}

        except Exception as e:
            logger.error(f"Error seeding profile: {str(e)}")
            return {"success": False, "error": str(e)}

    async def seed_ai_memory(
        self, user_id: str, notes: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Seed AI memory notes in the user's context bundle.
        Creates bundle if none exists.

        Args:
            user_id: Auth user UUID
            notes: List of dicts with 'text' and 'category' keys

        Returns: {'success': bool, 'data': dict, 'error': str}
        """
        try:
            logger.info(f"Seeding AI memory for user: {user_id}")
            admin_client = self.get_admin_client()

            # Add date to each note
            current_date = datetime.utcnow().isoformat()
            notes_with_dates = [{**note, "date": current_date} for note in notes]

            # Check for existing bundle
            existing = (
                admin_client.table("user_context_bundles")
                .select("id, ai_memory")
                .eq("user_id", user_id)
                .is_("conversation_id", "null")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            if existing.data:
                # Update existing bundle
                bundle = existing.data[0]
                current_memory = bundle.get("ai_memory") or {"notes": []}
                if "notes" not in current_memory:
                    current_memory["notes"] = []
                current_memory["notes"].extend(notes_with_dates)

                result = (
                    admin_client.table("user_context_bundles")
                    .update({"ai_memory": current_memory})
                    .eq("id", bundle["id"])
                    .execute()
                )

                logger.info(f"Updated bundle {bundle['id']} with AI memory")
            else:
                # Create new bundle
                bundle_id = str(uuid4())
                result = (
                    admin_client.table("user_context_bundles")
                    .insert(
                        {
                            "id": bundle_id,
                            "user_id": user_id,
                            "conversation_id": None,
                            "ai_memory": {"notes": notes_with_dates},
                            "status": "complete",
                            "created_at": datetime.utcnow().isoformat(),
                        }
                    )
                    .execute()
                )

                logger.info(f"Created new bundle {bundle_id} with AI memory")

            if result.data:
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Failed to seed AI memory"}

        except Exception as e:
            logger.error(f"Error seeding AI memory: {str(e)}")
            return {"success": False, "error": str(e)}

    async def setup_complete_test_account(
        self,
        email: str,
        password: str,
        profile: Dict[str, Any],
        ai_memory: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        One-shot function to create a fully onboarded test account.

        Args:
            email: User email
            password: User password
            profile: Dict with dob, first_name, is_imperial, permission_level
            ai_memory: Dict with 'notes' list

        Returns: {
            'success': bool,
            'data': {
                'user_id': str,
                'conversation_id': str,
                'profile': dict,
                'ai_memory': dict
            },
            'error': str
        }
        """
        try:
            logger.info(f"Setting up complete test account: {email}")

            # 1. Create user
            user_result = await self.create_test_user(
                email=email,
                password=password,
                first_name=profile.get("first_name", "Test"),
            )
            if not user_result["success"]:
                return user_result

            user_id = user_result["data"]["user_id"]

            # 2. Seed profile
            profile_result = await self.seed_user_profile(
                user_id=user_id,
                first_name=profile.get("first_name", "Test"),
                dob=profile.get("dob", "1990-01-01"),
                is_imperial=profile.get("is_imperial", False),
                permission_level=profile.get("permission_level", "tester"),
            )
            if not profile_result["success"]:
                return profile_result

            # 3. Seed AI memory
            memory_result = await self.seed_ai_memory(
                user_id=user_id, notes=ai_memory.get("notes", [])
            )
            if not memory_result["success"]:
                return memory_result

            # 4. Create conversation
            conv_result = await self.create_conversation_for_user(
                user_id=user_id,
                title=f"{profile.get('first_name', 'Test')}'s Conversation",
                config_name="coach",
            )
            if not conv_result["success"]:
                return conv_result

            logger.info(f"Successfully set up complete test account: {email}")
            return {
                "success": True,
                "data": {
                    "user_id": user_id,
                    "conversation_id": conv_result["data"]["conversation_id"],
                    "profile": profile_result["data"],
                    "ai_memory": memory_result["data"],
                },
            }

        except Exception as e:
            logger.error(f"Error setting up test account: {str(e)}")
            return {"success": False, "error": str(e)}

    async def delete_test_user(self, user_id: str) -> Dict[str, Any]:
        """
        Delete a test user and all associated data (admin access).
        Must delete from tables with NO ACTION FK constraints first.

        Returns: {'success': bool, 'error': str}
        """
        try:
            logger.info(f"Deleting test user: {user_id}")
            admin_client = self.get_admin_client()

            # Delete from tables with NO ACTION FK constraints first
            # Order matters - delete children before parents

            # 1. Delete messages (references conversations) - get conv IDs first
            try:
                convs = (
                    admin_client.table("conversations")
                    .select("id")
                    .eq("user_id", user_id)
                    .execute()
                )
                if convs.data:
                    conv_ids = [c["id"] for c in convs.data]
                    for conv_id in conv_ids:
                        admin_client.table("messages").delete().eq(
                            "conversation_id", conv_id
                        ).execute()
                    logger.debug(f"Deleted messages for {len(conv_ids)} conversations")
            except Exception as e:
                logger.debug(f"Messages delete (may not exist): {e}")

            # 2. Delete conversations
            try:
                admin_client.table("conversations").delete().eq(
                    "user_id", user_id
                ).execute()
                logger.debug(f"Deleted conversations for user {user_id}")
            except Exception as e:
                logger.debug(f"Conversations delete (may not exist): {e}")

            # 3. Delete user_context_bundles
            try:
                admin_client.table("user_context_bundles").delete().eq(
                    "user_id", user_id
                ).execute()
                logger.debug(f"Deleted context bundles for user {user_id}")
            except Exception as e:
                logger.debug(f"Context bundles delete (may not exist): {e}")

            # 4. Delete user_profiles
            try:
                admin_client.table("user_profiles").delete().eq(
                    "auth_user_uuid", user_id
                ).execute()
                logger.debug(f"Deleted profile for user {user_id}")
            except Exception as e:
                logger.debug(f"Profile delete (may not exist): {e}")

            # 5. Delete user_rate_limits
            try:
                admin_client.table("user_rate_limits").delete().eq(
                    "user_id", user_id
                ).execute()
                logger.debug(f"Deleted rate limits for user {user_id}")
            except Exception as e:
                logger.debug(f"Rate limits delete (may not exist): {e}")

            # 6. Delete workouts (and their children: exercises, sets)
            try:
                # Get all workouts for user
                workouts_result = (
                    admin_client.table("workouts")
                    .select("id")
                    .eq("user_id", user_id)
                    .execute()
                )
                
                if workouts_result.data:
                    workout_ids = [w["id"] for w in workouts_result.data]
                    
                    # Get all exercises for these workouts
                    exercises_result = (
                        admin_client.table("workout_exercises")
                        .select("id")
                        .in_("workout_id", workout_ids)
                        .execute()
                    )
                    
                    if exercises_result.data:
                        exercise_ids = [e["id"] for e in exercises_result.data]
                        
                        # A. Delete sets
                        admin_client.table("workout_exercise_sets").delete().in_(
                            "exercise_id", exercise_ids
                        ).execute()
                        logger.debug(f"Deleted sets for {len(exercise_ids)} exercises")
                        
                        # B. Delete exercises
                        admin_client.table("workout_exercises").delete().in_(
                            "id", exercise_ids
                        ).execute()
                        logger.debug(f"Deleted exercises for {len(workout_ids)} workouts")
                    
                    # C. Delete workouts
                    admin_client.table("workouts").delete().in_(
                        "id", workout_ids
                    ).execute()
                    logger.debug(f"Deleted {len(workout_ids)} workouts for user {user_id}")
                
            except Exception as e:
                logger.debug(f"Workouts delete (may not exist): {e}")

            # Now delete the auth user
            admin_client.auth.admin.delete_user(user_id)

            logger.info(f"Deleted test user: {user_id}")
            return {"success": True}

        except Exception as e:
            logger.error(f"Error deleting test user: {str(e)}")
            return {"success": False, "error": str(e)}

    async def find_user_by_email(self, email: str) -> Dict[str, Any]:
        """
        Find a user by email address.

        Returns: {'success': bool, 'data': {'user_id': str}, 'error': str}
        """
        try:
            logger.info(f"Looking up user by email: {email}")
            admin_client = self.get_admin_client()

            # List users and filter by email
            result = admin_client.auth.admin.list_users()

            for user in result:
                if user.email == email:
                    logger.info(f"Found user: {user.id}")
                    return {
                        "success": True,
                        "data": {"user_id": user.id, "email": user.email},
                    }

            return {"success": False, "error": f"User not found: {email}"}

        except Exception as e:
            logger.error(f"Error finding user: {str(e)}")
            return {"success": False, "error": str(e)}

    async def delete_user_by_email(self, email: str) -> Dict[str, Any]:
        """
        Find and delete a user by email address.

        Returns: {'success': bool, 'error': str}
        """
        find_result = await self.find_user_by_email(email)
        if not find_result["success"]:
            # User doesn't exist - that's fine
            return {
                "success": True,
                "message": f"User {email} not found (already deleted?)",
            }

        return await self.delete_test_user(find_result["data"]["user_id"])

    async def reset_persona(
        self, persona_name: str, increment: bool = True
    ) -> Dict[str, Any]:
        """
        Delete existing persona account and create a new one.

        Args:
            persona_name: Name of the persona (e.g., 'margaret')
            increment: If True, increment iteration before creating new account

        Returns: Setup result with new user_id
        """
        from testing.config import setup_scripts

        # Get current persona config (before increment)
        current_persona = setup_scripts.get_persona(persona_name)
        if not current_persona:
            return {"success": False, "error": f"Unknown persona: {persona_name}"}

        # Delete existing account if it exists
        logger.info(
            f"Deleting existing {persona_name} account: {current_persona['email']}"
        )
        await self.delete_user_by_email(current_persona["email"])

        # Increment iteration if requested
        if increment:
            new_iteration = setup_scripts.increment_iteration()
            logger.info(f"Iteration incremented to: {new_iteration}")

        # Get updated persona config with new email
        new_persona = setup_scripts.get_persona(persona_name)

        # Create new account
        logger.info(f"Creating new {persona_name} account: {new_persona['email']}")
        return await self.setup_complete_test_account(
            email=new_persona["email"],
            password=new_persona["password"],
            profile=new_persona["profile"],
            ai_memory=new_persona["ai_memory"],
        )

    async def reset_all_personas(self) -> Dict[str, Dict[str, Any]]:
        """
        Delete and recreate all persona accounts with incremented iteration.

        Returns: Dict mapping persona names to their reset results
        """
        from testing.config import setup_scripts

        # Increment iteration once for all personas
        new_iteration = setup_scripts.increment_iteration()
        logger.info(f"Iteration incremented to: {new_iteration}")

        results = {}
        for name in setup_scripts.list_personas():
            # Don't increment again - already done above
            results[name] = await self.reset_persona(name, increment=False)

        return results


# Singleton instance
test_account_service = TestAccountService()
