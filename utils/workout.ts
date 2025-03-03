// utils/workout.ts
import { WorkoutWithConversation, CompleteWorkout, SetInput } from '@/types/workout';

/**
 * Converts a WorkoutWithConversation to a CompleteWorkout format
 * for consistent display and processing across components
 *
 * @param workout The workout in conversation format
 * @returns The workout in complete format
 */
export const convertToCompleteWorkout = (workout: WorkoutWithConversation): CompleteWorkout => {
  if (!workout) {
    // Return a minimal valid CompleteWorkout instead of null
    return {
      id: '',
      user_id: '',
      name: 'Unavailable Workout',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workout_exercises: []
    } as CompleteWorkout;
  }
  
  return {
    id: workout.id,
    user_id: workout.id?.split('-')[0] || `user-${Date.now()}`,
    name: workout.name || 'Untitled Workout',
    // Handle cases where description is an array
    notes: Array.isArray(workout.description) 
      ? workout.description.join('\n') 
      : (workout.description || ''),
    created_at: workout.created_at || new Date().toISOString(),
    updated_at: workout.created_at || new Date().toISOString(),
    workout_exercises: (workout.exercises || []).map(ex => {
      // Type assertion for the workout exercise fields
      const exercise = ex as any;
      const exerciseId = exercise.id || `ex-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Handle both array format and {sets: [...]} format for set_data
      const setsArray = exercise.set_data?.sets 
        ? exercise.set_data.sets  // Handle {sets: [...]} format
        : (Array.isArray(exercise.set_data) ? exercise.set_data : []); // Handle direct array format
      
      return {
        id: exerciseId,
        workout_id: workout.id,
        name: exercise.exercise_name || 'Unnamed Exercise',
        order_index: exercise.order_in_workout || 0,
        created_at: workout.created_at || new Date().toISOString(),
        updated_at: workout.created_at || new Date().toISOString(),
        weight_unit: exercise.weight_unit || 'kg',
        distance_unit: exercise.distance_unit || 'm',
        workout_exercise_sets: setsArray.map((set: SetInput, idx: number) => ({
          id: `set-${exerciseId}-${idx}`,
          exercise_id: exerciseId,
          set_number: idx + 1,
          weight: set.weight || null,
          reps: set.reps || null,
          distance: set.distance || null,
          // Convert duration to string as required by the WorkoutSet type
          duration: set.duration ? String(set.duration) : null,
          rpe: set.rpe || null,
          created_at: workout.created_at || new Date().toISOString(),
          updated_at: workout.created_at || new Date().toISOString()
        }))
      };
    })
  };
};