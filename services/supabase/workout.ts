import { WorkoutInput, CompleteWorkout, WorkoutSet, WorkoutExercise,  } from '@/types/workout';
import { BaseService } from './base';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

export class WorkoutService extends BaseService {
  async createWorkout(userId: string, workout: WorkoutInput): Promise<CompleteWorkout> {
    const operation = async () => {
      const { data: workoutData, error: workoutError } = await this.supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: workout.name,
          notes: workout.description,
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating workout:', workoutError);
        throw workoutError;
      }

      const exercisePromises = workout.exercises.map(async (exercise) => {
        const { data: exerciseData, error: exerciseError } = await this.supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutData.id,
            name: exercise.exercise_name,
            order_index: exercise.order_in_workout,
            weight_unit: exercise.weight_unit,
            distance_unit: exercise.distance_unit,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        const setPromises = exercise.set_data.sets.map(async (set, index) => {
          const { error: setError } = await this.supabase
            .from('workout_exercise_sets')
            .insert({
              exercise_id: exerciseData.id,
              set_number: index + 1,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
              distance: set.distance,
              duration: set.duration,
            });

          if (setError) throw setError;
        });

        await Promise.all(setPromises);
        return exerciseData;
      });

      await Promise.all(exercisePromises);

      // Fetch the complete workout after creation
      const createdWorkout = await this.getWorkout(workoutData.id);
      return { data: createdWorkout, error: null } as PostgrestSingleResponse<CompleteWorkout>;
    };

    return this.withRetry(operation);
  }

  async getWorkout(workoutId: string): Promise<CompleteWorkout> {
    const operation = async () => {
      const { data, error } = await this.supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            workout_exercise_sets (*)
          )
        `)
        .eq('id', workoutId)
        .order('workout_exercises.order_index')
        .order('workout_exercises.workout_exercise_sets.set_number')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Workout not found');

      const workout: CompleteWorkout = {
        ...data,
        workout_exercises: data.workout_exercises.map((exercise: WorkoutExercise) => ({
          ...exercise,
          workout_exercise_sets: exercise.workout_exercise_sets.sort(
            (a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number
          )
        }))
      };

      return {
        data: workout,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<CompleteWorkout>;
    };

    return this.withRetry(operation);
  }

 // In getUserWorkouts method, update the map callbacks with proper typing
async getUserWorkouts(userId: string): Promise<CompleteWorkout[]> {
  const operation = async () => {
    const { data, error } = await this.supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          workout_exercise_sets (*)
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!data) {
      return {
        data: [] as CompleteWorkout[],
        error: null,
        count: 0,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<CompleteWorkout[]>;
    }

    const workouts: CompleteWorkout[] = data.map((workout: any) => ({
      ...workout,
      workout_exercises: workout.workout_exercises
        .map((exercise: WorkoutExercise) => ({
          ...exercise,
          workout_exercise_sets: exercise.workout_exercise_sets.sort(
            (a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number
          )
        }))
        .sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index)
    }));

    return {
      data: workouts,
      error: null,
      count: workouts.length,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<CompleteWorkout[]>;
  };

  return this.withRetry(operation);
}

  async deleteWorkout(workoutId: string): Promise<CompleteWorkout> {
    const operation = async () => {
      const { data, error } = await this.supabase
        .from('workouts')
        .update({ status: 'deleted' })
        .eq('id', workoutId)
        .select(`
          *,
          workout_exercises (
            *,
            workout_exercise_sets (*)
          )
        `)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Workout not found');

      return {
        data,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<CompleteWorkout>;
    };

    return this.withRetry(operation);
  }
}