from app.schemas.workout import Workout, WorkoutExercise, SetData

WORKOUT_EXAMPLES = [
    # Example 1: Basic strength training
    (
        """User: I want to log my chest workout
Assistant: What would you like to name this workout?
User: Monday Chest Day
Assistant: Great name! What was your first exercise?
User: Started with bench press, did 3 sets of 225lbs for 8 reps""",
        Workout(
            name="Monday Chest Day",
            exercises=[
                WorkoutExercise(
                    exercise_name="Bench Press",
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

    # Example 2: Mixed workout with different set schemes
    (
        """User: Log my leg day
Assistant: What would you like to name this workout?
User: Squat Focus Day
Assistant: Got it! What was your first exercise?
User: Squats - first set 135lbs for 10, then 185 for 8, finally 225 for 6
Assistant: Noted! Any other exercises?
User: Yes, did some walking lunges, 3 sets of 40 meters with 20lb dumbbells""",
        Workout(
            name="Squat Focus Day",
            exercises=[
                WorkoutExercise(
                    exercise_name="Squats",
                    set_data=SetData(sets=[
                        {"weight": 135, "reps": 10},
                        {"weight": 185, "reps": 8},
                        {"weight": 225, "reps": 6}
                    ]),
                    order_in_workout=1
                ),
                WorkoutExercise(
                    exercise_name="Walking Lunges",
                    set_data=SetData(sets=[
                        {"weight": 20, "distance": "40m"},
                        {"weight": 20, "distance": "40m"},
                        {"weight": 20, "distance": "40m"}
                    ]),
                    order_in_workout=2
                )
            ]
        )
    ),

    # Example 3: Cardio session
    (
        """User: Logging my morning run
Assistant: What would you like to name this workout?
User: Morning 5K
Assistant: Great! What details can you share about your run?
User: Did a 5K in 27:30, started slow and picked up the pace""",
        Workout(
            name="Morning 5K",
            exercises=[
                WorkoutExercise(
                    exercise_name="Running",
                    set_data=SetData(sets=[
                        {"duration": "27:30", "distance": "5km"}
                    ]),
                    order_in_workout=1
                )
            ]
        )
    ),

    # Example 4: Complex workout with description
    (
        """User: Need to log my HIIT session
Assistant: What would you like to name this workout?
User: Thursday HIIT
Assistant: Could you provide any additional details about this workout?
User: It's a cardio focus day with some strength elements
Assistant: What exercises did you do?
User: Started with assault bike sprints, 30 seconds max effort followed by 30 seconds rest, did that 5 times
Assistant: Got it! Any other exercises?
User: Then did kettlebell swings, 3 sets of 20 reps with 24kg
Assistant: Nice one. Anything else?""",
        Workout(
            name="Thursday HIIT",
            description="Cardio focus day with some strength elements",
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