// hooks/useWorkoutAttachments.ts
import { useState, useEffect } from 'react';
import { useWorkoutStore } from '@/stores/attachments/WorkoutStore';
import { useGraphBundleStore } from '@/stores/attachments/GraphBundleStore';
import { AttachmentType, WorkoutDataBundle, WorkoutWithConversation } from '@/types/workout';

/**
 * Hook for managing workout attachments (workouts and graph bundles)
 * for a specific conversation
 */
export function useWorkoutAttachments(conversationId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get store state and actions
  const { 
    workouts,
    isLoading: workoutsLoading, 
    error: workoutsError,
    loadWorkoutsForConversation,
    getWorkoutsByConversation,
    addWorkout,
    deleteWorkout,
    clearWorkoutsForConversation
  } = useWorkoutStore();
  
  const {
    bundles,
    isLoading: bundlesLoading,
    error: bundlesError,
    loadBundlesForConversation,
    getBundlesByConversation,
    addBundle,
    deleteBundle,
    clearBundlesForConversation
  } = useGraphBundleStore();

  // Combined loading and error states
  const isStoreLoading = workoutsLoading || bundlesLoading;
  const storeError = workoutsError || bundlesError;
  
  // Load data when the component mounts or conversationId changes
  useEffect(() => {
    if (!conversationId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadWorkoutsForConversation(conversationId),
          loadBundlesForConversation(conversationId)
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [conversationId, loadWorkoutsForConversation, loadBundlesForConversation]);
  
  // Process workout data and add it to the store
  const processWorkoutAnalysis = async (workoutData: any) => {
    setIsLoading(true);
    try {
      await addWorkout(workoutData, conversationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process graph bundle data and add it to the store
  const processGraphBundle = async (bundle: WorkoutDataBundle) => {
    setIsLoading(true);
    try {
      await addBundle(bundle, conversationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete an attachment (workout or graph bundle)
  const deleteAttachment = async (attachmentId: string, type: AttachmentType) => {
    setIsLoading(true);
    try {
      if (type === 'workout') {
        await deleteWorkout(attachmentId);
      } else {
        await deleteBundle(attachmentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear all attachments for the conversation
  const clearAttachments = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        clearWorkoutsForConversation(conversationId),
        clearBundlesForConversation(conversationId)
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    // Data
    workouts: getWorkoutsByConversation(conversationId),
    graphBundles: getBundlesByConversation(conversationId),
    
    // Status
    isLoading: isLoading || isStoreLoading,
    error: error || storeError,
    
    // Actions
    processWorkoutAnalysis,
    processGraphBundle,
    deleteAttachment,
    clearAttachments
  };
}