// hooks/useWorkoutAnalysisConversation.ts
import { useState } from 'react';
import { useConversationStore } from '@/stores/chat/ConversationStore';
import { useMessageStore } from '@/stores/chat/MessageStore';
import { useWorkoutAnalysisStore } from '@/stores/analysis/WorkoutAnalysisStore';

interface AnalysisOptions {
  title?: string;
  initialMessage?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for creating and managing workout analysis conversations
 */
export function useWorkoutAnalysisConversation() {
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const conversationStore = useConversationStore();
  const messageStore = useMessageStore();
  const workoutAnalysisStore = useWorkoutAnalysisStore();
  
  /**
   * Create a conversation with existing analysis results
   */
  const createAnalysisConversation = async (
    analysisResults: any,
    options?: AnalysisOptions
  ) => {
    try {
      setIsCreating(true);
      setError(null);
      
      // Create the conversation
      const conversationId = await conversationStore.createConversation({
        title: options?.title || 'Workout Analysis',
        firstMessage: options?.initialMessage || 'Analyze my workout data',
        configName: 'workout-analysis'
      });
      
      // Get config
      const configName = await conversationStore.getConversationConfig(conversationId);
      
      // Connect and setup WebSocket through MessageStore
      const cleanup = await messageStore.connectToConversation(conversationId, configName);
      
      // Wait briefly for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send analysis bundle via MessageStore
      // Using an empty message with the analysisBundle option instead of type
      await messageStore.sendMessage(conversationId, '', {
        analysisBundle: analysisResults
      });
      
      return conversationId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useWorkoutAnalysisConversation] Error creating analysis conversation:', error);
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };
  
  /**
   * Analyze a workout and create a conversation with the results
   */
  const analyzeWorkout = async (workout: any, options?: AnalysisOptions) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Log info about the workout being analyzed
      console.log("🔍 Analyzing workout:", {
        id: workout.id,
        name: workout.name,
        exerciseCount: workout.workout_exercises?.length || 0
      });
      
      // Submit workout for analysis using WorkoutAnalysisStore
      const analysisResults = await workoutAnalysisStore.submitAnalysis(workout, {
        onProgress: options?.onProgress,
        onError: (error) => {
          setError(error);
          options?.onError?.(error);
        }
      });
      
      // Create conversation with analysis results
      return await createAnalysisConversation(
        analysisResults,
        {
          title: options?.title || `Analysis: ${workout.name}`,
          initialMessage: options?.initialMessage || 
            `Analyze my "${workout.name}" workout and show how it relates to my previous workouts.`
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useWorkoutAnalysisConversation] Error analyzing workout:', error);
      setError(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Combined function to create or analyze based on input
   * Creates a conversation directly if given analysis results,
   * or analyzes a workout first if given a workout
   */
  const createOrAnalyze = async (
    input: any, 
    options?: AnalysisOptions
  ) => {
    // Determine if input is a workout or analysis result
    const isWorkout = input?.workout_exercises || input?.name;
    
    if (isWorkout) {
      return await analyzeWorkout(input, options);
    } else {
      return await createAnalysisConversation(input, options);
    }
  };
  
  return {
    // Main functions
    analyzeWorkout,
    createAnalysisConversation,
    createOrAnalyze,
    
    // State
    isAnalyzing,
    isCreating,
    isBusy: isAnalyzing || isCreating,
    error,
    
    // Utilities
    clearError: () => setError(null)
  };
}