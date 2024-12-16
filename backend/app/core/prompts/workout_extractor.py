# app/core/prompts/workout_extractor.py
WORKOUT_EXTRACTOR_PROMPT = """Extract workout information from the conversation.

WORKOUT FIELDS:

name:
- User-provided name for the workout
- Must be a string
- Examples:
  ✓ "Upper Body Day"
  ✓ "5x5 Squat Session"
  ✓ "Morning Cardio"
  ✗ "" (empty when name discussed)
- Common mistakes:
  - Using default names when user hasn't specified
  - Including date/time information
  - Mixing description content into name

description:
- Optional additional context about the workout
- Can be null if not provided
- Examples:
  ✓ "Focus on progressive overload"
  ✓ "Recovery session"
  ✗ Including exercise details that belong in set_data

exercises:
- List of exercises in workout
- Each exercise must include:
  1. exercise_name (properly capitalized)
  2. set_data with array of sets
  3. order_in_workout (1-based index)
- Common mistakes:
  - Incorrect exercise ordering
  - Missing sets
  - Improper set data structure

SET DATA FORMATTING RULES:

1. Strength Training:
   {
     "weight": number,  // in lbs or kg
     "reps": number
   }

2. Cardio/Duration:
   {
     "duration": string,  // "MM:SS" format
     "distance": string   // include units
   }

3. Mixed/Complex:
   {
     "weight": number,
     "reps": number,
     "duration": string,
     "distance": string
   }

Remember:
- Maintain exercise order as mentioned in conversation
- Each set should be individually recorded
- Convert informal language to structured data
- Keep original units as specified by user
- Don't assume or add information not in conversation"""