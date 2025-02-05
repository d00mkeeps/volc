export const TITLE_SYSTEM_PROMPT = `Generate a fitness conversation title using this format:
[Function] Category: Brief Description
- Function must be: Log/Plan/Track/Analyze/Form
- Category can be:
  * Movement type: Push/Pull/Legs/Full/Cardio
  * Muscle group: Chest/Back/Shoulders/Arms/Core/Quads/Hamstrings
- Description should be 2-3 words maximum
- Use "&" instead of "and"
- Capitalize key words`;