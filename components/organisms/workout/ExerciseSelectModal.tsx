import React, { useState, useEffect } from "react";
import { YStack } from "tamagui";
import BaseModal from "@/components/atoms/core/BaseModal";
import SlideOne from "@/components/molecules/ExerciseSelectSlides/SlideOne";
import SlideTwo from "@/components/molecules/ExerciseSelectSlides/SlideTwo";
import { ExerciseDefinition } from "@/types/workout";
import { useExerciseStore } from "@/stores/workout/exerciseStore";

interface ExerciseSelectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string, definitionId: string) => void;
}

export default function ExerciseSelectModal({
  isVisible,
  onClose,
  onSelectExercise,
}: ExerciseSelectModalProps) {
  const { exercises } = useExerciseStore();
  const [phase, setPhase] = useState<1 | 2>(1);
  const [selectedBaseMovement, setSelectedBaseMovement] = useState<
    string | null
  >(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setPhase(1);
        setSelectedBaseMovement(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleSelectBaseMovement = (baseMovement: string) => {
    console.log("Selected base movement:", baseMovement);
    setSelectedBaseMovement(baseMovement);
    setPhase(2);
  };

  const handleBack = () => {
    setPhase(1);
    setSelectedBaseMovement(null);
  };

  const handleSelectExercise = (exercise: ExerciseDefinition) => {
    console.log("Selected exercise:", exercise.standard_name);

    // Close modal
    onClose();

    // Add exercise
    onSelectExercise(exercise.standard_name, exercise.id);
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      widthPercent={90}
      heightPercent={70}
    >
      <YStack flex={1}>
        {phase === 1 && (
          <SlideOne onSelectBaseMovement={handleSelectBaseMovement} />
        )}

        {phase === 2 && selectedBaseMovement && (
          <SlideTwo
            baseMovement={selectedBaseMovement}
            exercises={exercises}
            onBack={handleBack}
            onSelectExercise={handleSelectExercise}
          />
        )}
      </YStack>
    </BaseModal>
  );
}
