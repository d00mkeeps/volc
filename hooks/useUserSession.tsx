import { useEffect } from "react";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { CompleteWorkout } from "@/types/workout";

export function useUserSession() {
  const sessionStore = useUserSessionStore();
  const { workouts } = useWorkoutStore();

  // Auto-update timer every second when active
  useEffect(() => {
    if (!sessionStore.isActive || sessionStore.isPaused) return;

    const interval = setInterval(() => {
      sessionStore.updateElapsedTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStore.isActive, sessionStore.isPaused]);

  // Get a default workout if none selected (replace mock data)
  const getDefaultWorkout = () => {
    // Return most recent workout or a template
    return workouts[0] || createEmptyWorkout();
  };

  const startWorkout = (workout?: CompleteWorkout) => {
    const workoutToStart = workout || getDefaultWorkout();
    sessionStore.startWorkout(workoutToStart);
  };

  return {
    // State
    currentWorkout: sessionStore.currentWorkout,
    isActive: sessionStore.isActive,
    isPaused: sessionStore.isPaused,
    timeString: sessionStore.getTimeString(),
    progress: sessionStore.getProgress(),

    // Actions
    startWorkout,
    pauseWorkout: sessionStore.pauseWorkout,
    resumeWorkout: sessionStore.resumeWorkout,
    finishWorkout: sessionStore.finishWorkout,

    // Computed
    togglePause: sessionStore.isPaused
      ? sessionStore.resumeWorkout
      : sessionStore.pauseWorkout,
  };
}

function createEmptyWorkout(): CompleteWorkout {
  // Create a basic workout structure
  return {
    id: `temp-${Date.now()}`,
    user_id: "current-user",
    name: "Quick Workout",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    workout_exercises: [],
    scheduled_time: "18:00", // Default evening workout
  };
}
