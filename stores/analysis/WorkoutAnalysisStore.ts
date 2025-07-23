import { create } from 'zustand';
import { workoutAnalysisService } from '../../services/api/workoutAnalysisService';

interface AnalysisResult {
  conversation_id: string;
}

interface AnalysisStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  result: AnalysisResult | null;
  error: Error | null;
}

interface WorkoutAnalysisStoreState {
  currentAnalysis: AnalysisStatus;
  
  submitAnalysis: (
    workoutData: any,
    options?: {
      onComplete?: (result: AnalysisResult) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<AnalysisResult>;
  
  initiateBackgroundAnalysis: (definitionIds: string[]) => Promise<AnalysisResult>;
  
  getProgress: () => { status: string };
  getResult: () => AnalysisResult | null;
  resetAnalysis: () => void;
}

export const useWorkoutAnalysisStore = create<WorkoutAnalysisStoreState>((set, get) => ({
  currentAnalysis: {
    status: 'idle',
    result: null,
    error: null
  },
  
  submitAnalysis: async (definitionIds: string[], options = {}) => {
    try {
      set({ currentAnalysis: { status: 'loading', result: null, error: null } });
      
      const response = await workoutAnalysisService.initiateAnalysisAndConversation(definitionIds);
      
      set({ currentAnalysis: { status: 'success', result: response, error: null } });
      
      if (options.onComplete) {
        options.onComplete(response);
      }
      
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      set({ currentAnalysis: { status: 'error', result: null, error: err } });
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  },
  
  initiateBackgroundAnalysis: async (definitionIds: string[]) => {
    try {
      const response = await workoutAnalysisService.initiateAnalysisAndConversation(definitionIds);
      set({ currentAnalysis: { status: 'success', result: response, error: null } });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      set({ currentAnalysis: { status: 'error', result: null, error: err } });
      throw err;
    }
  },
  
  getProgress: () => {
    const { status } = get().currentAnalysis;
    return { status };
  },
  
  getResult: () => {
    return get().currentAnalysis.result;
  },
  
  resetAnalysis: () => {
    set({ currentAnalysis: { status: 'idle', result: null, error: null } });
  },
}));