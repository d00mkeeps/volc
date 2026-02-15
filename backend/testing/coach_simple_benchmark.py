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
        "Hello, how can you help me today?",
        "What are your core features?",
        "Tell me a joke about lifting weights.",
        "How do I use this app?",
        "Give me a motivational quote."
    ]

    results = []

    for msg in test_messages:
        print(f"Testing Message: '{msg}'")
        start_time = time.time()
        ttft = None
        full_response = ""
        
        async for chunk in service.process_message(msg):
            if ttft is None and not chunk.startswith('{"_type": "thinking"'):
                ttft = time.time() - start_time
            if not chunk.startswith('{"_type": "thinking"'):
                full_response += chunk
        
        total_time = time.time() - start_time
        print(f"  TTFT: {ttft:.2f}s")
        print(f"  Total: {total_time:.2f}s")
        print(f"  Response Length: {len(full_response)} chars")
        print("-" * 30)
        
        results.append({
            "message": msg,
            "ttft": ttft,
            "total_time": total_time,
            "length": len(full_response)
        })

    # Summary
    avg_ttft = sum(r['ttft'] for r in results) / len(results)
    avg_total = sum(r['total_time'] for r in results) / len(results)
    
    print(f"\nOVERALL SUMMARY:")
    print(f"Average TTFT: {avg_ttft:.2f}s")
    print(f"Average Total: {avg_total:.2f}s")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
