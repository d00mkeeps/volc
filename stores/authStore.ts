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

        // Initialize all auth-dependent stores
        useUserStore.getState().initializeIfAuthenticated();
        useExerciseStore.getState().initializeIfAuthenticated();
        useConversationStore.getState().initializeIfAuthenticated();
        useWorkoutStore.getState().initializeIfAuthenticated();

        console.log("✅ All stores initialized");
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
