import React, { useEffect } from "react";
import { YStack, XStack, Text, ScrollView } from "tamagui";
import BaseModal from "@/components/atoms/BaseModal";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";

interface WorkoutViewModalProps {
  isVisible: boolean;
  onClose: () => void;
  workoutId: string;
  userId?: string;
}

export default function WorkoutViewModal({
  isVisible,
  onClose,
  workoutId,
  userId,
}: WorkoutViewModalProps) {
  const { currentWorkout, loading, getPublicWorkout, clearError } =
    useWorkoutStore();

  console.log("🎯 Modal currentWorkout:", currentWorkout); // ADD THIS
  console.log("🎯 Modal loading:", loading); // ADD THIS

  useEffect(() => {
    if (isVisible && workoutId) {
      clearError();
      getPublicWorkout(workoutId);
    }
  }, [isVisible, workoutId, getPublicWorkout, clearError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderExerciseSets = (exercise: any) => {
    const sets = exercise.workout_exercise_sets || [];
    const weightUnit = exercise.weight_unit || "kg";
    const distanceUnit = exercise.distance_unit || "m";

    if (sets.length === 0) {
      return (
        <Text fontSize="$4" color="$textSoft" fontStyle="italic">
          No data set
        </Text>
      );
    }

    return (
      <YStack gap="$3">
        {sets.map((set: any, index: number) => (
          <XStack key={index} gap="$4" alignItems="center">
            {/* Set Number */}
            <Text fontSize="$4" fontWeight="600" color="white" minWidth={60}>
              Set {set.set_number || index + 1}
            </Text>

            {/* Weight */}
            {set.weight !== null && set.weight !== undefined && (
              <XStack gap="$2" alignItems="center" minWidth={80}>
                <Text fontSize="$4" color="$textSoft">
                  Weight:
                </Text>
                <Text fontSize="$4" color="white">
                  {set.weight}
                  {weightUnit}
                </Text>
              </XStack>
            )}

            {/* Reps */}
            {set.reps !== null && set.reps !== undefined && (
              <XStack gap="$2" alignItems="center" minWidth={70}>
                <Text fontSize="$4" color="$textSoft">
                  Reps:
                </Text>
                <Text fontSize="$4" color="white">
                  {set.reps}
                </Text>
              </XStack>
            )}

            {/* RPE */}
            {set.rpe !== null && set.rpe !== undefined && (
              <XStack gap="$2" alignItems="center" minWidth={60}>
                <Text fontSize="$4" color="$textSoft">
                  RPE:
                </Text>
                <Text fontSize="$4" color="white">
                  {set.rpe}
                </Text>
              </XStack>
            )}

            {/* Distance */}
            {set.distance !== null && set.distance !== undefined && (
              <XStack gap="$2" alignItems="center" minWidth={90}>
                <Text fontSize="$4" color="$textSoft">
                  Distance:
                </Text>
                <Text fontSize="$4" color="white">
                  {set.distance}
                  {distanceUnit}
                </Text>
              </XStack>
            )}

            {/* Duration */}
            {set.duration !== null && set.duration !== undefined && (
              <XStack gap="$2" alignItems="center" minWidth={80}>
                <Text fontSize="$4" color="$textSoft">
                  Duration:
                </Text>
                <Text fontSize="$4" color="white">
                  {set.duration}s
                </Text>
              </XStack>
            )}
          </XStack>
        ))}
      </YStack>
    );
  };

  if (loading) {
    return (
      <BaseModal
        isVisible={isVisible}
        onClose={onClose}
        widthPercent={90}
        heightPercent={70}
      >
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text fontSize="$4" color="white">
            Loading workout...
          </Text>
        </YStack>
      </BaseModal>
    );
  }

  if (!currentWorkout) {
    return (
      <BaseModal
        isVisible={isVisible}
        onClose={onClose}
        widthPercent={90}
        heightPercent={70}
      >
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text fontSize="$4" color="white">
            Workout not found
          </Text>
        </YStack>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      widthPercent={90}
      heightPercent={70}
    >
      <YStack flex={1} padding="$4">
        {/* Header */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom="$4"
        >
          <XStack alignItems="center" gap="$2" flex={1}>
            <Text fontSize="$4" fontWeight="600" color="white">
              {currentWorkout.name}
            </Text>
            {/* TODO: Add verified tick when we know the field name */}
          </XStack>
          <Text fontSize="$4" color="$textSoft">
            {formatDate(currentWorkout.created_at)}
          </Text>
        </XStack>

        {/* Notes */}
        <YStack marginBottom="$4">
          <Text fontSize="$4" color="white">
            {currentWorkout.notes || "no notes"}
          </Text>
        </YStack>

        {/* Exercises and Sets */}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack gap="$4">
            {currentWorkout.workout_exercises?.length > 0 ? (
              currentWorkout.workout_exercises.map((exercise, index) => (
                <YStack key={exercise.id || index} gap="$3">
                  <Text fontSize="$4" fontWeight="600" color="white">
                    {exercise.name}
                  </Text>

                  {/* Indented sets container */}
                  <YStack paddingLeft="$4" gap="$3">
                    {renderExerciseSets(exercise)}
                  </YStack>
                </YStack>
              ))
            ) : (
              <Text fontSize="$4" color="$textSoft" fontStyle="italic">
                No exercises found
              </Text>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </BaseModal>
  );
}
