import { create } from 'zustand';
import { workoutAnalysisService } from '../../services/api/workoutAnalysisService';
import { useUserStore } from '@/stores/userProfileStore';

interface AnalysisStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  result: any | null;
  error: Error | null;
}

interface WorkoutAnalysisStoreState {
  currentAnalysis: AnalysisStatus;
  
  submitAnalysis: (
    workoutData: any,
    options?: {
      onComplete?: (result: any) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<{ conversation_id: string }>;
  
  getProgress: () => { status: string };
  
  
  getResult: () => any | null;
  resetAnalysis: () => void;
}

export const useWorkoutAnalysisStore = create<WorkoutAnalysisStoreState>((set, get) => ({
  currentAnalysis: {
    status: 'idle',
    result: null,
    error: null
  },
  
 // Update the submitAnalysis method signature
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