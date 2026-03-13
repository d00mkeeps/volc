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
import { useUserSessionStore } from "@/stores/userSessionStore";

export function useStoreInitializer() {
  const { user, loading } = useAuth();
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log("[AuthStore] Initializing stores...");
        const initializeStores = async () => {
          try {
            const startTime = Date.now();
            console.log(`⏱️ [StoreInit] [0ms] Starting background initialization...`);
            // Allow a brief moment (100ms) for AsyncStorage to hydrate Zustand.
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log(`⏱️ [StoreInit] [${Date.now() - startTime}ms] AsyncStorage hydration wait finished.`);

            // We need to import useUserSessionStore at the top or access it dynamically if not imported.
            // Ensure we handle dynamic import correctly to avoid circular deps if any.
            // We already did this via useUserSessionStore.getState()
            const hasCachedProfile = !!useUserStore.getState().userProfile;
            const hasCachedWorkouts = useWorkoutStore.getState().workouts.length > 0;
            const hasActiveWorkout = !!useUserSessionStore.getState().currentWorkout;

            console.log(
              `⏱️ [StoreInit] Cache status: Profile=${hasCachedProfile}, Workouts=${hasCachedWorkouts}, ActiveWorkout=${hasActiveWorkout}`
            );

            // Onboarding condition: no workout history and not currently in a workout
            if (!hasCachedWorkouts && !hasActiveWorkout) {
              console.log(
                `⏱️ [StoreInit] No cached workouts and no active workout. Triggering onboarding chat open.`
              );
              // Wait a bit ensuring ChatOverlay has mounted
              setTimeout(() => {
                useConversationStore.getState().setPendingChatOpen(true);
              }, 500);
            }
            console.log(
              `⏱️ [StoreInit] [${Date.now() - startTime}ms] Waiting for up to 1 successful ping to check network...`,
            );
            const isOnline = await networkMonitor.waitForSuccessfulPings(
              1,
              3500,
            );
            console.log(`⏱️ [StoreInit] [${Date.now() - startTime}ms] Network check finished. isOnline: ${isOnline}`);

            if (isOnline) {
              console.log(
                `⏱️ [StoreInit] [${Date.now() - startTime}ms] Network stable, fetching init data...`,
              );
              const initUserPromise = useUserStore
                .getState()
                .initializeIfAuthenticated();

              if (!hasCachedProfile) {
                console.log(
                  `⏱️ [StoreInit] [${Date.now() - startTime}ms] No cached profile found. Blocking until network fetch completes...`,
                );
                await initUserPromise;
                console.log(`⏱️ [StoreInit] [${Date.now() - startTime}ms] initUserPromise resolved.`);
              }

              console.log(`⏱️ [StoreInit] [${Date.now() - startTime}ms] Triggering background store fetches in parallel...`);
              // Initialize remaining stores in parallel (DO NOT AWAIT - Let AuthGate render via cached data)
              Promise.allSettled([
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

            console.log(`⏱️ [StoreInit] [${Date.now() - startTime}ms] About to call refreshQuickChat...`);
            // Non-blocking
            useChatStore.getState().refreshQuickChat();

            // Subscribe to dashboard realtime updates
            const userProfile = useUserStore.getState().userProfile;
            if (userProfile?.auth_user_uuid) {
              useDashboardStore
                .getState()
                .subscribeToUpdates(userProfile.auth_user_uuid);
            }

            console.log(`⏱️ [StoreInit] [${Date.now() - startTime}ms] All stores initialized (background fetches may be ongoing)`);
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
