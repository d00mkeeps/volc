import React, { useState, useRef, useMemo } from "react";
import { Stack } from "tamagui";
import Dashboard from "@/components/organisms/Dashboard";
import Header from "@/components/molecules/headers/HomeScreenHeader";
import WorkoutTracker, {
  WorkoutTrackerRef,
} from "@/components/organisms/WorkoutTracker";
import FloatingActionButton from "@/components/atoms/buttons/FloatingActionButton";
import TemplateSelector from "@/components/molecules/workout/TemplateModal";
import { useWorkoutTemplates } from "@/hooks/workout/useWorkoutTemplates";
import {
  createEmptyWorkout,
  useUserSessionStore,
} from "@/stores/userSessionStore";
import { useUserStore } from "@/stores/userProfileStore";
import { WorkoutCompletionModal } from "../../components/organisms/WorkoutCompletionModal";
import { EMPTY_WORKOUT_TEMPLATE } from "@/mockdata";
import { CompleteWorkout } from "@/types/workout";
let count = 0;
export default function HomeScreen() {
  console.log(`=== homescreen render count: ${count} ===`);
  count++;
  const workoutTrackerRef = useRef<WorkoutTrackerRef>(null);
  const { userProfile } = useUserStore();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [intendedToStart, setIntendedToStart] = useState(false);

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
    </>
  );
}
