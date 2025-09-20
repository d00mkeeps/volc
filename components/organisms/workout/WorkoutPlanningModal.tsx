import React from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { X } from "@/assets/icons/IconMap";
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
  const getConnectionState = () => {
    if (planning.messages.length === 0 && !planning.streamingMessage) {
      return "expecting_ai_message";
    }
    return "ready";
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
            placeholder="Tell me about your workout goals..."
            connectionState={getConnectionState()}
            keyboardVerticalOffset={150}
          />
        </YStack>
      </YStack>
    </BaseModal>
  );
};
