// context/ChatAttachmentContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { uuidv4 } from '@/utils/uuid';
import { WorkoutService } from '../services/supabase/workout';
import { attachmentService } from '../services/supabase/attachment';
import { authService } from '@/services/supabase/auth';
import { 
  WorkoutDataBundle, 
  WorkoutWithConversation,
  AttachmentType
} from '@/types/workout';

type ChatAttachmentContextType = {
  handleSignal: (type: string, data: any) => Promise<void>;
  getWorkoutsByConversation: (conversationId: string) => WorkoutWithConversation[];
  graphBundles: Map<string, WorkoutDataBundle>;
  addGraphBundle: (bundle: WorkoutDataBundle, conversationId: string) => void;
  getGraphBundlesByConversation: (conversationId: string) => WorkoutDataBundle[];
  clearAttachmentsForConversation: (conversationId: string) => void;
  deleteAttachment: (attachmentId: string, type: AttachmentType) => Promise<void>;
  isLoading: boolean;
};

type Props = {
  children: React.ReactNode;
  conversationId: string;
};

const MAX_BUNDLES_PER_CONVERSATION = 20;
const MAX_WORKOUTS_PER_CONVERSATION = 10;

const ChatAttachmentContext = createContext<ChatAttachmentContextType>(null!);

