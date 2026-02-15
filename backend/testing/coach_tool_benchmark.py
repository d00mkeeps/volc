#!/usr/bin/env python3
import os
import sys
import asyncio
import time
import json
from pathlib import Path
from dotenv import load_dotenv
from google.oauth2 import service_account

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.llm.unified_coach_service import UnifiedCoachService

async def run_benchmark():
    # Credentials from .env
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    
    if not credentials_json or not project_id:
        print("Missing credentials in .env")
        return

    info = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(info).with_scopes(
        ["https://www.googleapis.com/auth/cloud-platform"]
    )

    # Initialize service
    service = UnifiedCoachService(credentials=credentials, project_id=project_id)
    
    # Use real-world IDs from logs to avoid syntax errors
    conversation_id = "8d25e1c1-3473-4c57-931c-d91760187003"
    user_id = "4141b66c-4497-4582-9eec-fc32a45b6afb"
    
    print(f"--- Initializing Service ---")
    start_init = time.time()
    await service.initialize(conversation_id, user_id)
    print(f"Initialization took: {time.time() - start_init:.2f}s\n")

    test_messages = [
        "Recommend 3 strength exercises for chest.",
        "What are some good mobility exercises for my ankles?",
        "Give me a quick cardio routine with available exercises.",
        "Can you list some strength exercises for back?",
        "I need 3 mobility exercises for shoulders."
    ]

    results = []

    for msg in test_messages:
        print(f"Testing Message: '{msg}'")
        start_time = time.time()
        time_to_first_thought = None
        ttft_content = None
        full_response = ""
        
        async for chunk in service.process_message(msg):
            # Check for thinking block
            if chunk.startswith('{"_type": "thinking"'):
                if time_to_first_thought is None:
                    time_to_first_thought = time.time() - start_time
                    print(f"  [Time to Thought: {time_to_first_thought:.2f}s]")
            else:
                # Regular content chunk
                if ttft_content is None:
                    ttft_content = time.time() - start_time
                    print(f"  [Time to Content: {ttft_content:.2f}s]")
                full_response += chunk
        
        total_time = time.time() - start_time
        print(f"  Total Time: {total_time:.2f}s")
        print(f"  Response Length: {len(full_response)} chars")
        print("-" * 30)
        
        results.append({
            "message": msg,
            "time_to_thought": time_to_first_thought,
            "ttft_content": ttft_content,
            "total_time": total_time,
            "length": len(full_response)
        })

    # Summary
    avg_thought = sum(r['time_to_thought'] for r in results if r['time_to_thought']) / len(results)
    avg_content = sum(r['ttft_content'] for r in results if r['ttft_content']) / len(results)
    avg_total = sum(r['total_time'] for r in results) / len(results)
    
    print(f"\nOVERALL TOOL-USAGE SUMMARY (5 Runs):")
    print(f"Average Time to Thought: {avg_thought:.2f}s")
    print(f"Average Time to Content (Final Answer): {avg_content:.2f}s")
    print(f"Average Total round-trip: {avg_total:.2f}s")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
