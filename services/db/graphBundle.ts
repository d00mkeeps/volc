// services/supabase/graphBundle.ts
import { BaseService } from './base';
import { WorkoutDataBundle } from '@/types/workout';
import { apiGet, apiPost, apiDelete } from '../api/apiClient';

export class GraphBundleService extends BaseService {
  /**
   * Save a workout data bundle to the database
   */
  async saveGraphBundle(userId: string, bundle: WorkoutDataBundle): Promise<void> {
    try {
      console.log(`[GraphBundleService] Saving graph bundle: ${bundle.bundle_id}`);
      
      await apiPost('/db/graph-bundles', bundle);
      
      console.log(`[GraphBundleService] Bundle saved successfully with conversation ID: ${bundle.conversationId}`);
    } catch (error) {
      console.error(`[GraphBundleService] Error in saveGraphBundle:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Get all graph bundles for a specific conversation
   */
  async getGraphBundlesByConversation(userId: string, conversationId: string): Promise<WorkoutDataBundle[]> {
    try {
      console.log(`[GraphBundleService] Getting graph bundles for conversation: ${conversationId}`);
      
      const bundles = await apiGet<WorkoutDataBundle[]>('/db/graph-bundles', { conversation_id: conversationId });
      
      console.log(`[GraphBundleService] Retrieved ${bundles.length} graph bundles`);
      return bundles;
    } catch (error) {
      console.error(`[GraphBundleService] Error getting graph bundles:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Delete a graph bundle
   */
  async deleteGraphBundle(userId: string, bundleId: string): Promise<void> {
    try {
      console.log(`[GraphBundleService] Deleting graph bundle: ${bundleId}`);
      
      await apiDelete(`/db/graph-bundles/${bundleId}`);
      
      console.log(`[GraphBundleService] Successfully deleted graph bundle: ${bundleId}`);
    } catch (error) {
      console.error(`[GraphBundleService] Error deleting graph bundle:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Delete all graph bundles for a conversation
   */
  async deleteConversationGraphBundles(userId: string, conversationId: string): Promise<void> {
    try {
      console.log(`[GraphBundleService] Deleting all graph bundles for conversation: ${conversationId}`);
      
      await apiDelete(`/db/graph-bundles/conversation/${conversationId}`);
      
      console.log(`[GraphBundleService] Successfully deleted all graph bundles for conversation: ${conversationId}`);
    } catch (error) {
      console.error(`[GraphBundleService] Error deleting conversation graph bundles:`, error);
      return this.handleError(error);
    }
  }
}

export const graphBundleService = new GraphBundleService();