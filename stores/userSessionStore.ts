// stores/userSessionStore.ts
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
  
  // Template selection state
  selectedTemplate: CompleteWorkout | null;
  showTemplateSelector: boolean;
  
  // Actions
  startWorkout: (workout: CompleteWorkout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  togglePause: () => void; // This was missing!
  finishWorkout: () => Promise<void>;
  updateElapsedTime: () => void;
  updateCurrentWorkout: (workout: CompleteWorkout) => void;
  updateExercise: (exerciseId: string, updatedExercise: WorkoutExercise) => void;
  resetSession: () => void;
  // Template actions
  setSelectedTemplate: (template: CompleteWorkout | null) => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  selectTemplate: (template: CompleteWorkout) => void;
  
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
  selectedTemplate: null,
  showTemplateSelector: false,
  
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

  // ADD THIS MISSING METHOD:
  togglePause: () => {
    const { isPaused } = get();
    if (isPaused) {
      console.log('[UserSession] Resuming workout');
      set({ isPaused: false });
    } else {
      console.log('[UserSession] Pausing workout');
      set({ isPaused: true });
    }
  },

  updateCurrentWorkout: (workout) => {
    const { isActive } = get();
    if (!isActive) return;
    
    console.log('[UserSession] Updating current workout data');
    set({ currentWorkout: workout });
  },

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
  
 // In userSessionStore.ts
finishWorkout: async () => {
  const { currentWorkout } = get();
  
  if (!currentWorkout) return;
  
  const userProfile = useUserStore.getState().userProfile;
  if (!userProfile?.user_id) {
    throw new Error('No user profile found');
  }
  
  // Save workout and refresh dashboard
  const savedWorkout = await workoutService.saveCompletedWorkout(
    userProfile.user_id.toString(), 
    currentWorkout
  );
  
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
    selectedTemplate: null
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
    console.log('[UserSession] Setting selected template:', template?.name);
    set({ selectedTemplate: template });
  },
  
  openTemplateSelector: () => {
    console.log('[UserSession] Opening template selector');
    set({ showTemplateSelector: true });
  },
  
  closeTemplateSelector: () => {
    console.log('[UserSession] Closing template selector');
    set({ showTemplateSelector: false });
  },
  
  selectTemplate: (template) => {
    console.log('[UserSession] Selecting template:', template.name);
    
    const userProfile = useUserStore.getState().userProfile;
    if (!userProfile?.user_id) {
      console.error('Cannot select template: No user profile found');
      return;
    }
    
    // Create a new workout based on the selected template
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
        workout_exercise_sets: exercise.workout_exercise_sets.map((set, setIndex) => ({
          ...set,
          id: `set-${Date.now()}-${index}-${setIndex}`,
          exercise_id: `exercise-${Date.now()}-${index}`,
          is_completed: false, // Reset completion status
        })),
      })),
    };
    
    set({ 
      currentWorkout: newWorkout,
      selectedTemplate: template,
      showTemplateSelector: false 
    });
  },
  
  // Computed values
  getTimeString: () => {
    const { isActive, elapsedSeconds, scheduledTime } = get();
    
    if (!isActive && scheduledTime) {
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