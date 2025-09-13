import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Stack } from "tamagui";
import { RefreshControl, ScrollView } from "react-native";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/headers/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/workout/WorkoutTracker";
import { Keyboard } from "react-native";
import FloatingActionButton from "@/components/atoms/core/FloatingActionButton";
import TemplateSelector from "@/components/molecules/workout/TemplateModal";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { WorkoutCompletionModal } from "@/components/organisms/workout/WorkoutCompletionModal";
import { CompleteWorkout } from "@/types/workout";
import { OnboardingModal } from "@/components/organisms/onboarding/OnboardingModal";
import { SettingsModal } from "@/components/molecules/SettingsModal";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { SystemMessage } from "@/components/atoms/SystemMessage";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

let count = 0;

export const EMPTY_WORKOUT_TEMPLATE: CompleteWorkout = {
  id: "empty-workout-template",
  user_id: "",
  name: "Start Empty Workout",
  notes: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_template: true,
  workout_exercises: [],
  description: "A blank template for creating custom workouts",
};

export default function HomeScreen() {
  console.log(`=== homescreen render count: ${count} ===`);
  count++;

  const workoutTrackerRef = useRef<WorkoutTrackerRef>(null);
  const { userProfile } = useUserStore();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFinishMessage, setShowFinishMessage] = useState(false);
  const [intendedToStart, setIntendedToStart] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard state from store
  const {
    allData: dashboardAllData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshDashboard,
  } = useDashboardStore();

  // Use our custom hook for session state
  const {
    isActive,
    currentWorkout,
    showTemplateSelector,
    selectedTemplate,
    progress,
  } = useWorkoutSession();

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
    }),
    []
  );

  const { templates } = useWorkoutTemplates(userProfile?.user_id?.toString());

  const templatesWithEmpty = useMemo(() => {
    if (!userProfile?.user_id) return templates;

    const emptyTemplate = {
      ...EMPTY_WORKOUT_TEMPLATE,
      user_id: userProfile.user_id.toString(),
    };

    return [emptyTemplate, ...templates];
  }, [templates, userProfile?.user_id]);

  // Auto-load dashboard data on mount
  useEffect(() => {
    refreshDashboard();
  }, []); // Only on mount

  // Pull-to-refresh handler - refreshes dashboard data, savvy!
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
        // Get the workout directly from store after selection
        setTimeout(() => {
          const { currentWorkout } = useUserSessionStore.getState();
          if (currentWorkout) {
            sessionActions.startWorkout(currentWorkout);
            workoutTrackerRef.current?.expandToFull();
          }
        }, 100);
      }
    },
    [sessionActions, intendedToStart]
  );

  const handleTemplateClose = useCallback(() => {
    setIntendedToStart(false); // RESET INTENT
    sessionActions.closeTemplateSelector();
  }, [sessionActions]);

  const handleToggleWorkout = useCallback(async () => {
    if (isActive) {
      // Check if any sets are completed before allowing finish
      if (progress.completed === 0) {
        setShowFinishMessage(true);
        // Hide message after 3 seconds
        setTimeout(() => setShowFinishMessage(false), 3000);
        return;
      }

      // Force dismiss keyboard to save any active input values
      Keyboard.dismiss();

      // Small delay to let onBlur events process
      await new Promise((resolve) => setTimeout(resolve, 100));

      setShowCompletionModal(true);
      try {
        await sessionActions.finishWorkout();
        workoutTrackerRef.current?.finishWorkout();
      } catch (error) {
        console.error("Failed to finish workout:", error);
        setShowCompletionModal(false);
      }
    } else {
      if (!currentWorkout && !selectedTemplate) {
        setIntendedToStart(true);
        sessionActions.openTemplateSelector();
        return;
      }

      const workoutToStart = currentWorkout;

      if (!workoutToStart) {
        // Handle no user profile case
        console.error("No user profile available");
        return;
      }

      sessionActions.startWorkout(workoutToStart);
      workoutTrackerRef.current?.expandToFull();
    }
  }, [
    isActive,
    progress.completed,
    currentWorkout,
    selectedTemplate,
    sessionActions,
  ]);

  useEffect(() => {
    if (userProfile !== null) {
      // Profile has been loaded
      const needsOnboarding =
        !userProfile.first_name ||
        !userProfile.goals ||
        Object.keys(userProfile.goals || {}).length === 0;

      if (needsOnboarding) {
        console.log("User needs onboarding - showing modal");
        setShowOnboardingModal(true);
      }
    }
  }, [userProfile]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboardingModal(false);
    // Optionally refresh the profile to get updated data
    useUserStore.getState().refreshProfile();
  }, []);

  const handleWorkoutCompletionClose = useCallback(() => {
    setShowCompletionModal(false);
    setIntendedToStart(false);
    sessionActions.resetSession();
    useWorkoutStore.getState().fetchTemplates();
    useDashboardStore.getState().invalidateAfterWorkout();
  }, [sessionActions]);

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
          <Stack flex={1} padding="$4">
            <Header
              greeting="Welcome to Volc!"
              onSettingsPress={() => setShowSettingsModal(true)}
            />
            <Stack marginBottom="$5">
              <Dashboard
                allData={dashboardAllData}
                isLoading={dashboardLoading}
                error={dashboardError}
              />
            </Stack>
          </Stack>
        </ScrollView>

        {/* Other Modals */}
        <TemplateSelector
          isVisible={showTemplateSelector}
          selectedTemplateId={selectedTemplate?.id || null}
          onSelectTemplate={handleTemplateSelect}
          onClose={handleTemplateClose}
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
      </Stack>

      {/* WorkoutTracker */}
      <WorkoutTracker
        ref={workoutTrackerRef}
        currentTemplateName={selectedTemplate?.name}
      />
      <OnboardingModal
        isVisible={showOnboardingModal}
        onComplete={handleOnboardingComplete}
      />

      {/* Floating Action Button with System Message */}
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
          label={isActive ? "FINISH" : "START"}
          onPress={handleToggleWorkout}
          disabled={isActive && progress.completed === 0}
        />
      </Stack>
    </>
  );
}
