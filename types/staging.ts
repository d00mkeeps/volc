// types/staging.ts

export interface ParsedSetData {
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  duration?: number | null;
  distance?: number | null;
}

export interface ParsedExerciseData {
  exercise_name: string;
  definition_id?: string | null;
  matched_canonical_name?: string | null;
  sets: ParsedSetData[];
  order_index: number;
  notes?: string | null;
}

export interface ParsedWorkoutData {
  name: string;
  workout_timestamp: string;
  notes?: string | null;
  detected_unit?: string;
  exercises: ParsedExerciseData[];
}

export type StagedWorkoutStatus = "staging" | "confirmed" | "discarded";

export interface StagedWorkout {
  id: string;
  user_id: string;
  raw_text: string;
  reference_timestamp: string;
  status: StagedWorkoutStatus;
  parsed_workout: ParsedWorkoutData;
  created_at: string;
  updated_at: string;
}

export interface StageWorkoutPayload {
  raw_text: string;
  reference_timestamp?: string;
  timezone?: string;
  is_imperial?: boolean;
}
