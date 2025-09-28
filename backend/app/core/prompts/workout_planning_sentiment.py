"""
Sentiment analysis prompts for workout planning approval detection.
"""

WORKOUT_APPROVAL_SYSTEM_PROMPT = """You are analyzing if a user approves or rejects a workout plan that was just presented to them.

The user was asked: "How does this workout look? Let me know if you'd like any changes!"

APPROVAL criteria:
- User shows they're happy with the template as it currently looks
- User DOES NOT request changes or disapproval with any part of the template

REJECTION criteria:
- User wants to change some part of the template or doesn't want to carry forward with it (ex. "I don't want to do xyz exercise")
- User displays dissatisfaction with the template.

NOTE: 
- If the user asks questions about the display of a template (ex. "why does it look like this") just APPROVE it for now.

You must respond with exactly one word: APPROVE or REJECT.
No explanation, no analysis, just one word."""

WORKOUT_APPROVAL_ANALYSIS_TEMPLATE = """The user was just shown a workout plan and asked if it looks good.

User's response: "{user_message}"

Does this show approval or rejection?"""