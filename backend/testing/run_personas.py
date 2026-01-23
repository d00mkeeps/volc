"""
CLI Entry Point for Persona Testing System

Usage:
    python -m testing.run_personas list              # List available personas
    python -m testing.run_personas test margaret     # Test single persona conversation
    python -m testing.run_personas test --all        # Test all personas sequentially
    python -m testing.run_personas review            # Review most recent test run
    python -m testing.run_personas review --run 2026-01-19_11-25-53  # Review specific run
"""
import asyncio
import argparse
import logging
import os
import json
import subprocess
from pathlib import Path

from google.oauth2 import service_account
from dotenv import load_dotenv

from .runners.account_setup import setup_persona_account
from .runners.conversation import run_conversation
from .services.test_account_service import test_account_service
from .personas.config import get_personas, get_persona, list_personas, get_iteration, increment_iteration
from .output.formatter import format_transcript
from .output.changelog import generate_changelog

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress verbose logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("testing.services.test_account_service").setLevel(logging.WARNING)
logging.getLogger("testing.runners.account_setup").setLevel(logging.WARNING)
logging.getLogger("testing.runners.conversation").setLevel(logging.WARNING)
logging.getLogger("testing.personas.simulator").setLevel(logging.WARNING)
logging.getLogger("google_genai").setLevel(logging.WARNING)

# Base directories
LOG_DIR = Path(__file__).parent / "logs"
TESTING_DIR = Path(__file__).parent
BACKEND_DIR = TESTING_DIR.parent


# Review prompt template
REVIEW_PROMPT_TEMPLATE = """# Test Review Agent

## Role
Analyze test conversations, identify issues against success criteria, propose specific fixes.

## Filesystem Access
You have read/write access to the backend directory. Use terminal commands:
- Read: cat, ls, grep
- Write changelog to: {run_dir}/changelog.md

Key files to reference:
- app/core/prompts/unified_coach.py
- app/tools/exercise_tool.py
- app/services/llm/tool_selector.py
- testing/test_config.yaml

## Test Results
{summary}

## Success Criteria (Global)
{config}

## Previous Changelogs
{prev_changelogs}

## Output Format
When user says "generate", write to {run_dir}/changelog.md:

```markdown
# Iteration {iteration} - Changes Needed

## Issues by Persona
### [Name] ([status] - [count] msgs)
- [Line X] Issue description
- Evidence: "quote"
- Root: prompt/tool/data

## Changes to Implement
1. **File:** path/to/file.py
   **Section:** function/tag
   **Change:** Specific fix
   **Why:** Rationale
```

## Instructions
- Read code to understand system
- Ask clarifying questions
- When user says "generate", create changelog.md file and confirm
"""


def cmd_list():
    """List all available personas"""
    iteration = get_iteration()
    personas = get_personas()
    
    print(f"\nAvailable Personas (iteration {iteration}):")
    print("-" * 50)
    for name, config in personas.items():
        desc = config.get("description", "")
        email = config["email"]
        print(f"  {name:12} - {desc}")
        print(f"               Email: {email}")
    print()




def _get_gcp_credentials():
    """
    Get GCP credentials for Gemini API.
    Uses same pattern as app/api/endpoints/llm.py
    """
    # Load .env from backend directory
    backend_dir = Path(__file__).parent.parent
    load_dotenv(backend_dir / ".env")
    
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    
    if not credentials_json:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS_JSON not set. "
            "Add it to backend/.env"
        )
    
    if not project_id:
        raise RuntimeError(
            "GOOGLE_CLOUD_PROJECT not set. "
            "Add it to backend/.env"
        )
    
    try:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info
        ).with_scopes([
            "https://www.googleapis.com/auth/cloud-platform"
        ])
        return credentials, project_id
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")


