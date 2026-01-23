"""
Persona Configuration

Defines test personas for AI coach simulation testing.
Email format: {name}-{n}@gmail.com
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

# Config file for persisting iteration number
CONFIG_DIR = Path(__file__).parent.parent
ITERATION_FILE = CONFIG_DIR / "iteration.json"

# Default password for all test accounts
DEFAULT_PASSWORD = "testpassword123"


def get_iteration() -> int:
    """Get current iteration number from persistent storage"""
    if ITERATION_FILE.exists():
        with open(ITERATION_FILE, "r") as f:
            data = json.load(f)
            return data.get("iteration", 3)
    return 3  # Default starting value


def set_iteration(n: int) -> None:
    """Set iteration number in persistent storage"""
    with open(ITERATION_FILE, "w") as f:
        json.dump({"iteration": n}, f)


def increment_iteration() -> int:
    """Increment and return new iteration number"""
    current = get_iteration()
    new_val = current + 1
    set_iteration(new_val)
    return new_val


def get_current_date() -> str:
    """Get current date in ISO format"""
    return datetime.utcnow().isoformat()


def _build_personas(iteration: int) -> Dict[str, Any]:
    """Build personas dict with specific iteration number"""
    return {
        "margaret": {
            "email": f"margaret-{iteration}@gmail.com",
            "password": DEFAULT_PASSWORD,
            "profile": {
                "dob": "1959-01-19",
                "first_name": "Margaret",
                "is_imperial": False,
                "permission_level": "tester"
            },
            "ai_memory": {
                "notes": [
                    {"text": "User is a beginner, with less than 2 years training experience.", "category": "profile"},
                    {"text": "Prefers to train at home.", "category": "preference"}
                ]
            },
            "description": "65yo, Older Beginner, trains at home"
        },
        "jake": {
            "email": f"jake-{iteration}@gmail.com",
            "password": DEFAULT_PASSWORD,
            "profile": {
                "dob": "2002-03-22",
                "first_name": "Jake",
                "is_imperial": False,
                "permission_level": "tester"
            },
            "ai_memory": {
                "notes": [
                    {"text": "User is a beginner, with less than 2 years training experience.", "category": "profile"},
                    {"text": "Prefers to train at a commercial gym.", "category": "preference"}
                ]
            },
            "description": "22yo, Young Beginner, commercial gym"
        },
        "sarah": {
            "email": f"sarah-{iteration}@gmail.com",
            "password": DEFAULT_PASSWORD,
            "profile": {
                "dob": "1996-11-08",
                "first_name": "Sarah",
                "is_imperial": False,
                "permission_level": "tester"
            },
            "ai_memory": {
                "notes": [
                    {"text": "User is intermediate, with 2-5 years training experience.", "category": "profile"},
                    {"text": "Prefers to train at a commercial gym.", "category": "preference"}
                ]
            },
            "description": "28yo, Young Intermediate, commercial gym"
        },
        "brian": {
            "email": f"brian-{iteration}@gmail.com",
            "password": DEFAULT_PASSWORD,
            "profile": {
                "dob": "1966-07-30",
                "first_name": "Brian",
                "is_imperial": False,
                "permission_level": "tester"
            },
            "ai_memory": {
                "notes": [
                    {"text": "User is advanced/elite, with 10+ years training experience.", "category": "profile"},
                    {"text": "Prefers to train at a gym.", "category": "preference"}
                ]
            },
            "description": "58yo, Older Elite, gym"
        }
    }


def get_personas() -> Dict[str, Any]:
    """Get personas dict with current iteration"""
    return _build_personas(get_iteration())


def get_persona(name: str) -> Optional[Dict[str, Any]]:
    """Get persona config by name (case-insensitive)"""
    return get_personas().get(name.lower())


def list_personas() -> List[str]:
    """List all available persona names"""
    return ["margaret", "jake", "sarah", "brian"]


# For backwards compatibility - dynamically built
PERSONAS = get_personas()
