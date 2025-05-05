// services/supabase/attachment.ts
import { BaseService } from './base';
import { WorkoutDataBundle } from '@/types/workout';
import { supabase } from '@/lib/supabaseClient';

export class AttachmentService extends BaseService {
  /**
   * Save a workout data bundle to the database
   */
  async saveGraphBundle(userId: string, bundle: WorkoutDataBundle): Promise<void> {
    try {
      console.log(`[AttachmentService] Saving graph bundle: ${bundle.bundle_id}`);
      
      // Save the bundle with conversation_id directly
      const { error: bundleError } = await this.supabase
        .from('graph_bundles')
        .insert({
          id: bundle.bundle_id,
          user_id: userId,
          conversation_id: bundle.conversationId, // Store conversation ID directly
          metadata: bundle.metadata,
          workout_data: bundle.workout_data,
          original_query: bundle.original_query,
          chart_url: bundle.chart_url,
          chart_urls: bundle.chart_urls,
          top_performers: bundle.top_performers,
          consistency_metrics: bundle.consistency_metrics,
          created_at: bundle.created_at || new Date().toISOString()
        });
  
      if (bundleError) {
        console.error(`[AttachmentService] Error saving bundle:`, bundleError);
        throw bundleError;
      }
  
      console.log(`[AttachmentService] Bundle saved successfully with conversation ID: ${bundle.conversationId}`);
    } catch (error) {
      console.error(`[AttachmentService] Error in saveGraphBundle:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Get all graph bundles for a specific conversation
   */
  async getGraphBundlesByConversation(userId: string, conversationId: string): Promise<WorkoutDataBundle[]> {
    try {
      console.log(`[AttachmentService] Getting graph bundles for conversation: ${conversationId}`);
      
      // Direct query using conversation_id
      const { data: bundles, error: bundleError } = await this.supabase
        .from('graph_bundles')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (bundleError) {
        console.error(`[AttachmentService] Error querying bundles:`, bundleError);
        throw bundleError;
      }
      
      if (!bundles || bundles.length === 0) {
        console.log(`[AttachmentService] No graph bundles found for conversation: ${conversationId}`);
        return [];
      }

      console.log(`[AttachmentService] Retrieved ${bundles.length} graph bundles directly by conversation ID`);
      console.log(`[AttachmentService] Bundle IDs: ${bundles.map(b => b.id).join(', ')}`);

      // Map the data to the WorkoutDataBundle type
      const formattedBundles = bundles.map(bundle => ({
        bundle_id: bundle.id,
        metadata: bundle.metadata || {},
        workout_data: bundle.workout_data || {},
        original_query: bundle.original_query || '',
        chart_url: bundle.chart_url,
        chart_urls: bundle.chart_urls || {},
        top_performers: bundle.top_performers || {},
        consistency_metrics: bundle.consistency_metrics || {},
        created_at: bundle.created_at,
        conversationId
      }));

      console.log(`[AttachmentService] Formatted ${formattedBundles.length} bundles`);
      if (formattedBundles.length > 0) {
        console.log(`[AttachmentService] First bundle ID: ${formattedBundles[0]?.bundle_id}`);
      }
      
      return formattedBundles;
    } catch (error) {
      console.error(`[AttachmentService] Error getting graph bundles:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Get all workouts for a specific conversation
   */
  async getWorkoutsByConversation(userId: string, conversationId: string): Promise<any[]> {
    try {
      console.log(`[AttachmentService] Getting workouts for conversation: ${conversationId}`);
      
      // Direct query using conversation_id
      const { data: workouts, error: workoutError } = await this.supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (workoutError) {
        console.error(`[AttachmentService] Error querying workouts:`, workoutError);
        throw workoutError;
      }
      
      if (!workouts || workouts.length === 0) {
        console.log(`[AttachmentService] No workouts found for conversation: ${conversationId}`);
        return [];
      }

      console.log(`[AttachmentService] Retrieved ${workouts.length} workouts directly by conversation ID`);

      // Add conversationId to the result objects for consistency
      return workouts.map(workout => ({
        ...workout,
        conversationId
      }));
    } catch (error) {
      console.error(`[AttachmentService] Error getting workouts:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(
    userId: string, 
    attachmentId: string, 
    type: 'workout' | 'graph_bundle'
  ): Promise<void> {
    try {
      console.log(`[AttachmentService] Deleting ${type}: ${attachmentId}`);
      
      // Delete directly from the appropriate table
      const table = type === 'workout' ? 'workouts' : 'graph_bundles';
      const { error: deleteError } = await this.supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        .eq('id', attachmentId);

      if (deleteError) {
        console.error(`[AttachmentService] Error deleting ${type}:`, deleteError);
        throw deleteError;
      }
      
      console.log(`[AttachmentService] Successfully deleted ${type}: ${attachmentId}`);
    } catch (error) {
      console.error(`[AttachmentService] Error deleting attachment:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Delete all attachments for a conversation
   */
  async deleteConversationAttachments(userId: string, conversationId: string): Promise<void> {
    try {
      console.log(`[AttachmentService] Deleting all attachments for conversation: ${conversationId}`);
      
      // Delete from both tables
      const deletePromises = [
        this.supabase
          .from('graph_bundles')
          .delete()
          .eq('user_id', userId)
          .eq('conversation_id', conversationId),
          
        this.supabase
          .from('workouts')
          .delete()
          .eq('user_id', userId)
          .eq('conversation_id', conversationId)
      ];
      
      const results = await Promise.allSettled(deletePromises);
      
      // Check for errors
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
        
      if (errors.length > 0) {
        console.error(`[AttachmentService] Errors deleting conversation attachments:`, errors);
        throw errors[0];
      }
      
      console.log(`[AttachmentService] Successfully deleted all attachments for conversation: ${conversationId}`);
    } catch (error) {
      console.error(`[AttachmentService] Error deleting conversation attachments:`, error);
      return this.handleError(error);
    }
  }
}

export const attachmentService = new AttachmentService();