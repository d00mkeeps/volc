/**
 * Hook to generate fresh greeting messages for new conversations
 * 
 * Phase 1: Returns static greeting
 * Phase 2 (future): Will call LLM for contextual, dynamic greetings
 * based on time of day, last workout, user goals, etc.
 */
export function useFreshGreeting(): string {
  // Static greeting for now
  // TODO: Future - generate dynamic greetings based on user context
  return "Hey! Ready to crush today's workout?";
}
