import { CompleteWorkout } from "./types/workout";

export const EMPTY_WORKOUT_TEMPLATE: CompleteWorkout = {
  id: 'empty-workout-template',
  user_id: '', // Will be set when used
  name: 'Freestyle Workout',
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_template: true,
  workout_exercises: [],
  description: 'A blank template for creating custom workouts',
};

export const mockWorkout: CompleteWorkout = {
  id: "workout-123e4567-e89b-12d3-a456-426614174000",
  user_id: "user-987fcdeb-51a2-43d7-8f9e-123456789000",
  name: "Push Day - Upper Body Strength",
  notes: "Felt strong today, increased weight on bench press",
  description: "Chest, shoulders, and triceps focused session",
  created_at: "2024-06-05T10:30:00.000Z",
  updated_at: "2024-06-05T12:15:00.000Z",
  is_template: false,
  scheduled_time: "10:30",
  workout_exercises: [
    {
      id: "exercise-1-bench-press",
      definition_id: "def-bench-press-barbell",
      workout_id: "workout-123e4567-e89b-12d3-a456-426614174000",
      name: "Barbell Bench Press",
      order_index: 1,
      weight_unit: "kg",
      created_at: "2024-06-05T10:35:00.000Z",
      updated_at: "2024-06-05T11:00:00.000Z",
      notes: "New PR on last set!",
      workout_exercise_sets: [
        {
          id: "set-1-1",
          exercise_id: "exercise-1-bench-press",
          set_number: 1,
          weight: 80,
          reps: 12,
          rpe: 6,
          is_completed: true,
          created_at: "2024-06-05T10:35:00.000Z",
          updated_at: "2024-06-05T10:37:00.000Z"
        },
        {
          id: "set-1-2",
          exercise_id: "exercise-1-bench-press",
          set_number: 2,
          weight: 85,
          reps: 10,
          rpe: 7,
          is_completed: true,
          created_at: "2024-06-05T10:40:00.000Z",
          updated_at: "2024-06-05T10:42:00.000Z"
        },
        {
          id: "set-1-3",
          exercise_id: "exercise-1-bench-press",
          set_number: 3,
          weight: 90,
          reps: 8,
          rpe: 8,
          is_completed: true,
          created_at: "2024-06-05T10:45:00.000Z",
          updated_at: "2024-06-05T10:47:00.000Z"
        },
        {
          id: "set-1-4",
          exercise_id: "exercise-1-bench-press",
          set_number: 4,
          weight: 95,
          reps: 6,
          rpe: 9,
          is_completed: true,
          created_at: "2024-06-05T10:50:00.000Z",
          updated_at: "2024-06-05T10:52:00.000Z"
        }
      ]
    },
    {
      id: "exercise-2-shoulder-press",
      definition_id: "def-shoulder-press-dumbbell",
      workout_id: "workout-123e4567-e89b-12d3-a456-426614174000",
      name: "Dumbbell Shoulder Press",
      order_index: 2,
      weight_unit: "kg",
      created_at: "2024-06-05T11:05:00.000Z",
      updated_at: "2024-06-05T11:20:00.000Z",
      workout_exercise_sets: [
        {
          id: "set-2-1",
          exercise_id: "exercise-2-shoulder-press",
          set_number: 1,
          weight: 30,
          reps: 12,
          rpe: 7,
          is_completed: true,
          created_at: "2024-06-05T11:05:00.000Z",
          updated_at: "2024-06-05T11:07:00.000Z"
        },
        {
          id: "set-2-2",
          exercise_id: "exercise-2-shoulder-press",
          set_number: 2,
          weight: 32.5,
          reps: 10,
          rpe: 8,
          is_completed: true,
          created_at: "2024-06-05T11:10:00.000Z",
          updated_at: "2024-06-05T11:12:00.000Z"
        },
        {
          id: "set-2-3",
          exercise_id: "exercise-2-shoulder-press",
          set_number: 3,
          weight: 32.5,
          reps: 9,
          rpe: 8,
          is_completed: true,
          created_at: "2024-06-05T11:15:00.000Z",
          updated_at: "2024-06-05T11:17:00.000Z"
        }
      ]
    },
    {
      id: "exercise-3-push-ups",
      workout_id: "workout-123e4567-e89b-12d3-a456-426614174000",
      name: "Push-ups",
      order_index: 3,
      created_at: "2024-06-05T11:25:00.000Z",
      updated_at: "2024-06-05T11:35:00.000Z",
      notes: "Bodyweight burnout sets",
      workout_exercise_sets: [
        {
          id: "set-3-1",
          exercise_id: "exercise-3-push-ups",
          set_number: 1,
          reps: 25,
          rpe: 7,
          is_completed: true,
          created_at: "2024-06-05T11:25:00.000Z",
          updated_at: "2024-06-05T11:27:00.000Z"
        },
        {
          id: "set-3-2",
          exercise_id: "exercise-3-push-ups",
          set_number: 2,
          reps: 20,
          rpe: 8,
          is_completed: true,
          created_at: "2024-06-05T11:30:00.000Z",
          updated_at: "2024-06-05T11:32:00.000Z"
        },
        {
          id: "set-3-3",
          exercise_id: "exercise-3-push-ups",
          set_number: 3,
          reps: 15,
          rpe: 9,
          is_completed: true,
          created_at: "2024-06-05T11:33:00.000Z",
          updated_at: "2024-06-05T11:35:00.000Z"
        }
      ]
    },
    {
      id: "exercise-4-tricep-dips",
      workout_id: "workout-123e4567-e89b-12d3-a456-426614174000",
      name: "Tricep Dips",
      order_index: 4,
      created_at: "2024-06-05T11:40:00.000Z",
      updated_at: "2024-06-05T11:50:00.000Z",
      workout_exercise_sets: [
        {
          id: "set-4-1",
          exercise_id: "exercise-4-tricep-dips",
          set_number: 1,
          reps: 15,
          rpe: 6,
          is_completed: true,
          created_at: "2024-06-05T11:40:00.000Z",
          updated_at: "2024-06-05T11:42:00.000Z"
        },
        {
          id: "set-4-2",
          exercise_id: "exercise-4-tricep-dips",
          set_number: 2,
          reps: 12,
          rpe: 7,
          is_completed: true,
          created_at: "2024-06-05T11:45:00.000Z",
          updated_at: "2024-06-05T11:47:00.000Z"
        },
        {
          id: "set-4-3",
          exercise_id: "exercise-4-tricep-dips",
          set_number: 3,
          reps: 10,
          rpe: 8,
          is_completed: true,
          created_at: "2024-06-05T11:48:00.000Z",
          updated_at: "2024-06-05T11:50:00.000Z"
        }
      ]
    },
    {
      id: "exercise-5-cardio-finisher",
      workout_id: "workout-123e4567-e89b-12d3-a456-426614174000",
      name: "Treadmill Sprint Intervals",
      order_index: 5,
      distance_unit: "km",
      created_at: "2024-06-05T12:00:00.000Z",
      updated_at: "2024-06-05T12:15:00.000Z",
      notes: "High intensity finish",
      workout_exercise_sets: [
        {
          id: "set-5-1",
          exercise_id: "exercise-5-cardio-finisher",
          set_number: 1,
          distance: 0.5,
          duration: "3:30",
          rpe: 8,
          is_completed: true,
          created_at: "2024-06-05T12:00:00.000Z",
          updated_at: "2024-06-05T12:05:00.000Z"
        },
        {
          id: "set-5-2",
          exercise_id: "exercise-5-cardio-finisher",
          set_number: 2,
          distance: 0.5,
          duration: "3:45",
          rpe: 9,
          is_completed: true,
          created_at: "2024-06-05T12:08:00.000Z",
          updated_at: "2024-06-05T12:13:00.000Z"
        }
      ]
    }
  ]
};

// Create a file: mockData/analysisBundle.ts
export const mockAnalysisBundle = {
  id: "0a84dd47-1bb8-4087-bc2d-334d48eb17df",
  user_id: "1e2d6190-5d52-4f48-974c-7a5a43a50bf3",
  metadata: {
    date_range: "2025-04-01 to 2025-05-01",
    total_workouts: 10,
    total_exercises: 5,
    exercises_included: ["squat", "bench press", "deadlift"]
  },
  workout_data: {
    workouts: [
      {
        id: "338339aa-6253-46a1-b6ac-b14a34676d0c",
        date: "2025-05-13T10:42:06.260669",
        name: "Test Workout"
      }
    ]
  },
  original_query: "Show my workout progress",
  chart_url: "https://example.com/chart.png",
  chart_urls: {
    volume_progress: "https://example.com/volume.png",
    strength_progress: "https://example.com/strength.png"
  },
  consistency_metrics: {
    score: 85,
    streak: 3,
    avg_gap: 2.5
  },
  top_performers: {
    volume: [{ name: "bench press", change: 15, change_percent: 8 }],
    strength: [{ name: "squat", change: 20, change_percent: 10 }]
  },
  conversation_id: "12fb5333-09c7-4532-ac2c-9eccb37a1da1"
};