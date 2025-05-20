// stores/exerciseStore.ts
import { create } from 'zustand';
import { ExerciseDefinition } from "@/types/workout";
import { ExerciseDefinitionService } from "@/services/db/exerciseDefinition";

interface ExerciseStoreState {
  exercises: ExerciseDefinition[];
  loading: boolean;
  error: Error | null;
  
  // Actions
  loadExercises: () => Promise<void>;
  refreshExercises: () => Promise<void>;
}

export const useExerciseStore = create<ExerciseStoreState>((set) => {
  const exerciseService = new ExerciseDefinitionService();
  
  const fetchExercises = async () => {
    try {
      console.log("🏋️‍♂️ ExerciseStore: Initializing exercise data fetch...");
      set({ loading: true, error: null });

      const data = await exerciseService.getAllExerciseDefinitions();

      console.log(`✅ ExerciseStore: Loaded ${data.length} exercises successfully`);
      
      set({ exercises: data });
    } catch (err) {
      console.error("❌ ExerciseStore: Failed to fetch exercises:", err);
      set({ 
        error: err instanceof Error ? err : new Error("Failed to fetch exercises") 
      });
    } finally {
      set({ loading: false });
    }
  };

  // Initialize data loading
  fetchExercises();
  
  return {
    // State
    exercises: [],
    loading: true,
    error: null,
    
    // Actions
    loadExercises: fetchExercises,
    refreshExercises: fetchExercises,
  };
});