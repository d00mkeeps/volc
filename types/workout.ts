export type WorkoutSet = {
    id: string;
    exercise_id: string;
    set_number: number;
    weight?: number;
    reps?: number;
    rpe?: number;
    distance?: number;
    duration?: string;
    created_at: string;
    updated_at: string;
  };
  
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
  
  export type CompleteWorkout = {
    id: string;
    user_id: string;
    program_id?: string;
    name: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    workout_exercises: WorkoutExercise[];
  };
  
  // Input Types
  export type SetInput = {
    weight?: number;
    reps?: number;
    rpe?: number;
    distance?: number;
    duration?: string;
  };
  
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
  