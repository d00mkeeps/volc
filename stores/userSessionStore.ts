import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  CompleteWorkout,
  WorkoutExercise,
  WorkoutExerciseSet,
} from "@/types/workout";
import { workoutService } from "@/services/db/workout";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useUserStore } from "@/stores/userProfileStore";
import { useWorkoutAnalysisStore } from "./analysis/WorkoutAnalysisStore";
import { imageService } from "@/services/api/imageService";
import { useWorkoutStore } from "./workout/WorkoutStore";
import { filterIncompleteSets, isSetComplete } from "@/utils/setValidation";
import { useExerciseStore } from "./workout/exerciseStore";
import Toast from "react-native-toast-message";
import { AppState, AppStateStatus } from "react-native";
import { workoutPersistence } from "@/utils/workoutPersistence";
import { useConversationStore } from "@/stores/chat/ConversationStore";

interface UserSessionState {
  currentWorkout: CompleteWorkout | null;
  isActive: boolean;
  isPaused: boolean;
  pausedAt: Date | null;
  startTime: Date | null;
  elapsedSeconds: number;
  scheduledTime?: string;
  totalPausedMs: number;

  selectedTemplate: CompleteWorkout | null;
  showTemplateSelector: boolean;
  isWorkoutDetailOpen: boolean;

  pendingImageId: string | null;

