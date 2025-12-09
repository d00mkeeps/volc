import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Stack } from "tamagui";
import {
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import WorkoutPreviewSheet from "@/components/molecules/workout/WorkoutPreviewSheet";
import Dashboard from "@/components/organisms/Dashboard";
import BaseModal from "@/components/atoms/core/BaseModal";
import ProfileView from "@/components/organisms/profile/ProfileView";
import ChatsView from "@/components/organisms/chat/ChatsView";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "@/components/molecules/headers/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/workout/WorkoutTracker";
import { Keyboard } from "react-native";
import FloatingActionButton from "@/components/atoms/core/FloatingActionButton";
import { WorkoutPlanningModal } from "@/components/organisms/workout/WorkoutPlanningModal";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { WorkoutCompletionModal } from "@/components/organisms/workout/WorkoutCompletionModal";
import { CompleteWorkout } from "@/types/workout";
import { SettingsModal } from "@/components/molecules/SettingsModal";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { SystemMessage } from "@/components/atoms/core/SystemMessage";
import { countIncompleteSets, isSetComplete } from "@/utils/setValidation";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";
// import { WorkoutStartButton } from "@/components/molecules/workout/WorkoutStartButton"; // Removed
import { QuickChatActions } from '@/components/molecules/home/QuickChatActions';
import { useMessageStore } from "@/stores/chat/MessageStore";
import { useFreshGreeting } from "@/hooks/chat/useFreshGreeting";

let count = 0;

export const EMPTY_WORKOUT_TEMPLATE: CompleteWorkout = {
  id: "empty-workout-template",
  user_id: "",
  name: "Name your workout..",
  notes: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_template: true,
  workout_exercises: [],
  description: "",
};

export default function HomeScreen() {
  console.log(`=== homescreen render count: ${count} ===`);
  count++;

  const workoutTrackerRef = useRef<WorkoutTrackerRef>(null);
  const { userProfile } = useUserStore();
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showFinishMessage, setShowFinishMessage] = useState(false);
  const [intendedToStart, setIntendedToStart] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);

  // Dashboard state from store
  const {
    allData: dashboardAllData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshDashboard,
  } = useDashboardStore();

  // Granular selectors - only subscribe to what we need
  const isActive = useUserSessionStore((state) => state.isActive);
  const showTemplateSelector = useUserSessionStore(
    (state) => state.showTemplateSelector
  );
  const selectedTemplate = useUserSessionStore(
    (state) => state.selectedTemplate
  );

  // Stable reference to session actions
  const sessionActions = useMemo(
    () => ({
      startWorkout: useUserSessionStore.getState().startWorkout,
      finishWorkout: useUserSessionStore.getState().finishWorkout,
      closeTemplateSelector:
        useUserSessionStore.getState().closeTemplateSelector,
      openTemplateSelector: useUserSessionStore.getState().openTemplateSelector,
      selectTemplate: useUserSessionStore.getState().selectTemplate,
      resetSession: useUserSessionStore.getState().resetSession,
      clearWorkoutSavedPrompt:
        useUserSessionStore.getState().clearWorkoutSavedPrompt,
      hasAtLeastOneCompleteSet:
        useUserSessionStore.getState().hasAtLeastOneCompleteSet,
    }),
    []
  );

  const { templates } = useWorkoutTemplates(userProfile?.user_id?.toString());

  // Conversation State for Quick Chat
  const activeConversationId = useConversationStore((state) => state.activeConversationId);
  const activeConversation = useConversationStore((state) => 
    activeConversationId ? state.conversations.get(activeConversationId) : undefined
  );
  
  // Check if conversation is fresh enough (< 60 mins)
  // Initially we just use activeConversationId presence, but let's verify timeout logic is handling the archival?
  // Yes, checkTimeout handles archival. So if activeConversationId exists, it's active.

  // Fresh greeting generation
  const freshGreeting = useFreshGreeting();

  const recentMessages = useMessageStore((state) => 
    activeConversationId ? state.messages.get(activeConversationId) : undefined
  );

  const handleQuickReply = useCallback((text: string) => {
    const activeId = useConversationStore.getState().activeConversationId;
    
    // Only set greeting for NEW conversations
    if (!activeId) {
      useConversationStore.getState().setPendingGreeting(freshGreeting);
    }
    
    // Set pending message and open overlay
    useConversationStore.getState().setPendingInitialMessage(text);
    useConversationStore.getState().setPendingChatOpen(true);
  }, [freshGreeting]);


  // Auto-load dashboard data on mount
  useEffect(() => {
    console.log("⚡️ [HomeScreen] MOUNT EFFECT (Dashboard)");
    refreshDashboard();
  }, []);

  // Fetch suggested actions only when user profile is available
  useEffect(() => {
    if (userProfile?.auth_user_uuid) {
      console.log("⚡️ [HomeScreen] User ready, calling fetchSuggestedActions()");
      useConversationStore.getState().fetchSuggestedActions();
    } else {
      console.log("⚡️ [HomeScreen] User not ready yet, skipping actions fetch");
    }
  }, [userProfile?.auth_user_uuid]);

  // Pull-to-refresh handler - refreshes dashboard data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshDashboard]);

  const handleWorkoutDayPress = useCallback((workoutIds: string[]) => {
    setSelectedWorkoutIds(workoutIds);
  }, []);

  const handleTemplateSelect = useCallback(
    (template: CompleteWorkout) => {
      console.log("Selected template:", {
        id: template.id,
        name: template.name,
        workoutExercises: template.workout_exercises?.length || 0,
        exercises: (template as any).exercises?.length || 0,
        fullTemplate: template,
      });
      sessionActions.selectTemplate(template);

      if (intendedToStart) {
        setIntendedToStart(false);
        // Show the chats modal
        setShowChats(true);
        
        // We might need to handle auto-selection of the new conversation in ChatsView
        // For now, we rely on the store having the new conversation.
        useConversationStore.getState().getConversations();
      }
    },
    [sessionActions, intendedToStart]
  );

  const handleTemplateClose = useCallback(() => {
    setIntendedToStart(false);
    sessionActions.closeTemplateSelector();
  }, [sessionActions]);

  const handleToggleWorkout = useCallback(async () => {
    if (isActive) {
      // Force dismiss keyboard to save any active input values
      Keyboard.dismiss();

      // Small delay to let onBlur events process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get current workout for validation
      const currentWorkout = useUserSessionStore.getState().currentWorkout;
      if (!currentWorkout) return;

      // Check for incomplete sets
      const { exercises } = useExerciseStore.getState();
      const incompleteCount = countIncompleteSets(currentWorkout, exercises);

      if (incompleteCount > 0) {
        // Show confirmation alert
        Alert.alert(
          "Incomplete Sets",
          `${incompleteCount} set${
            incompleteCount > 1 ? "s are" : " is"
          } missing data and won't be tracked. Continue anyway?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: async () => {
                setShowCompletionModal(true);
                try {
                  await sessionActions.finishWorkout();
                  workoutTrackerRef.current?.finishWorkout();
                } catch (error) {
                  console.error("Failed to finish workout:", error);
                  setShowCompletionModal(false);
                }
              },
            },
          ]
        );
      } else {
        // All sets complete, proceed normally
        setShowCompletionModal(true);
        try {
          await sessionActions.finishWorkout();
          workoutTrackerRef.current?.finishWorkout();
        } catch (error) {
          console.error("Failed to finish workout:", error);
          setShowCompletionModal(false);
        }
      }
    }
  }, [isActive, sessionActions]);



  const handleWorkoutCompletionClose = useCallback(() => {
    setShowCompletionModal(false);
    setIntendedToStart(false);
    sessionActions.resetSession();
    useWorkoutStore.getState().fetchTemplates();
    useDashboardStore.getState().invalidateAfterWorkout();
  }, [sessionActions]);

  const hasAtLeastOneCompleteSet = useUserSessionStore((state) => {
    if (!state.currentWorkout) return false;
    const { exercises } = useExerciseStore.getState();

    return state.currentWorkout.workout_exercises.some((exercise) => {
      const definition = exercises.find(
        (ex) => ex.id === exercise.definition_id
      );
      return exercise.workout_exercise_sets.some((set) =>
        isSetComplete(set, definition)
      );
    });
  });

  const handlePlanWithCoach = useCallback(() => {
    setIntendedToStart(true);
    sessionActions.openTemplateSelector();
  }, [sessionActions]);

  const handleLogManually = useCallback(() => {
    if (userProfile?.user_id) {
      const emptyTemplate = {
        ...EMPTY_WORKOUT_TEMPLATE,
        user_id: userProfile.user_id.toString(),
      };

      // Select and immediately start with empty template
      sessionActions.selectTemplate(emptyTemplate);
      setTimeout(() => {
        const { currentWorkout } = useUserSessionStore.getState();
        if (currentWorkout) {
          sessionActions.startWorkout(currentWorkout);
          workoutTrackerRef.current?.expandToFull();
        }
      }, 100);
    }
  }, [sessionActions, userProfile?.user_id]);

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
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Stack flex={1} padding="$4" paddingBottom="$20">
            <Header
              greeting="Welcome to Volc!"
              onProfilePress={handleProfilePress}
              onRecentsPress={handleRecentsPress}
              onSettingsPress={() => setShowSettingsModal(true)}
            />
            <Stack marginBottom="$5" paddingBlock="$6">
              <Dashboard
                allData={dashboardAllData}
                isLoading={dashboardLoading}
                error={dashboardError}
                onWorkoutDayPress={handleWorkoutDayPress} // ✅ Add this prop
              />
            </Stack>

            {/* Quick Chat Interface */}
            {/* Quick Chat Actions */}
            <QuickChatActions
              isActive={!!activeConversationId}
              onActionSelect={handleQuickReply}
              recentMessages={recentMessages || undefined}
              greeting={freshGreeting}
            />
          </Stack>
        </ScrollView>

        <WorkoutPlanningModal
          isVisible={showTemplateSelector}
          onSelectTemplate={handleTemplateSelect}
          onClose={handleTemplateClose}
        />
        <WorkoutPreviewSheet
          workoutIds={selectedWorkoutIds}
          onClose={() => {
            setSelectedWorkoutIds([]);
          }}
        />

        <WorkoutCompletionModal
          isVisible={showCompletionModal}
          onClose={handleWorkoutCompletionClose}
        />

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
      </Stack>

      {/* WorkoutTracker - only show when active */}
      {isActive && (
        <WorkoutTracker
          ref={workoutTrackerRef}
          currentTemplateName={selectedTemplate?.name}
        />
      )}
      {/* Floating Action Button - only show when active */}
      {isActive && (
        <Stack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingBottom="$5"
          pointerEvents="box-none"
        >
          {/* System Message */}
          {showFinishMessage && (
            <Stack paddingHorizontal="$4" paddingBottom="$2">
              <SystemMessage
                message="Complete at least one set to finish your workout"
                type="info"
              />
            </Stack>
          )}

          {/* Floating Action Button */}
          <FloatingActionButton
            label="FINISH"
            onPress={handleToggleWorkout}
            disabled={!hasAtLeastOneCompleteSet}
          />
        </Stack>
      )}
    </>
  );
}
