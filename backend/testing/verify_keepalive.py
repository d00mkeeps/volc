#!/usr/bin/env python3
import asyncio
import json
import websockets
from datetime import datetime

# Configuration
CONVERSATION_ID = "verification-session"
USER_ID = "test-user"
WS_URL = f"ws://localhost:8000/api/llm/coach/{CONVERSATION_ID}/{USER_ID}"

async def run_verification():
    print(f"📡 Connecting to {WS_URL}...")
    try:
        async with websockets.connect(WS_URL) as websocket:
            # 1. Connection Status
            msg = await websocket.recv()
            print(f"📥 Received: {msg}")
            
            # 2. Send Message
            test_msg = "Please write a very long workout plan and take your time to think."
            print(f"💬 Sending: {test_msg}")
            await websocket.send(json.dumps({"message": test_msg}))
            
            # 3. Monitor for responses and keep-alive
            print("⏳ Monitoring for responses (specifically keep-alives)...")
            start_time = datetime.now()
            
            while True:
                try:
                    # Use a shorter timeout to detect if we are missing messages
                    msg = await asyncio.wait_for(websocket.recv(), timeout=130.0)
                    data = json.loads(msg)
                    elapsed = (datetime.now() - start_time).total_seconds()
                    
                    if data.get("type") == "thinking":
                        content = data.get("data", "")
                        if content == " ":
                            print(f"💓 [{elapsed:.1f}s] Received keep-alive (thinking with space)")
                        else:
                            print(f"💭 [{elapsed:.1f}s] Received thinking: {content[:50]}...")
                    
                    elif data.get("type") == "content":
                        print(f"📝 [{elapsed:.1f}s] Received content: {data.get('data', '')[:50]}...")
                    
                    elif data.get("type") == "complete":
                        print(f"🏁 [{elapsed:.1f}s] Response complete!")
                        break
                        
                    elif data.get("type") == "error":
                        print(f"❌ [{elapsed:.1f}s] Error: {data.get('data')}")
                        break
                        
                except asyncio.TimeoutError:
                    print(f"⏰ [{datetime.now()}] Timeout! No message received for 130 seconds.")
                    break
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_verification())
