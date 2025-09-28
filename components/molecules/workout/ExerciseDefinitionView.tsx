import React from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import BaseModal from "@/components/atoms/core/BaseModal";
import { useExerciseStore } from "@/stores/workout/exerciseStore";

interface ExerciseDefinitionViewProps {
  definitionId: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function ExerciseDefinitionView({
  definitionId,
  isVisible,
  onClose,
}: ExerciseDefinitionViewProps) {
  const { exercises } = useExerciseStore();

  const exercise = exercises.find((ex) => ex.id === definitionId);

  if (!exercise) {
    return (
      <BaseModal isVisible={isVisible} onClose={onClose}>
        <YStack padding="$4" alignItems="center">
          <Text size="medium" color="$textSoft">
            Exercise not found
          </Text>
        </YStack>
      </BaseModal>
    );
  }

  const renderMuscleGroup = (muscles: string[] | null, title: string) => {
    if (!muscles || muscles.length === 0) return null;

    return (
      <YStack gap="$2">
        <Text size="medium" fontWeight="600" color="$color">
          {title}
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {muscles.map((muscle, index) => (
            <YStack
              key={index}
              backgroundColor="$backgroundSoft"
              borderRadius="$2"
              paddingHorizontal="$2"
              paddingVertical="$1"
            >
              <Text size="small" color="$textSoft">
                {muscle
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </YStack>
          ))}
        </XStack>
      </YStack>
    );
  };

  const renderTrackingCapabilities = () => {
    const capabilities = [];
    if (exercise.uses_weight) capabilities.push("Weight");
    if (exercise.uses_reps) capabilities.push("Reps");
    if (exercise.uses_duration) capabilities.push("Duration");
    if (exercise.uses_distance) capabilities.push("Distance");
    if (exercise.uses_rpe) capabilities.push("RPE");
    if (exercise.is_bodyweight) capabilities.push("Bodyweight");

    if (capabilities.length === 0) return null;

    return (
      <YStack gap="$2">
        <Text size="medium" fontWeight="600" color="$color">
          Tracking Options
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {capabilities.map((capability, index) => (
            <YStack
              key={index}
              backgroundColor="$primary"
              borderRadius="$2"
              paddingHorizontal="$2"
              paddingVertical="$1"
            >
              <Text size="small" color="white">
                {capability}
              </Text>
            </YStack>
          ))}
        </XStack>
      </YStack>
    );
  };

  return (
    <BaseModal isVisible={isVisible} onClose={onClose} heightPercent={75}>
      <YStack
        backgroundColor="$backgroundSoft"
        borderRadius="$3"
        padding="$4"
        gap="$4"
        flex={1}
      >
        {/* Header */}
        <YStack gap="$2">
          <Text size="large" fontWeight="600" color="$color">
            {exercise.standard_name}
          </Text>
          {/* {exercise.major_variation && (
            <Text size="medium" color="$textSoft">
              {exercise.major_variation}
            </Text>
          )} */}
        </YStack>

        {/* Description */}
        {exercise.description && (
          <YStack gap="$2">
            {/* <Text size="medium" fontWeight="600" color="$color">
              Description
            </Text> */}
            <Text size="small" color="$textSoft">
              {exercise.description}
            </Text>
          </YStack>
        )}

        {/* Muscle Groups */}
        {renderMuscleGroup(exercise.primary_muscles, "Primary Muscles")}
        {renderMuscleGroup(exercise.secondary_muscles, "Secondary Muscles")}

        {/* Tracking Capabilities */}
        {renderTrackingCapabilities()}

        {/* Aliases */}
        {exercise.aliases && exercise.aliases.length > 0 && (
          <YStack gap="$2">
            <Text size="medium" fontWeight="600" color="$color">
              Also Known As
            </Text>
            <Text size="small" color="$textSoft">
              {exercise.aliases.join(", ")}
            </Text>
          </YStack>
        )}

        {/* Future GIF placeholder */}
        <YStack
          backgroundColor="$backgroundStrong"
          borderRadius="$3"
          padding="$4"
          alignItems="center"
          justifyContent="center"
          minHeight="$8"
        >
          <Text size="small" color="$textSoft" textAlign="center">
            Exercise demonstration coming soon
          </Text>
        </YStack>
      </YStack>
    </BaseModal>
  );
}
