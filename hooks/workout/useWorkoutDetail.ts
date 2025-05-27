// hooks/useWorkoutDetail.ts
import { useWorkoutStore } from '@/stores/workout/workoutStore';

export const useWorkoutDetail = () => {
  const { 
    currentWorkout, 
    loading, 
    error, 
    getWorkout 
  } = useWorkoutStore();
  
  return {
    workout: currentWorkout,
    loading,
    error,
    getWorkout
  };
};