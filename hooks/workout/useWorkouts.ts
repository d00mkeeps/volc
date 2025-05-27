// hooks/useWorkouts.ts
import { useEffect, useState } from 'react';
import { useWorkoutStore } from '@/stores/workout/workoutStore';
import { WorkoutWithConversation } from '@/types/workout';

export const useWorkouts = (userId?: string, conversationId?: string) => {
  const { 
    workouts: globalWorkouts,
    loading,
    error,
    loadWorkouts,
    createWorkout,
    deleteWorkout,
    getWorkoutsByConversation,
    deleteConversationWorkouts
  } = useWorkoutStore();
  
  const [conversationWorkouts, setConversationWorkouts] = useState<WorkoutWithConversation[]>([]);
  
  // Load global workouts when only userId is provided
  useEffect(() => {
    if (userId && !conversationId && globalWorkouts.length === 0) {
      loadWorkouts(userId);
    }
  }, [userId, conversationId, globalWorkouts.length, loadWorkouts]);
  
  // Load conversation-specific workouts when both userId and conversationId are provided
  useEffect(() => {
    if (userId && conversationId) {
      const fetchConversationWorkouts = async () => {
        const result = await getWorkoutsByConversation(userId, conversationId);
        if (result) {
          setConversationWorkouts(result);
        }
      };
      
      fetchConversationWorkouts();
    }
  }, [userId, conversationId, getWorkoutsByConversation]);
  
  return {
    // Return appropriate workouts based on whether conversationId is provided
    workouts: conversationId ? conversationWorkouts : globalWorkouts,
    loading,
    error,
    loadWorkouts,
    createWorkout,
    deleteWorkout,
    getWorkoutsByConversation,
    deleteConversationWorkouts,
    
    // Helper method to refresh conversation workouts
    refreshConversationWorkouts: async () => {
      if (userId && conversationId) {
        const result = await getWorkoutsByConversation(userId, conversationId);
        if (result) {
          setConversationWorkouts(result);
        }
      }
    }
  };
};