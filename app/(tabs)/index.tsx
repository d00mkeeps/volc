// app/(tabs)/index.tsx
import React, { useState, useRef } from "react";
import { Stack } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/WorkoutTracker"; // Back to WorkoutTracker
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import TemplateSelector from "@/components/molecules/TemplateModal";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import { mockWorkout } from "@/mockdata";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { WorkoutCompletionModal } from "../../components/organisms/WorkoutCompletionModal";

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
    selectTemplate,
    resetSession,
  } = useUserSessionStore();

  const { templates } = useWorkoutTemplates(userProfile?.user_id?.toString());

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
      const workoutToStart = currentWorkout || mockWorkout;
      startWorkout(workoutToStart);
      workoutTrackerRef.current?.startWorkout();
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
          templates={templates}
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
