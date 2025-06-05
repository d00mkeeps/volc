// services/api/WorkoutAnalysisService.ts
import { BaseService } from '../db/base';
import { apiGet } from './core/apiClient';

export class WorkoutAnalysisService extends BaseService {
  private ANALYSIS_ENDPOINT = '/api/workout-analysis';
  
  /**
   * Format workout data for analysis
   * @param workoutData Raw workout data
   * @param userId The authenticated user's UUID
   */
  formatAnalysisData(workoutData: any, userId: string): any {
    // Ensure we have a valid workout object
    if (!workoutData) {
      throw new Error('No workout data provided');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Extract exercise names from the workout
    const exerciseNames = workoutData.workout_exercises?.map((ex: any) => ex.name) || [];
    
    if (exerciseNames.length === 0) {
      throw new Error('No exercises found in workout data');
    }
    
    // Return payload for historical analysis
    return {
      user_id: userId,
      exercise_names: exerciseNames,
      timeframe: "3 months",
      message: `Analyze progress for: ${exerciseNames.join(', ')}`
    };
  }
  
  /**
   * Get stored analysis result for a conversation
   * @param conversationId The conversation ID
   */
  async getStoredAnalysisResult(conversationId: string): Promise<any> {
    try {
      console.log(`[WorkoutAnalysisService] Getting stored analysis for conversation: ${conversationId}`);
      
      // This would call an endpoint to get the stored analysis from the database
      const result = await apiGet<any>(`/api/workout-analysis/conversation/${conversationId}`);
      
      return result;
    } catch (error) {
      console.error('[WorkoutAnalysisService] Error getting stored analysis:', error);
      return this.handleError(error);
    }
  }
}

export const workoutAnalysisService = new WorkoutAnalysisService();