import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { CompleteWorkout, WorkoutExercise } from "@/types/workout";
import { workoutService } from "@/services/db/workout";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useUserStore } from "@/stores/userProfileStore";
import { useWorkoutAnalysisStore } from "./analysis/WorkoutAnalysisStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";

interface UserSessionState {
  // Session state
  currentWorkout: CompleteWorkout | null;
  isActive: boolean;
  isPaused: boolean;
  // Timer state
  startTime: Date | null;
  elapsedSeconds: number;
  scheduledTime?: string;

  // Template selection state
  selectedTemplate: CompleteWorkout | null;
  showTemplateSelector: boolean;

  // NEW: Conversation state
  activeConversationId: string | null;

  // Actions
  startWorkout: (workout: CompleteWorkout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  togglePause: () => void;
  finishWorkout: () => Promise<void>;
  updateElapsedTime: () => void;
  updateCurrentWorkout: (workout: CompleteWorkout) => void;
  updateExercise: (
    exerciseId: string,
    updatedExercise: WorkoutExercise
  ) => void;
  resetSession: () => void;

  // Template actions
  setSelectedTemplate: (template: CompleteWorkout | null) => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  selectTemplate: (template: CompleteWorkout) => void;

  // NEW: Conversation actions
  setActiveConversation: (id: string | null) => void;

  // Computed values
  getTimeString: () => string;
  getProgress: () => { completed: number; total: number };
}

// Helper function to create workout with proper UUIDs
function createWorkoutWithIds(
  template: CompleteWorkout,
  userId: string
): CompleteWorkout {
  const workoutId = uuidv4();
  const now = new Date().toISOString();

  return {
    ...template,
    id: workoutId,
    user_id: userId,
    template_id: template.id,
    is_template: false,
    created_at: now,
    updated_at: now,
    workout_exercises: template.workout_exercises.map((exercise) => {
      const exerciseId = uuidv4();

      return {
        ...exercise,
        id: exerciseId,
        workout_id: workoutId,
        workout_exercise_sets: exercise.workout_exercise_sets.map((set) => ({
          ...set,
          id: uuidv4(),
          exercise_id: exerciseId,
          is_completed: false,
        })),
      };
    }),
  };
}

// At the top of the file, outside the store
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
  isActive: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  scheduledTime: undefined,
  selectedTemplate: null,
  showTemplateSelector: false,
  activeConversationId: null, // NEW

  // Actions
  startWorkout: (workout) => {
    console.log("[UserSession] Starting workout:", workout.name);
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
    console.log("[UserSession] Pausing workout");
    set({ isPaused: true });
  },

  resumeWorkout: () => {
    console.log("[UserSession] Resuming workout");
    set({ isPaused: false });
  },

  togglePause: () => {
    const { isPaused } = get();
    if (isPaused) {
      console.log("[UserSession] Resuming workout");
      set({ isPaused: false });
    } else {
      console.log("[UserSession] Pausing workout");
      set({ isPaused: true });
    }
  },

  updateCurrentWorkout: (workout) => {
    console.log("=== UPDATE CURRENT WORKOUT ===");
    console.log("Incoming workout ID:", workout.id);
    console.log("Incoming workout notes:", workout.notes);
    console.log("Incoming workout notes length:", workout.notes?.length);

    const { isActive, currentWorkout: oldWorkout } = get();
    console.log("Store isActive:", isActive);
    console.log("Old workout notes:", oldWorkout?.notes);
    console.log("Old workout notes length:", oldWorkout?.notes?.length);

    set({ currentWorkout: workout });

    // Verify the update took effect
    const { currentWorkout: newWorkout } = get();
    console.log("After update - new workout notes:", newWorkout?.notes);
    console.log(
      "After update - new workout notes length:",
      newWorkout?.notes?.length
    );
    console.log("Update successful:", newWorkout?.notes === workout.notes);
  },

