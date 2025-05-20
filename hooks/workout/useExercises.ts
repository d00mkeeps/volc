// hooks/useExercises.ts
import { useEffect } from 'react';
import { useExerciseStore } from '@/stores/workout/exerciseStore';

export const useExercises = () => {
  const { 
    exercises, 
    loading, 
    error, 
    loadExercises, 
    refreshExercises 
  } = useExerciseStore();
  
  // Optional: Ensure exercises are loaded when the hook is first used
  useEffect(() => {
    if (exercises.length === 0 && !loading && !error) {
      loadExercises();
    }
  }, [exercises.length, loading, error, loadExercises]);
  
  return {
    exercises,
    loading,
    error,
    refreshExercises,
  };
};