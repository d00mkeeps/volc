// stores/workoutStore.ts
import { create } from 'zustand';
import { CompleteWorkout, WorkoutInput, WorkoutWithConversation } from "@/types/workout";
import { workoutService } from "@/services/db/workout";

interface WorkoutState {
  // State
  workouts: CompleteWorkout[];  // Changed from Map to array for compatibility
  currentWorkout: CompleteWorkout | null;
  templates: CompleteWorkout[];
  loading: boolean;
  error: Error | null;
  
  // Actions
  loadWorkouts: (userId: string) => Promise<void>;
  getWorkout: (workoutId: string) => Promise<void>;
  createWorkout: (userId: string, workout: WorkoutInput) => Promise<void>;
  updateWorkout: (workoutId: string, updates: WorkoutInput) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  clearError: () => void;
  fetchTemplates: (userId: string) => Promise<void>;
  saveAsTemplate: (workout: CompleteWorkout) => Promise<CompleteWorkout>;
  getWorkoutsByConversation: (userId: string, conversationId: string) => Promise<WorkoutWithConversation[]>; // Fixed return type
  deleteConversationWorkouts: (userId: string, conversationId: string) => Promise<void>;
  updateTemplateUsage: (templateId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial state
  workouts: [],
  currentWorkout: null,
  templates: [],
  loading: false,
  error: null,
  
  // Actions
  loadWorkouts: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const userWorkouts = await workoutService.getUserWorkouts(userId);
      set({ workouts: userWorkouts });
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to load workouts") });
    } finally {
      set({ loading: false });
    }
  },
  
  getWorkout: async (workoutId: string) => {
    try {
      set({ loading: true, error: null });
      // First check if we already have the workout in our state
      const { workouts } = get();
      const existingWorkout = workouts.find((w) => w.id === workoutId);
      
      if (existingWorkout) {
        set({ currentWorkout: existingWorkout });
        return;
      }

      const workout = await workoutService.getWorkout(workoutId);
      set({ currentWorkout: workout });
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to load workout") });
    } finally {
      set({ loading: false });
    }
  },
  
  createWorkout: async (userId: string, workoutInput: WorkoutInput) => {
    try {
      set({ loading: true, error: null });
      const newWorkout = await workoutService.createWorkout(userId, workoutInput);
      set((state) => ({ 
        workouts: [newWorkout, ...state.workouts],
        currentWorkout: newWorkout 
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to create workout") });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteWorkout: async (workoutId: string) => {
    try {
      set({ loading: true, error: null });
      await workoutService.deleteWorkout(workoutId);
      set((state) => ({ 
        workouts: state.workouts.filter((w) => w.id !== workoutId),
        currentWorkout: state.currentWorkout?.id === workoutId ? null : state.currentWorkout 
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to delete workout") });
    } finally {
      set({ loading: false });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  fetchTemplates: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const templateList = await workoutService.getTemplates(userId);
      set({ templates: templateList });
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to load templates") });
    } finally {
      set({ loading: false });
    }
  },
  
  saveAsTemplate: async (workout: CompleteWorkout) => {
    try {
      set({ loading: true, error: null });
      const template = await workoutService.saveAsTemplate(workout);
      set((state) => ({ templates: [template, ...state.templates] }));
      return template;
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to save template") });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
  
  // Fixed return type to match interface
  getWorkoutsByConversation: async (userId: string, conversationId: string) => {
    try {
      set({ loading: true, error: null });
      const conversationWorkouts = await workoutService.getWorkoutsByConversation(userId, conversationId);
      return conversationWorkouts;
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to load conversation workouts") });
      return []; // Return empty array on error
    } finally {
      set({ loading: false });
    }
  },
  
  deleteConversationWorkouts: async (userId: string, conversationId: string) => {
    try {
      set({ loading: true, error: null });
      await workoutService.deleteConversationWorkouts(userId, conversationId);
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to delete conversation workouts") });
    } finally {
      set({ loading: false });
    }
  },

  updateWorkout: async (workoutId: string, updates: WorkoutInput) => {
    try {
      set({ loading: true, error: null });
      const updatedWorkout = await workoutService.updateWorkout(workoutId, updates);
      set((state) => ({
        workouts: state.workouts.map(w => w.id === workoutId ? updatedWorkout : w),
        currentWorkout: state.currentWorkout?.id === workoutId ? updatedWorkout : state.currentWorkout
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to update workout") });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
  
  updateTemplateUsage: async (templateId: string) => {
    try {
      set({ loading: true, error: null });
      await workoutService.updateTemplateUsage(templateId);
    } catch (err) {
      set({ error: err instanceof Error ? err : new Error("Failed to update template usage") });
    } finally {
      set({ loading: false });
    }
  }
}));