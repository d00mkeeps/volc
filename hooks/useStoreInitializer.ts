import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useUserStore } from "@/stores/userProfileStore";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useChatStore } from "@/stores/chat/ChatStore";
import { useAuthStore } from "@/stores/authStore";

export function useStoreInitializer() {
  const { user, loading } = useAuth();
  const setInitialized = useAuthStore((state) => state.setInitialized);

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

            // Subscribe to dashboard realtime updates
            const userProfile = useUserStore.getState().userProfile;
            if (userProfile?.auth_user_uuid) {
              useDashboardStore
                .getState()
                .subscribeToUpdates(userProfile.auth_user_uuid);
            }

            console.log("[AuthStore] All stores initialized");
            setInitialized(true);
          } catch (error) {
            console.error("❌ Store initialization failed:", error);
            // Even if stores fail to load, we should let the app start
            // The individual stores handle their own error states
            setInitialized(true);
          }
        };
        initializeStores();
      } else {
        console.log("[AuthStore] User logged out - clearing stores...");

        // Unsubscribe from dashboard updates BEFORE clearing
        useDashboardStore.getState().unsubscribe();

        useUserStore.getState().clearData();
        useExerciseStore.getState().clearData();
        useConversationStore.getState().clearData();
        useWorkoutStore.getState().clearData();
        useDashboardStore.getState().clearData();
        useChatStore.setState({
          greeting: null,
          actions: null,
          isLoadingGreeting: true,
          isLoadingActions: true,
        });
        console.log("[AuthStore] All stores cleared");
        setInitialized(true);
      }
    }
  }, [user, loading, setInitialized]);
}
