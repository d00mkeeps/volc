// hooks/workout/useWorkoutTemplates.ts
import { useEffect, useMemo } from 'react';
import { useWorkoutStore } from '@/stores/workout/WorkoutStore';
import { createTemplatesFromWorkouts } from '@/utils/createTemplatesFromWorkouts';

export function useWorkoutTemplates(userId?: string) {
  const { workouts, loading, error, loadWorkouts } = useWorkoutStore();

  // Load workouts when userId changes
  useEffect(() => {
    if (userId) {
      loadWorkouts(userId);
    }
  }, [userId, loadWorkouts]);

  // Process workouts into templates
  const templates = useMemo(() => {
    if (!workouts.length) return [];
    return createTemplatesFromWorkouts(workouts);
  }, [workouts]);

  return {
    templates,
    loading,
    error,
    refetch: () => userId && loadWorkouts(userId)
  };
}