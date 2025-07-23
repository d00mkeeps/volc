// // stores/WorkoutStore.ts
// import { create } from 'zustand';
// import { workoutService } from '@/services/db/workout';
// import { authService } from '@/services/db/auth';
// import { WorkoutWithConversation } from '@/types/workout';
// import { uuidv4 } from '@/utils/uuid';


// interface WorkoutState {
//   workouts: Map<string, WorkoutWithConversation>;
//   isLoading: boolean;
//   error: Error | null;
  
//   // Actions
//   loadWorkoutsForConversation: (conversationId: string) => Promise<void>;
//   getWorkoutsByConversation: (conversationId: string) => WorkoutWithConversation[];
//   addWorkout: (workout: any, conversationId: string) => Promise<void>;
//   deleteWorkout: (workoutId: string) => Promise<void>;
//   clearWorkoutsForConversation: (conversationId: string) => Promise<void>;
// }

// const MAX_WORKOUTS_PER_CONVERSATION = 10;

// export const useWorkoutStore = create<WorkoutState>((set, get) => ({
//   workouts: new Map<string, WorkoutWithConversation>(),
//   isLoading: false,
//   error: null,
  
  
//   loadWorkoutsForConversation: async (conversationId: string) => {
//     try {
//       set({ isLoading: true, error: null });
      
//       const session = await authService.getSession();
//       if (!session?.user?.id) return;
      
//       const savedWorkouts = await workoutService.getWorkoutsByConversation(
//         session.user.id,
//         conversationId
//       );
      
//       if (savedWorkouts?.length) {
//         const workoutMap = new Map<string, WorkoutWithConversation>();
//         savedWorkouts.forEach((workout: WorkoutWithConversation) => {
//           workoutMap.set(workout.id, workout);
//         });
        
//         set({ workouts: workoutMap });
//       }
//     } catch (error) {
//       console.error("[WorkoutStore] Failed to load workouts:", error);
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   },
  
//   getWorkoutsByConversation: (conversationId: string) => {
//     const { workouts } = get();
//     return Array.from(workouts.values())
//       .filter((w) => w.conversationId === conversationId)
//       .sort((a, b) => 
//         new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//       );
//   },
  
//   addWorkout: async (workoutData: any, conversationId: string) => {
//     const { workouts } = get();
//     let workoutId: string | null = null;
    
//     try {
//       set({ isLoading: true, error: null });
      
//       const session = await authService.getSession();
//       if (!session?.user?.id) {
//         throw new Error("No authenticated user found");
//       }
      
//       workoutId = uuidv4();
//       const workoutWithMeta = {
//         ...workoutData,
//         id: workoutId,
//         conversationId: conversationId,
//         created_at: new Date().toISOString(),
//       };
      
//       // Update state with new workout
//       const newWorkouts = new Map(workouts);
      
//       // Check if we need to remove older workouts
//       const conversationWorkouts = Array.from(newWorkouts.values())
//         .filter((w) => w.conversationId === conversationId);
      
//       if (conversationWorkouts.length >= MAX_WORKOUTS_PER_CONVERSATION) {
//         // Sort by creation time (oldest first)
//         const sortedWorkouts = conversationWorkouts.sort((a, b) => 
//           new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
//         );
        
//         // Remove oldest
//         const toRemove = sortedWorkouts[0];
//         if (toRemove) {
//           newWorkouts.delete(toRemove.id);
//         }
//       }
      
//       // Add new workout
//       newWorkouts.set(workoutId, workoutWithMeta);
//       set({ workouts: newWorkouts });
      
//       // Save to database
//       await workoutService.createWorkout(session.user.id, workoutWithMeta);
      
//     } catch (error) {
//       console.error("[WorkoutStore] Failed to add workout:", error);
      
//       // Rollback state if there was an error
//       if (workoutId) {
//         const rollbackWorkouts = new Map(get().workouts);
//         rollbackWorkouts.delete(workoutId);
//         set({ workouts: rollbackWorkouts });
//       }
      
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   },
  
//   deleteWorkout: async (workoutId: string) => {
//     try {
//       set({ isLoading: true, error: null });
      
//       // Remove from state
//       const newWorkouts = new Map(get().workouts);
//       newWorkouts.delete(workoutId);
//       set({ workouts: newWorkouts });
      
//       // Delete from database
//       await workoutService.deleteWorkout(workoutId);
      
//     } catch (error) {
//       console.error("[WorkoutStore] Failed to delete workout:", error);
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   },
  
//   clearWorkoutsForConversation: async (conversationId: string) => {
//     try {
//       set({ isLoading: true, error: null });
      
//       const session = await authService.getSession();
//       if (!session?.user?.id) {
//         throw new Error("No authenticated user found");
//       }
      
//       // Update state
//       const newWorkouts = new Map(get().workouts);
//       Array.from(newWorkouts.entries())
//         .filter(([_, workout]) => workout.conversationId === conversationId)
//         .forEach(([id, _]) => newWorkouts.delete(id));
      
//       set({ workouts: newWorkouts });
      
//       // Delete from database
//       await workoutService.deleteConversationWorkouts(session.user.id, conversationId);
      
//     } catch (error) {
//       console.error("[WorkoutStore] Failed to clear workouts for conversation:", error);
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   }
// }));