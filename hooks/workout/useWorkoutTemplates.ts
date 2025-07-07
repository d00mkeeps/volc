// hooks/useWorkoutTemplates.ts
import { useEffect } from 'react';
import { useWorkoutStore } from '@/stores/workout/WorkoutStore';

export const useWorkoutTemplates = (userId?: string) => {
  const { 
    templates, 
    loading, 
    error, 
    fetchTemplates, 
    saveAsTemplate,
    updateTemplateUsage 
  } = useWorkoutStore();
  
  // Auto-load templates when userId is provided
  useEffect(() => {
    if (userId && templates.length === 0) {
      fetchTemplates(userId);
    }
  }, [userId, templates.length, fetchTemplates]);
  
  return {
    templates,
    loading,
    error,
    fetchTemplates,
    saveAsTemplate,
    updateTemplateUsage
  };
};