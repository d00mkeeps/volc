import { createContext, useContext, useState } from 'react';
import { uuidv4 } from '@/utils/uuid';import { WorkoutService } from '../services/supabase/workout';
import { authService } from '@/services/supabase/auth';

type WorkoutExercise = {
  exercise_name: string;
  set_data: {
    sets: Record<string, any>[];
  };
  order_in_workout: number;
  weight_unit?: 'kg' | 'lbs';
  distance_unit?: 'km' | 'm' | 'mi';
};

type Workout = {
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
};

type WorkoutWithConversation = Workout & {
  conversationId: string;
};

type ChatAttachmentContextType = {
  handleSignal: (type: string, data: any) => Promise<void>;
  getWorkoutsByConversation: (conversationId: string) => WorkoutWithConversation[];
};

type Props = {
  children: React.ReactNode;
  conversationId: string;
};

const ChatAttachmentContext = createContext<ChatAttachmentContextType>(null!);

export function ChatAttachmentProvider({ children, conversationId }: Props) {
  const [workouts, setWorkouts] = useState<Map<string, WorkoutWithConversation>>(new Map());
  const workoutService = new WorkoutService();

  const handleSignal = async (type: string, data: any) => {
    console.log('ChatAttachmentProvider: Handling signal:', { type, data });
    if (type !== 'workout_approved') return;
    
    let workoutId: string | null = null;  // Define outside try block
    
    try {
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }
  
      console.log('Processing workout:', data);
      workoutId = uuidv4();
      const workoutWithMeta = { ...data, id: workoutId, conversationId };
      
      setWorkouts(prev => {
        const newWorkouts = new Map(prev).set(workoutId!, workoutWithMeta);
        return newWorkouts;
      });
  
      await workoutService.createWorkout(session.user.id, workoutWithMeta);
      console.log('Workout saved successfully:', workoutId);
    } catch (error) {
      console.error('Failed to handle workout signal:', error);
      // Now workoutId is in scope
      if (workoutId) {
        setWorkouts(prev => {
          const newWorkouts = new Map(prev);
          newWorkouts.delete(workoutId!);
          return newWorkouts;
        });
      }
      throw error;
    }
  };
  const getWorkoutsByConversation = (convId: string) => 
    Array.from(workouts.values()).filter(w => w.conversationId === convId);

  return (
    <ChatAttachmentContext.Provider value={{
      handleSignal,
      getWorkoutsByConversation
    }}>
      {children}
    </ChatAttachmentContext.Provider>
  );
}

export const useWorkouts = () => {
  const context = useContext(ChatAttachmentContext);
  if (!context) {
    throw new Error('useWorkouts must be used within a ChatAttachmentProvider');
  }
  return context;
};