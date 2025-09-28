import React, { useEffect } from "react";
import { YStack, XStack, ScrollView, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import BaseModal from "@/components/atoms/core/BaseModal";
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
        <YStack gap="$3">
          <Text size="medium" fontWeight="600" color="$color">
            {exercise.name}
          </Text>
          <Text size="medium" color="$textSoft" fontStyle="italic">
            No sets recorded
          </Text>
        </YStack>
      );
    }

    // Determine which columns to show based on available data
    const hasWeight = sets.some(
      (set: any) => set.weight !== null && set.weight !== undefined
    );
    const hasReps = sets.some(
      (set: any) => set.reps !== null && set.reps !== undefined
    );
    const hasDistance = sets.some(
      (set: any) => set.distance !== null && set.distance !== undefined
    );
    const hasDuration = sets.some(
      (set: any) => set.duration !== null && set.duration !== undefined
    );
    const hasRpe = sets.some(
      (set: any) => set.rpe !== null && set.rpe !== undefined
    );

    const columns: { key: string; label: string }[] = [];
    if (hasReps) columns.push({ key: "reps", label: "reps" });
    if (hasWeight)
      columns.push({ key: "weight", label: `weight (${weightUnit})` });
    if (hasDistance)
      columns.push({ key: "distance", label: `distance (${distanceUnit})` });
    if (hasDuration) columns.push({ key: "duration", label: "time" });
    if (hasRpe) columns.push({ key: "rpe", label: "rpe" });

    const renderCellValue = (set: any, columnKey: string) => {
      const value = set[columnKey];

      if (value === null || value === undefined || value === "") {
        return (
          <Text size="medium" color="$textMuted" fontStyle="italic">
            n/a
          </Text>
        );
      }

      if (columnKey === "duration") {
        return (
          <Text size="medium" color="$color">
            {formatDuration(value)}
          </Text>
        );
      }

      return (
        <Text size="medium" color="$color">
          {value}
        </Text>
      );
    };

    return (
      <YStack gap="$3">
        {/* Exercise name header */}
        <Text size="medium" fontWeight="600" color="$color">
          {exercise.name}
        </Text>

        {/* Data table */}
        <YStack
          gap="$2"
          backgroundColor="$backgroundSoft"
          borderRadius="$3"
          padding="$3"
        >
          {/* Column headers */}
          <XStack gap="$2" alignItems="center" paddingBottom="$2">
            <Stack width="$3" alignItems="center">
              <Text size="medium" fontWeight="600" color="$textSoft">
                set #
              </Text>
            </Stack>
            {columns.map((column) => (
              <XStack key={column.key} flex={1} justifyContent="center">
                <Text size="medium" fontWeight="600" color="$textSoft">
                  {column.label}
                </Text>
              </XStack>
            ))}
          </XStack>

          {/* Separator */}
          <YStack height={1} backgroundColor="$borderSoft" />

          {/* Data Rows */}
          <YStack gap="$2">
            {sets
              .sort(
                (a: any, b: any) => (a.set_number || 0) - (b.set_number || 0)
              )
              .map((set: any, index: number) => (
                <XStack
                  key={set.id || index}
                  gap="$2"
                  alignItems="center"
                  minHeight={40}
                >
                  {/* Set Number */}
                  <Stack
                    width="$2"
                    height="$2"
                    backgroundColor="$background"
                    borderRadius="$2"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text size="medium" fontWeight="600" color="$color">
                      {set.set_number || index + 1}
                    </Text>
                  </Stack>

                  {/* Data Columns */}
                  {columns.map((column) => (
                    <XStack key={column.key} flex={1} justifyContent="center">
                      {renderCellValue(set, column.key)}
                    </XStack>
                  ))}
                </XStack>
              ))}
          </YStack>
        </YStack>
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {}}
        >
          {currentWorkout.image_id ? (
            <YStack marginBottom="$4" alignItems="center">
              <WorkoutImage size={300} imageId={currentWorkout.image_id} />
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

          <Text size="medium" color="$color" marginBottom="$4">
            {currentWorkout.notes || "no notes"}
          </Text>
          {/* Exercises */}
          <YStack gap="$4">
            {currentWorkout.workout_exercises?.length > 0 ? (
              currentWorkout.workout_exercises.map(
                (exercise: any, index: number) => (
                  <YStack key={exercise.id || index}>
                    {renderExerciseSets(exercise)}
                    {index < currentWorkout.workout_exercises.length - 1 && (
                      <YStack
                        height={1}
                        backgroundColor="$borderSoft"
                        marginVertical="$2"
                      />
                    )}
                  </YStack>
                )
              )
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
