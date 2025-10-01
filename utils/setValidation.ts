import {
  WorkoutExerciseSet,
  ExerciseDefinition,
  CompleteWorkout,
} from "@/types/workout";

/**
 * Determine which fields are required based on exercise definition
 */
export function getRequiredFields(
  exerciseDefinition?: ExerciseDefinition
): string[] {
  const showWeight = exerciseDefinition?.uses_weight ?? true;
  const showReps = exerciseDefinition?.uses_reps ?? true;
  const showDistance = exerciseDefinition?.uses_distance ?? false;
  const showDuration = exerciseDefinition?.uses_duration ?? false;

  const required: string[] = [];

  // Weight and reps typically go together for strength exercises
  if (showWeight && showReps) {
    required.push("weight", "reps");
  } else if (showDistance) {
    required.push("distance");
  } else if (showDuration) {
    required.push("duration");
  }

  return required;
}

/**
 * Check if a set has all required data based on what fields are shown
 */
export function isSetComplete(
  set: WorkoutExerciseSet,
  exerciseDefinition?: ExerciseDefinition
): boolean {
  const showWeight = exerciseDefinition?.uses_weight ?? true;
  const showReps = exerciseDefinition?.uses_reps ?? true;
  const showDistance = exerciseDefinition?.uses_distance ?? false;
  const showDuration = exerciseDefinition?.uses_duration ?? false;

  // Helper to check if a value is actually valid (not undefined or NaN)
  const isValid = (value: any) => value !== undefined && !Number.isNaN(value);

  // Check each field that's shown - if it's shown, it must have a valid value
  if (showWeight && !isValid(set.weight)) return false;
  if (showReps && !isValid(set.reps)) return false;
  if (showDistance && !isValid(set.distance)) return false;
  if (showDuration && !isValid(set.duration)) return false;

  return true;
}
/**
 * Count incomplete sets in a workout
 */
export function countIncompleteSets(
  workout: CompleteWorkout,
  exercises: ExerciseDefinition[]
): number {
  let incompleteCount = 0;

  workout.workout_exercises.forEach((exercise) => {
    const definition = exercises.find((ex) => ex.id === exercise.definition_id);
    exercise.workout_exercise_sets.forEach((set) => {
      if (!isSetComplete(set, definition)) {
        incompleteCount++;
      }
    });
  });

  return incompleteCount;
}

/**
 * Filter out incomplete sets from a workout
 */
export function filterIncompleteSets(
  workout: CompleteWorkout,
  exercises: ExerciseDefinition[]
): CompleteWorkout {
  const filteredExercises = workout.workout_exercises
    .map((exercise) => {
      const definition = exercises.find(
        (ex) => ex.id === exercise.definition_id
      );
      const validSets = exercise.workout_exercise_sets.filter((set) =>
        isSetComplete(set, definition)
      );

      return {
        ...exercise,
        workout_exercise_sets: validSets,
      };
    })
    .filter((exercise) => exercise.workout_exercise_sets.length > 0);

  return {
    ...workout,
    workout_exercises: filteredExercises,
  };
}
