"""
Seed Conversations for Compaction Testing

Pre-generated conversations used to seed the testing framework
for validating mid-conversation memory compaction.

Marker facts to verify in extracted memory:
- Competition in March (goal)
- Disc herniation L4-L5 (injury)
- Prefers 4-day upper/lower splits (preference)
- Trains at 5am before work (schedule)
- Avoiding conventional deadlifts (injury-related)
- Uses belt for heavy squats (equipment preference)
"""

from typing import List, Dict

# Brian: 30 messages covering workout planning with injury context
BRIAN_CONVERSATION: List[Dict[str, str]] = [
    # Message 1-2: Opening
    {"role": "assistant", "content": "Evening, Brian. Want to plan tomorrow's session or review something?"},
    {"role": "user", "content": "plan tomorrow"},
    
    # Message 3-4: Initial direction
    {"role": "assistant", "content": "What are we hitting tomorrow?"},
    {"role": "user", "content": "lower body day"},
    
    # Message 5-6: Injury check (MARKER: L4-L5 disc)
    {"role": "assistant", "content": "Got it. Any injuries or restrictions I should know about?"},
    {"role": "user", "content": "disc herniation L4-L5 from years ago. mostly managed now"},
    
    # Message 7-8: Probing injury
    {"role": "assistant", "content": "Thanks for sharing. What movements aggravate it?"},
    {"role": "user", "content": "heavy loaded flexion. conventional deadlifts are out"},
    
    # Message 9-10: Current approach (MARKER: avoiding conventional)
    {"role": "assistant", "content": "Makes sense. What have you been doing for hip hinge patterns?"},
    {"role": "user", "content": "trap bar and RDLs mostly. rack pulls sometimes"},
    
    # Message 11-12: Schedule context (MARKER: 5am training)
    {"role": "assistant", "content": "Solid choices. What time do you usually train?"},
    {"role": "user", "content": "5am before work. only slot that works"},
    
    # Message 13-14: More schedule
    {"role": "assistant", "content": "Early bird. How's energy and warmup at that hour?"},
    {"role": "user", "content": "takes longer to warm up. need extra mobility work"},
    
    # Message 15-16: Training split (MARKER: 4-day upper/lower)
    {"role": "assistant", "content": "Got it. What's your current weekly split look like?"},
    {"role": "user", "content": "4 day upper lower. been running it for years"},
    
    # Message 17-18: Goals (MARKER: competition in March)
    {"role": "assistant", "content": "Classic setup. Any specific goals right now?"},
    {"role": "user", "content": "masters competition in March. need to peak squat"},
    
    # Message 19-20: Equipment (MARKER: belt for heavy squats)
    {"role": "assistant", "content": "Exciting! What equipment do you use for heavy squats?"},
    {"role": "user", "content": "always belt up for working sets. helps brace with the back"},
    
    # Message 21-22: Knee context
    {"role": "assistant", "content": "Smart. Any knee considerations?"},
    {"role": "user", "content": "bit of wear and tear. wraps help on heavy days"},
    
    # Message 23-24: Working on specifics
    {"role": "assistant", "content": "Understood. For tomorrow, squat focus or accessories?"},
    {"role": "user", "content": "squat and some leg press. keep it simple"},
    
    # Message 25-26: Volume discussion
    {"role": "assistant", "content": "How many working sets do you typically do for squat?"},
    {"role": "user", "content": "4-5 sets. RPE 7-8 range this far out"},
    
    # Message 27-28: Weight range
    {"role": "assistant", "content": "Makes sense for this phase. What's your target weight for tomorrow?"},
    {"role": "user", "content": "probably around 140kg for triples"},
    
    # Message 29-30: Pausing before generation
    {"role": "assistant", "content": "Perfect. Want me to put together the session?"},
    {"role": "user", "content": "actually wait, one question about warmup"},

    # Message 31-32: Warmup details
    {"role": "assistant", "content": "Sure, what's on your mind regarding the warmup?"},
    {"role": "user", "content": "should I do foam rolling first?"},

    # Message 33-34: Specific advice (back safety)
    {"role": "assistant", "content": "For your back history, some targeted glute rolling can help. Just avoid rolling the lower back directly. Want me to add that?"},
    {"role": "user", "content": "yeah add that in"},

    # Message 35-36: Verification ready
    {"role": "assistant", "content": "Done. Anything else for the knee sleeves? When do you put them on?"},
    {"role": "user", "content": "usually after warmups before the first working set"},
]

# Expected memory extractions from messages 1-20:
BRIAN_EXPECTED_MARKERS = [
    "disc herniation L4-L5",
    "conventional deadlifts",
    "5am",
    "4 day upper lower",
    "competition in March",
    "belt",
]


def get_seed_conversation(persona: str, count: int = 30) -> List[Dict[str, str]]:
    """
    Get seed conversation for a persona.
    
    Args:
        persona: 'brian' (more to be added)
        count: Number of messages to return
        
    Returns:
        List of message dicts with 'role' and 'content'
    """
    conversations = {
        "brian": BRIAN_CONVERSATION,
    }
    
    conv = conversations.get(persona.lower())
    if not conv:
        raise ValueError(f"No seed conversation for persona: {persona}")
    
    return conv[:count]


def get_expected_markers(persona: str) -> List[str]:
    """Get expected marker facts for validation."""
    markers = {
        "brian": BRIAN_EXPECTED_MARKERS,
    }
    return markers.get(persona.lower(), [])
