export type ExerciseInput = {
  exercise_name: string;
  definition_id?: string; // Optional string (UUID)
  set_data: {
    sets: SetInput[];
  };
  order_in_workout: number;
  weight_unit?: "kg" | "lbs";
  distance_unit?: "km" | "m" | "mi";
};

export type WorkoutInput = {
  name: string;
  description?: string;
  exercises: ExerciseInput[];
};

export interface SetInput {
  weight?: number | null;
  reps?: number | null;
  distance?: number | null;
  duration?: any | null;
  rpe?: number | null;
}
export interface WorkoutExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  distance?: number | null;
  duration?: any | null;
  rpe?: number | null;
  is_completed?: boolean; // Add this
  created_at: string;
  updated_at: string;
}

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

export type WorkoutField = "weight" | "reps" | "rpe" | "distance" | "duration";

export type WorkoutExercise = {
  id: string;
  definition_id?: string; // New field to link to exercise definitions
  workout_id: string;
  name: string;
  order_index: number;
  weight_unit?: "kg" | "lbs";
  distance_unit?: "km" | "m" | "mi";
  created_at: string;
  updated_at: string;
  workout_exercise_sets: WorkoutExerciseSet[];
  notes?: string;
};

// types.ts (add this to your existing types file)
export interface ExerciseDefinition {
  id: string;
  base_movement: string;
  major_variation: string | null;
  standard_name: string;
  aliases: string[] | null;
  equipment: string | null;
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[] | null;
  uses_weight: boolean;
  uses_reps: boolean;
  uses_duration: boolean;
  uses_distance: boolean;
  uses_rpe: boolean;
  is_bodyweight: boolean;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
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
  scheduled_time?: string; // Format: "HH:MM" in 24-hour time
  description?: string;
  image_id?: string;
}

export type BundleMetadata = {
  total_workouts: number;
  total_exercises: number;
  date_range: {
    start: string;
    end: string;
  };
  exercises_included: string[];
};

export interface AnalysisBundle {
  bundle_id: string;
  conversationId?: string;
  metadata: {
    total_workouts?: number;
    total_exercises?: number;
    date_range?: {
      earliest?: string;
      latest?: string;
    };
    exercises_included?: string[];
  };
  workout_data: any; // You can define this more specifically if needed
  original_query: string;
  created_at: string;
  chart_url?: string; // Keep for backward compatibility
  chart_urls?: {
    strength_progress?: string;
    volume_progress?: string;
    correlation_heatmap?: string;
    weekly_frequency?: string;
    [key: string]: string | undefined;
  };
  top_performers?: {
    strength?: Array<{
      name: string;
      first_value: number;
      last_value: number;
      change: number;
      change_percent: number;
    }>;
    volume?: Array<{
      name: string;
      first_value: number;
      last_value: number;
      change: number;
      change_percent: number;
    }>;
    frequency?: Array<{
      name: string;
      first_value: number;
      last_value: number;
      change: number;
      change_percent: number;
    }>;
  };
  consistency_metrics?: {
    score: number;
    streak: number;
    avg_gap: number;
  };
}

export type Workout = {
  id: string;
  name: string;
  description?: string;
  workout_exercises: WorkoutExercise[]; // Changed from "exercises"
  created_at: string;
};

export type WorkoutWithConversation = Workout & {
  conversationId: string;
};

export type AttachmentType = "workout" | "graph_bundle" | "analysis_bundle";
export interface MuscleData {
  muscle: string;
  sets: number;
}

export interface ConsistencyData {
  workoutDates: string[]; // Changed from workoutDays to workoutDates
  totalWorkouts: number;
  // Removed streak, score
}

export interface TimeframeData {
  muscleBalance: MuscleData[];
  consistency: ConsistencyData;
}

export interface AllTimeframeData {
  "1week": TimeframeData;
  "2weeks": TimeframeData;
  "1month": TimeframeData;
  "2months": TimeframeData;
  lastUpdated: string;
}