  updateExercise: (exerciseId, updatedExercise) => {
    const { currentWorkout, isActive } = get();
    if (!isActive || !currentWorkout) return;

    console.log("[UserSession] Updating exercise:", exerciseId);

    const updatedWorkout = {
      ...currentWorkout,
      workout_exercises: currentWorkout.workout_exercises.map((exercise) =>
        exercise.id === exerciseId ? updatedExercise : exercise
      ),
      updated_at: new Date().toISOString(),
    };

    set({ currentWorkout: updatedWorkout });
  },

  finishWorkout: async () => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const userProfile = useUserStore.getState().userProfile;
    if (!userProfile?.user_id) {
      throw new Error("No user profile found");
    }

    // 1. ALWAYS create new workout record (for history/analysis)
    const workoutForSaving = createWorkoutWithIds(
      currentWorkout,
      userProfile.user_id.toString()
    );
    const savedWorkout = await workoutService.saveCompletedWorkout(
      userProfile.user_id.toString(),
      { ...workoutForSaving, notes: "" }
    );

    // 2. Handle template deduplication
    const { workouts } = useWorkoutStore.getState();
    const currentDefIds = new Set(
      currentWorkout.workout_exercises
        .map((ex) => ex.definition_id)
        .filter(Boolean)
    );

    // Find existing template with same definition_ids
    const existingTemplate = Array.from(workouts.values()).find((workout) => {
      const templateDefIds = new Set(
        workout.workout_exercises.map((ex) => ex.definition_id).filter(Boolean)
      );

      // Same exercises regardless of order
      return (
        currentDefIds.size === templateDefIds.size &&
        [...currentDefIds].every((id) => templateDefIds.has(id))
      );
    });

    if (existingTemplate) {
      // Update existing template with latest version
      console.log(
        "[UserSession] Updating existing template:",
        existingTemplate.id
      );
      const { updateWorkout } = useWorkoutStore.getState();
      await updateWorkout(existingTemplate.id, {
        ...currentWorkout,
        id: existingTemplate.id,
        updated_at: new Date().toISOString(),
      });
    }
    // If no existing template found, savedWorkout becomes the new template automatically

    set({ currentWorkout: { ...currentWorkout, id: savedWorkout.id } });

    // 3. Extract definition IDs for analysis
    const definitionIds = savedWorkout.workout_exercises
      .map((ex) => ex.definition_id)
      .filter((id): id is string => Boolean(id));

    // 4. Trigger analysis with definition IDs
    if (definitionIds.length > 0) {
      try {
        const analysisResult = await useWorkoutAnalysisStore
          .getState()
          .initiateBackgroundAnalysis(definitionIds);

        // Store conversation ID in session
        if (analysisResult?.conversation_id) {
          set({ activeConversationId: analysisResult.conversation_id });
          console.log(
            "[UserSession] Set active conversation:",
            analysisResult.conversation_id
          );
        }

        console.log("Analysis initiated successfully");
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    }

    // 5. Refresh dashboard
    useDashboardStore.getState().refreshDashboard();
  },

  resetSession: () => {
    set({
      currentWorkout: null,
      isActive: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      scheduledTime: undefined,
      selectedTemplate: null,
      activeConversationId: null, // NEW: Reset conversation ID
    });
  },

  updateElapsedTime: () => {
    const { startTime, isPaused } = get();
    if (startTime && !isPaused) {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      set({ elapsedSeconds: elapsed });
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
      id: `temp-${Date.now()}`,
      user_id: userProfile.user_id.toString(),
      template_id: template.id,
      is_template: false,
      created_at: now,
      updated_at: now,
      // Reset workout exercise IDs and set states
      workout_exercises: template.workout_exercises.map((exercise, index) => ({
        ...exercise,
        id: `exercise-${Date.now()}-${index}`,
        workout_id: `temp-${Date.now()}`,
        workout_exercise_sets: exercise.workout_exercise_sets.map(
          (set, setIndex) => ({
            ...set,
            id: `set-${Date.now()}-${index}-${setIndex}`,
            exercise_id: `exercise-${Date.now()}-${index}`,
            is_completed: false, // Reset completion status
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
    console.log("[UserSession] Setting active conversation:", id);
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
