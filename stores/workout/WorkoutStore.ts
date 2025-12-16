import { create } from "zustand";
import { CompleteWorkout, WorkoutWithConversation } from "@/types/workout";
import { workoutService } from "@/services/db/workout";
import { authService } from "@/services/db/auth";
import { pendingWorkoutQueue } from "@/utils/pendingWorkoutQueue";
import { retryWithBackoff } from "@/utils/retryManager";
import Toast from "react-native-toast-message";

interface WorkoutState {
  // State
  workouts: CompleteWorkout[];
  currentWorkout: CompleteWorkout | null;
  templates: CompleteWorkout[]; // Filtered from workouts
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  pendingWorkoutsCount: number;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  syncPendingWorkouts: () => Promise<void>;
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

  // Template methods - work from workouts array, no separate API
  handleTemplateDeduplication: () => Promise<void>;

  saveAsTemplate: (workout: CompleteWorkout) => Promise<CompleteWorkout>;
  getWorkoutsByConversation: (
    conversationId: string
  ) => Promise<WorkoutWithConversation[]>;
  deleteConversationWorkouts: (conversationId: string) => Promise<void>;
  getPublicWorkout: (workoutId: string) => Promise<void>;
  fetchTemplates: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => {
  const loadWorkoutsData = async () => {
    try {
      set({ loading: true, error: null });

      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const userWorkouts = await workoutService.getUserWorkouts(
        session.user.id
      );
      set({ workouts: userWorkouts, initialized: true });
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
    pendingWorkoutsCount: 0,

    // Called by authStore when user becomes authenticated
    initializeIfAuthenticated: async () => {
      // console.log("[WorkoutStore] initializeIfAuthenticated called");

      const { initialized, loading } = get();

      // Always check and sync pending workouts, even if already initialized
      // This ensures queue processing happens on every app startup
      const queueBeforeSync = await pendingWorkoutQueue.getAll();
      // console.log("[WorkoutStore] 🔍 Queue contents on app startup:", {
      //   count: queueBeforeSync.length,
      //   workouts: queueBeforeSync.map((item) => ({
      //     id: item.id,
      //     name: item.workout.name,
      //     attempts: item.attempts,
      //     addedAt: new Date(item.addedAt).toISOString(),
      //     lastAttemptAt: item.lastAttemptAt
      //       ? new Date(item.lastAttemptAt).toISOString()
      //       : "never",
      //   })),
      // });

      // Try to sync any pending workouts from previous session
      await get().syncPendingWorkouts();

      // Only load workouts data if not already initialized
      if (initialized || loading) {
        // console.log(
        //   "[WorkoutStore] Already initialized or loading, skipping data load"
        // );
        return;
      }

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
        pendingWorkoutsCount: 0,
      });
    },

    // Actions
    loadWorkouts: async () => {
      await loadWorkoutsData();
    },

    handleTemplateDeduplication: async () => {
      const { templates } = get();

      // Get last 10 templates (most recent)
      const recentTemplates = (templates || [])
        .sort(
          (a: CompleteWorkout, b: CompleteWorkout) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 10);

      // Group by normalized definition ID sets
      const groups = new Map<string, CompleteWorkout[]>();

      recentTemplates.forEach((template: CompleteWorkout) => {
        const definitionIds = (template.workout_exercises || [])
          .map((ex: any) => ex.definition_id)
          .filter(Boolean)
          .sort(); // Sort for consistent grouping regardless of order

        const key = definitionIds.join(",");
        const existingGroup = groups.get(key);
        if (!existingGroup) {
          groups.set(key, []);
        }
        groups.get(key)!.push(template);
      });

      // For each group with duplicates, keep newest and delete others
      for (const [key, templateGroup] of groups) {
        if (templateGroup.length > 1) {
          const sorted = templateGroup.sort(
            (a: CompleteWorkout, b: CompleteWorkout) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          const [newest, ...duplicates] = sorted;

          // Delete the duplicates
          for (const duplicate of duplicates) {
            await get().deleteWorkout(duplicate.id);
          }
        }
      }

      // Refresh templates after deduplication
      const { workouts } = get();
      const updatedTemplates = workouts.filter(
        (workout: CompleteWorkout) =>
          workout.workout_exercises.length > 0 && !workout.is_template === false
      );
      set({ templates: updatedTemplates });
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
      // console.log("[WorkoutStore] 📝 createWorkout called for:", workout.name);

      // 1. Add to queue FIRST (never fails)
      await pendingWorkoutQueue.add(workout);
      // console.log("[WorkoutStore] ✅ Added to queue:", workout.id);

      try {
        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        // console.log(
        //   "[WorkoutStore] 🚀 Starting background save with retry logic"
        // );

        // 2. Attempt save with retry + Toast notifications (BACKGROUND)
        // We do NOT await this so the UI can proceed immediately
        retryWithBackoff(
          () => workoutService.createWorkout(session.user.id, workout),
          {
            maxRetries: 3,
            delays: [5000, 15000], // 5s, 15s delays
            onRetry: (attempt, error) => {
              // console.log(
              //   `[WorkoutStore] ⚠️ Retry attempt ${attempt}/3 for workout:`,
              //   workout.id
              // );
              Toast.show({
                type: "info",
                text1: "Please check your network",
                text2: `Retrying (${attempt}/3)`,
              });
            },
          }
        )
          .then(async (newWorkout) => {
            // 3. SUCCESS - Remove from queue and add to store
            // console.log(
            //   "[WorkoutStore] ✅ Save successful, removing from queue:",
            //   workout.id
            // );
            await pendingWorkoutQueue.remove(workout.id);
            Toast.show({ type: "success", text1: "Workout saved!" });

            // Add to store only on success
            set((state) => ({
              workouts: [newWorkout, ...state.workouts],
              currentWorkout: newWorkout,
            }));
          })
          .catch((err) => {
            // 4. FAILED after all retries - Stay in queue only, don't add to store
            console.error(
              "[WorkoutStore] ❌ Save failed after all retries, kept in queue:",
              workout.id,
              err
            );
            Toast.show({
              type: "error",
              text1: "We can't save your workout right now",
              text2: "Please try again later.",
            });

            set((state) => ({
              error:
                err instanceof Error
                  ? err
                  : new Error("Failed to sync workout"),
            }));
          });
      } catch (err) {
        console.error("[WorkoutStore] Error initiating save:", err);
        set({
          error:
            err instanceof Error ? err : new Error("Failed to initiate save"),
        });
      } finally {
        // Update pending count
        const remaining = await pendingWorkoutQueue.getAll();
        // console.log(
        //   "[WorkoutStore] 📊 Pending workouts count:",
        //   remaining.length
        // );
        set({ pendingWorkoutsCount: remaining.length });
      }
    },

    syncPendingWorkouts: async () => {
      // console.log("[WorkoutStore] 🔄 Checking for pending workouts...");
      const pending = await pendingWorkoutQueue.getAll();
      // console.log(`[WorkoutStore] Found ${pending.length} pending workouts`);

      if (pending.length === 0) {
        set({ pendingWorkoutsCount: 0 });
        return;
      }

      // console.log(
      //   `[WorkoutStore] 🚀 Syncing ${pending.length} pending workouts`
      // );

      // Show initial toast
      Toast.show({
        type: "info",
        text1: `Attempting to save ${pending.length} workout${
          pending.length > 1 ? "s" : ""
        }`,
      });

      let successCount = 0;
      const syncedWorkouts: CompleteWorkout[] = [];

      for (const item of pending) {
        console.log(`[WorkoutStore] 📤 Attempting to sync workout:`, {
          id: item.id,
          name: item.workout.name,
          attempts: item.attempts,
        });

        try {
          const session = await authService.getSession();
          if (!session?.user?.id) {
            console.log("[WorkoutStore] ⚠️ No session found, skipping sync");
            continue;
          }

          const savedWorkout = await workoutService.createWorkout(
            session.user.id,
            item.workout
          );
          await pendingWorkoutQueue.remove(item.id);
          syncedWorkouts.push(savedWorkout);
          successCount++;
          console.log(
            `[WorkoutStore] ✅ Successfully synced workout: ${item.id}`
          );
        } catch (err) {
          console.error(
            `[WorkoutStore] ❌ Failed to sync workout ${item.id}:`,
            err
          );
          await pendingWorkoutQueue.updateAttempt(item.id);
        }
      }

      console.log(
        `[WorkoutStore] 📊 Sync complete. Success: ${successCount}/${pending.length}`
      );

      if (successCount > 0) {
        Toast.show({
          type: "success",
          text1: `Synced ${successCount} workout${successCount > 1 ? "s" : ""}`,
        });

        // Add synced workouts to store
        set((state) => ({
          workouts: [...syncedWorkouts, ...state.workouts],
        }));

        // Reload workouts to ensure consistency with database
        await get().loadWorkouts();
      }

      // Update pending count
      const remaining = await pendingWorkoutQueue.getAll();
      console.log(
        `[WorkoutStore] 📊 Remaining pending workouts: ${remaining.length}`
      );
      set({ pendingWorkoutsCount: remaining.length });
    },

    updateWorkout: async (
      workoutId: string,
      updates: Partial<CompleteWorkout>
    ): Promise<CompleteWorkout> => {
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

    saveAsTemplate: async (workout: CompleteWorkout) => {
      try {
        set({ loading: true, error: null });
        const template = await workoutService.saveAsTemplate(workout);
        set((state) => ({
          workouts: [template, ...state.workouts],
          templates: [template, ...state.templates],
        }));
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

    fetchTemplates: () => {
      const { workouts } = get();
      const templates = workouts.filter(
        (workout) => workout.workout_exercises.length > 0 && workout.is_template
      );
      set({ templates });
    },
  };
});
