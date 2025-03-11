import { WorkoutInput, CompleteWorkout, WorkoutSet, WorkoutExercise,  } from '@/types/workout';
import { BaseService } from './base';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

export class WorkoutService extends BaseService {
  async createWorkout(userId: string, workout: WorkoutInput): Promise<CompleteWorkout> {
    const operation = async () => {
      const now = new Date().toISOString();
      
      const { data: workoutData, error: workoutError } = await this.supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: workout.name,
          notes: workout.description,
          created_at: now,
          used_as_template: now  // Set this to creation date by default
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
  
      // Fetch the complete workout after creation - THIS IS WHERE THE ERROR OCCURS
      // Instead of using complex ordering in the query, we'll sort in memory
      const { data, error } = await this.supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            workout_exercise_sets (*)
          )
        `)
        .eq('id', workoutData.id)
        .single();
  
      if (error) throw error;
      if (!data) throw new Error('Failed to fetch created workout');
  
      // Sort the data in memory
// Fix for createWorkout method with proper type annotations
const createdWorkout = {
  ...data,
  workout_exercises: data.workout_exercises
    .sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index)
    .map((exercise: WorkoutExercise) => ({
      ...exercise,
      workout_exercise_sets: exercise.workout_exercise_sets.sort(
        (a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number
      )
    }))
};
  
      return { data: createdWorkout, error: null } as PostgrestSingleResponse<CompleteWorkout>;
    };
  
    return this.withRetry(operation);
  }

  async getWorkout(workoutId: string): Promise<CompleteWorkout> {
    const operation = async () => {
      // Fetch data without complex nested ordering
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
        .single();
  
      if (error) throw error;
      if (!data) throw new Error('Workout not found');
  
      // Sort nested data in-memory instead of relying on Postgrest's nested ordering
      const workout: CompleteWorkout = {
        ...data,
        workout_exercises: data.workout_exercises
          .sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index)
          .map((exercise: WorkoutExercise) => ({
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
  async updateTemplateUsage(templateId: string): Promise<void> {
    const operation = async () => {
      const { error } = await this.supabase
        .from('workouts')
        .update({ 
          used_as_template: new Date().toISOString() // Only update this timestamp
        })
        .eq('id', templateId);
          
      if (error) throw error;
      
      return {
        data: { id: templateId},
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<unknown>;
    };
    
    await this.withRetry(operation);
  }
  
async getTemplates(userId: string): Promise<CompleteWorkout[]> {
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
      .order('used_as_template', { ascending: false, nullsFirst: false })
      .limit(50)

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

    // Sort nested data in-memory instead
    const templates: CompleteWorkout[] = data.map((workout: any) => ({
      ...workout,
      workout_exercises: workout.workout_exercises
        .sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index)
        .map((exercise: WorkoutExercise) => ({
          ...exercise,
          workout_exercise_sets: exercise.workout_exercise_sets.sort(
            (a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number
          )
        }))
    }));

    return {
      data: templates,
      error: null,
      count: templates.length,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<CompleteWorkout[]>;
  };

  return this.withRetry(operation);
}

async saveAsTemplate(workout: CompleteWorkout): Promise<CompleteWorkout> {
  const operation = async () => {
    try {
      // Deep copy the workout and modify for template
      const templateWorkout = {
        ...JSON.parse(JSON.stringify(workout)), // Deep copy
        id: undefined, // Let DB generate new ID
        is_template: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert the template workout
      const { data: workoutData, error: workoutError } = await this.supabase
        .from('workouts')
        .insert({
          user_id: workout.user_id,
          name: workout.name,
          notes: workout.notes,
          is_template: true
        })
        .select()
        .single();
      
      if (workoutError) throw workoutError;
      
      // Copy exercises
      for (const exercise of workout.workout_exercises) {
        const { data: exerciseData, error: exerciseError } = await this.supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutData.id,
            name: exercise.name,
            order_index: exercise.order_index,
            weight_unit: exercise.weight_unit,
            distance_unit: exercise.distance_unit,
          })
          .select()
          .single();
        
        if (exerciseError) throw exerciseError;
        
        // Copy sets
        const setPromises = exercise.workout_exercise_sets.map(set =>
          this.supabase
            .from('workout_exercise_sets')
            .insert({
              exercise_id: exerciseData.id,
              set_number: set.set_number,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
              distance: set.distance,
              duration: set.duration,
            })
        );
        
        await Promise.all(setPromises);
      }
      
      // Fetch the complete template
      const { data, error } = await this.supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            workout_exercise_sets (*)
          )
        `)
        .eq('id', workoutData.id)
        .single();
      
