// stores/WorkoutAnalysisStore.ts
import { create } from 'zustand';
import { workoutAnalysisService } from '../services/api/workoutAnalysisService';
import { useJobStore } from './JobStore';

interface AnalysisStatus {
  jobId: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  progress: number;
  result: any | null;
  error: Error | null;
}

interface WorkoutAnalysisStoreState {
  currentAnalysis: AnalysisStatus;
  
  // Submit workout data for analysis
  submitAnalysis: (
    workoutData: any,
    options?: {
      onProgress?: (progress: number) => void;
      onComplete?: (result: any) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<string>;
  
  // Get current analysis progress
  getProgress: () => { status: string; progress: number };
  
  // Get analysis result (if available)
  getResult: () => any | null;
  
  // Reset analysis state
  resetAnalysis: () => void;
  
  // Internal handlers
  _handleAnalysisComplete: (result: any) => void;
  _handleAnalysisError: (error: Error) => void;
}

export const useWorkoutAnalysisStore = create<WorkoutAnalysisStoreState>((set, get) => ({
  currentAnalysis: {
    jobId: null,
    status: 'idle',
    progress: 0,
    result: null,
    error: null
  },
  
  submitAnalysis: async (workoutData, options = {}) => {
    try {
      // Reset current analysis state
      set({
        currentAnalysis: {
          jobId: null,
          status: 'loading',
          progress: 0,
          result: null,
          error: null
        }
      });
      
      // Submit workout for analysis
      const jobId = await workoutAnalysisService.submitWorkoutAnalysis(workoutData);
      
      // Update state with job ID
      set((state) => ({
        currentAnalysis: {
          ...state.currentAnalysis,
          jobId
        }
      }));
      
      // Start polling for completion
      useJobStore.getState().pollJob(
        '/api/workout-analysis',
        jobId,
        {
          onProgress: (progress) => {
            // Update internal progress
            set((state) => ({
              currentAnalysis: {
                ...state.currentAnalysis,
                progress
              }
            }));
            
            // Forward progress to caller
            if (options.onProgress) {
              options.onProgress(progress);
            }
          },
          onComplete: (result) => {
            // Handle completion internally
            get()._handleAnalysisComplete(result);
            
            // Forward result to caller
            if (options.onComplete) {
              options.onComplete(result);
            }
          },
          onError: (error) => {
            // Handle error internally
            get()._handleAnalysisError(error);
            
            // Forward error to caller
            if (options.onError) {
              options.onError(error);
            }
          }
        }
      );
      
      return jobId;
    } catch (error) {
      console.error('[WorkoutAnalysisStore] Error submitting analysis:', error);
      
      // Update state with error
      set((state) => ({
        currentAnalysis: {
          ...state.currentAnalysis,
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error))
        }
      }));
      
      throw error;
    }
  },
  
  getProgress: () => {
    const { status, progress } = get().currentAnalysis;
    return { status, progress };
  },
  
  getResult: () => {
    return get().currentAnalysis.result;
  },
  
  resetAnalysis: () => {
    const { jobId } = get().currentAnalysis;
    
    // If there's an active job, stop polling
    if (jobId) {
      useJobStore.getState().stopPolling(jobId);
    }
    
    // Reset state
    set({
      currentAnalysis: {
        jobId: null,
        status: 'idle',
        progress: 0,
        result: null,
        error: null
      }
    });
  },
  
  _handleAnalysisComplete: (result) => {
    console.log('[WorkoutAnalysisStore] Analysis completed successfully:', result);
    
    // Update state with result
    set((state) => ({
      currentAnalysis: {
        ...state.currentAnalysis,
        status: 'success',
        progress: 100,
        result
      }
    }));
  },
  
  _handleAnalysisError: (error) => {
    console.error('[WorkoutAnalysisStore] Analysis failed:', error);
    
    // Update state with error
    set((state) => ({
      currentAnalysis: {
        ...state.currentAnalysis,
        status: 'error',
        error
      }
    }));
  }
}));