import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useUserStore } from "@/stores/userProfileStore";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { useGlossaryStore } from "@/stores/glossaryStore";
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
            console.log("🔍 [StoreInit] Starting background initialization...");
            // Initialize user profile first, as others depend on it
            const initUserPromise = useUserStore
              .getState()
              .initializeIfAuthenticated();

            // Allow a brief moment (100ms) for AsyncStorage to hydrate Zustand.
            await new Promise((resolve) => setTimeout(resolve, 100));

            if (!useUserStore.getState().userProfile) {
              console.log(
                "🔍 [StoreInit] No cached profile found. Blocking until network fetch completes...",
              );
              await initUserPromise;
            } else {
              console.log(
                "🔍 [StoreInit] Cached profile available. Fetching updates smoothly in the background.",
              );
            }

            console.log(
              "🔍 [StoreInit] contextBundle.ai_memory:",
              useUserStore.getState().contextBundle?.ai_memory,
            );

            // Initialize remaining stores in parallel in the background
            const initOthersPromise = Promise.allSettled([
              useExerciseStore.getState().initializeIfAuthenticated(),
              useGlossaryStore.getState().initializeIfAuthenticated(),
              useConversationStore.getState().initializeIfAuthenticated(),
              useWorkoutStore.getState().initializeIfAuthenticated(),
            ]);

            // Wait up to 500ms for other stores to fetch fresh data.
            // If network is slow, this aborts the wait and proceeds with the cached offline data.
            await Promise.race([
              initOthersPromise,
              new Promise((resolve) => setTimeout(resolve, 500)),
            ]);

            console.log("🔍 [StoreInit] About to call refreshQuickChat...");
            // Non-blocking
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
        useGlossaryStore.getState().clearData();
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
