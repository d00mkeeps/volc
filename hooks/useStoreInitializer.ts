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
import { networkMonitor } from "@/services/networkMonitor";

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
            // Allow a brief moment (100ms) for AsyncStorage to hydrate Zustand.
            await new Promise((resolve) => setTimeout(resolve, 100));

            const hasCachedProfile = !!useUserStore.getState().userProfile;

            console.log(
              "🔍 [StoreInit] Waiting for up to 3 successful pings to check network...",
            );
            const isOnline = await networkMonitor.waitForSuccessfulPings(
              3,
              3500,
            );

            if (isOnline) {
              console.log(
                "🔍 [StoreInit] Network stable, fetching init data...",
              );
              const initUserPromise = useUserStore
                .getState()
                .initializeIfAuthenticated();

              if (!hasCachedProfile) {
                console.log(
                  "🔍 [StoreInit] No cached profile found. Blocking until network fetch completes...",
                );
                await initUserPromise;
              }

              // Initialize remaining stores in parallel
              await Promise.allSettled([
                useExerciseStore.getState().initializeIfAuthenticated(),
                useGlossaryStore.getState().initializeIfAuthenticated(),
                useConversationStore.getState().initializeIfAuthenticated(),
                useWorkoutStore.getState().initializeIfAuthenticated(),
              ]);
            } else {
              console.log(
                "🔍 [StoreInit] Network unstable, initializing in offline mode...",
              );

              // Proceed with standard reconnect/offline logic without awaiting
              useUserStore
                .getState()
                .initializeIfAuthenticated()
                .catch(() => {});
              useExerciseStore
                .getState()
                .initializeIfAuthenticated()
                .catch(() => {});
              useGlossaryStore
                .getState()
                .initializeIfAuthenticated()
                .catch(() => {});
              useConversationStore
                .getState()
                .initializeIfAuthenticated()
                .catch(() => {});
              useWorkoutStore
                .getState()
                .initializeIfAuthenticated()
                .catch(() => {});
            }

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
