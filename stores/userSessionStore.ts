// stores/UserSessionStore.ts
import { create } from 'zustand';
import { CompleteWorkout, WorkoutExercise } from '@/types/workout';
import { workoutService } from '@/services/db/workout';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useUserStore } from '@/stores/userProfileStore';

interface UserSessionState {
  // Session state
  currentWorkout: CompleteWorkout | null;
  isActive: boolean;
  isPaused: boolean;
  
  // Timer state
  startTime: Date | null;
  elapsedSeconds: number;
  scheduledTime?: string;
  
  // Actions
  startWorkout: (workout: CompleteWorkout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => Promise<void>;
  updateElapsedTime: () => void;
  updateCurrentWorkout: (workout: CompleteWorkout) => void; // NEW
  updateExercise: (exerciseId: string, updatedExercise: WorkoutExercise) => void; // NEW
  
  // Computed values
  getTimeString: () => string;
  getProgress: () => { completed: number; total: number };
}

export const useUserSessionStore = create<UserSessionState>((set, get) => ({
  // Initial state
  currentWorkout: null,
  isActive: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  scheduledTime: undefined,
  
  // Actions
  startWorkout: (workout) => {
    console.log('[UserSession] Starting workout:', workout.name);
    set({
      currentWorkout: workout,
      isActive: true,
      isPaused: false,
      startTime: new Date(),
      elapsedSeconds: 0,
      scheduledTime: workout.scheduled_time
    });
  },
  
  pauseWorkout: () => {
    console.log('[UserSession] Pausing workout');
    set({ isPaused: true });
  },
  
  resumeWorkout: () => {
    console.log('[UserSession] Resuming workout');
    set({ isPaused: false });
  },

  // NEW: Update the entire current workout
  updateCurrentWorkout: (workout) => {
    const { isActive } = get();
    if (!isActive) return;
    
    console.log('[UserSession] Updating current workout data');
    set({ currentWorkout: workout });
  },

  // NEW: Update a specific exercise within the current workout
  updateExercise: (exerciseId, updatedExercise) => {
    const { currentWorkout, isActive } = get();
    if (!isActive || !currentWorkout) return;

    console.log('[UserSession] Updating exercise:', exerciseId);
    
    const updatedWorkout = {
      ...currentWorkout,
      workout_exercises: currentWorkout.workout_exercises.map((exercise) =>
        exercise.id === exerciseId ? updatedExercise : exercise
      ),
      updated_at: new Date().toISOString()
    };

    set({ currentWorkout: updatedWorkout });
  },
  
  finishWorkout: async () => {
    const { currentWorkout } = get();
    
    try {
      if (currentWorkout) {
        // Get current user ID from user store
        const userProfile = useUserStore.getState().userProfile;
        if (!userProfile?.user_id) {
          console.error('Cannot finish workout: No user profile found');
          throw new Error('No user profile found');
        }
        
        console.log('[UserSession] Finishing workout:', {
          workoutId: currentWorkout.id,
          workoutName: currentWorkout.name,
          userId: userProfile.user_id,
          exerciseCount: currentWorkout.workout_exercises?.length || 0
        });
        
        // Save the completed workout
        const savedWorkout = await workoutService.saveCompletedWorkout(
          userProfile.user_id.toString(), 
          currentWorkout
        );
        
        console.log('[UserSession] Workout saved successfully with ID:', savedWorkout.id);
        
        // Trigger dashboard refresh
        console.log('[UserSession] Triggering dashboard refresh...');
        useDashboardStore.getState().refreshDashboard();
      }
      
      // Reset session state
      console.log('[UserSession] Resetting session state...');
      set({
        currentWorkout: null,
        isActive: false,
        isPaused: false,
        startTime: null,
        elapsedSeconds: 0,
        scheduledTime: undefined
      });
      
      console.log('[UserSession] Workout finished successfully');
    } catch (error) {
      console.error('[UserSession] Failed to finish workout:', error);
      
      // Still reset UI state even if save fails
      set({
        currentWorkout: null,
        isActive: false,
        isPaused: false,
        startTime: null,
        elapsedSeconds: 0,
        scheduledTime: undefined
      });
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
  },
  
  updateElapsedTime: () => {
    const { startTime, isPaused } = get();
    if (startTime && !isPaused) {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      set({ elapsedSeconds: elapsed });
    }
  },
  
  // Computed values
  getTimeString: () => {
    const { isActive, elapsedSeconds, scheduledTime } = get();
    
    if (!isActive && scheduledTime) {
      // Countdown mode - calculate time until scheduled
      const now = new Date();
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduled = new Date();
      scheduled.setHours(hours, minutes, 0, 0);
      
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      
      const secondsUntil = Math.max(0, Math.floor((scheduled.getTime() - now.getTime()) / 1000));
      return formatTime(secondsUntil);
    }
    
    // Active mode - show elapsed time
    return formatTime(elapsedSeconds);
  },
  
  getProgress: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) return { completed: 0, total: 0 };
    
    const totalSets = currentWorkout.workout_exercises?.reduce(
      (sum, exercise) => sum + (exercise.workout_exercise_sets?.length || 0), 0
    ) || 0;
    
    const completedSets = currentWorkout.workout_exercises?.reduce(
      (sum, exercise) => sum + (exercise.workout_exercise_sets?.filter(set => set.is_completed).length || 0), 0
    ) || 0;
    
    return { completed: completedSets, total: totalSets };
  }
}));

// Helper function
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}