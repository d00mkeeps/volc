import React, { useState, useRef, useMemo, useEffect } from "react";
import { Stack } from "tamagui";
import { RefreshControl, ScrollView } from "react-native";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/headers/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/WorkoutTracker";
import { Keyboard } from "react-native";
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import TemplateSelector from "@/components/molecules/workout/TemplateModal";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { WorkoutCompletionModal } from "../../components/organisms/WorkoutCompletionModal";
import { CompleteWorkout } from "@/types/workout";
import { OnboardingModal } from "@/components/organisms/onboarding/OnboardingModal";
import { useDashboardStore } from "@/stores/dashboardStore";

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
  const [intendedToStart, setIntendedToStart] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard state from store
  const {
    allData: dashboardAllData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshDashboard,
  } = useDashboardStore();

  // With selective selectors:
  const isActive = useUserSessionStore((state) => state.isActive);
  const currentWorkout = useUserSessionStore((state) => state.currentWorkout);
  const showTemplateSelector = useUserSessionStore(
    (state) => state.showTemplateSelector
  );
  const selectedTemplate = useUserSessionStore(
    (state) => state.selectedTemplate
  );

  // Actions can be accessed directly:
  const {
    startWorkout,
    finishWorkout,
    closeTemplateSelector,
    openTemplateSelector,
    selectTemplate,
    resetSession,
  } = useUserSessionStore.getState();

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
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTemplateSelect = (template: CompleteWorkout) => {
    console.log("Selected template:", {
      id: template.id,
      name: template.name,
      workoutExercises: template.workout_exercises?.length || 0,
      exercises: (template as any).exercises?.length || 0,
      fullTemplate: template,
    });
    selectTemplate(template);

    if (intendedToStart) {
      setIntendedToStart(false);
      // Get the workout directly from store after selection
      setTimeout(() => {
        const { currentWorkout } = useUserSessionStore.getState();
        if (currentWorkout) {
          startWorkout(currentWorkout);
          workoutTrackerRef.current?.expandToFull();
        }
      }, 100);
    }
  };

  const handleTemplateClose = () => {
    setIntendedToStart(false); // RESET INTENT
    closeTemplateSelector();
  };

  const handleToggleWorkout = async () => {
    if (isActive) {
      // Force dismiss keyboard to save any active input values
      Keyboard.dismiss();

      // Small delay to let onBlur events process
      await new Promise((resolve) => setTimeout(resolve, 100));

      setShowCompletionModal(true);
      try {
        await finishWorkout();
        workoutTrackerRef.current?.finishWorkout();
      } catch (error) {
        console.error("Failed to finish workout:", error);
        setShowCompletionModal(false);
      }
    } else {
      if (!currentWorkout && !selectedTemplate) {
        setIntendedToStart(true);
        openTemplateSelector();
        return;
      }

      const workoutToStart = currentWorkout;

      if (!workoutToStart) {
        // Handle no user profile case
        console.error("No user profile available");
        return;
      }

      startWorkout(workoutToStart);
      workoutTrackerRef.current?.expandToFull();
    }
  };

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

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    // Optionally refresh the profile to get updated data
    useUserStore.getState().refreshProfile();
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
          <Stack flex={1} padding="$4">
            <Header
              greeting="Welcome to Volc!"
              onSettingsPress={() => setShowOnboardingModal(true)}
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

        {/* Floating Action Button */}
        <Stack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingBottom="$5"
          zIndex={10}
          pointerEvents="box-none"
        >
          <FloatingActionButton
            label={isActive ? "FINISH" : "START"}
            onPress={handleToggleWorkout}
          />
        </Stack>

        {/* Other Modals */}
        <TemplateSelector
          isVisible={showTemplateSelector}
          selectedTemplateId={selectedTemplate?.id || null}
          onSelectTemplate={handleTemplateSelect}
          onClose={handleTemplateClose}
        />
        <WorkoutCompletionModal
          isVisible={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setIntendedToStart(false);
            resetSession();
          }}
        />
      </Stack>

      {/* WorkoutTracker - replaces TestBottomSheet */}
      <WorkoutTracker
        ref={workoutTrackerRef}
        currentTemplateName={selectedTemplate?.name}
      />
      <OnboardingModal
        isVisible={showOnboardingModal}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
