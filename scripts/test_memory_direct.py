"""
Direct test of memory extraction service without WebSocket.
This bypasses authentication and directly tests the memory extraction logic.
"""
import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_memory_extraction():
    from app.services.memory.memory_service import MemoryExtractionService
    from app.services.db.user_profile_service import UserProfileService
    
    # Use a test user ID
    user_id = "test_user_memory_direct"
    conversation_id = f"test_conv_{int(datetime.now().timestamp())}"
    
    print(f"=== Memory Extraction Direct Test ===")
    print(f"User ID: {user_id}")
    print(f"Conversation ID: {conversation_id}")
    print()
    
    # Initialize services
    memory_service = MemoryExtractionService()
    profile_service = UserProfileService()
    
    # Test 1: Check if service initializes
    print("✓ Memory service initialized")
    
    # Test 2: Try to extract memory (will fail if no conversation exists, but we can see the error)
    print(f"\nAttempting memory extraction...")
    try:
        await memory_service.extract_memory(user_id, conversation_id)
        print("✓ Memory extraction completed (or failed gracefully)")
    except Exception as e:
        print(f"✗ Memory extraction error: {e}")
        print(f"  This is expected if conversation doesn't exist")
    
    # Test 3: Check if we can access user profile
    print(f"\nChecking user profile access...")
    try:
        result = await profile_service.get_user_profile_admin(user_id)
        if result.get("success"):
            profile = result["data"]
            memory = profile.get("ai_memory")
            print(f"✓ User profile accessible")
            print(f"  Current ai_memory: {memory}")
        else:
            print(f"✗ Could not fetch profile: {result.get('error')}")
    except Exception as e:
        print(f"✗ Profile access error: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    asyncio.run(test_memory_extraction())
