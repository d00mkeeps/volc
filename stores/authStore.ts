import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useUserStore } from "./userProfileStore";
import { useExerciseStore } from "./workout/exerciseStore";
import { useConversationStore } from "./chat/ConversationStore";
import { useWorkoutStore } from "./workout/WorkoutStore";
import { useDashboardStore } from "./dashboardStore";
import { useChatStore } from "./chat/ChatStore";
import { networkMonitor, NetworkQuality } from "@/services/networkMonitor";

export function useAuthStore() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log("[AuthStore] Initializing stores...");
        const initializeStores = async () => {
          try {
            await useUserStore.getState().initializeIfAuthenticated();
            await useExerciseStore.getState().initializeIfAuthenticated();
            await useConversationStore.getState().initializeIfAuthenticated();
            await useWorkoutStore.getState().initializeIfAuthenticated();
            useChatStore.getState().refreshQuickChat();
            console.log("[AuthStore] All stores initialized");
          } catch (error) {
            console.error("❌ Store initialization failed:", error);
          }
        };
        initializeStores();
      } else {
        console.log("[AuthStore] User logged out - clearing stores...");
        useUserStore.getState().clearData();
        useExerciseStore.getState().clearData();
        useConversationStore.getState().clearData();
        useWorkoutStore.getState().clearData();
        useDashboardStore.getState().clearData();
        // Clear ChatStore quick chat data
        useChatStore.setState({
          greeting: null,
          actions: null,
          isLoadingGreeting: true,
          isLoadingActions: true,
        });
        console.log("[AuthStore] All stores cleared");
      }
    }

    // Network recovery handling
    const handleQualityChange = async ({
      from,
      to,
    }: {
      from: NetworkQuality;
      to: NetworkQuality;
    }) => {
      const isImprovement =
        (from === "offline" || from === "poor") &&
        (to === "good" || to === "excellent");

      if (isImprovement && user && !loading) {
        const refreshStores = async () => {
          console.log(
            `[AuthStore] Network improved (${from} -> ${to}), refreshing stores...`
          );
          try {
            await Promise.all([
              useUserStore.getState().refreshProfile(),
              useExerciseStore.getState().refreshExercises(),
              useConversationStore.getState().initializeIfAuthenticated(),
              useWorkoutStore.getState().loadWorkouts(),
              // ChatStore actions are sync triggers
              Promise.resolve(useChatStore.getState().refreshQuickChat()),
            ]);
            console.log("[AuthStore] Stores refreshed after network recovery");
          } catch (error) {
            console.error(
              "[AuthStore] Error refreshing stores on network recovery:",
              error
            );
          }
        };

        refreshStores();
      }
    };

    networkMonitor.on("qualityChange", handleQualityChange);

    return () => {
      networkMonitor.off("qualityChange", handleQualityChange);
    };
  }, [user, loading]);
}
