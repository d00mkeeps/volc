// services/api/graphBundleService.ts
import { BaseApiService } from './baseService';
import { WorkoutDataBundle } from '@/types/workout';

/**
 * Graph Bundle API Service
 */
export class GraphBundleApiService extends BaseApiService {
  constructor() {
    super('/db/graph-bundles');
  }
  
  /**
   * Get all graph bundles for a conversation
   */
  async getByConversation(conversationId: string): Promise<WorkoutDataBundle[]> {
    try {
      return await this.get<WorkoutDataBundle[]>('', { conversation_id: conversationId });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Save a graph bundle
   */
  async save(bundle: WorkoutDataBundle): Promise<{ bundle_id: string }> {
    try {
      return await this.post<{ bundle_id: string }>('', bundle);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Delete a graph bundle
   */
  async deleteBundle(bundleId: string): Promise<void> {
    try {
      // Call the protected delete method from the base class
      await this.delete(`/${bundleId}`);
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const graphBundleApiService = new GraphBundleApiService();