import { apiPost } from './core/apiClient';
import { BaseService } from '../db/base';

export class WorkoutAnalysisService extends BaseService {
  private ANALYSIS_ENDPOINT = '/api/workout-analysis';

  async initiateAnalysisAndConversation(
    definitionIds: string[]
  ): Promise<{ conversation_id: string }> {
    try {
      console.log(`[WorkoutAnalysisService] Initiating analysis for definition IDs:`, definitionIds);

      const payload = {
        exercise_definition_ids: definitionIds
      };

      const response = await apiPost<{ conversation_id: string }>(this.ANALYSIS_ENDPOINT, payload);

      console.log(`[WorkoutAnalysisService] Analysis initiation complete. Conversation ID: ${response.conversation_id}`);
      return response;
    } catch (error) {
      console.error('[WorkoutAnalysisService] Error initiating analysis:', error);
      return this.handleError(error);
    }
  }
}

export const workoutAnalysisService = new WorkoutAnalysisService();