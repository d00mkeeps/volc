"""
Output Formatter

Converts transcript to standard format for manual review.
"""
from typing import List, Dict


def format_transcript(transcript: List[Dict[str, str]], persona_name: str) -> str:
    """
    Convert transcript to standard format.
    
    Args:
        transcript: [{'role': 'assistant'|'user', 'content': str}, ...]
        persona_name: 'margaret', 'jake', 'sarah', 'brian'
    
    Returns:
        Standard format string:
        ASSISTANT: [message]
        MARGARET: [message]
        ASSISTANT: [message]
        MARGARET: [message]
    """
    lines = []
    persona_label = persona_name.upper()
    
    for message in transcript:
        role = message.get("role", "")
        content = message.get("content", "")
        
        if role == "assistant":
            label = "ASSISTANT"
        elif role == "user":
            label = persona_label
        else:
            # Handle unexpected roles gracefully
            label = role.upper()
        
        lines.append(f"{label}: {content}")
    
    return "\n".join(lines)
