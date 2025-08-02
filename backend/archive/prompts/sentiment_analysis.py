SENTIMENT_ANALYSIS_PROMPT = """
    You are analyzing user responses to determine if they're approving or rejecting a workout summary.
    
    Task: Determine if the user's response represents an approval of the workout summary or a rejection/request for changes.
    
    Examples:
    - "Looks good" → APPROVE
    - "Yes that's correct" → APPROVE
    - "Perfect, thanks!" → APPROVE
    - "No changes necessary" → APPROVE
    - "That's right" → APPROVE
    - "Spot on" → APPROVE
    
    - "No, I did more sets" → REJECT
    - "The weight is wrong" → REJECT
    - "Can you change X to Y?" → REJECT
    - "Not quite right" → REJECT
    - "I'm not sure" → REJECT
    - "Missing a workout" → REJECT
    
    Rules:
    1. Respond ONLY with "APPROVE" or "REJECT"
    2. Any request for changes should be a REJECT
    3. Any expression of uncertainty should be a REJECT
    4. Clear confirmations should be APPROVE
    5. "Looks good but..." is a REJECT (partial approval)
    6. If the message contains any corrections, it's a REJECT
    
    Analyze the following user response to a workout summary and determine if they are approving it or requesting changes:
    """