async def _run_single_persona(
    persona_name: str,
    credentials,
    project_id: str,
    run_dir: Path,
    host: str = "localhost:8000"
):
    """
    Run a single persona conversation with full lifecycle.
    
    1. Setup account (create fresh)
    2. Run conversation
    3. Save transcript
    4. Delete account
    """
    persona_name = persona_name.lower()
    persona_config = get_persona(persona_name)
    
    if not persona_config:
        return {
            "persona": persona_name,
            "status": "error",
            "message_count": 0,
            "transcript": [],
            "error": f"Unknown persona: {persona_name}"
        }
    
    print(f"\n[{persona_name.upper()}] Running...")
    
    # Step 1: Setup account (fresh)
    setup_result = await setup_persona_account(persona_name)
    
    if not setup_result["success"]:
        return {
            "persona": persona_name,
            "status": "error",
            "message_count": 0,
            "transcript": [],
            "error": f"Account setup failed: {setup_result.get('error')}"
        }
    
    user_id = setup_result["data"]["user_id"]
    conversation_id = setup_result["data"]["conversation_id"]
    
    # Step 2: Run conversation
    result = await run_conversation(
        persona_name=persona_name,
        user_id=user_id,
        conversation_id=conversation_id,
        credentials=credentials,
        project_id=project_id,
        host=host
    )
    
    # Step 3: Save transcript
    transcript_file = run_dir / f"{persona_name}.txt"
    formatted = format_transcript(result.get("transcript", []), persona_name)
    transcript_file.write_text(formatted)
    
    # Step 4: Delete account (silently - just log if fails)
    delete_result = await test_account_service.delete_user_by_email(persona_config["email"])
    if not delete_result.get("success", True):
        logger.warning(f"Failed to delete {persona_name}: {delete_result.get('error')}")
    
    # Print summary
    status = result.get("status", "unknown")
    msg_count = result.get("message_count", 0)
    status_icon = "✓" if status == "approved" else "✗" if status in ("quit", "error") else "•"
    print(f"[{persona_name.upper()}] {status_icon} {status} ({msg_count} messages)")
    
    return result


