import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useUserStore } from "./userProfileStore";
import { useExerciseStore } from "./workout/exerciseStore";
import { useConversationStore } from "./chat/ConversationStore";
import { useWorkoutStore } from "./workout/WorkoutStore";

/**
 * Central auth state manager that coordinates all store initialization
 * Call this once at the app root level
 */
export function useAuthStore() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log("🔐 Auth detected - initializing stores...");

        const initializeStores = async () => {
          try {
            console.log("Initializing UserStore...");
            await useUserStore.getState().initializeIfAuthenticated();
            console.log("✅ UserStore done");

            console.log("Initializing ExerciseStore...");
            await useExerciseStore.getState().initializeIfAuthenticated();
            console.log("✅ ExerciseStore done");

            console.log("Initializing ConversationStore...");
            await useConversationStore.getState().initializeIfAuthenticated();
            console.log("✅ ConversationStore done");

            console.log("Initializing WorkoutStore...");
            await useWorkoutStore.getState().initializeIfAuthenticated();
            console.log("✅ WorkoutStore done");
          } catch (error) {
            console.error("❌ Store initialization failed:", error);
          }
        };
        initializeStores();
      } else {
        console.log("🚪 User logged out - clearing stores...");
        // Clear all stores on logout
        useUserStore.getState().clearData();
        useExerciseStore.getState().clearData();
        useConversationStore.getState().clearData();
        useWorkoutStore.getState().clearData();
        console.log("🧹 All stores cleared");
      }
    }
  }, [user, loading]);
}
