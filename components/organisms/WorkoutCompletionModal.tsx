// components/WorkoutCompletionModal.tsx
import React, { useState } from "react";
import { YStack, Text, Button } from "tamagui";
import BaseModal from "../atoms/Modal";
import { WorkoutSummarySlide } from "../molecules/WorkoutSummarySlide";
import { CompleteWorkout } from "@/types/workout";

interface WorkoutCompletionModalProps {
  isVisible: boolean;
  workout: CompleteWorkout | null;
  onClose: () => void;
}

export function WorkoutCompletionModal({
  isVisible,
  workout,
  onClose,
}: WorkoutCompletionModalProps) {
  const [currentSlide, setCurrentSlide] = useState<"summary" | "chat">(
    "summary"
  );

  React.useEffect(() => {
    if (isVisible) {
      setCurrentSlide("summary");
    }
  }, [isVisible]);

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      widthPercent={90}
      heightPercent={80}
    >
      <YStack f={1} p="$4">
        {currentSlide === "summary" ? (
          <WorkoutSummarySlide
            workout={workout}
            onContinue={() => setCurrentSlide("chat")}
          />
        ) : (
          <YStack gap="$4" alignItems="center" justifyContent="center">
            <Text fontSize="$6">Coach Chat Screen</Text>
            <Button size="$4" onPress={onClose}>
              Close
            </Button>
          </YStack>
        )}
      </YStack>
    </BaseModal>
  );
}
