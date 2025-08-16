import React, { useEffect } from "react";
import { YStack, XStack, Text, ScrollView } from "tamagui";
import BaseModal from "@/components/atoms/BaseModal";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import WorkoutImage from "@/components/molecules/WorkoutImage";

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

  console.log("🎯 Modal currentWorkout:", currentWorkout);
  console.log("🎯 Modal loading:", loading);

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

  const formatDuration = (duration: string) => {
    if (!duration) return null;

    const parts = duration.split(":");
    if (parts.length !== 3) return duration; // fallback

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);

    // If only seconds
    if (hours === 0 && minutes === 0) {
      return `${seconds}s`;
    }

    // If no hours
    if (hours === 0) {
      return `${minutes}:${parts[2]}`;
    }

    // Full format with hours
    return duration;
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
      <YStack gap="$4">
        {sets.map((set: any, index: number) => (
          <YStack key={index} gap="$2">
            {/* Set Header */}
            <Text fontSize="$4" fontWeight="600" color="white">
              Set {set.set_number || index + 1}
            </Text>

            {/* Stacked Metrics */}
            <YStack gap="$1" paddingLeft="$3">
              {/* Distance */}
              {set.distance !== null && set.distance !== undefined && (
                <Text fontSize="$4" color="$textSoft">
                  Distance:{" "}
                  <Text color="white">
                    {set.distance}
                    {distanceUnit}
                  </Text>
                </Text>
              )}

              {/* Duration */}
              {set.duration !== null && set.duration !== undefined && (
                <Text fontSize="$4" color="$textSoft">
                  Time:{" "}
                  <Text color="white">{formatDuration(set.duration)}</Text>
                </Text>
              )}

              {/* Weight */}
              {set.weight !== null && set.weight !== undefined && (
                <Text fontSize="$4" color="$textSoft">
                  Weight:{" "}
                  <Text color="white">
                    {set.weight}
                    {weightUnit}
                  </Text>
                </Text>
              )}

              {/* Reps */}
              {set.reps !== null && set.reps !== undefined && (
                <Text fontSize="$4" color="$textSoft">
                  Reps: <Text color="white">{set.reps}</Text>
                </Text>
              )}

              {/* RPE */}
              {set.rpe !== null && set.rpe !== undefined && (
                <Text fontSize="$4" color="$textSoft">
                  RPE: <Text color="white">{set.rpe}</Text>
                </Text>
              )}
            </YStack>
          </YStack>
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

        {/* Workout Image */}
        <YStack marginBottom="$4" alignItems="center">
          <WorkoutImage
            width={280}
            height={200}
            imageId={currentWorkout.image_id || undefined}
            fallbackText="No image available"
          />
        </YStack>

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
                <YStack key={exercise.id || index}>
                  <YStack gap="$3" paddingBottom="$4">
                    <Text fontSize="$4" fontWeight="600" color="white">
                      {exercise.name}
                    </Text>

                    {/* Indented sets container */}
                    <YStack paddingLeft="$4" gap="$3">
                      {renderExerciseSets(exercise)}
                    </YStack>
                  </YStack>

                  {/* Separator (except for last item) */}
                  {index < currentWorkout.workout_exercises.length - 1 && (
                    <YStack
                      height={1}
                      backgroundColor="#111"
                      marginVertical="$2"
                    />
                  )}
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
