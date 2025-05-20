// hooks/useWorkoutAnalysis.ts
import { useState, useCallback } from 'react';
import { useWorkoutAnalysisStore } from '@/stores/analysis/WorkoutAnalysisStore';
import { useWorkoutStore } from '@/stores/attachments/WorkoutStore';
import { useGraphBundleStore } from '@/stores/attachments/GraphBundleStore';
import { WorkoutDataBundle } from '@/types/workout';

interface AnalysisOptions {
  onProgress?: (progress: number) => void;
  saveResults?: boolean;
  targetId?: string; // Could be conversation ID or any other identifier
}

/**
 * Hook for analyzing workouts and optionally saving results
 */
export function useWorkoutAnalysis() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  
  // Get store states and actions
  const { 
    submitAnalysis, 
    getProgress, 
    getResult, 
    resetAnalysis,
    currentAnalysis
  } = useWorkoutAnalysisStore();
  
  const { addWorkout } = useWorkoutStore();
  const { addBundle } = useGraphBundleStore();
  
  // Derive full analysis state
  const { status, progress, result, error: analysisError } = currentAnalysis;
  const isAnalyzing = status === 'loading';
  const isAnalysisComplete = status === 'success';
  const hasAnalysisError = status === 'error';
  
  /**
   * Save analysis results to the specified context
   */
  const saveAnalysisResults = useCallback(async (
    analysisResult: any, 
    targetId: string
  ) => {
    if (!analysisResult) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const savePromises = [];
      
      // Save workout if available
      if (analysisResult.workout) {
        savePromises.push(
          addWorkout(analysisResult.workout, targetId)
        );
      }
      
      // Save graph bundle if available
      if (analysisResult.graph_bundle) {
        savePromises.push(
          addBundle(analysisResult.graph_bundle as WorkoutDataBundle, targetId)
        );
      }
      
      // Wait for all saves to complete
      await Promise.all(savePromises);
      
    } catch (error) {
      console.error("[useWorkoutAnalysis] Error saving analysis results:", error);
      setSaveError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [addWorkout, addBundle]);
  
  /**
   * Analyze a workout and optionally save the results
   */
  const analyzeWorkout = useCallback(async (
    workoutData: any, 
    options: AnalysisOptions = {}
  ) => {
    try {
      // Start analysis
      await submitAnalysis(workoutData, {
        onProgress: options.onProgress,
        onComplete: async (result) => {
          // If saveResults is true and a targetId was provided, save the results
          if (options.saveResults && options.targetId) {
            await saveAnalysisResults(result, options.targetId);
          }
        }
      });
      
      // Return the result (may not be available yet if analysis is still running)
      return getResult();
    } catch (error) {
      console.error("[useWorkoutAnalysis] Analysis failed:", error);
      throw error;
    }
  }, [submitAnalysis, getResult, saveAnalysisResults]);
  
  /**
   * Get the latest analysis result and save it
   */
  const saveLatestResults = useCallback(async (targetId: string) => {
    const latestResult = getResult();
    if (latestResult) {
      await saveAnalysisResults(latestResult, targetId);
    }
    return latestResult;
  }, [getResult, saveAnalysisResults]);
  
  return {
    // Analysis state
    isAnalyzing,
    analysisProgress: progress,
    analysisResult: result,
    analysisError,
    isAnalysisComplete,
    hasAnalysisError,
    
    // Save state
    isSaving,
    saveError,
    
    // Combined state
    isBusy: isAnalyzing || isSaving,
    error: analysisError || saveError,
    
    // Actions
    analyzeWorkout,
    saveAnalysisResults: saveLatestResults,
    resetAnalysis,
    
    // Access to raw store state and methods if needed
    currentAnalysis,
    getProgress
  };
}