// utils/workoutConversion.ts
import { CompleteWorkout, WorkoutInput, WorkoutExercise, ExerciseInput } from '@/types/workout';

/**
 * Convert CompleteWorkout (UI/Database format) to WorkoutInput (API format)
 */
export const convertCompleteToInput = (completeWorkout: CompleteWorkout): WorkoutInput => {
  return {
    name: completeWorkout.name,
    description: completeWorkout.description || completeWorkout.notes,
    exercises: completeWorkout.workout_exercises.map((workoutExercise): ExerciseInput => ({
      exercise_name: workoutExercise.name,
      definition_id: workoutExercise.definition_id,
      order_in_workout: workoutExercise.order_index,
      weight_unit: workoutExercise.weight_unit,
      distance_unit: workoutExercise.distance_unit,
      set_data: {
        sets: workoutExercise.workout_exercise_sets.map(set => ({
          weight: set.weight,
          reps: set.reps,
          distance: set.distance,
          duration: set.duration,
          rpe: set.rpe
        }))
      }
    }))
  };
};

/**
 * Convert WorkoutInput (API format) back to CompleteWorkout (UI format)
 * Useful when you get data back from API
 */
export const convertInputToComplete = (
  workoutInput: WorkoutInput, 
  metadata?: {
    id?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
  }
): CompleteWorkout => {
  return {
    id: metadata?.id || `temp-${Date.now()}`,
    user_id: metadata?.user_id || 'current-user',
    name: workoutInput.name,
    notes: workoutInput.description || '',
    description: workoutInput.description,
    created_at: metadata?.created_at || new Date().toISOString(),
    updated_at: metadata?.updated_at || new Date().toISOString(),
    workout_exercises: workoutInput.exercises.map((exercise, index): WorkoutExercise => ({
      id: `temp-exercise-${index}`,
      workout_id: metadata?.id || `temp-${Date.now()}`,
      name: exercise.exercise_name,
      definition_id: exercise.definition_id,
      order_index: exercise.order_in_workout,
      weight_unit: exercise.weight_unit,
      distance_unit: exercise.distance_unit,
      created_at: metadata?.created_at || new Date().toISOString(),
      updated_at: metadata?.updated_at || new Date().toISOString(),
      workout_exercise_sets: exercise.set_data.sets.map((set, setIndex) => ({
        id: `temp-set-${index}-${setIndex}`,
        exercise_id: `temp-exercise-${index}`,
        set_number: setIndex + 1,
        weight: set.weight,
        reps: set.reps,
        distance: set.distance,
        duration: set.duration,
        rpe: set.rpe,
        is_completed: false, // Default to not completed
        created_at: metadata?.created_at || new Date().toISOString(),
        updated_at: metadata?.updated_at || new Date().toISOString(),
      }))
    }))
  };
};