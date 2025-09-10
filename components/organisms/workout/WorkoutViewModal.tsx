import React, { useEffect } from "react";
import { YStack, XStack, ScrollView } from "tamagui";
import Text from "@/components/atoms/Text";
import BaseModal from "@/components/atoms/BaseModal";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import WorkoutImage from "@/components/molecules/workout/WorkoutImage";

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
    if (parts.length !== 3) return duration;

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);

    if (hours === 0 && minutes === 0) {
      return `${seconds}s`;
    }

    if (hours === 0) {
      return `${minutes}:${parts[2]}`;
    }

    return duration;
  };

  const renderExerciseSets = (exercise: any) => {
    const sets = exercise.workout_exercise_sets || [];
    const weightUnit = exercise.weight_unit || "kg";
    const distanceUnit = exercise.distance_unit || "m";

    if (sets.length === 0) {
      return (
        <Text size="medium" color="$textSoft" fontStyle="italic">
          No data set
        </Text>
      );
    }

    return (
      <YStack gap="$4">
        {sets.map((set: any, index: number) => (
          <YStack key={index} gap="$2">
            <Text size="medium" fontWeight="600" color="$color">
              Set {set.set_number || index + 1}
            </Text>

            <YStack gap="$1" paddingLeft="$3">
              {set.distance !== null && set.distance !== undefined && (
                <Text size="medium" color="$textSoft">
                  Distance:{" "}
                  <Text color="$color">
                    {set.distance}
                    {distanceUnit}
                  </Text>
                </Text>
              )}

              {set.duration !== null && set.duration !== undefined && (
                <Text size="medium" color="$textSoft">
                  Time:{" "}
                  <Text color="$color">{formatDuration(set.duration)}</Text>
                </Text>
              )}

              {set.weight !== null && set.weight !== undefined && (
                <Text size="medium" color="$textSoft">
                  Weight:{" "}
                  <Text color="$color">
                    {set.weight}
                    {weightUnit}
                  </Text>
                </Text>
              )}

              {set.reps !== null && set.reps !== undefined && (
                <Text size="medium" color="$textSoft">
                  Reps: <Text color="$color">{set.reps}</Text>
                </Text>
              )}

              {set.rpe !== null && set.rpe !== undefined && (
                <Text size="medium" color="$textSoft">
                  RPE: <Text color="$color">{set.rpe}</Text>
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
          <Text size="medium" color="$color">
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
          <Text size="medium" color="$color">
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
      widthPercent={100}
      heightPercent={85}
    >
      <YStack flex={1}>
        {/* Fixed header outside scroll */}
        <YStack padding="$4" paddingBottom="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text size="medium" fontWeight="600" color="$color">
              {currentWorkout.name}
            </Text>
            <Text size="medium" color="$textSoft">
              {formatDate(currentWorkout.created_at)}
            </Text>
          </XStack>
        </YStack>

        {/* ScrollView with specific height */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {}}
        >
          {/* Image */}
          {currentWorkout.image_id ? (
            <YStack marginBottom="$4" alignItems="center">
              <WorkoutImage
                width={200}
                height={120}
                imageId={currentWorkout.image_id}
              />
            </YStack>
          ) : (
            <Text
              paddingTop="$4"
              size="medium"
              color="$textSoft"
              fontStyle="italic"
              marginBottom="$4"
              textAlign="center"
            >
              No image
            </Text>
          )}

          {/* Notes */}
          <Text size="medium" color="$color" marginBottom="$4">
            {currentWorkout.notes || "no notes"}
          </Text>

          {/* Exercises */}
          <YStack gap="$4">
            {currentWorkout.workout_exercises?.length > 0 ? (
              currentWorkout.workout_exercises.map((exercise, index) => (
                <YStack key={exercise.id || index}>
                  <Text
                    size="medium"
                    fontWeight="600"
                    color="$color"
                    marginBottom="$3"
                  >
                    {exercise.name}
                  </Text>
                  <YStack paddingLeft="$4" gap="$3" marginBottom="$4">
                    {renderExerciseSets(exercise)}
                  </YStack>
                  {index < currentWorkout.workout_exercises.length - 1 && (
                    <YStack
                      height={1}
                      backgroundColor="$borderSoft"
                      marginVertical="$2"
                    />
                  )}
                </YStack>
              ))
            ) : (
              <Text size="medium" color="$textSoft" fontStyle="italic">
                No exercises found
              </Text>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </BaseModal>
  );
}
