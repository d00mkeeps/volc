// services/api/WorkoutAnalysisService.ts
import { BaseService } from '../db/base';
import { jobService } from './JobService';
import { apiGet } from './core/apiClient';

export class WorkoutAnalysisService extends BaseService {
  private ANALYSIS_ENDPOINT = '/api/workout-analysis';
  
  /**
   * Format workout data for analysis
   * @param workoutData Raw workout data
   */
  formatAnalysisData(workoutData: any): any {
    // Ensure we have a valid workout object
    if (!workoutData) {
      throw new Error('No workout data provided');
    }
    
    // Return a formatted payload for the API
    return {
      user_id: workoutData.user_id || 'anonymous',
      workout_data: workoutData,
      exercise_names: workoutData.workout_exercises?.map((ex: any) => ex.name) || []
    };
  }
  
  /**
   * Submit workout data for analysis
   * @param workoutData The workout data to analyze
   */
  async submitWorkoutAnalysis(workoutData: any): Promise<string> {
    try {
      console.log('[WorkoutAnalysisService] Submitting workout for analysis');
      
      // Format the data for submission
      const formattedData = this.formatAnalysisData(workoutData);
      
      // Create a new analysis job
      return await jobService.createJob(this.ANALYSIS_ENDPOINT, formattedData);
    } catch (error) {
      console.error('[WorkoutAnalysisService] Error submitting workout analysis:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Get job status for a workout analysis
   * @param jobId The job ID
   */
  async getAnalysisJobStatus(jobId: string): Promise<any> {
    return jobService.getJobStatus(this.ANALYSIS_ENDPOINT, jobId);
  }
  
  /**
   * Poll for workout analysis completion
   * @param jobId The job ID
   * @param options Polling options
   */
  async pollAnalysisCompletion(
    jobId: string,
    options: {
      interval?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<any> {
    return jobService.pollJobStatus(this.ANALYSIS_ENDPOINT, jobId, options);
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