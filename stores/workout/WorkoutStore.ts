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
  initialized: boolean;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;

  loadWorkouts: () => Promise<void>;
  getWorkout: (workoutId: string) => Promise<void>;
  createWorkout: (workout: CompleteWorkout) => Promise<void>;
  updateWorkout: (
    workoutId: string,
    updates: Partial<CompleteWorkout>
  ) => Promise<CompleteWorkout>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  clearError: () => void;
  fetchTemplates: () => Promise<void>;
  saveAsTemplate: (workout: CompleteWorkout) => Promise<CompleteWorkout>;
  getWorkoutsByConversation: (
    conversationId: string
  ) => Promise<WorkoutWithConversation[]>;
  deleteConversationWorkouts: (conversationId: string) => Promise<void>;
  getPublicWorkout: (workoutId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => {
  const loadWorkoutsData = async () => {
    try {
      console.log("Loading workouts...");
      set({ loading: true, error: null });

      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const userWorkouts = await workoutService.getUserWorkouts(
        session.user.id
      );
      set({ workouts: userWorkouts, initialized: true });
      console.log(`Loaded ${userWorkouts.length} workouts`);
    } catch (err) {
      console.error("[WorkoutStore] Error loading workouts:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to load workouts"),
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  };

  return {
    // Initial state - clean slate
    workouts: [],
    currentWorkout: null,
    templates: [],
    loading: false,
    error: null,
    initialized: false,

    // Called by authStore when user becomes authenticated
    initializeIfAuthenticated: async () => {
      const { initialized, loading } = get();
      if (initialized || loading) return; // Prevent double-initialization

      await loadWorkoutsData();
    },

    // Called by authStore when user logs out
    clearData: () => {
      set({
        workouts: [],
        currentWorkout: null,
        templates: [],
        loading: false,
        error: null,
        initialized: false,
      });
    },

    // Actions
    loadWorkouts: async () => {
      await loadWorkoutsData();
    },

    getWorkout: async (workoutId: string) => {
      try {
        set({ loading: true, error: null });
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
          error:
            err instanceof Error ? err : new Error("Failed to load workout"),
        });
      } finally {
        set({ loading: false });
      }
    },
    getPublicWorkout: async (workoutId: string) => {
      try {
        set({ loading: true, error: null });
        const { workouts } = get();
        const existingWorkout = workouts.find((w) => w.id === workoutId);

        if (existingWorkout) {
          set({ currentWorkout: existingWorkout });
          return;
        }

        const workout = await workoutService.getPublicWorkout(workoutId);
        console.log("🔍 Public workout data received:", workout);
        set({ currentWorkout: workout });
      } catch (err) {
        console.error("[WorkoutStore] Error getting public workout:", err);
        set({
          error:
            err instanceof Error
              ? err
              : new Error("Failed to load public workout"),
        });
      } finally {
        set({ loading: false });
      }
    },

    createWorkout: async (workout: CompleteWorkout) => {
      try {
        set({ loading: true, error: null });

        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        const newWorkout = await workoutService.createWorkout(
          session.user.id,
          workout
        );

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

    updateWorkout: async (
      workoutId: string,
      updates: Partial<CompleteWorkout>
    ): Promise<CompleteWorkout> => {
      // 🔥 Change return type
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
        }));

        return updatedWorkout;
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
      // Optimistic update - remove immediately
      const { workouts, currentWorkout } = get();
      const workoutToDelete = workouts.find((w) => w.id === workoutId);

      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== workoutId),
        currentWorkout:
          state.currentWorkout?.id === workoutId ? null : state.currentWorkout,
        error: null,
      }));

      try {
        await workoutService.deleteWorkout(workoutId);
      } catch (err) {
        console.error("[WorkoutStore] Error deleting workout:", err);

        // Rollback on failure - restore the workout
        if (workoutToDelete) {
          set((state) => ({
            workouts: [...state.workouts, workoutToDelete].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            ),
            currentWorkout:
              currentWorkout?.id === workoutId
                ? workoutToDelete
                : state.currentWorkout,
            error:
              err instanceof Error
                ? err
                : new Error("Failed to delete workout"),
          }));
        }
        throw err;
      }
    },

    fetchTemplates: async () => {
      try {
        set({ loading: true, error: null });

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
        console.error(
          "[WorkoutStore] Error getting conversation workouts:",
          err
        );
        set({
          error:
            err instanceof Error
              ? err
              : new Error("Failed to load conversation workouts"),
        });
        return [];
      } finally {
        set({ loading: false });
      }
    },

    deleteConversationWorkouts: async (conversationId: string) => {
      try {
        set({ loading: true, error: null });

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
  };
});