async def cmd_test(persona_name: str = None, all_personas: bool = False, host: str = "localhost:8000"):
    """Test persona conversation(s)"""
    
    # Validate args
    if not persona_name and not all_personas:
        print("Error: Specify a persona name or use --all")
        print(f"Available: {', '.join(list_personas())}")
        return
    
    if persona_name and all_personas:
        print("Error: Cannot specify both persona name and --all")
        return
    
    # Get GCP credentials
    try:
        credentials, project_id = _get_gcp_credentials()
    except Exception as e:
        print(f"Error: Failed to get GCP credentials: {e}")
        return
    
    # Create run directory using current iteration
    iteration = get_iteration()
    run_dir = LOG_DIR / f"run-{iteration}"
    run_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n=== Persona Test: Iteration {iteration} ===")
    print(f"Output: {run_dir}")
    
    if all_personas:
        # Run all personas
        personas_to_run = list_personas()
        results = []
        
        for name in personas_to_run:
            result = await _run_single_persona(
                persona_name=name,
                credentials=credentials,
                project_id=project_id,
                run_dir=run_dir,
                host=host
            )
            results.append(result)
        
        # Increment iteration ONCE at end
        new_iteration = increment_iteration()
        print(f"\n📈 Iteration incremented to {new_iteration}")
        
        # Generate changelog
        changelog = generate_changelog(results, str(iteration))
        summary_file = run_dir / "summary.md"
        summary_file.write_text(changelog)
        
        # Generate latency benchmark
        total_messages = sum(len(r.get("latencies", [])) for r in results)
        all_latencies = [l for r in results for l in r.get("latencies", [])]
        
        if all_latencies:
            avg_latency = sum(l["total"] for l in all_latencies) / len(all_latencies)
            avg_ttft = sum(l["ttft"] for l in all_latencies) / len(all_latencies)
            min_latency = min(l["total"] for l in all_latencies)
            max_latency = max(l["total"] for l in all_latencies)
            
            latency_content = f"""Latency Benchmark Results
========================
Run: {iteration}
Date: {run_dir.name}

Summary
-------
Total messages: {total_messages}
Average response time: {avg_latency:.3f}s
Average time to first token: {avg_ttft:.3f}s
Min response time: {min_latency:.3f}s
Max response time: {max_latency:.3f}s

Per Persona
-----------
"""
            for r in results:
                persona_latencies = r.get("latencies", [])
                if persona_latencies:
                    p_avg = sum(l["total"] for l in persona_latencies) / len(persona_latencies)
                    p_ttft = sum(l["ttft"] for l in persona_latencies) / len(persona_latencies)
                    latency_content += f"{r['persona']}: avg={p_avg:.3f}s ttft={p_ttft:.3f}s ({len(persona_latencies)} msgs)\n"
            
            latency_file = run_dir / "latency_benchmark.txt"
            latency_file.write_text(latency_content)
            print(f"\n📊 Latency: {latency_file}")
        
        # Print final summary
        print("\n" + "=" * 50)
        print("TEST COMPLETE")
        print("=" * 50)
        
        approved = sum(1 for r in results if r.get("status") == "approved")
        quit_count = sum(1 for r in results if r.get("status") == "quit")
        max_msg = sum(1 for r in results if r.get("status") == "max_messages")
        errors = sum(1 for r in results if r.get("status") == "error")
        
        print(f"  Approved:     {approved}/{len(results)}")
        print(f"  Quit:         {quit_count}")
        print(f"  Max messages: {max_msg}")
        if errors > 0:
            print(f"  Errors:       {errors}")
        if all_latencies:
            print(f"  Avg latency:  {avg_latency:.3f}s")
            print(f"  Avg TTFT:     {avg_ttft:.3f}s")
        print(f"\nLogs: {run_dir}")
        print(f"Summary: {summary_file}")

        
    else:
        # Run single persona
        if persona_name.lower() not in [p.lower() for p in list_personas()]:
            print(f"Error: Unknown persona '{persona_name}'")
            print(f"Available: {', '.join(list_personas())}")
            return
        
        result = await _run_single_persona(
            persona_name=persona_name,
            credentials=credentials,
            project_id=project_id,
            run_dir=run_dir,
            host=host
        )
        
        # Increment iteration after single run
        new_iteration = increment_iteration()
        print(f"\n📈 Iteration incremented to {new_iteration}")
        
        # Print result
        print("\n" + "=" * 50)
        status = result.get("status", "unknown")
        msg_count = result.get("message_count", 0)
        
        if status == "approved":
            print(f"✓ APPROVED after {msg_count} messages")
        elif status == "quit":
            print(f"✗ QUIT after {msg_count} messages")
        elif status == "max_messages":
            print(f"• MAX MESSAGES reached ({msg_count})")
        else:
            error = result.get("error", "Unknown")
            print(f"✗ ERROR: {error}")
        
        print(f"\nTranscript: {run_dir / f'{persona_name.lower()}.txt'}")


# ============== Review Command ==============

def _extract_run_number(path: Path) -> int:
    """Extract iteration number from run-X folder name"""
    try:
        return int(path.name.split("-")[1])
    except (IndexError, ValueError):
        return 0

def _get_most_recent_run() -> Path:
    """Get the most recent run directory (highest iteration)"""
    run_dirs = sorted(LOG_DIR.glob("run-*"), key=_extract_run_number, reverse=True)
    if not run_dirs:
        raise FileNotFoundError("No test runs found in logs/")
    return run_dirs[0]


def _get_previous_changelogs(n: int = 3, before: Path = None) -> list:
    """Get last N changelogs before the specified run"""
    changelogs = []
    run_dirs = sorted(LOG_DIR.glob("run-*"), key=_extract_run_number, reverse=True)
    
    # Filter to runs before the current one
    if before:
        current_num = _extract_run_number(before)
        run_dirs = [d for d in run_dirs if _extract_run_number(d) < current_num]
    
    for run_dir in run_dirs[:n]:
        changelog_path = run_dir / "changelog.md"
        if changelog_path.exists():
            changelogs.append(f"## {run_dir.name}\n{changelog_path.read_text()}")
    
    return changelogs


