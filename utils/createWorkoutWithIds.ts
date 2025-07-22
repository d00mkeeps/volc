import { v4 as uuidv4 } from 'uuid';
import { CompleteWorkout } from '@/types/workout';

export function createWorkoutWithIds(template: CompleteWorkout, userId: string): CompleteWorkout {
  const workoutId = uuidv4();
  const now = new Date().toISOString();
  
  return {
    ...template,
    id: workoutId,
    user_id: userId,
    template_id: template.id,
    is_template: false,
    created_at: now,
    updated_at: now,
    workout_exercises: template.workout_exercises.map((exercise) => {
      const exerciseId = uuidv4();
      
      return {
        ...exercise,
        id: exerciseId,
        workout_id: workoutId, // Proper foreign key
        workout_exercise_sets: exercise.workout_exercise_sets.map((set) => ({
          ...set,
          id: uuidv4(),
          exercise_id: exerciseId, // Proper foreign key
          is_completed: false,
        })),
      };
    }),
  };
}