import { BaseService } from './base';
import { CompleteWorkout, WorkoutWithConversation } from '@/types/workout';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/core/apiClient';
import { convertCompleteToInput } from '@/utils/workoutConversion';

export class WorkoutService extends BaseService {
  /**
   * Create a new workout and store it in the database with direct conversation ID
   */
  async createWorkout(userId: string, workout: CompleteWorkout | WorkoutWithConversation): Promise<CompleteWorkout> {
    try {
      const workoutId = 'id' in workout ? workout.id : 'N/A';
      
      console.log(`[WorkoutService] Creating workout: ${workoutId} with exercises:`);
      workout.workout_exercises?.forEach(exercise => {
        const setCount = exercise.workout_exercise_sets?.length || 0;
        console.log(`    ${exercise.id} (${exercise.name}, ${setCount} sets)`);
      });
      
      const data = await apiPost<CompleteWorkout>('/db/workouts', workout);
      console.log("[WorkoutService] API Response:", data);
      
      return data;
    } catch (error) {
      console.error('[WorkoutService] Error creating workout:', error);
      return this.handleError(error);
    }
  }
  /**
   * Save a completed workout (convenience method that handles conversion)
   */
  async saveCompletedWorkout(userId: string, workout: CompleteWorkout): Promise<CompleteWorkout> {
    try {
      console.log("[WorkoutService] Saving completed workout:", workout.id);
      
      // Use existing createWorkout method
      const result = await this.createWorkout(userId, workout);
      
      console.log("[WorkoutService] Completed workout saved with ID:", result.id);
      return result;
    } catch (error) {
      console.error('[WorkoutService] Error saving completed workout:', error);
      return this.handleError(error);
    }
  }

  /**
   * Get a workout by ID
   */
  async getWorkout(workoutId: string): Promise<CompleteWorkout> {
    try {
      console.log(`[WorkoutService] Getting workout: ${workoutId}`);
      
      // Make API call to get workout
      const data = await apiGet<CompleteWorkout>(`/db/workouts/${workoutId}`);
      
      console.log(`[WorkoutService] Successfully retrieved workout: ${workoutId}`);
      
      return data;
    } catch (error) {
      console.error(`[WorkoutService] Error fetching workout ${workoutId}:`, error);
      return this.handleError(error);
    }
  }
  
  /**
   * Get all workouts for a user
   */
  async getUserWorkouts(userId: string): Promise<CompleteWorkout[]> {
    try {
      console.log(`[WorkoutService] Getting all workouts for user: ${userId}`);
      
      // Call the endpoint to get all user workouts
      const data = await apiGet<CompleteWorkout[]>('/db/workouts/user');
      
      console.log(`[WorkoutService] Retrieved ${data.length} workouts for user: ${userId}`);
      
      return data;
    } catch (error) {
      console.error(`[WorkoutService] Error fetching user workouts:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Get all workouts for a specific user filtered by conversation ID
   */
  async getWorkoutsByConversation(userId: string, conversationId: string): Promise<WorkoutWithConversation[]> {
    try {
      console.log(`[WorkoutService] Getting workouts for conversation: ${conversationId}`);
      
      // Make API call to get workouts for conversation
      const data = await apiGet<WorkoutWithConversation[]>('/db/workouts', { conversation_id: conversationId });
      
      console.log(`[WorkoutService] Retrieved ${data.length} workouts for conversation: ${conversationId}`);
      
      return data;
    } catch (error) {
      console.error(`[WorkoutService] Error fetching workouts for conversation ${conversationId}:`, error);
      return this.handleError(error);
    }
  }

  /**
 * Update an existing workout
 */
async updateWorkout(workoutId: string, workout: CompleteWorkout): Promise<CompleteWorkout> {
  try {
    console.log(`[WorkoutService] Updating workout: ${workoutId}`);
    
    const data = await apiPut<CompleteWorkout>(`/db/workouts/${workoutId}`, workout);
    
    console.log(`[WorkoutService] Successfully updated workout: ${workoutId}`);
    
    return data;
  } catch (error) {
    console.error(`[WorkoutService] Error updating workout:`, error);
    return this.handleError(error);
  }
}

  /**
   * Delete all workouts for a specific conversation
   */
  async deleteConversationWorkouts(userId: string, conversationId: string): Promise<void> {
    try {
      console.log(`[WorkoutService] Deleting all workouts for conversation: ${conversationId}`);
      
      // Make API call to delete all workouts for conversation
      await apiDelete(`/db/workouts/conversation/${conversationId}`);
      
      console.log(`[WorkoutService] Successfully deleted all workouts for conversation: ${conversationId}`);
    } catch (error) {
      console.error(`[WorkoutService] Error deleting conversation workouts:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Update template usage timestamp
   */
  // async updateTemplateUsage(templateId: string): Promise<void> {
  //   try {
  //     console.log(`[WorkoutService] Updating template usage for workout: ${templateId}`);
      
  //     // Make API call to update template usage
  //     await apiPut(`/db/workouts/template/${templateId}`, {});
      
  //     console.log(`[WorkoutService] Successfully updated template usage for workout: ${templateId}`);
  //   } catch (error) {
  //     console.error(`[WorkoutService] Error updating template usage:`, error);
  //     return this.handleError(error);
  //   }
  // }
  
  /**
   * Get all workout templates for a user
   */
  async getTemplates(userId: string): Promise<CompleteWorkout[]> {
    try {
      console.log(`[WorkoutService] Getting workout templates for user: ${userId}`);
      
      // Make API call to get templates
      const data = await apiGet<CompleteWorkout[]>('/db/workouts/templates');
      
      console.log(`[WorkoutService] Retrieved ${data.length} templates for user: ${userId}`);
      
      return data;
    } catch (error) {
      console.error(`[WorkoutService] Error getting templates:`, error);
      return this.handleError(error);
    }
  }
  
  /**
   * Save a workout as a template
   */
// Remove the conversion in saveAsTemplate
async saveAsTemplate(workout: CompleteWorkout): Promise<CompleteWorkout> {
  try {
    console.log(`[WorkoutService] Saving workout as template: ${workout.id}`);
    
    // Send CompleteWorkout directly instead of converting
    const data = await apiPost<CompleteWorkout>('/db/workouts/template', workout);
    
    console.log(`[WorkoutService] Successfully saved workout as template: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`[WorkoutService] Error saving workout as template:`, error);
    return this.handleError(error);
  }
}
  
  /**
   * Delete a workout
   */
  async deleteWorkout(workoutId: string): Promise<void> {
    try {
      console.log(`[WorkoutService] Deleting workout: ${workoutId}`);
      
      // Make API call to delete workout
      await apiDelete(`/db/workouts/${workoutId}`);
      
      console.log(`[WorkoutService] Successfully deleted workout: ${workoutId}`);
    } catch (error) {
      console.error(`[WorkoutService] Error deleting workout:`, error);
      return this.handleError(error);
    }
  }
}

export const workoutService = new WorkoutService();