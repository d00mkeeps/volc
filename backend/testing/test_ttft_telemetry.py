#!/usr/bin/env python3
"""
Test script to verify TTFT telemetry is working with thinking mode enabled.
Sends a test message via WebSocket and checks the telemetry trace.
"""

import asyncio
import json
import websockets
import requests
from datetime import datetime

import argparse

# Configuration
WS_URL = "ws://localhost:8000/api/llm/coach/test-ttft-conversation/test-user"
TRACE_URL = "http://localhost:8000/debug/trace/test-ttft-conversation"
DEFAULT_MESSAGE = "What exercises should I do for chest?"


async def test_ttft_telemetry(test_message: str):
    """Test TTFT telemetry by sending a message and checking the trace."""
    
    print("\n" + "="*60)
    print("TTFT TELEMETRY VERIFICATION TEST")
    print("="*60)
    print(f"Test Message: {test_message}")
    print(f"WebSocket URL: {WS_URL}")
    print(f"Trace URL: {TRACE_URL}\n")
    
    try:
        # Connect to WebSocket
        print("📡 Connecting to WebSocket...")
        async with websockets.connect(WS_URL) as websocket:
            
            # Wait for connection confirmation
            connection_msg = await websocket.recv()
            connection_data = json.loads(connection_msg)
            print(f"✅ Connected: {connection_data}")
            
            # Send test message
            print(f"\n💬 Sending test message: '{test_message}'")
            await websocket.send(json.dumps({
                "message": test_message
            }))
            
            # Collect response
            print("\n📥 Receiving response chunks:")
            response_chunks = []
            first_chunk_time = None
            start_time = datetime.now()
            
            while True:
                try:
                    msg = await asyncio.wait_for(websocket.recv(), timeout=60.0)  # Long timeout for tool calling
                    data = json.loads(msg)
                    
                    if data.get("type") == "content":
                        if first_chunk_time is None:
                            first_chunk_time = datetime.now()
                            client_ttft = (first_chunk_time - start_time).total_seconds() * 1000
                            print(f"  ⏱️  Client-measured TTFT: {client_ttft:.2f}ms")
                        
                        chunk = data.get("data", "")
                        response_chunks.append(chunk)
                        print(f"  📝 Chunk: {chunk[:50]}...")
                    
                    elif data.get("type") == "complete":
                        print(f"\n✅ Response complete!")
                        break
                    
                    elif data.get("type") == "error":
                        print(f"\n❌ Error: {data.get('data')}")
                        return
                        
                except asyncio.TimeoutError:
                    print("\n⏰ Timeout waiting for response")
                    break
            
            full_response = "".join(response_chunks)
            print(f"\n📄 Full response ({len(full_response)} chars):")
            print(f"  {full_response[:200]}...")
        
        # Wait a moment for telemetry to be committed
        await asyncio.sleep(1)
        
        # Check telemetry trace
        print(f"\n🔍 Checking telemetry trace...")
        response = requests.get(TRACE_URL)
        
        if response.status_code == 200:
            trace = response.json()
            print(f"✅ Trace retrieved: {len(trace)} turns")
            
            # Find the turn with our response (likely the last one)
            turn = trace[-1]
            print(f"\n📊 Latest Turn Metrics:")
            print(f"  TTFT: {turn.get('ttft_ms')}ms")
            print(f"  Total Time: {turn.get('total_time_ms')}ms")
            print(f"  Final Answer Length: {len(turn.get('final_answer', ''))}")
            
            # Verify TTFT is captured
            if turn.get('ttft_ms') is not None:
                print(f"\n✅ TTFT TELEMETRY WORKING!")
            else:
                print(f"\n❌ TTFT not captured in telemetry!")
        else:
            print(f"❌ Failed to retrieve trace: {response.status_code}")
    
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", type=str, default=DEFAULT_MESSAGE)
    args = parser.parse_args()
    
    asyncio.run(test_ttft_telemetry(args.message))
