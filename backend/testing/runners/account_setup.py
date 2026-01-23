"""
Account Setup Runner

Uses test_account_service to create accounts for all personas.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional

from ..services.test_account_service import test_account_service
from ..personas.config import PERSONAS, list_personas

logger = logging.getLogger(__name__)


async def setup_persona_account(persona_name: str) -> Dict[str, Any]:
    """
    Create a test account for a single persona.
    
    Args:
        persona_name: Name of the persona (e.g., 'margaret', 'jake')
        
    Returns:
        Result dict with user_id, conversation_id, etc.
    """
    persona = PERSONAS.get(persona_name.lower())
    if not persona:
        return {"success": False, "error": f"Unknown persona: {persona_name}"}
    
    logger.info(f"Setting up account for persona: {persona_name}")
    
    result = await test_account_service.setup_complete_test_account(
        email=persona["email"],
        password=persona["password"],
        profile=persona["profile"],
        ai_memory=persona["ai_memory"]
    )
    
    if result["success"]:
        logger.info(f"Successfully created account for {persona_name}: {result['data']['user_id']}")
    else:
        logger.error(f"Failed to create account for {persona_name}: {result.get('error')}")
    
    return result


async def setup_all_personas() -> Dict[str, Dict[str, Any]]:
    """
    Create test accounts for all defined personas.
    
    Returns:
        Dict mapping persona names to their setup results
    """
    logger.info("Setting up all persona accounts...")
    
    results = {}
    for persona_name in list_personas():
        results[persona_name] = await setup_persona_account(persona_name)
    
    # Summary
    success_count = sum(1 for r in results.values() if r.get("success"))
    logger.info(f"Setup complete: {success_count}/{len(results)} personas created successfully")
    
    return results


async def cleanup_persona_account(user_id: str) -> Dict[str, Any]:
    """
    Delete a persona's test account.
    
    Args:
        user_id: The user's auth UUID
        
    Returns:
        Result dict
    """
    return await test_account_service.delete_test_user(user_id)


async def cleanup_all_personas(user_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Delete all persona test accounts.
    
    Args:
        user_ids: List of user UUIDs to delete
        
    Returns:
        Dict mapping user_ids to their deletion results
    """
    logger.info(f"Cleaning up {len(user_ids)} persona accounts...")
    
    results = {}
    for user_id in user_ids:
        results[user_id] = await cleanup_persona_account(user_id)
    
    return results


# CLI entry point for standalone usage
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(level=logging.INFO)
    
    if len(sys.argv) > 1:
        # Setup specific persona
        persona = sys.argv[1]
        result = asyncio.run(setup_persona_account(persona))
        print(f"Result: {result}")
    else:
        # Setup all personas
        results = asyncio.run(setup_all_personas())
        for name, result in results.items():
            status = "✓" if result.get("success") else "✗"
            print(f"{status} {name}: {result.get('data', {}).get('user_id', result.get('error'))}")
