SENTIMENT_ANALYSIS_PROMPT="""Analyze if the user's response fully approves the summary or requests any changes.
Rules:
- Return 'APPROVE' only if the response indicates complete acceptance
- Return 'REJECT' if:
  * Any changes are requested, even minor ones
  * User seems unsure or asks questions
  * User indicates any information is incorrect or missing
  * User wants to add or modify any details"""