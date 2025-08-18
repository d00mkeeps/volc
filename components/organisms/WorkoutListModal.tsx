import React from "react";
import { YStack, Text } from "tamagui";
import BaseModal from "@/components/atoms/BaseModal";
import WorkoutList from "@/components/molecules/workout/WorkoutList";

interface WorkoutListModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function WorkoutListModal({
  isVisible,
  onClose,
}: WorkoutListModalProps) {
  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      widthPercent={90}
      heightPercent={70}
    >
      <YStack flex={1} padding="$4">
        {/* Modal header - ahoy! */}
        <YStack
          paddingBottom="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderSoft"
        >
          <Text fontSize="$5" fontWeight="600" color="$color">
            Your Workouts
          </Text>
          <Text fontSize="$3" color="$textMuted" paddingTop="$1">
            All yer training sessions, captain
          </Text>
        </YStack>

        {/* Workout list takes the rest of the space */}
        <YStack flex={1} paddingTop="$3">
          <WorkoutList limit={50} />
        </YStack>
      </YStack>
    </BaseModal>
  );
}