def _load_review_context(run_id: str = None) -> dict:
    """Load context for review"""
    # Get run directory
    if run_id:
        run_dir = LOG_DIR / f"run-{run_id}"
        if not run_dir.exists():
            raise FileNotFoundError(f"Run not found: {run_dir}")
    else:
        run_dir = _get_most_recent_run()
    
    # Load conversations from .txt transcript files
    transcripts = []
    for txt_file in sorted(run_dir.glob("*.txt")):
        persona_name = txt_file.stem.title()
        content = txt_file.read_text().strip()
        if content:
            transcripts.append(f"## {persona_name}\n```\n{content}\n```")
    
    if not transcripts:
        raise FileNotFoundError(f"No transcripts found in: {run_dir}")
    
    summary = "\n\n".join(transcripts)
    
    # Load config
    config_path = TESTING_DIR / "test_config.yaml"
    config = config_path.read_text() if config_path.exists() else "# No config file found"
    
    # Get iteration from run directory name
    iteration = _extract_run_number(run_dir)
    
    # Get previous changelogs
    prev_changelogs = _get_previous_changelogs(n=3, before=run_dir)
    
    return {
        "run_dir": run_dir,
        "summary": summary,
        "config": config,
        "iteration": iteration,
        "prev_changelogs": prev_changelogs
    }


def _generate_review_prompt(context: dict) -> Path:
    """Generate review prompt and save to file"""
    prompt = REVIEW_PROMPT_TEMPLATE.format(
        run_dir=context["run_dir"],
        summary=context["summary"],
        config=context["config"],
        iteration=context["iteration"],
        prev_changelogs="\n\n---\n\n".join(context["prev_changelogs"]) if context["prev_changelogs"] else "No previous changelogs"
    )
    
    prompt_path = context["run_dir"] / "review_prompt.txt"
    prompt_path.write_text(prompt)
    return prompt_path


def cmd_review(run_id: str = None):
    """Review test results and generate changelog"""
    try:
        context = _load_review_context(run_id)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return
    
    # Generate prompt and write to GEMINI.md for CLI to pick up
    prompt = REVIEW_PROMPT_TEMPLATE.format(
        run_dir=context["run_dir"],
        summary=context["summary"],
        config=context["config"],
        iteration=context["iteration"],
        prev_changelogs="\n\n---\n\n".join(context["prev_changelogs"]) if context["prev_changelogs"] else "No previous changelogs"
    )
    
    gemini_md_path = BACKEND_DIR / "GEMINI.md"
    gemini_md_path.write_text(prompt)
    
    print(f"🔍 Reviewing: {context['run_dir'].name}")
    print(f"📄 Instructions written to: {gemini_md_path}")
    print("🤖 Launching Gemini CLI...\n")
    
    # Launch Gemini CLI in interactive mode from backend directory
    try:
        subprocess.run(
            ["gemini"],
            cwd=str(BACKEND_DIR.resolve())
        )
    except FileNotFoundError:
        print("\n⚠️  Gemini CLI not found. Install with: npm install -g @google/gemini-cli")
        print(f"\nManual review: Copy contents of {gemini_md_path} into Gemini")
        return
    
    # Check if changelog was created
    changelog_path = context["run_dir"] / "changelog.md"
    if changelog_path.exists():
        print(f"\n✅ Changelog saved: {changelog_path}")


def main():
    parser = argparse.ArgumentParser(description="Persona Testing System")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # list command
    subparsers.add_parser("list", help="List available personas")
    
    # test command
    test_parser = subparsers.add_parser("test", help="Test persona conversation(s)")
    test_parser.add_argument("persona", nargs="?", help="Specific persona to test (or use --all)")
    test_parser.add_argument("--all", dest="all_personas", action="store_true", help="Test all personas sequentially")
    test_parser.add_argument("--host", default="localhost:8000", help="Backend host:port (default: localhost:8000)")
    
    # review command
    review_parser = subparsers.add_parser("review", help="Review test results with Gemini CLI")
    review_parser.add_argument("--run", dest="run_id", help="Specific run timestamp (default: most recent)")
    
    args = parser.parse_args()
    
    if args.command == "list":
        cmd_list()
    elif args.command == "test":
        asyncio.run(cmd_test(args.persona, args.all_personas, args.host))
    elif args.command == "review":
        cmd_review(args.run_id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

