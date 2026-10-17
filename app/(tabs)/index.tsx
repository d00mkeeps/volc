import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Stack } from "tamagui";
import WorkoutPreviewSheet from "@/components/molecules/workout/WorkoutPreviewSheet";
import Dashboard from "@/components/organisms/Dashboard";
import BaseModal from "@/components/atoms/core/BaseModal";
import ProfileView from "@/components/organisms/profile/ProfileView";
import ChatsView from "@/components/organisms/chat/ChatsView";
import Header from "@/components/molecules/headers/HomeScreenHeader";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { SettingsModal } from "@/components/molecules/SettingsModal";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { DisplayMessage } from "@/components/molecules/home/DisplayMessage";
import WorkoutScratchpadSheet from "@/components/molecules/workout/WorkoutScratchpadSheet";

export default function HomeScreen() {
  const { userProfile } = useUserStore();
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);
  const setDashboardHeight = useLayoutStore(
    (state) => state.setDashboardHeight,
  );
  // Layout selectors for dynamic height calculation
  const expandChatOverlay = useLayoutStore((state) => state.expandChatOverlay);
  const screenHeight = useLayoutStore((state) => state.screenHeight);

  // Dashboard state from store
  const {
    allData: dashboardAllData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshDashboard,
  } = useDashboardStore();

  const workoutCount = useWorkoutStore((state) => state.workouts.length);
  const hasDismissedExitModal = useUserSessionStore((state) => state.hasDismissedExitModal);
  const isOnboarding = workoutCount === 0 && !hasDismissedExitModal;

  // Auto-load dashboard data on mount (only if not onboarding)
  useEffect(() => {
    if (!isOnboarding) {
       refreshDashboard();
    }
  }, [isOnboarding]);

  // Fetch suggested actions only when user profile is available
  useEffect(() => {
    if (userProfile?.auth_user_uuid) {
      useConversationStore.getState().fetchSuggestedActions();
    }
  }, [userProfile?.auth_user_uuid]);

  const handleWorkoutDayPress = useCallback(
    (workoutIds: string[]) => {
      setSelectedWorkoutIds(workoutIds);
    },
    [],
  );

  const handleProfilePress = () => {
    setShowProfile(true);
  };

  const handleRecentsPress = () => {
    setShowChats(true);
  };

  return (
    <>
      {/* Main Content */}
      <Stack flex={1} backgroundColor="$background">
        <Stack flex={1} padding="$2">
          {isOnboarding ? null : (
            <>
              <Header
                greeting="Welcome to Volc!"
                onProfilePress={handleProfilePress}
                onRecentsPress={handleRecentsPress}
                onSettingsPress={() => setShowSettingsModal(true)}
                onNewWorkout={() => setShowScratchpad(true)}
              />
              <Stack
                onLayout={(e) => setDashboardHeight(e.nativeEvent.layout.height)}
                position="relative"
              >
                <Dashboard
                  allData={dashboardAllData}
                  isLoading={dashboardLoading}
                  error={dashboardError}
                  onWorkoutDayPress={handleWorkoutDayPress}
                />
              </Stack>

              <DisplayMessage
                maxHeight={screenHeight + 100}
                onPress={() => expandChatOverlay?.()}
              />
            </>
          )}
        </Stack>

        <Stack
          zIndex={20}
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          pointerEvents="box-none"
        >
          <WorkoutPreviewSheet
            workoutIds={selectedWorkoutIds}
            onClose={() => {
              setSelectedWorkoutIds([]);
            }}
          />
        </Stack>

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />

        {/* Profile Modal */}
        <BaseModal
          isVisible={showProfile}
          onClose={() => setShowProfile(false)}
          heightPercent={85}
        >
          <ProfileView />
        </BaseModal>

        {/* Chats Modal */}
        <BaseModal
          isVisible={showChats}
          onClose={() => setShowChats(false)}
          heightPercent={85}
        >
          <ChatsView onClose={() => setShowChats(false)} />
        </BaseModal>

        {/* Workout Scratchpad / New Workout */}
        <WorkoutScratchpadSheet
          isVisible={showScratchpad}
          onClose={() => setShowScratchpad(false)}
        />
      </Stack>
    </>
  );
}
