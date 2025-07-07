import { apiPost } from './core/apiClient';
import { BaseService } from '../db/base';

export class WorkoutAnalysisService extends BaseService {
  private ANALYSIS_ENDPOINT = '/api/workout-analysis';

  /**
   * Initiate analysis and conversation
   * @param workoutData The workout data to analyze
   * @param userId The authenticated user's UUID
   */
  async initiateAnalysisAndConversation(workoutData: any, userId: string): Promise<{ conversation_id: string }> {
    try {
      console.log(`[WorkoutAnalysisService] Initiating analysis and conversation for user: ${userId}`);

      const payload = {
        user_id: userId,
        workout_data: workoutData,
        message: "Analyze my workout" // Default message for initial analysis
      };

      const response = await apiPost<{ conversation_id: string }>(this.ANALYSIS_ENDPOINT, payload);

      console.log(`[WorkoutAnalysisService] Analysis initiation complete. Conversation ID: ${response.conversation_id}`);
      return response;
    } catch (error) {
      console.error('[WorkoutAnalysisService] Error initiating analysis and conversation:', error);
      return this.handleError(error);
    }
  }
}

export const workoutAnalysisService = new WorkoutAnalysisService();