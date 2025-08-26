import { create } from "zustand";
import { ExerciseDefinition } from "@/types/workout";
import { ExerciseDefinitionService } from "@/services/db/exerciseDefinition";
import { authService } from "@/services/db/auth";

interface ExerciseStoreState {
  exercises: ExerciseDefinition[];
  loading: boolean;
  error: Error | null;
  initialized: boolean;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;

  // Public methods (called by components)
  loadExercises: () => Promise<void>;
  refreshExercises: () => Promise<void>;
}

export const useExerciseStore = create<ExerciseStoreState>((set, get) => {
  const exerciseService = new ExerciseDefinitionService();

  const fetchExercises = async () => {
    try {
      set({ loading: true, error: null });

      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const data = await exerciseService.getAllExerciseDefinitions();

      set({ exercises: data, initialized: true });
    } catch (err) {
      console.error("❌ ExerciseStore: Failed to fetch exercises:", err);
      set({
        error:
          err instanceof Error ? err : new Error("Failed to fetch exercises"),
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  };

  return {
    // Initial state - clean slate, no immediate loading
    exercises: [],
    loading: false,
    error: null,
    initialized: false,

    // Called by authStore when user becomes authenticated
    initializeIfAuthenticated: async () => {
      const { initialized, loading } = get();
      if (initialized || loading) return; // Prevent double-initialization

      await fetchExercises();
    },

    // Called by authStore when user logs out
    clearData: () => {
      set({
        exercises: [],
        loading: false,
        error: null,
        initialized: false,
      });
    },

    // Public methods for components
    loadExercises: fetchExercises,
    refreshExercises: fetchExercises,
  };
});
