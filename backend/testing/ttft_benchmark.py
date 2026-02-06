#!/usr/bin/env python3
"""
TTFT (Time To First Token) Benchmark Script
Tests Gemini 2.5 Pro and Flash models with thinking enabled/disabled
Uses existing BaseLLMService infrastructure
"""

import os
import sys
import time
import json
import asyncio
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from google.oauth2 import service_account

# Load environment variables
load_dotenv()

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.llm.base import BaseLLMService

# Configuration
TEST_PROMPT = "Explain the concept of recursion in programming in one paragraph."
NUM_RUNS = 5  # Number of runs per configuration

# Model configurations to test
CONFIGURATIONS = [
    {
        "name": "Gemini 2.5 Flash - Thinking Enabled",
        "model": "gemini-2.5-flash",
        "thinking_budget": 10000,
        "include_thoughts": True
    },
    {
        "name": "Gemini 2.5 Flash - Thinking Disabled",
        "model": "gemini-2.5-flash",
        "thinking_budget": None,
        "include_thoughts": False
    },
    {
        "name": "Gemini 2.5 Pro - Thinking Enabled",
        "model": "gemini-2.5-pro",
        "thinking_budget": 10000,
        "include_thoughts": True
    },
    {
        "name": "Gemini 2.5 Pro - Thinking Disabled",
        "model": "gemini-2.5-pro",
        "thinking_budget": None,
        "include_thoughts": False
    },
]


def get_credentials():
    """Initialize Google Cloud credentials from environment"""
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

    if not credentials_json:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set")
    
    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable not set")

    try:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info
        ).with_scopes(["https://www.googleapis.com/auth/cloud-platform"])
        return credentials, project_id
    except json.JSONDecodeError:
        raise ValueError("Invalid Google Cloud credentials JSON")


async def measure_ttft(config: dict, credentials, project_id: str) -> dict:
    """Measure TTFT for a given configuration"""
    print(f"\n{'='*60}")
    print(f"Testing: {config['name']}")
    print(f"{'='*60}")
    
    results = []
    
    for run in range(NUM_RUNS):
        print(f"  Run {run + 1}/{NUM_RUNS}...", end=" ", flush=True)
        
        try:
            # Initialize the service with configuration
            service_kwargs = {
                "model_name": config["model"],
                "temperature": 1.0,
                "streaming": True,
                "credentials": credentials,
                "project_id": project_id,
            }
            
            # Add thinking parameters if enabled
            if config["thinking_budget"] is not None:
                service_kwargs["thinking_budget"] = config["thinking_budget"]
                service_kwargs["include_thoughts"] = config["include_thoughts"]
            
            service = BaseLLMService(**service_kwargs)
            
            # Measure time to first token
            start_time = time.time()
            first_token_time = None
            total_tokens = 0
            
            async for chunk in service.stream(TEST_PROMPT):
                if first_token_time is None:
                    first_token_time = time.time()
                    ttft = (first_token_time - start_time) * 1000  # Convert to ms
                total_tokens += 1
            
            end_time = time.time()
            total_time = (end_time - start_time) * 1000  # Convert to ms
            
            result = {
                "run": run + 1,
                "ttft_ms": round(ttft, 2),
                "total_time_ms": round(total_time, 2),
                "total_tokens": total_tokens,
                "success": True
            }
            
            results.append(result)
            print(f"✓ TTFT: {result['ttft_ms']}ms")
            
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            results.append({
                "run": run + 1,
                "error": str(e),
                "success": False
            })
    
    return results


def calculate_statistics(results: list) -> dict:
    """Calculate statistics from results"""
    successful_runs = [r for r in results if r.get("success", False)]
    
    if not successful_runs:
        return {
            "success_rate": 0,
            "avg_ttft_ms": None,
            "min_ttft_ms": None,
            "max_ttft_ms": None,
            "std_dev_ms": None
        }
    
    ttfts = [r["ttft_ms"] for r in successful_runs]
    avg_ttft = sum(ttfts) / len(ttfts)
    
    # Calculate standard deviation
    variance = sum((x - avg_ttft) ** 2 for x in ttfts) / len(ttfts)
    std_dev = variance ** 0.5
    
    return {
        "success_rate": len(successful_runs) / len(results),
        "avg_ttft_ms": round(avg_ttft, 2),
        "min_ttft_ms": round(min(ttfts), 2),
        "max_ttft_ms": round(max(ttfts), 2),
        "std_dev_ms": round(std_dev, 2)
    }


async def main():
    """Main benchmark execution"""
    print("\n" + "="*60)
    print("TTFT BENCHMARK TEST")
    print("="*60)
    print(f"Test Prompt: {TEST_PROMPT}")
    print(f"Runs per configuration: {NUM_RUNS}")
    
    # Get credentials from config
    credentials, project_id = get_credentials()
    print(f"Project: {project_id}")
    
    all_results = {}
    
    # Run benchmarks for each configuration
    for config in CONFIGURATIONS:
        results = await measure_ttft(config, credentials, project_id)
        stats = calculate_statistics(results)
        
        all_results[config["name"]] = {
            "config": config,
            "runs": results,
            "statistics": stats
        }
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for config_name, data in all_results.items():
        stats = data["statistics"]
        print(f"\n{config_name}:")
        print(f"  Success Rate: {stats['success_rate']*100:.0f}%")
        if stats['avg_ttft_ms'] is not None:
            print(f"  Average TTFT: {stats['avg_ttft_ms']}ms")
            print(f"  Min TTFT: {stats['min_ttft_ms']}ms")
            print(f"  Max TTFT: {stats['max_ttft_ms']}ms")
            print(f"  Std Dev: {stats['std_dev_ms']}ms")
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(__file__).parent / "logs"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"ttft_results_{timestamp}.json"
    
    with open(output_file, "w") as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Results saved to: {output_file}")
    print(f"{'='*60}\n")
    
    return all_results


if __name__ == "__main__":
    asyncio.run(main())
