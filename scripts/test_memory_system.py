import asyncio
import websockets
import json
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.db.user_profile_service import UserProfileService

async def test_memory_system():
    user_id = "test_user_memory_v1"
    conversation_id = f"test_conv_{int(datetime.now().timestamp())}"
    
    print(f"--- Starting Memory System Test ---")
    print(f"User ID: {user_id}")
    print(f"Conversation ID: {conversation_id}")
    
    # 1. Create/Reset User Profile
    profile_service = UserProfileService()
    # Ensure user exists (mocking or using existing if possible, but for this test we might need a real user)
    # For simplicity, we'll assume the user exists or we can use a known ID if we have one.
    # Let's try to use a real user ID from the system if possible, or just use the one we have.
    # If we can't create a user easily, we might need to skip this or use a valid one.
    # I'll use a placeholder and hope the backend allows it or I'll need to fetch one.
    
    # Actually, let's just check if we can get a profile first.
    # If not, we might need to insert one directly or use a known one.
    # For now, let's assume we can use the one from the previous context or a new one.
    
    # 2. Connect to WebSocket
    uri = f"ws://127.0.0.1:8000/api/llm/workout-analysis/{conversation_id}/{user_id}"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            # Handle connection status
            msg = await websocket.recv()
            print(f"Received: {msg}")
            
            # Send a message with some facts
            user_message = {
                "type": "message",
                "message": "I have a lower back injury from deadlifting last year. I want to focus on hypertrophy for my legs but avoid heavy spinal loading."
            }
            await websocket.send(json.dumps(user_message))
            print(f"Sent: {user_message['message']}")
            
            # Receive response (stream)
            print("Receiving response...")
            while True:
                response = await websocket.recv()
                data = json.loads(response)
                if data.get("type") == "complete":
                    print("Response complete.")
                    break
                elif data.get("type") == "content":
                    print(".", end="", flush=True)
            print()
            
            # Disconnect
            print("Disconnecting...")
            # Context manager exit will close the socket
            
    except Exception as e:
        print(f"WebSocket Error: {e}")
        # If connection fails, it might be auth or server not running.
        # We'll assume server is running on 8000.
        return

    # 3. Wait for Background Task
    print("Waiting for background memory extraction (10 seconds)...")
    await asyncio.sleep(10)
    
    # 4. Verify Memory
    print("Verifying memory update...")
    result = await profile_service.get_user_profile_admin(user_id)
    
    if result.get("success"):
        profile = result["data"]
        memory = profile.get("ai_memory")
        print(f"AI Memory: {json.dumps(memory, indent=2)}")
        
        if memory and "lower back injury" in str(memory).lower():
            print("✅ SUCCESS: Memory successfully extracted and stored!")
        else:
            print("❌ FAILURE: Memory not found or incomplete.")
    else:
        print(f"❌ FAILURE: Could not fetch profile: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_memory_system())