export function ChatAttachmentProvider({ children, conversationId }: Props) {
  const [workouts, setWorkouts] = useState<Map<string, WorkoutWithConversation>>(new Map());
  const [graphBundles, setGraphBundles] = useState<Map<string, WorkoutDataBundle>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const workoutService = new WorkoutService();

  // Load saved attachments on mount or conversation change
  useEffect(() => {
    const loadSavedAttachments = async () => {
      try {
        const session = await authService.getSession();
        if (!session?.user?.id) return;
        
        setIsLoading(true);
        
        // Load saved workouts using the attachment service
        const savedWorkouts = await attachmentService.getWorkoutsByConversation(
          session.user.id, 
          conversationId
        );
        
        if (savedWorkouts?.length) {
          const workoutMap = new Map();
          savedWorkouts.forEach((workout: WorkoutWithConversation) => {
            workoutMap.set(workout.id, workout);
          });
          setWorkouts(workoutMap);
        }
        
        // Load saved graph bundles
        const savedBundles = await attachmentService.getGraphBundlesByConversation(
          session.user.id,
          conversationId
        );
        
        if (savedBundles?.length) {
          const bundleMap = new Map();
          savedBundles.forEach((bundle: WorkoutDataBundle) => {
            bundleMap.set(bundle.bundle_id, bundle);
          });
          setGraphBundles(bundleMap);
        }
      } catch (error) {
        console.error('Failed to load saved attachments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedAttachments();
  }, [conversationId]);

  const handleSignal = async (type: string, data: any) => {
    console.log('ChatAttachmentProvider: Handling signal:', { type, data });
    
  // In the handleSignal method where workout_approved is processed
if (type === 'workout_approved') {
  let workoutId: string | null = null;
  
  try {
    setIsLoading(true);
    const session = await authService.getSession();
    if (!session?.user?.id) {
      throw new Error('No authenticated user found');
    }

    console.log('Processing workout:', data);
    workoutId = uuidv4();
    const workoutWithMeta = { 
      ...data, 
      id: workoutId, 
      conversationId,
      created_at: new Date().toISOString()
    };
    
    // Add to state
    setWorkouts(prev => {
      const newWorkouts = new Map(prev);
      
      // Check if we need to remove older workouts
      const conversationWorkouts = Array.from(newWorkouts.values())
        .filter(w => w.conversationId === conversationId);
        
      if (conversationWorkouts.length >= MAX_WORKOUTS_PER_CONVERSATION) {
        // Sort by creation time (oldest first)
        const sortedWorkouts = conversationWorkouts.sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        // Remove oldest
        const toRemove = sortedWorkouts[0];
        if (toRemove) {
          newWorkouts.delete(toRemove.id);
        }
      }
      
      // Add new workout
      newWorkouts.set(workoutId!, workoutWithMeta);
      return newWorkouts;
    });

    try {
      // Try to save workout and link it to the conversation
      console.log('Saving workout to database:', workoutId);
      await workoutService.createWorkout(session.user.id, workoutWithMeta);
      
      console.log('Linking workout to conversation:', workoutId, conversationId);
      await attachmentService.linkWorkoutToConversation(
        session.user.id,
        workoutId,
        conversationId
      );
      
      console.log('Workout saved successfully:', workoutId);
    } catch (dbError: any) {
      // Log detailed error information
      console.error('Database error details:', dbError);
      if (dbError && dbError.message && dbError.message.includes('order')) {
        console.error('Order syntax error detected. Check .order() calls in Supabase queries.');
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Failed to handle workout signal:', error);
    // Remove from state if saving failed
    if (workoutId) {
      setWorkouts(prev => {
        const newWorkouts = new Map(prev);
        newWorkouts.delete(workoutId!);
        return newWorkouts;
      });
    }
    throw error;
  } finally {
    setIsLoading(false);
  }
}
    else if (type === 'workout_data_bundle') {
      try {
        setIsLoading(true);
        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error('No authenticated user found');
        }

        console.log('Received workout_data_bundle:', data);
        console.log('workout_data type:', typeof data.workout_data);
        if (data.workout_data) {
          console.log('workout_data keys:', Object.keys(data.workout_data));
          // If it's a string, try to log parsed version too
          if (typeof data.workout_data === 'string') {
            try {
              const parsed = JSON.parse(data.workout_data);
              console.log('Parsed workout_data:', parsed);
            } catch (e) {
              console.log('workout_data is not valid JSON string');
            }
          }
        }
        
        // Store the graph bundle with the current conversation ID
        const bundleWithConversation = { 
          ...data, 
          conversationId 
        };
        
        addGraphBundle(bundleWithConversation, conversationId);
        
        // Save to database using the attachment service
        await attachmentService.saveGraphBundle(
          session.user.id, 
          bundleWithConversation
        );
        
        console.log('Graph bundle saved successfully:', data.bundle_id);
      } catch (error) {
        console.error('Failed to handle graph bundle signal:', error);
        // Remove from state if saving failed
        if (data?.bundle_id) {
          setGraphBundles(prev => {
            const newBundles = new Map(prev);
            newBundles.delete(data.bundle_id);
            return newBundles;
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addGraphBundle = (bundle: WorkoutDataBundle, convId: string) => {
    setGraphBundles(prev => {
      const newBundles = new Map(prev);
      
      // Check if we need to remove older bundles
      const conversationBundles = Array.from(newBundles.values())
        .filter(b => b.conversationId === convId);
        
      if (conversationBundles.length >= MAX_BUNDLES_PER_CONVERSATION) {
        // Sort by creation time (oldest first)
        const sortedBundles = conversationBundles.sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        // Remove oldest
        const toRemove = sortedBundles[0];
        if (toRemove) {
          newBundles.delete(toRemove.bundle_id);
        }
      }
      
      // Add new bundle
      newBundles.set(bundle.bundle_id, {
        ...bundle,
        conversationId: convId
      });
      
      return newBundles;
    });
  };

  const getWorkoutsByConversation = (convId: string) => 
    Array.from(workouts.values())
      .filter(w => w.conversationId === convId);

  const getGraphBundlesByConversation = (convId: string) => 
    Array.from(graphBundles.values())
      .filter(b => b.conversationId === convId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const clearAttachmentsForConversation = (convId: string) => {
    // Clear workouts and graph bundles from state
    setWorkouts(prev => {
      const newWorkouts = new Map(prev);
      Array.from(newWorkouts.entries())
        .filter(([_, workout]) => workout.conversationId === convId)
        .forEach(([id, _]) => newWorkouts.delete(id));
      return newWorkouts;
    });
    
    setGraphBundles(prev => {
      const newBundles = new Map(prev);
      Array.from(newBundles.entries())
        .filter(([_, bundle]) => bundle.conversationId === convId)
        .forEach(([id, _]) => newBundles.delete(id));
      return newBundles;
    });
    
    // Delete from database
    const deleteFromDb = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user?.id) {
          await attachmentService.deleteConversationAttachments(
            session.user.id,
            convId
          );
        }
      } catch (error) {
        console.error('Failed to delete conversation attachments:', error);
      }
    };
    
    deleteFromDb();
  };

  const deleteAttachment = async (attachmentId: string, type: AttachmentType) => {
    try {
      setIsLoading(true);
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }
      
      // Remove from state
      if (type === 'workout') {
        setWorkouts(prev => {
          const newWorkouts = new Map(prev);
          newWorkouts.delete(attachmentId);
          return newWorkouts;
        });
      } else {
        setGraphBundles(prev => {
          const newBundles = new Map(prev);
          newBundles.delete(attachmentId);
          return newBundles;
        });
      }
      
      // Delete from database
      await attachmentService.deleteAttachment(
        session.user.id,
        attachmentId,
        type
      );
      
      console.log(`${type} deleted successfully:`, attachmentId);
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatAttachmentContext.Provider value={{
      handleSignal,
      getWorkoutsByConversation,
      graphBundles,
      addGraphBundle,
      getGraphBundlesByConversation,
      clearAttachmentsForConversation,
      deleteAttachment,
      isLoading
    }}>
      {children}
    </ChatAttachmentContext.Provider>
  );
}

export const useAttachments = () => {
  const context = useContext(ChatAttachmentContext);
  if (!context) {
    throw new Error('useAttachments must be used within a ChatAttachmentProvider');
  }
  return context;
};

// Backwards compatibility
export const useWorkouts = useAttachments;