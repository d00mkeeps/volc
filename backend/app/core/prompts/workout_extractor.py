WORKOUT_EXTRACTOR_PROMPT = """Extract workout information from the conversation.

WORKOUT FIELDS:
name: string (workout name given by user or empty string)
description: string[] | null (optional context about workout)

exercises: array of:
  exercise_name: string (properly capitalized)
  weight_unit: "kg" | "lbs" | null 
  distance_unit: "km" | "m" | "mi" | null
  order_in_workout: number (1-based index)
  sets: array of:
    weight: number | null
    reps: number | null
    duration: "MM:SS" | null
    distance: number | null

EXTRACTION RULES:
- Extract only explicitly stated information
- Maintain exercise order from conversation
- Never assume units; only include unit fields when explicitly specified
- Each set should be individually recorded with its metrics
- Keep original weight/distance values as specified by user
- Convert description into key points array:
  - Extract main points about workout quality, improvements, successes
  - Keep points concise and actionable 
  - Remove redundant information
  - Convert narrative text into discrete statements

Example correct structure:
{
  "name": "Upper Body Day",
  "exercises": [{
    "exercise_name": "Bench Press",
    "weight_unit": "lbs",
    "sets": [
      {"weight": 225, "reps": 8},
      {"weight": 225, "reps": 8}
    ],
    "order_in_workout": 1
  }]
}"""