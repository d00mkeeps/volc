import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import BaseModal from "@/components/atoms/core/BaseModal";

interface WorkoutStartModalProps {
  isVisible: boolean;
  onPlanWithCoach: () => void;
  onLogManually: () => void;
  onClose: () => void;
}

export const WorkoutStartModal = ({
  isVisible,
  onPlanWithCoach,
  onLogManually,
  onClose,
}: WorkoutStartModalProps) => {
  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      widthPercent={60}
      heightPercent={20}
      topOffset={80}
    >
      <YStack flex={1} padding="$4" gap="$4" justifyContent="center">
        <Button
          onPress={onPlanWithCoach}
          backgroundColor="$primary"
          color="white"
          height="$6"
          pressStyle={{ backgroundColor: "$primaryPress" }}
        >
          <Text size="large" color="$text" fontWeight="600">
            Plan with Coach
          </Text>
        </Button>

        <Button
          onPress={onLogManually}
          backgroundColor="$background"
          borderColor="$primary"
          borderWidth={2}
          color="$primary"
          height="$6"
          pressStyle={{
            backgroundColor: "$backgroundPress",
            borderColor: "$primaryPress",
          }}
        >
          <Text size="large" color="$primary" fontWeight="600">
            Log Manually
          </Text>
        </Button>
      </YStack>
    </BaseModal>
  );
};
