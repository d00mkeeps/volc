// app/(tabs)/index.tsx
import React, { useState, useRef } from "react";
import { Stack, Text } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/WorkoutTracker";
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import TemplateSelector from "@/components/molecules/TemplateSelector";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import { mockWorkout } from "@/mockdata";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";

export default function HomeScreen() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const workoutTrackerRef = useRef<WorkoutTrackerRef>(null);
  const { userProfile } = useUserStore();

  const {
    isActive,
    startWorkout,
    finishWorkout,
    currentWorkout,
    // Template state from store
    showTemplateSelector,
    selectedTemplate,
    closeTemplateSelector,
    selectTemplate,
    // Removed: timeString, isPaused, togglePause - header gets these from store
  } = useUserSessionStore();

  // Get templates
  const { templates } = useWorkoutTemplates(userProfile?.user_id?.toString());

  const handleToggleWorkout = async () => {
    if (isActive) {
      try {
        await finishWorkout();
        workoutTrackerRef.current?.finishWorkout();
      } catch (error) {
        console.error("Failed to finish workout:", error);
      }
    } else {
      const workoutToStart = currentWorkout || mockWorkout;
      startWorkout(workoutToStart);
      workoutTrackerRef.current?.startWorkout();
    }
  };

  const handleActiveChange = (active: boolean) => {
    setIsWorkoutActive(active);
  };

  return (
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

      <WorkoutTracker
        ref={workoutTrackerRef}
        workout={currentWorkout || mockWorkout}
        isActive={isWorkoutActive}
        onActiveChange={handleActiveChange}
        currentTemplateName={selectedTemplate?.name}
        // Removed: timeString, isPaused, togglePause
      />

      <Stack paddingBottom="$5">
        <FloatingActionButton
          label={isWorkoutActive ? "FINISH" : "START"}
          onPress={handleToggleWorkout}
        />
      </Stack>

      {/* Template Selector Modal - managed by store state */}
      <TemplateSelector
        isVisible={showTemplateSelector}
        templates={templates}
        selectedTemplateId={selectedTemplate?.id || null}
        onSelectTemplate={selectTemplate}
        onClose={closeTemplateSelector}
      />
    </Stack>
  );
}
