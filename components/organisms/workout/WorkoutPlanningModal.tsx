import React, { useCallback, useEffect } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import BaseModal from "../../atoms/core/BaseModal";
import { ChatInterface } from "../ChatInterface";
import { useWorkoutPlanning } from "@/hooks/chat/useWorkoutPlanning";
import { CompleteWorkout } from "@/types/workout";
import { EMPTY_WORKOUT_TEMPLATE } from "@/app/(tabs)/index";
import { useUserStore } from "@/stores/userProfileStore";

interface WorkoutPlanningModalProps {
  isVisible: boolean;
  onSelectTemplate?: (template: CompleteWorkout) => void;
  onClose: () => void;
}

export const WorkoutPlanningModal = ({
  isVisible,
  onSelectTemplate,
  onClose,
}: WorkoutPlanningModalProps) => {
  const planning = useWorkoutPlanning();
  const { userProfile } = useUserStore();

  // Convert backend template data to CompleteWorkout format
  // Convert backend template data to CompleteWorkout format
  const convertTemplateToWorkout = useCallback(
    (templateData: any): CompleteWorkout | null => {
      // The template data comes directly, not wrapped in workout_template
      if (!templateData || !userProfile?.user_id) {
        console.error(
          "[WorkoutPlanningModal] Missing template data or user profile:",
          {
            hasTemplate: !!templateData,
            hasUserId: !!userProfile?.user_id,
            templateData,
          }
        );
        return null;
      }

      // Use templateData directly since it's the template, not wrapped
      const template = templateData;
      const now = new Date().toISOString();

      const convertedWorkout: CompleteWorkout = {
        id: `ai-template-${Date.now()}`,
        user_id: userProfile.user_id.toString(),
        name: template.name || "AI Generated Workout",
        notes: template.notes || "",
        is_template: true,
        workout_exercises:
          template.workout_exercises?.map((exercise: any, index: number) => ({
            id: `exercise-${Date.now()}-${index}`,
            definition_id: exercise.definition_id || undefined,
            workout_id: `ai-template-${Date.now()}`,
            name: exercise.name || `Exercise ${index + 1}`,
            notes: exercise.notes || undefined,
            order_index: exercise.order_index ?? index,
            weight_unit: "kg",
            distance_unit: "km",
            workout_exercise_sets:
              exercise.workout_exercise_sets?.map(
                (set: any, setIndex: number) => ({
                  id: `set-${Date.now()}-${index}-${setIndex}`,
                  exercise_id: `exercise-${Date.now()}-${index}`,
                  set_number: set.set_number || setIndex + 1,
                  reps: set.reps || undefined,
                  weight: set.weight || undefined,
                  distance: set.distance || undefined,
                  duration: set.duration || undefined,
                  rpe: set.rpe || undefined,
                  is_completed: false,
                  created_at: now,
                  updated_at: now,
                })
              ) || [],
            created_at: now,
            updated_at: now,
          })) || [],
        created_at: now,
        updated_at: now,
      };

      console.log("[WorkoutPlanningModal] Converted template:", {
        originalName: template.name,
        convertedName: convertedWorkout.name,
        exerciseCount: convertedWorkout.workout_exercises.length,
      });

      return convertedWorkout;
    },
    [userProfile?.user_id]
  );

  // Handle approved template from AI
  const handleTemplateApproved = useCallback(
    (templateData: any) => {
      console.log(
        "[WorkoutPlanningModal] Template approved, processing data:",
        templateData
      );

      const workout = convertTemplateToWorkout(templateData);
      if (workout && onSelectTemplate) {
        console.log(
          "[WorkoutPlanningModal] Successfully converted template, selecting workout"
        );
        onSelectTemplate(workout);
        onClose();
      } else {
        console.error(
          "[WorkoutPlanningModal] Failed to convert template data to workout"
        );
      }
    },
    [convertTemplateToWorkout, onSelectTemplate, onClose]
  );

  // Register/unregister template approval handler based on modal visibility
  useEffect(() => {
    if (isVisible && planning.setTemplateApprovalHandler) {
      console.log(
        "[WorkoutPlanningModal] Registering template approval handler"
      );
      planning.setTemplateApprovalHandler(handleTemplateApproved);
    } else if (!isVisible && planning.setTemplateApprovalHandler) {
      console.log(
        "[WorkoutPlanningModal] Unregistering template approval handler"
      );
      planning.setTemplateApprovalHandler(() => {});
    }

    // Cleanup on unmount
    return () => {
      if (planning.setTemplateApprovalHandler) {
        planning.setTemplateApprovalHandler(() => {});
      }
    };
  }, [isVisible, planning.setTemplateApprovalHandler, handleTemplateApproved]);

  // Handle sending messages
  const handleSend = async (content: string) => {
    try {
      await planning.sendMessage(content);
    } catch (error) {
      console.error("Failed to send planning message:", error);
    }
  };

  // Handle "Choose my own workout" button
  const handleChooseOwnWorkout = () => {
    if (onSelectTemplate && userProfile?.user_id) {
      const emptyTemplate = {
        ...EMPTY_WORKOUT_TEMPLATE,
        user_id: userProfile.user_id.toString(),
      };
      onSelectTemplate(emptyTemplate);
      onClose();
    }
  };

  // Determine connection state for placeholder
  const getConnectionState = ():
    | "ready"
    | "expecting_ai_message"
    | "disconnected" => {
    if (planning.connectionState === "disconnected") {
      return "disconnected";
    }
    if (planning.messages.length === 0 && !planning.streamingMessage) {
      return "expecting_ai_message";
    }
    return "ready";
  };

  const handleRestart = async () => {
    await planning.restartChat();
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      widthPercent={95}
      heightPercent={85}
    >
      <YStack flex={1}>
        {/* Header with Close and Choose Own Workout buttons */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$5"
          paddingVertical="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderSoft"
        >
          <Text size="medium" fontWeight="600" color="$color" flex={1.5}>
            Plan Your Workout
          </Text>

          <Button
            flex={0.6}
            size="$2"
            backgroundColor="$primary"
            color="white"
            onPress={handleChooseOwnWorkout}
            pressStyle={{ backgroundColor: "$primaryPress" }}
          >
            <Text size="small" color="$text" fontWeight="600">
              Skip AI Chat
            </Text>
          </Button>
        </XStack>

        <YStack flex={1}>
          <ChatInterface
            messages={planning.messages}
            streamingMessage={planning.streamingMessage}
            onSend={handleSend}
            onRestart={handleRestart}
            placeholder="Tell me about your workout goals..."
            connectionState={getConnectionState()}
            onTemplateApprove={handleTemplateApproved} // Add this line
            keyboardVerticalOffset={150}
          />
        </YStack>
      </YStack>
    </BaseModal>
  );
};
