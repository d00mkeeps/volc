from app.schemas.workout import Workout, WorkoutExercise, SetData

WORKOUT_EXAMPLES = [
    # Basic strength training with explicit units
    (
        """User: I want to log my chest workout
Assistant: What was your first exercise?
User: Bench press, did 3 sets of 225lbs for 8 reps""",
        Workout(
            name="",  # Empty since user didn't provide one
            exercises=[
                WorkoutExercise(
                    exercise_name="Bench Press",
                    weight_unit="lbs",
                    set_data=SetData(sets=[
                        {"weight": 225, "reps": 8},
                        {"weight": 225, "reps": 8},
                        {"weight": 225, "reps": 8}
                    ]),
                    order_in_workout=1
                )
            ]
        )
    ),
    # Mixed workout with different unit types
    (
        """User: Log my leg day called Squat Focus Day
Assistant: What was your first exercise?
User: Squats - first set 135lbs for 10, then 185 for 8, finally 225 for 6
Assistant: Would you like to add another exercise?
User: Yes, did some walking lunges, 3 sets of 40 meters""",
        Workout(
            name="Squat Focus Day",
            exercises=[
                WorkoutExercise(
                    exercise_name="Squats",
                    weight_unit="lbs",
                    set_data=SetData(sets=[
                        {"weight": 135, "reps": 10},
                        {"weight": 185, "reps": 8},
                        {"weight": 225, "reps": 6}
                    ]),
                    order_in_workout=1
                ),
                WorkoutExercise(
                    exercise_name="Walking Lunges",
                    distance_unit="m",
                    set_data=SetData(sets=[
                        {"distance": 40},
                        {"distance": 40},
                        {"distance": 40}
                    ]),
                    order_in_workout=2
                )
            ]
        )
    ),
    # Cardio session
    (
        """User: Logging my morning run
Assistant: What details can you share about your run?
User: Did a 5K in 27:30""",
        Workout(
            name="",
            exercises=[
                WorkoutExercise(
                    exercise_name="Running",
                    distance_unit="km",
                    set_data=SetData(sets=[
                        {"duration": "27:30", "distance": 5}
                    ]),
                    order_in_workout=1
                )
            ]
        )
    ),
    # Complex workout with description and mixed modalities
    (
        """User: Need to log my HIIT session
Assistant: What exercises did you do?
User: Started with assault bike sprints, 30 seconds max effort followed by 30 seconds rest, did that 5 times
Assistant: Got it! Any other exercises?
User: Then did kettlebell swings, 3 sets of 20 reps with 24kg""",
        Workout(
            name="Thursday HIIT",
            description=["High-intensity interval training", "Mixed cardio and strength"],
            exercises=[
                WorkoutExercise(
                    exercise_name="Assault Bike Sprints",
                    set_data=SetData(sets=[
                        {"duration": "00:30"},
                        {"duration": "00:30"},
                        {"duration": "00:30"},
                        {"duration": "00:30"},
                        {"duration": "00:30"}
                    ]),
                    order_in_workout=1
                ),
                WorkoutExercise(
                    exercise_name="Kettlebell Swings",
                    weight_unit="kg",
                    set_data=SetData(sets=[
                        {"weight": 24, "reps": 20},
                        {"weight": 24, "reps": 20},
                        {"weight": 24, "reps": 20}
                    ]),
                    order_in_workout=2
                )
            ]
        )
    )
]