export type WorkoutSet = {
  id: string;
  exercise_id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  distance?: number | null;
  duration?: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutField = 'weight' | 'reps' | 'rpe' | 'distance' | 'duration';
  
  export type WorkoutExercise = {
    id: string;
    workout_id: string;
    name: string;
    order_index: number;
    weight_unit?: 'kg' | 'lbs';
    distance_unit?: 'km' | 'm' | 'mi';
    created_at: string;
    updated_at: string;
    workout_exercise_sets: WorkoutSet[];
  };

  // Add this to your types/workout.ts or at the top of both files
  export interface SetInput {
    weight?: number;
    reps?: number;
    distance?: number; 
    duration?: number;
    rpe?: number;
  }

// In types/workout.ts
export interface CompleteWorkout {
  id: string;
  user_id: string;
  name: string;
  notes: string;
  created_at: string;
  updated_at: string;
  is_template?: boolean;
  template_id?: string;
  used_as_template?: string; // Add this field
  workout_exercises: WorkoutExercise[];
}
  
  export type ExerciseInput = {
    exercise_name: string;
    set_data: {
      sets: SetInput[];
    };
    order_in_workout: number;
    weight_unit?: 'kg' | 'lbs';
    distance_unit?: 'km' | 'm' | 'mi';
  };
  
  export type WorkoutInput = {
    name: string;
    description?: string;
    exercises: ExerciseInput[];
  };
  
  // types/workout.ts
export type BundleMetadata = {
  total_workouts: number;
  total_exercises: number;
  date_range: {
    start: string;
    end: string;
  };
  exercises_included: string[];
};

export type WorkoutDataBundle = {
  bundle_id: string;
  metadata: BundleMetadata;
  workout_data: any;
  original_query: string;
  chart_url: string | null;
  created_at: string;
  conversationId?: string;
};

export type Workout = {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  created_at: string;
};

export type WorkoutWithConversation = Workout & {
  conversationId: string;
};

export type AttachmentType = 'workout' | 'graph_bundle';