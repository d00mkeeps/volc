"""
Changelog Generator

Generates issue-focused changelog with full conversations for prompt iteration reports.
"""
from typing import List, Dict, Any

from .formatter import format_transcript


# Persona display info
PERSONA_INFO = {
    "margaret": {"age": 65, "type": "Old Beginner", "injury": "No Injury"},
    "jake": {"age": 32, "type": "Young Beginner", "injury": "No Injury"},
    "sarah": {"age": 28, "type": "Young Experienced", "injury": "Shoulder Surgery"},
    "brian": {"age": 58, "type": "Old Experienced", "injury": "Back/Knee History"},
}


def generate_changelog(results: List[Dict[str, Any]], timestamp: str) -> str:
    """
    Generate markdown changelog.
    
    Args:
        results: List of conversation results from run_conversation()
                 Each result: {
                     'persona': str,
                     'status': 'approved' | 'quit' | 'max_messages' | 'error',
                     'message_count': int,
                     'transcript': List[{'role': str, 'content': str}]
                 }
        timestamp: Run timestamp (e.g., "2026-01-19_10-30-00")
    
    Returns:
        Markdown string for the changelog
    """
    lines = []
    
    # Header
    lines.append(f"# Prompt Iteration Report - {timestamp}")
    lines.append("")
    
    # Summary stats
    total_personas = len(results)
    approved = sum(1 for r in results if r.get("status") == "approved")
    quit_count = sum(1 for r in results if r.get("status") == "quit")
    max_msg = sum(1 for r in results if r.get("status") == "max_messages")
    error_count = sum(1 for r in results if r.get("status") == "error")
    
    # Calculate average messages to approval
    approved_message_counts = [
        r.get("message_count", 0) 
        for r in results 
        if r.get("status") == "approved"
    ]
    avg_to_approval = (
        sum(approved_message_counts) / len(approved_message_counts) 
        if approved_message_counts else 0
    )
    
    lines.append("## Summary")
    lines.append(f"- Personas run: {total_personas}/4")
    lines.append(f"- Approved: {approved}")
    lines.append(f"- Quit: {quit_count}")
    lines.append(f"- Max messages: {max_msg}")
    if error_count > 0:
        lines.append(f"- Errors: {error_count}")
    lines.append(f"- Average messages to approval: {avg_to_approval:.0f}")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Individual persona sections
    for idx, result in enumerate(results, start=1):
        persona_name = result.get("persona", "unknown")
        status = result.get("status", "unknown")
        message_count = result.get("message_count", 0)
        transcript = result.get("transcript", [])
        
        # Get persona display info
        info = PERSONA_INFO.get(persona_name.lower(), {
            "age": "?", 
            "type": "Unknown", 
            "injury": "Unknown"
        })
        
        # Section header
        display_name = persona_name.capitalize()
        lines.append(
            f"## Persona {idx} - {display_name} "
            f"({info['age']}, {info['type']}, {info['injury']})"
        )
        lines.append(f"**Status:** {status} ({message_count} messages)")
        lines.append("")
        
        # Issues section (placeholder - would need NLP analysis in future)
        lines.append("### Issues")
        if status == "quit":
            lines.append("- [TODO] Review conversation for potential issues")
        elif status == "max_messages":
            lines.append("- [TODO] Conversation exceeded max messages without resolution")
        elif status == "error":
            error_msg = result.get("error", "Unknown error")
            lines.append(f"- Error: {error_msg}")
        else:
            lines.append("- None detected - approved successfully")
        lines.append("")
        
        # Full conversation
        lines.append("### Full Conversation")
        lines.append("```")
        lines.append(format_transcript(transcript, persona_name))
        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append("")
    
    # Changes Needed section (placeholder)
    lines.append("## Changes Needed")
    lines.append("1. [TODO] Analyze conversations above for prompt improvements")
    lines.append("")
    
    return "\n".join(lines)
