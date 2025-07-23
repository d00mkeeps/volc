// // services/supabase/attachment.ts
// import { WorkoutDataBundle } from '@/types/workout';
// import { graphBundleService } from './analysisBundle';
// import { workoutService } from './workout';

// /**
//  * Thin wrapper service that delegates to specialized services
//  * This maintains backward compatibility while encouraging migration to the specialized services
//  * @deprecated Use graphBundleService and workoutService directly instead
//  */
// export class AttachmentService {
//   /**
//    * Save a workout data bundle to the database
//    * @deprecated Use graphBundleService.saveGraphBundle instead
//    */
//   async saveGraphBundle(userId: string, bundle: WorkoutDataBundle): Promise<void> {
//     console.log(`[AttachmentService] Delegating saveGraphBundle to GraphBundleService`);
//     return graphBundleService.saveGraphBundle(userId, bundle);
//   }

//   /**
//    * Get all graph bundles for a specific conversation
//    * @deprecated Use graphBundleService.getGraphBundlesByConversation instead
//    */
//   async getGraphBundlesByConversation(userId: string, conversationId: string): Promise<WorkoutDataBundle[]> {
//     console.log(`[AttachmentService] Delegating getGraphBundlesByConversation to GraphBundleService`);
//     return graphBundleService.getGraphBundlesByConversation(userId, conversationId);
//   }

//   /**
//    * Get all workouts for a specific conversation
//    * @deprecated Use workoutService.getWorkoutsByConversation instead
//    */
//   async getWorkoutsByConversation(userId: string, conversationId: string): Promise<any[]> {
//     console.log(`[AttachmentService] Delegating getWorkoutsByConversation to WorkoutService`);
//     return workoutService.getWorkoutsByConversation(userId, conversationId);
//   }

//   /**
//    * Delete an attachment
//    * @deprecated Use graphBundleService.deleteGraphBundle or workoutService.deleteWorkout instead
//    */
//   async deleteAttachment(
//     userId: string, 
//     attachmentId: string, 
//     type: 'workout' | 'graph_bundle'
//   ): Promise<void> {
//     console.log(`[AttachmentService] Delegating deleteAttachment (${type}) to appropriate service`);
    
//     if (type === 'workout') {
//       return workoutService.deleteWorkout(attachmentId);
//     } else {
//       return graphBundleService.deleteGraphBundle(userId, attachmentId);
//     }
//   }

//   /**
//    * Delete all attachments for a conversation
//    * @deprecated Use graphBundleService.deleteConversationGraphBundles and workoutService.deleteConversationWorkouts instead
//    */
//   async deleteConversationAttachments(userId: string, conversationId: string): Promise<void> {
//     console.log(`[AttachmentService] Delegating deleteConversationAttachments to both specialized services`);
    
//     // Delete both types of attachments
//     await Promise.all([
//       graphBundleService.deleteConversationGraphBundles(userId, conversationId),
//       workoutService.deleteConversationWorkouts(userId, conversationId)
//     ]);
//   }
// }

// export const attachmentService = new AttachmentService();