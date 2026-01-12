import { AppEventsLogger } from "react-native-fbsdk-next";

export const MetaEvents = {
  logCompleteRegistration: () => {
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
      registration_method: "apple_oauth",
    });
    console.log("[MetaEvents] CompleteRegistration tracked");
  },

  logWorkoutCreated: (workoutName: string, exerciseCount: number) => {
    AppEventsLogger.logEvent("WorkoutCreated", {
      workout_name: workoutName,
      exercise_count: exerciseCount,
    });
    console.log("[MetaEvents] WorkoutCreated tracked:", workoutName);
  },
};
