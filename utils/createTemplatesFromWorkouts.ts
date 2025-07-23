// @/utils/createTemplatesFromWorkouts.ts
import { CompleteWorkout } from '@/types/workout';

export function createTemplatesFromWorkouts(workouts: CompleteWorkout[]): CompleteWorkout[] {
  // Filter workouts with exercises
  const validWorkouts = workouts.filter(w => w.workout_exercises?.length > 0);
  
  // Remove duplicates - keep newer workout if exercises are identical
  const uniqueWorkouts = validWorkouts.reduce((acc, workout) => {
    // Create signature based on exercise names and order
    const exerciseSignature = workout.workout_exercises
      .map(ex => `${ex.name.trim()}-${ex.order_index}`)
      .sort()
      .join('|');
    
    const existingIndex = acc.findIndex(w => {
      const existingSignature = w.workout_exercises
        .map(ex => `${ex.name.trim()}-${ex.order_index}`)
        .sort()
        .join('|');
      return existingSignature === exerciseSignature;
    });
    
    if (existingIndex === -1) {
      // No duplicate found, add this workout
      acc.push({
        ...workout,
        notes: '', // Clear notes for template use
      });
    } else {
      // Duplicate found, keep the newer one
      const existing = acc[existingIndex];
      if (new Date(workout.created_at) > new Date(existing.created_at)) {
        acc[existingIndex] = {
          ...workout,
          notes: '', // Clear notes for template use
        };
      }
    }
    
    return acc;
  }, [] as CompleteWorkout[]);
  
  // Sort by most recent first
  return uniqueWorkouts.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}