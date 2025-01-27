import { BaseService } from './base';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

type WorkoutExercise = {
  exercise_name: string;
  set_data: {
    sets: Record<string, any>[];
  };
  order_in_workout: number;
  weight_unit?: 'kg' | 'lbs';
  distance_unit?: 'km' | 'm' | 'mi';
};

type Workout = {
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
};

export class WorkoutService extends BaseService {
  async createWorkout(userId: string, workout: Workout) {
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

        console.log('Workout insert result:', { workoutData, workoutError });

        console.log('Workout created:', workoutData);
      const exercisePromises = workout.exercises.map(async (exercise) => {
        const { data: exerciseData, error: exerciseError } = await this.supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutData.id,
            name: exercise.exercise_name,
            order_index: exercise.order_in_workout,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        const setPromises = exercise.set_data.sets.map(async (set, index) => {
          await this.supabase
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
        });

        await Promise.all(setPromises);
        return exerciseData;
      });

      await Promise.all(exercisePromises);
      return { data: workoutData, error: null } as PostgrestSingleResponse<any>;
    };

    return this.withRetry(operation);
  } catch (error: Error) {
    console.error('createWorkout error:', error)
  throw error}

  async getWorkout(workoutId: string) {
    const operation = async () => {
      const { data: workout, error: workoutError } = await this.supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
  
      if (workoutError) throw workoutError;
  
      const { data: exercises, error: exercisesError } = await this.supabase
        .from('workout_exercises')
        .select('*, workout_exercise_sets(*)')
        .eq('workout_id', workoutId)
        .order('order_index');
  
      if (exercisesError) throw exercisesError;
  
      return {
        data: { ...workout, exercises },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<any>;
    };
  
    return this.withRetry(operation);
  }
  async getUserWorkouts(userId: string) {
    const operation = async () => {
      const response = await this.supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (response.error) throw response.error;
      return response;
    };

    return this.withRetry(operation);
  }

  async deleteWorkout(workoutId: string) {
    const operation = async () => {
      const response = await this.supabase
        .from('workouts')
        .update({ status: 'deleted' })
        .eq('id', workoutId)
        .select();

      if (response.error) throw response.error;
      return response;
    };

    return this.withRetry(operation);
  }
}