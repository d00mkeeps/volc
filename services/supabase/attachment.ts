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
      // First, save the bundle to the graph_bundles table
      const { error: bundleError } = await this.supabase
        .from('graph_bundles')
        .insert({
          id: bundle.bundle_id,
          user_id: userId,
          metadata: bundle.metadata,
          workout_data: bundle.workout_data,
          original_query: bundle.original_query,
          chart_url: bundle.chart_url,
          created_at: bundle.created_at || new Date().toISOString()
        });

      if (bundleError) throw bundleError;

      // Then create the link to the conversation
      if (bundle.conversationId) {
        const { error: linkError } = await this.supabase
          .from('conversation_attachments')
          .insert({
            conversation_id: bundle.conversationId,
            attachment_id: bundle.bundle_id,
            attachment_type: 'graph_bundle',
            user_id: userId
          });

        if (linkError) throw linkError;
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all graph bundles for a specific conversation
   */
  async getGraphBundlesByConversation(userId: string, conversationId: string): Promise<WorkoutDataBundle[]> {
    try {
      // Query the link table first
      const { data: links, error: linkError } = await this.supabase
        .from('conversation_attachments')
        .select('attachment_id')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .eq('attachment_type', 'graph_bundle');

      if (linkError) throw linkError;
      if (!links || links.length === 0) return [];

      // Get the bundle IDs
      const bundleIds = links.map(link => link.attachment_id);

      // Query the bundles
      const { data: bundles, error: bundleError } = await this.supabase
        .from('graph_bundles')
        .select('*')
        .eq('user_id', userId)
        .in('id', bundleIds);

      if (bundleError) throw bundleError;
      if (!bundles) return [];

      // Map the data to the WorkoutDataBundle type
      return bundles.map(bundle => ({
        bundle_id: bundle.id,
        metadata: bundle.metadata,
        workout_data: bundle.workout_data,
        original_query: bundle.original_query,
        chart_url: bundle.chart_url,
        created_at: bundle.created_at,
        conversationId
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Link a workout to a conversation
   */
  async linkWorkoutToConversation(
    userId: string, 
    workoutId: string, 
    conversationId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_attachments')
        .insert({
          conversation_id: conversationId,
          attachment_id: workoutId,
          attachment_type: 'workout',
          user_id: userId
        });

      if (error) throw error;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all workouts attached to a conversation
   */
  async getWorkoutsByConversation(userId: string, conversationId: string): Promise<any[]> {
    try {
      // Query the link table first
      const { data: links, error: linkError } = await this.supabase
        .from('conversation_attachments')
        .select('attachment_id')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .eq('attachment_type', 'workout');

      if (linkError) throw linkError;
      if (!links || links.length === 0) return [];

      // Get the workout IDs
      const workoutIds = links.map(link => link.attachment_id);

      // Query the workouts
      const { data: workouts, error: workoutError } = await this.supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .in('id', workoutIds);

      if (workoutError) throw workoutError;
      if (!workouts) return [];

      // Add conversation ID to each workout
      return workouts.map(workout => ({
        ...workout,
        conversationId
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete an attachment and its link to conversations
   */
  async deleteAttachment(
    userId: string, 
    attachmentId: string, 
    type: 'workout' | 'graph_bundle'
  ): Promise<void> {
    try {
      // Begin a transaction
      const { error: linkError } = await this.supabase
        .from('conversation_attachments')
        .delete()
        .eq('user_id', userId)
        .eq('attachment_id', attachmentId)
        .eq('attachment_type', type);

      if (linkError) throw linkError;

      // Delete from the appropriate table
      const table = type === 'workout' ? 'workouts' : 'graph_bundles';
      const { error: deleteError } = await this.supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete all attachments for a conversation
   */
  async deleteConversationAttachments(userId: string, conversationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_attachments')
        .delete()
        .eq('user_id', userId)
        .eq('conversation_id', conversationId);

      if (error) throw error;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const attachmentService = new AttachmentService();