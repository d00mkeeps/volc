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
  // Add other screens here as needed
};
export type ConversationListProps = {
  onConversationPress: (id: string) => void;
}

export interface ConversationUIProps {
  title: string;
  subtitle: string;
  messages: any[]; // Replace 'any' with your message type
  draftMessage?: string;
  onSendMessage: (message: string) => void;
  onDraftMessageChange?: (draft: string) => void;
}



export interface Workout {
  id: string;
  name: string;
  description: string;
}
export interface Program {
id: string;
name: string;
description: string;
createdAt: string;
workouts: Workout[]

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