      if (error) throw error;
      
      // Sort the data in memory
      const template = {
        ...data,
        workout_exercises: data.workout_exercises
          .sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index)
          .map((exercise: WorkoutExercise) => ({
            ...exercise,
            workout_exercise_sets: exercise.workout_exercise_sets.sort(
              (a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number
            )
          }))
      };
      
      return {
        data: template,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<CompleteWorkout>;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };
  
  return this.withRetry(operation);
}

async createWorkoutFromTemplate(userId: string, templateId: string): Promise<CompleteWorkout> {
  const operation = async () => {
    try {
      // Fetch the template
      const { data: template, error: templateError } = await this.supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            workout_exercise_sets (*)
          )
        `)
        .eq('id', templateId)
        .eq('is_template', true)
        .single();
        
      if (templateError) throw templateError;
      if (!template) throw new Error('Template not found');
      
      // Create the new workout
      const { data: workoutData, error: workoutError } = await this.supabase
        .from('workouts')
        .insert({
          name: template.name,
          notes: template.notes,
          user_id: userId,
          template_id: templateId,
          is_template: false
        })
        .select()
        .single();
        
      if (workoutError) throw workoutError;
      
      // Copy all exercises and sets
      for (const exercise of template.workout_exercises) {
        const { data: exerciseData, error: exerciseError } = await this.supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutData.id,
            name: exercise.name,
            order_index: exercise.order_index,
            weight_unit: exercise.weight_unit,
            distance_unit: exercise.distance_unit,
          })
          .select()
          .single();
          
        if (exerciseError) throw exerciseError;
        
        // Copy sets
        const setPromises = exercise.workout_exercise_sets.map((set: { set_number: any; weight: any; reps: any; rpe: any; distance: any; duration: any; }) =>
          this.supabase
            .from('workout_exercise_sets')
            .insert({
              exercise_id: exerciseData.id,
              set_number: set.set_number,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
              distance: set.distance,
              duration: set.duration,
            })
        );
        
        await Promise.all(setPromises);
      }
      
      // Fetch the complete new workout
      const { data: newWorkout, error } = await this.supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            workout_exercise_sets (*)
          )
        `)
        .eq('id', workoutData.id)
        .single();
        
      if (error) throw error;
      
      // Sort the data in memory with proper type annotations
      newWorkout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
        a.order_index - b.order_index
      );
      
      newWorkout.workout_exercises.forEach((exercise: WorkoutExercise) => {
        exercise.workout_exercise_sets.sort((a: WorkoutSet, b: WorkoutSet) => 
          a.set_number - b.set_number
        );
      });
      
      return {
        data: newWorkout,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<CompleteWorkout>;
    } catch (error) {
      console.error('Error creating workout from template:', error);
      throw error;
    }
  };
  
  return this.withRetry(operation);
}
  async getUserWorkouts(userId: string): Promise<CompleteWorkout[]> {
    const operation = async () => {
      // Fetch data without complex nested ordering
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
  
      // Sort nested data in-memory instead
      const workouts: CompleteWorkout[] = data.map((workout: any) => ({
        ...workout,
        workout_exercises: workout.workout_exercises
          .sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index)
          .map((exercise: WorkoutExercise) => ({
            ...exercise,
            workout_exercise_sets: exercise.workout_exercise_sets.sort(
              (a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number
            )
          }))
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
  async deleteWorkout(workoutId: string): Promise<PostgrestSingleResponse<null>> {
    const operation = async () => {
      // Delete workout exercise sets first (due to foreign key constraints)
      const { data: exercises } = await this.supabase
        .from('workout_exercises')
        .select('id')
        .eq('workout_id', workoutId);
      
      if (exercises && exercises.length > 0) {
        const exerciseIds = exercises.map(e => e.id);
        const { error: setsError } = await this.supabase
          .from('workout_exercise_sets')
          .delete()
          .in('exercise_id', exerciseIds);
  
        if (setsError) throw setsError;
      }
  
      // Delete workout exercises
      const { error: exercisesError } = await this.supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId);
  
      if (exercisesError) throw exercisesError;
  
      // Finally delete the workout and return its response
      return await this.supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .single();
    };
  
    return this.withRetry(operation);
  }
  async updateWorkout(workoutId: string, workout: CompleteWorkout): Promise<CompleteWorkout> {
    const operation = async () => {
      try {
        // Update workout basic info
        const { error: workoutError } = await this.supabase
          .from('workouts')
          .update({
            name: workout.name,
            notes: workout.notes,
          })
          .eq('id', workoutId);
  
        if (workoutError) {
          console.error('Error updating workout:', workoutError);
          throw workoutError;
        }
  
        console.log('Basic workout info updated successfully');
  
        // Update exercises
        for (const exercise of workout.workout_exercises) {
          try {
            if (exercise.id.startsWith('temp-')) {
              // Create new exercise
              console.log('Creating new exercise:', exercise.name);
              const { data: exerciseData, error: exerciseError } = await this.supabase
                .from('workout_exercises')
                .insert({
                  workout_id: workoutId,
                  name: exercise.name,
                  order_index: exercise.order_index,
                  weight_unit: exercise.weight_unit,
                  distance_unit: exercise.distance_unit,
                })
                .select()
                .single();
  
              if (exerciseError) throw exerciseError;
  
              // Create sets for new exercise
              const setPromises = exercise.workout_exercise_sets.map(set => 
                this.supabase
                  .from('workout_exercise_sets')
                  .insert({
                    exercise_id: exerciseData.id,
                    set_number: set.set_number,
                    weight: set.weight,
                    reps: set.reps,
                    rpe: set.rpe,
                    distance: set.distance,
                    duration: set.duration,
                  })
              );
  
              await Promise.all(setPromises);
            } else {
              // Update existing exercise
              console.log('Updating exercise:', exercise.id);
              const { error: exerciseError } = await this.supabase
                .from('workout_exercises')
                .update({
                  name: exercise.name,
                  order_index: exercise.order_index,
                  weight_unit: exercise.weight_unit,
                  distance_unit: exercise.distance_unit,
                })
                .eq('id', exercise.id);
  
              if (exerciseError) throw exerciseError;
  
              // Handle sets
              for (const set of exercise.workout_exercise_sets) {
                if (set.id.startsWith('temp-')) {
                  // Create new set
                  const { error: setError } = await this.supabase
                    .from('workout_exercise_sets')
                    .insert({
                      exercise_id: exercise.id,
                      set_number: set.set_number,
                      weight: set.weight,
                      reps: set.reps,
                      rpe: set.rpe,
                      distance: set.distance,
                      duration: set.duration,
                    });
  
                  if (setError) throw setError;
                } else {
                  // Update existing set
                  const { error: setError } = await this.supabase
                    .from('workout_exercise_sets')
                    .update({
                      set_number: set.set_number,
                      weight: set.weight,
                      reps: set.reps,
                      rpe: set.rpe,
                      distance: set.distance,
                      duration: set.duration,
                    })
                    .eq('id', set.id);
  
                  if (setError) throw setError;
                }
              }
            }
          } catch (exerciseError) {
            console.error('Error processing exercise:', exercise.name, exerciseError);
            throw exerciseError;
          }
        }
  
        const existingExerciseIds = workout.workout_exercises
          .filter(e => !e.id.startsWith('temp-'))
          .map(e => e.id);
  
        const { data: allExercises } = await this.supabase
          .from('workout_exercises')
          .select('id')
          .eq('workout_id', workoutId);
  
        const deletedExerciseIds = allExercises
          ?.filter(e => !existingExerciseIds.includes(e.id))
          .map(e => e.id) || [];
  
        if (deletedExerciseIds.length > 0) {
          await this.supabase
            .from('workout_exercises')
            .delete()
            .in('id', deletedExerciseIds);
        }
  
        // Fetch the complete updated workout
        const { data: updatedData, error: fetchError } = await this.supabase
          .from('workouts')
          .select(`
            *,
            workout_exercises (
              *,
              workout_exercise_sets (*)
            )
          `)
          .eq('id', workoutId)
          .single();
  
        if (fetchError) throw fetchError;
        if (!updatedData) throw new Error('Failed to fetch updated workout');
  
        // Sort the data in memory with proper type annotations
        updatedData.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
          a.order_index - b.order_index
        );
        updatedData.workout_exercises.forEach((exercise: WorkoutExercise) => {
          exercise.workout_exercise_sets.sort((a: WorkoutSet, b: WorkoutSet) => 
            a.set_number - b.set_number
          );
        });
  
        return {
          data: updatedData,
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        } as PostgrestSingleResponse<CompleteWorkout>;
  
      } catch (error) {
        console.error('Workout update failed:', error);
        throw error;
      }
    };
  
    return this.withRetry(operation);
  }}