  startWorkout: (templateOrWorkout: CompleteWorkout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  togglePause: () => void;
  cancelWorkout: () => void;
  hasAtLeastOneCompleteSet: () => boolean;
  finishWorkout: () => void;
  showWorkoutSavedPrompt: boolean;
  clearWorkoutSavedPrompt: () => void;
  saveCompletedWorkout: (metadata: {
    name: string;
    notes: string;
    imageId?: string;
  }) => Promise<CompleteWorkout>;
  initializeAnalysisAndChat: () => Promise<any>;
  updateElapsedTime: () => void;
  updateCurrentWorkout: (workout: CompleteWorkout) => void;
  updateExercise: (
    exerciseId: string,
    updatedFields: Partial<WorkoutExercise>
  ) => void;
  resetSession: () => void;

  setSelectedTemplate: (template: CompleteWorkout | null) => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  setWorkoutDetailOpen: (isOpen: boolean) => void;

  setPendingImage: (imageId: string | null) => void;

  getTimeString: () => string;
  getProgress: () => { completed: number; total: number };
}

export function createEmptyWorkout(userId: string): CompleteWorkout {
  const now = new Date().toISOString();
  return {
    id: `temp-${Date.now()}`,
    user_id: userId,
    name: "Quick Workout",
    notes: "",
    is_template: false,
    workout_exercises: [],
    created_at: now,
    updated_at: now,
  };
}

/**
 * Debounce helper for auto-save
 * (/stores/userSessionStore.debounce)
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useUserSessionStore = create<UserSessionState>((set, get) => ({
  // Initial state
  currentWorkout: null,
  pausedAt: null,
  totalPausedMs: 0,
  isActive: false,
  showWorkoutSavedPrompt: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  scheduledTime: undefined,
  selectedTemplate: null,
  showTemplateSelector: false,
  isWorkoutDetailOpen: false,
  pendingImageId: null,

  startWorkout: (templateOrWorkout) => {
    console.log("🟢 [Store] startWorkout called with:", templateOrWorkout);

    const userProfile = useUserStore.getState().userProfile;
    if (!userProfile?.user_id) {
      console.error("❌ [Store] Cannot start workout: No user profile found");
      return;
    }

    let workout: CompleteWorkout;
    let selectedTemplate: CompleteWorkout | null = null;

    // If it's a template, convert to workout instance
    if (
      templateOrWorkout.is_template ||
      !templateOrWorkout.workout_exercises[0]?.workout_id
    ) {
      console.log("🟢 [Store] Converting template to workout");
      selectedTemplate = templateOrWorkout;
      const now = new Date().toISOString();
      const workoutId = uuidv4();

      workout = {
        ...templateOrWorkout,
        id: workoutId,
        user_id: userProfile.user_id.toString(),
        template_id: templateOrWorkout.id,
        is_template: false,
        created_at: now,
        updated_at: now,
        workout_exercises: templateOrWorkout.workout_exercises.map(
          (exercise, index) => ({
            ...exercise,
            id: `exercise-${Date.now()}-${index}`,
            workout_id: workoutId,
            workout_exercise_sets: exercise.workout_exercise_sets.map(
              (set, setIndex) => ({
                ...set,
                id: `set-${Date.now()}-${index}-${setIndex}`,
                exercise_id: `exercise-${Date.now()}-${index}`,
                is_completed: false,
              })
            ),
          })
        ),
      };
      console.log("🟢 [Store] Created workout:", workout.id);
    } else {
      console.log("🟢 [Store] Using workout as-is");
      workout = templateOrWorkout;
    }

    console.log(
      "🟢 [Store] Setting state - isActive: true, workoutId:",
      workout.id
    );
    set({
      currentWorkout: workout,
      selectedTemplate,
      isActive: true,
      isPaused: false,
      startTime: new Date(),
      elapsedSeconds: 0,
      totalPausedMs: 0,
      pausedAt: null,
      scheduledTime: workout.scheduled_time,
    });

    console.log("✅ [Store] startWorkout complete");
  },

  pauseWorkout: () => {
    const { startTime, elapsedSeconds } = get();
    const pausedAt = new Date();
    set({
      isPaused: true,
      pausedAt: pausedAt,
    });
  },

  clearWorkoutSavedPrompt: () => {
    set({ showWorkoutSavedPrompt: false });
  },

  resumeWorkout: () => {
    const { startTime, pausedAt, totalPausedMs } = get();

    if (pausedAt) {
      const now = new Date();
      const pauseDuration = now.getTime() - pausedAt.getTime();
      const newTotalPausedMs = totalPausedMs + pauseDuration;

      set({
        isPaused: false,
        pausedAt: null,
        totalPausedMs: newTotalPausedMs,
      });
    } else {
      set({ isPaused: false, pausedAt: null });
    }
  },

  togglePause: () => {
    const { isPaused } = get();

    if (isPaused) {
      get().resumeWorkout();
    } else {
      get().pauseWorkout();
    }
  },

  updateCurrentWorkout: (workout) => {
    const { isActive, currentWorkout: oldWorkout } = get();

    set({ currentWorkout: workout });

    // Verify the update took effect
    const { currentWorkout: newWorkout } = get();
  },

  cancelWorkout: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;
    workoutPersistence.clear();
    set({
      pausedAt: null,
      currentWorkout: null,
      isActive: false,
      isPaused: false,
      startTime: null,
      totalPausedMs: 0,
      elapsedSeconds: 0,
      scheduledTime: undefined,
    });
  },

  updateExercise: (
    exerciseId: string,
    updatedFields: Partial<WorkoutExercise>
  ) => {
    console.log("🏪 Store.updateExercise called:", {
      exerciseId,
      updatedFields,
    });
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedWorkout: CompleteWorkout = {
      ...currentWorkout,
      workout_exercises: currentWorkout.workout_exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, ...updatedFields }
          : exercise
      ),
      updated_at: new Date().toISOString(),
    };

    set({ currentWorkout: updatedWorkout });
    console.log("✅ Store updated, new workout:", get().currentWorkout);
  },

  initializeAnalysisAndChat: async () => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      throw new Error("No workout for analysis");
    }

    // Extract definition IDs for analysis
    const definitionIds = currentWorkout.workout_exercises
      .map((ex) => ex.definition_id)
      .filter((id): id is string => Boolean(id));

    if (definitionIds.length === 0) {
      throw new Error("No exercises found for analysis");
    }

    // Start analysis and create conversation
    const analysisResult = await useWorkoutAnalysisStore
      .getState()
      .initiateBackgroundAnalysis(definitionIds);

    if (analysisResult?.conversation_id) {
      useConversationStore
        .getState()
        .setActiveConversation(analysisResult.conversation_id);
    }

    return analysisResult;
  },

  saveCompletedWorkout: async (metadata: {
    name: string;
    notes: string;
    imageId?: string;
  }) => {
    const { currentWorkout, pendingImageId } = get();
    if (!currentWorkout) {
      throw new Error("No workout to save");
    }

    const userProfile = useUserStore.getState().userProfile;
    if (!userProfile?.user_id) {
      throw new Error("No user profile found");
    }

    // Get exercise definitions for validation
    const { exercises } = useExerciseStore.getState();

    // Filter out incomplete sets
    const filteredWorkout = filterIncompleteSets(currentWorkout, exercises);

    // Get user's preferred units
    const isImperial = userProfile.is_imperial ?? false;
    const preferredUnits = {
      weight: isImperial ? ("lbs" as const) : ("kg" as const),
      distance: isImperial ? ("mi" as const) : ("km" as const),
    };

    // Create complete workout with metadata and normalized units
    const workoutToSave: CompleteWorkout = {
      ...filteredWorkout,
      name: metadata.name,
      notes: metadata.notes,
      image_id: metadata.imageId || pendingImageId || null,
      workout_exercises: filteredWorkout.workout_exercises.map((exercise) => ({
        ...exercise,
        weight_unit: preferredUnits.weight,
        distance_unit: preferredUnits.distance,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Initiate save in background (don't await - WorkoutStore handles retry logic)
    useWorkoutStore.getState().createWorkout(workoutToSave);

    // Clear persistence immediately
    workoutPersistence.clear();

    // Handle image commit in background (don't await)
    if (pendingImageId) {
      imageService.commitImage(pendingImageId).then((commitResult) => {
        if (!commitResult.success) {
          console.error("Failed to commit image:", commitResult.error);
        }
      });
      set({ pendingImageId: null });
    }

    // Update session with saved workout
    set({ currentWorkout: workoutToSave });

    useDashboardStore.getState().refreshDashboard();

    // Show success toast (handled by WorkoutStore)
    // WorkoutStore shows "Workout saved!" or "We can't save your workout right now"

    set({ showWorkoutSavedPrompt: true });

    return workoutToSave;
  },

  finishWorkout: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      throw new Error("No workout to finish");
    }

    // Helper function to check if a set has actual data
    const setHasData = (set: WorkoutExerciseSet) => {
      return (
        (set.weight !== undefined && set.weight !== null) ||
        (set.reps !== undefined && set.reps !== null) ||
        (set.distance !== undefined && set.distance !== null) ||
        (set.duration !== undefined && set.duration !== null)
      );
    };

    // Filter out exercises that have no sets with actual data
    const exercisesWithData = currentWorkout.workout_exercises.filter(
      (exercise) => {
        return exercise.workout_exercise_sets.some((set) => setHasData(set));
      }
    );

    // Update the workout with only exercises that have data
    const cleanedWorkout = {
      ...currentWorkout,
      workout_exercises: exercisesWithData,
    };
    workoutPersistence.clear();
    // Update the store with cleaned workout
    set({
      currentWorkout: cleanedWorkout,
      isActive: false,
      isPaused: false,
    });

    // Refresh dashboard for immediate UI feedback
    useDashboardStore.getState().refreshDashboard();
  },

  setPendingImage: (imageId) => {
    set({ pendingImageId: imageId });
  },

  hasAtLeastOneCompleteSet: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) return false;

    const { exercises } = useExerciseStore.getState();

    return currentWorkout.workout_exercises.some((exercise) => {
      const definition = exercises.find(
        (ex) => ex.id === exercise.definition_id
      );
      return exercise.workout_exercise_sets.some((set) =>
        isSetComplete(set, definition)
      );
    });
  },

  resetSession: () => {
    set({
      currentWorkout: null,
      isActive: false,
      isPaused: false,
      startTime: null,
      pausedAt: null,
      totalPausedMs: 0,
      elapsedSeconds: 0,
      scheduledTime: undefined,
      selectedTemplate: null,
      pendingImageId: null,
    });
  },

  updateElapsedTime: () => {
    const { startTime, isPaused, totalPausedMs } = get();
    if (startTime && !isPaused) {
      const now = new Date();
      const rawElapsed = now.getTime() - startTime.getTime();
      const adjustedElapsed = Math.floor((rawElapsed - totalPausedMs) / 1000);
      set({ elapsedSeconds: adjustedElapsed });
    }
  },

  // Template actions
  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
  },

  openTemplateSelector: () => {
    set({ showTemplateSelector: true });
  },

  closeTemplateSelector: () => {
    set({ showTemplateSelector: false });
  },

  setWorkoutDetailOpen: (isOpen) => {
    set({ isWorkoutDetailOpen: isOpen });
  },

  // Computed values
  getTimeString: () => {
    const { isActive, elapsedSeconds, scheduledTime } = get();

    if (!isActive && scheduledTime) {
      const now = new Date();
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const scheduled = new Date();
      scheduled.setHours(hours, minutes, 0, 0);

      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      const secondsUntil = Math.max(
        0,
        Math.floor((scheduled.getTime() - now.getTime()) / 1000)
      );
      return formatTime(secondsUntil);
    }

    return formatTime(elapsedSeconds);
  },

  getProgress: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) return { completed: 0, total: 0 };

    const totalSets =
      currentWorkout.workout_exercises?.reduce(
        (sum, exercise) => sum + (exercise.workout_exercise_sets?.length || 0),
        0
      ) || 0;

    const completedSets =
      currentWorkout.workout_exercises?.reduce(
        (sum, exercise) =>
          sum +
          (exercise.workout_exercise_sets?.filter((set) => set.is_completed)
            .length || 0),
        0
      ) || 0;

    return { completed: completedSets, total: totalSets };
  },
}));

// ============================================
// PERSISTENCE INITIALIZATION & AUTO-SAVE
// ============================================

/**
 * Initialize persistence layer
 * (/stores/userSessionStore.initializePersistence)
 */
(async () => {
  // Load persisted workout on app start
  const persisted = await workoutPersistence.load();

  if (persisted) {
    console.log("🔄 Restoring persisted workout session");
    useUserSessionStore.setState({
      currentWorkout: persisted.workout,
      isActive: true,
      startTime: persisted.startTime,
      elapsedSeconds: persisted.elapsedSeconds,
      totalPausedMs: persisted.totalPausedMs,
      isPaused: persisted.isPaused,
      pausedAt: persisted.pausedAt,
    });
  }
})();

/**
 * Debounced save function (500ms)
 * (/stores/userSessionStore.debouncedSave)
 */
const debouncedSave = debounce(() => {
  const state = useUserSessionStore.getState();
  if (state.currentWorkout && state.isActive && state.startTime) {
    workoutPersistence.save({
      workout: state.currentWorkout,
      startTime: state.startTime,
      elapsedSeconds: state.elapsedSeconds,
      totalPausedMs: state.totalPausedMs,
      isPaused: state.isPaused,
      pausedAt: state.pausedAt,
    });
  }
}, 500);

/**
 * Subscribe to currentWorkout changes for auto-save
 * (/stores/userSessionStore.subscribe)
 */
let previousWorkout: CompleteWorkout | null = null;

useUserSessionStore.subscribe((state) => {
  // Only trigger save if currentWorkout actually changed
  if (state.currentWorkout && state.currentWorkout !== previousWorkout) {
    previousWorkout = state.currentWorkout;
    debouncedSave();
  } else if (!state.currentWorkout) {
    previousWorkout = null;
  }
});

/**
 * AppState listener for immediate save on background
 * (/stores/userSessionStore.appStateListener)
 */
const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === "background") {
    const state = useUserSessionStore.getState();
    if (state.currentWorkout && state.isActive && state.startTime) {
      // Immediate save (no debounce) when backgrounding
      workoutPersistence.save({
        workout: state.currentWorkout,
        startTime: state.startTime,
        elapsedSeconds: state.elapsedSeconds,
        totalPausedMs: state.totalPausedMs,
        isPaused: state.isPaused,
        pausedAt: state.pausedAt,
      });
    }
  }
};

// Set up AppState listener
AppState.addEventListener("change", handleAppStateChange);

// Helper function
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
