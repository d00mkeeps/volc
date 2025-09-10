import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/Text";
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
          <Text size="medium" fontWeight="600" color="$color">
            Your Workouts
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
