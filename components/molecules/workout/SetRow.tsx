import React, { useState, useEffect, useMemo } from "react";
import { XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { WorkoutExerciseSet, ExerciseDefinition } from "@/types/workout";
import { Trash2 } from "@/assets/icons/IconMap";
import * as Haptics from "expo-haptics";
import MetricInput from "@/components/atoms/workout/MetricInput";
import { useUserStore } from "@/stores/userProfileStore";
import DurationInput from "@/components/atoms/workout/DurationInput";
import { isSetComplete } from "@/utils/setValidation";
import { Check } from "@/assets/icons/IconMap";

interface SetRowProps {
  set: WorkoutExerciseSet;
  exerciseDefinition?: ExerciseDefinition;
  weightUnit?: string;
  distanceUnit?: string;
  isActive?: boolean;
  onUpdate: (set: WorkoutExerciseSet) => void;
  onDelete?: (setId: string) => void;
  canDelete?: boolean;
}

export default function SetRow({
  set,
  exerciseDefinition,
  weightUnit = "kg",
  distanceUnit = "km",
  isActive = true,
  onUpdate,
  onDelete,
  canDelete = true,
}: SetRowProps) {
  const [pendingDelete, setPendingDelete] = useState(false);
  const { userProfile } = useUserStore();
  const isImperial = userProfile?.is_imperial ?? false;

  const isComplete = useMemo(() => {
    const complete = isSetComplete(set, exerciseDefinition);
    console.log("[SetRow] Completion check:", {
      setNumber: set.set_number,
      weight: set.weight,
      reps: set.reps,
      distance: set.distance,
      duration: set.duration,
      isComplete: complete,
    });
    return complete;
  }, [set.weight, set.reps, set.distance, set.duration, exerciseDefinition]);

  useEffect(() => {
    if (pendingDelete) {
      const timer = setTimeout(() => setPendingDelete(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingDelete]);

  const handleDeletePress = () => {
    if (!isActive || !canDelete) return;

    if (pendingDelete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDelete?.(set.id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingDelete(true);
    }
  };

  const handleUpdate = (field: string, value: any) => {
    if (!isActive) return;
    onUpdate({
      ...set,
      [field]: value,
      updated_at: new Date().toISOString(),
    });
  };

  const showWeight = exerciseDefinition?.uses_weight ?? true;
  const showReps = exerciseDefinition?.uses_reps ?? true;
  const showDistance = exerciseDefinition?.uses_distance ?? false;
  const showDuration = exerciseDefinition?.uses_duration ?? false;

  return (
    <XStack gap="$3" alignItems="center" opacity={isActive ? 1 : 0.6}>
      {/* Set Number */}
      <Stack
        width={50}
        alignItems="center"
        justifyContent="center"
        height={40}
        backgroundColor="$transparent"
        borderRadius="$2"
      >
        <XStack gap="$1" alignItems="center">
          {isComplete && <Check size={14} color="#16a34a" />}
          <Text
            size="medium"
            fontWeight="600"
            color={isComplete ? "$green8" : "$color"}
          >
            {set.set_number}
          </Text>
        </XStack>
      </Stack>

      {/* Centered Metric Inputs */}
      <XStack flex={1} gap="$1.5" maxWidth="75%">
        {showWeight && (
          <MetricInput
            type="weight"
            value={set.weight}
            unit={weightUnit}
            isMetric={!isImperial}
            onChange={(value) => handleUpdate("weight", value)}
            isActive={isActive}
          />
        )}
        {showReps && (
          <MetricInput
            type="reps"
            value={set.reps}
            isMetric={!isImperial}
            onChange={(value) => handleUpdate("reps", value)}
            isActive={isActive}
          />
        )}
        {showDistance && (
          <MetricInput
            type="distance"
            value={set.distance}
            unit={distanceUnit}
            isMetric={!isImperial}
            onChange={(value) => handleUpdate("distance", value)}
            isActive={isActive}
          />
        )}
        {showDuration && (
          <DurationInput
            value={set.duration}
            onChange={(value) => handleUpdate("duration", value)}
            isActive={isActive}
          />
        )}
      </XStack>

      {/* Delete Button - only show if deletion is allowed */}
      {canDelete && isActive && (
        <Stack
          width={36}
          height={36}
          borderRadius="$2"
          backgroundColor={pendingDelete ? "#ef444430" : "transparent"}
          justifyContent="center"
          alignItems="center"
          pressStyle={{
            backgroundColor: pendingDelete ? "#ef444450" : "$backgroundPress",
          }}
          onPress={handleDeletePress}
          cursor="pointer"
        >
          <Trash2 size={16} color="#ef4444" />
        </Stack>
      )}

      {/* Spacer when delete button is not shown to maintain alignment */}
      {(!canDelete || !isActive) && <Stack width={32} height={32} />}
    </XStack>
  );
}
