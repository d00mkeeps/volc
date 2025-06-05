// app/(tabs)/index.tsx
import React, { useState, useRef, useMemo } from "react";
import { Stack } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/WorkoutTracker";
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import TemplateSelector from "@/components/molecules/TemplateModal";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import {
  createEmptyWorkout,
  useUserSessionStore,
} from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { WorkoutCompletionModal } from "../../components/organisms/WorkoutCompletionModal";
import { EMPTY_WORKOUT_TEMPLATE } from "@/mockdata";

export default function HomeScreen() {
  const workoutTrackerRef = useRef<WorkoutTrackerRef>(null);
  const { userProfile } = useUserStore();
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const {
    isActive,
    startWorkout,
    finishWorkout,
    currentWorkout,
    showTemplateSelector,
    selectedTemplate,
    closeTemplateSelector,
    openTemplateSelector,
    selectTemplate,
    resetSession,
  } = useUserSessionStore();

  const { templates } = useWorkoutTemplates(userProfile?.user_id?.toString());

  const templatesWithEmpty = useMemo(() => {
    if (!userProfile?.user_id) return templates;

    const emptyTemplate = {
      ...EMPTY_WORKOUT_TEMPLATE,
      user_id: userProfile.user_id.toString(),
    };

    return [emptyTemplate, ...templates];
  }, [templates, userProfile?.user_id]);

  const handleToggleWorkout = async () => {
    if (isActive) {
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
        // Encourage template use first
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

  return (
    <>
      {/* Main Content */}
      <Stack flex={1} backgroundColor="$background">
        <Stack flex={1} padding="$4">
          <Header
            greeting="Welcome to Volc!"
            onSettingsPress={() => console.log("Settings pressed")}
          />
          <Stack marginBottom="$5">
            <Dashboard />
          </Stack>
        </Stack>

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
          templates={templatesWithEmpty}
          selectedTemplateId={selectedTemplate?.id || null}
          onSelectTemplate={selectTemplate}
          onClose={closeTemplateSelector}
        />
        <WorkoutCompletionModal
          isVisible={showCompletionModal}
          workout={currentWorkout}
          onClose={() => {
            setShowCompletionModal(false);
            resetSession();
          }}
        />
      </Stack>

      {/* WorkoutTracker - replaces TestBottomSheet */}
      <WorkoutTracker
        ref={workoutTrackerRef}
        currentTemplateName={selectedTemplate?.name}
      />
    </>
  );
}
