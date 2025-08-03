import { create } from "zustand";
import { CompleteWorkout, WorkoutWithConversation } from "@/types/workout";
import { workoutService } from "@/services/db/workout";
import { authService } from "@/services/db/auth";

interface WorkoutState {
  // State
  workouts: CompleteWorkout[];
  currentWorkout: CompleteWorkout | null;
  templates: CompleteWorkout[];
  loading: boolean;
  error: Error | null;

  // Actions - removed userId parameters
  loadWorkouts: () => Promise<void>;
  getWorkout: (workoutId: string) => Promise<void>;
  createWorkout: (workout: CompleteWorkout) => Promise<void>;
  updateWorkout: (workoutId: string, updates: CompleteWorkout) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  clearError: () => void;
  fetchTemplates: () => Promise<void>;
  saveAsTemplate: (workout: CompleteWorkout) => Promise<CompleteWorkout>;
  getWorkoutsByConversation: (
    conversationId: string
  ) => Promise<WorkoutWithConversation[]>;
  deleteConversationWorkouts: (conversationId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial state
  workouts: [],
  currentWorkout: null,
  templates: [],
  loading: false,
  error: null,

  // Actions
  loadWorkouts: async () => {
    try {
      set({ loading: true, error: null });

      // Get user ID from session
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const userWorkouts = await workoutService.getUserWorkouts(
        session.user.id
      );
      set({ workouts: userWorkouts });
    } catch (err) {
      console.error("[WorkoutStore] Error loading workouts:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to load workouts"),
      });
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
      console.error("[WorkoutStore] Error getting workout:", err);
      set({
        error: err instanceof Error ? err : new Error("Failed to load workout"),
      });
    } finally {
      set({ loading: false });
    }
  },

  createWorkout: async (workout: CompleteWorkout) => {
    try {
      set({ loading: true, error: null });

      // Get user ID from session
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const newWorkout = await workoutService.createWorkout(
        session.user.id,
        workout
      );

      // Add to workouts array - this triggers template refresh
      set((state) => ({
        workouts: [newWorkout, ...state.workouts],
        currentWorkout: newWorkout,
      }));
    } catch (err) {
      console.error("[WorkoutStore] Error creating workout:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to create workout"),
      });
    } finally {
      set({ loading: false });
    }
  },

  updateWorkout: async (workoutId: string, updates: CompleteWorkout) => {
    try {
      set({ loading: true, error: null });
      const updatedWorkout = await workoutService.updateWorkout(
        workoutId,
        updates
      );
      set((state) => ({
        workouts: state.workouts.map((w) =>
          w.id === workoutId ? updatedWorkout : w
        ),
        currentWorkout:
          state.currentWorkout?.id === workoutId
            ? updatedWorkout
            : state.currentWorkout,
      }));
    } catch (err) {
      console.error("[WorkoutStore] Error updating workout:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to update workout"),
      });
      throw err;
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
        currentWorkout:
          state.currentWorkout?.id === workoutId ? null : state.currentWorkout,
      }));
    } catch (err) {
      console.error("[WorkoutStore] Error deleting workout:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to delete workout"),
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      set({ loading: true, error: null });

      // Get user ID from session
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const templateList = await workoutService.getTemplates(session.user.id);
      set({ templates: templateList });
    } catch (err) {
      console.error("[WorkoutStore] Error fetching templates:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to load templates"),
      });
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
      console.error("[WorkoutStore] Error saving template:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to save template"),
      });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getWorkoutsByConversation: async (conversationId: string) => {
    try {
      set({ loading: true, error: null });

      // Get user ID from session
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const conversationWorkouts =
        await workoutService.getWorkoutsByConversation(
          session.user.id,
          conversationId
        );
      return conversationWorkouts;
    } catch (err) {
      console.error("[WorkoutStore] Error getting conversation workouts:", err);
      set({
        error:
          err instanceof Error
            ? err
            : new Error("Failed to load conversation workouts"),
      });
      return []; // Return empty array on error
    } finally {
      set({ loading: false });
    }
  },

  deleteConversationWorkouts: async (conversationId: string) => {
    try {
      set({ loading: true, error: null });

      // Get user ID from session
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      await workoutService.deleteConversationWorkouts(
        session.user.id,
        conversationId
      );
    } catch (err) {
      console.error(
        "[WorkoutStore] Error deleting conversation workouts:",
        err
      );
      set({
        error:
          err instanceof Error
            ? err
            : new Error("Failed to delete conversation workouts"),
      });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
