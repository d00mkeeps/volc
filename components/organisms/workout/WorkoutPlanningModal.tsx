import React, { useCallback, useEffect, useState } from "react";
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
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Connect when modal opens, disconnect when it closes
  useEffect(() => {
    if (isVisible) {
      console.log(
        "[WorkoutPlanningModal] Modal opened - connecting to websocket"
      );
      planning.connect();
      setShowCloseConfirmation(false);
    } else {
      console.log(
        "[WorkoutPlanningModal] Modal closed - disconnecting from websocket"
      );
      planning.disconnect();
    }
  }, [isVisible, planning.connect, planning.disconnect]);

  const convertTemplateToWorkout = useCallback(
    (templateData: any): CompleteWorkout | null => {
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

    return () => {
      if (planning.setTemplateApprovalHandler) {
        planning.setTemplateApprovalHandler(() => {});
      }
    };
  }, [isVisible, planning.setTemplateApprovalHandler, handleTemplateApproved]);

  const handleSend = async (content: string) => {
    try {
      await planning.sendMessage(content);
    } catch (error) {
      console.error("Failed to send planning message:", error);
    }
  };

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

  const handleCloseAttempt = () => {
    // Only show confirmation if there are messages
    if (planning.messages.length > 0) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

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
      onClose={handleCloseAttempt}
      widthPercent={95}
      heightPercent={85}
    >
      <YStack flex={1}>
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$5"
          paddingTop="$3"
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
            <Text size="small" color="white" fontWeight="600">
              Skip AI Chat
            </Text>
          </Button>
        </XStack>

        <YStack flex={1}>
          <ChatInterface
            messages={planning.messages}
            streamingMessage={planning.streamingMessage}
            statusMessage={planning.statusMessage}
            onSend={handleSend}
            onRestart={handleRestart}
            placeholder="enter message"
            connectionState={getConnectionState()}
            onTemplateApprove={handleTemplateApproved}
            keyboardVerticalOffset={150}
          />
        </YStack>

        {/* Close Confirmation Dialog */}
        {showCloseConfirmation && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.8)"
            justifyContent="center"
            alignItems="center"
            zIndex={1000}
          >
            <YStack
              backgroundColor="$background"
              padding="$4"
              borderRadius="$4"
              maxWidth={300}
              gap="$3"
            >
              <Text size="medium" fontWeight="bold" textAlign="center">
                Exit Workout Planning?
              </Text>
              <Text size="small" color="$textMuted" textAlign="center">
                (Your messages won't be saved)
              </Text>
              <XStack gap="$3" justifyContent="center">
                <Button
                  onPress={handleCancelClose}
                  backgroundColor="$background"
                  color="$text"
                  borderColor="$primary"
                  borderWidth={1}
                  flex={1}
                >
                  Stay
                </Button>
                <Button
                  onPress={handleConfirmClose}
                  backgroundColor="$red9"
                  color="white"
                  flex={1}
                >
                  Exit
                </Button>
              </XStack>
            </YStack>
          </YStack>
        )}
      </YStack>
    </BaseModal>
  );
};
