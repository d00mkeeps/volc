import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { CompleteWorkout, WorkoutExercise } from "@/types/workout";
import { workoutService } from "@/services/db/workout";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useUserStore } from "@/stores/userProfileStore";
import { useWorkoutAnalysisStore } from "./analysis/WorkoutAnalysisStore";
import { imageService } from "@/services/api/imageService";
import { useWorkoutStore } from "./workout/WorkoutStore";
import { filterIncompleteSets, isSetComplete } from "@/utils/setValidation";
import { useExerciseStore } from "./workout/exerciseStore";

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

  activeConversationId: string | null;

  pendingImageId: string | null;

  startWorkout: (workout: CompleteWorkout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  togglePause: () => void;
  cancelWorkout: () => void;
  hasAtLeastOneCompleteSet: () => boolean;
  finishWorkout: () => void;
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
    updatedExercise: Partial<WorkoutExercise>
  ) => void;
  resetSession: () => void;

  setSelectedTemplate: (template: CompleteWorkout | null) => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  selectTemplate: (template: CompleteWorkout) => void;

  setActiveConversation: (id: string | null) => void;

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

export const useUserSessionStore = create<UserSessionState>((set, get) => ({
  // Initial state
  currentWorkout: null,
  pausedAt: null,
  totalPausedMs: 0,
  isActive: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  scheduledTime: undefined,
  selectedTemplate: null,
  showTemplateSelector: false,
  activeConversationId: null,
  pendingImageId: null,
  startWorkout: (workout) => {
    set({
      currentWorkout: workout,
      isActive: true,
      isPaused: false,
      startTime: new Date(),
      elapsedSeconds: 0,
      scheduledTime: workout.scheduled_time,
    });
  },

  pauseWorkout: () => {
    const { startTime, elapsedSeconds } = get();
    const pausedAt = new Date();
    set({
      isPaused: true,
      pausedAt: pausedAt,
    });
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
      set({ activeConversationId: analysisResult.conversation_id });
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

    // Single database save with complete data
    const savedWorkout = await workoutService.saveCompletedWorkout(
      userProfile.user_id.toString(),
      workoutToSave
    );

    // Handle image commit if needed
    if (pendingImageId) {
      const commitResult = await imageService.commitImage(pendingImageId);
      if (!commitResult.success) {
        throw new Error(commitResult.error || "Failed to commit image");
      }
      set({ pendingImageId: null });
    }

    // Update session with saved workout
    set({ currentWorkout: savedWorkout });

    useDashboardStore.getState().refreshDashboard();

    // Refresh workout store to show the new workout in workout lists
    useWorkoutStore.getState().loadWorkouts();

    return savedWorkout;
  },

  finishWorkout: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      throw new Error("No workout to finish");
    }

    // ONLY: Mark workout as completed in session (no DB save yet)
    set({
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
      activeConversationId: null,
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

  selectTemplate: (template) => {
    const userProfile = useUserStore.getState().userProfile;
    if (!userProfile?.user_id) {
      console.error("Cannot select template: No user profile found");
      return;
    }
    const now = new Date().toISOString();
    const newWorkout: CompleteWorkout = {
      ...template,
      id: uuidv4(),
      user_id: userProfile.user_id.toString(),
      template_id: template.id,
      is_template: false,
      created_at: now,
      updated_at: now,

      name: "",
      notes: "",
      image_id: null,

      workout_exercises: template.workout_exercises.map((exercise, index) => ({
        ...exercise,
        id: `exercise-${Date.now()}-${index}`,
        workout_id: `temp-${Date.now()}`,
        workout_exercise_sets: exercise.workout_exercise_sets.map(
          (set, setIndex) => ({
            ...set,
            id: `set-${Date.now()}-${index}-${setIndex}`,
            exercise_id: `exercise-${Date.now()}-${index}`,
            is_completed: false,
          })
        ),
      })),
    };

    set({
      currentWorkout: newWorkout,
      selectedTemplate: template,
      showTemplateSelector: false,
    });
  },

  // NEW: Conversation actions
  setActiveConversation: (id) => {
    set({ activeConversationId: id });
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
