-- Convert existing weights from lbs to kg for users who have 'is_imperial' = true
-- This handles mixed data where some users are imperial (stored in lbs) and others metric (stored in kg)

-- 1. Update workout_exercise_sets weight
UPDATE workout_exercise_sets
SET weight = ROUND((workout_exercise_sets.weight * 0.453592)::numeric, 2)
FROM workout_exercises, workouts, user_profiles
WHERE workout_exercise_sets.exercise_id = workout_exercises.id
  AND workout_exercises.workout_id = workouts.id
  AND workouts.user_id = user_profiles.auth_user_uuid
  AND user_profiles.is_imperial = true
  AND workout_exercise_sets.weight IS NOT NULL;

-- 2. Update workout_exercise_sets estimated_1rm
UPDATE workout_exercise_sets
SET estimated_1rm = ROUND((workout_exercise_sets.estimated_1rm * 0.453592)::numeric, 2)
FROM workout_exercises, workouts, user_profiles
WHERE workout_exercise_sets.exercise_id = workout_exercises.id
  AND workout_exercises.workout_id = workouts.id
  AND workouts.user_id = user_profiles.auth_user_uuid
  AND user_profiles.is_imperial = true
  AND workout_exercise_sets.estimated_1rm IS NOT NULL;

-- 3. Update leaderboard_biceps estimated_1rm
UPDATE leaderboard_biceps
SET estimated_1rm = ROUND((leaderboard_biceps.estimated_1rm * 0.453592)::numeric, 2)
FROM user_profiles
WHERE leaderboard_biceps.user_id = user_profiles.auth_user_uuid
  AND user_profiles.is_imperial = true
  AND leaderboard_biceps.estimated_1rm IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN workout_exercise_sets.weight IS 'Weight in kilograms (kg). Always stored in metric.';
COMMENT ON COLUMN workout_exercise_sets.estimated_1rm IS 'Estimated 1RM in kilograms (kg). Always stored in metric.';
COMMENT ON COLUMN leaderboard_biceps.estimated_1rm IS 'Estimated 1RM in kilograms (kg). Always stored in metric.';
