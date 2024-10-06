export interface Exercise {
  id: string;
  name: string;
  description: string;
  sets?: number;
  reps?: number;
  duration?: string;
}


export interface Workout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  workouts: Workout[];
}

export interface ProgramDetailSlideProps {
  program: Program ;
  selectedWorkout: Workout | null;
  onWorkoutChange: (workout: Workout | null) => void;
}

export interface HeaderProps {
  title: string;
  onClose: () => void
}

export interface WorkoutDisplayProps {
  workout: Workout | null;
  workouts: Workout[];
  onWorkoutChange: (workout: Workout) => void;
}

export interface ExerciseCardProps {
  exercise: Exercise;
}

export interface ProgramNoteSlideProps {
  program: Program;
}

export type RootStackParamList = {
  ConversationList: undefined;
  Conversation: { conversationId: string };
};
export type ConversationListProps = {
  onConversationPress: (id: string) => void;
}

export interface ConversationUIProps {
  title: string;
  subtitle: string;
  messages: any[];
  draftMessage?: string;
  onSendMessage: (message: string) => void;
  onDraftMessageChange?: (draft: string) => void;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  created_at?: string; 
  user_id?: number; 
}
export interface Program {
id: string;
name: string;
description: string;
createdAt: string;
workouts: Workout[]
}


export interface ProfileGroupProps {
  profile: UserProfile;
}



export interface ProgramCardProps {
program: Program;
onPress?: (programId: string) => void;
}

export interface ProgramListProps {
programs: Program[];
onProgramPress?: (programId: string) => void;
}

export interface ProgramsScreenProps {
navigation: any;}

export interface WorkoutSelectProps {
  workouts: string[];
  selectedWorkout: string;
  onSelectWorkout: (workout: string) => void;
}

export interface ProgramDetailsModalProps {
  program: Program;
  isVisible: boolean;
  onClose: () => void;
}


export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  lastMessageTime: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
export interface UserProfile {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  is_imperial: boolean;
  display_name: string | null;
  auth_user_uuid: string | null;
  goals: string | null;
  training_history: any | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: number;
  exercise_name: string;
  set_data: SetData[];
  order_in_workout: number;
}

export interface SetData {
  reps?: number;
  weight?: number;
  duration?: string;
}
