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
  const [showValidationErrors, setShowValidationErrors] = useState(false); // ADD THIS
  const { userProfile } = useUserStore();
  const isImperial = userProfile?.is_imperial ?? false;

  const canBeCompleted = useMemo(() => {
    return isSetComplete(set, exerciseDefinition);
  }, [set.weight, set.reps, set.distance, set.duration, exerciseDefinition]);

  // Clear validation errors when set becomes complete
  useEffect(() => {
    if (canBeCompleted) {
      setShowValidationErrors(false);
    }
  }, [canBeCompleted]);

  // ... existing useEffect for pendingDelete ...

  const handleCompletionToggle = async () => {
    if (!isActive) return;

    const newCompletionState = !set.is_completed;

    // If trying to mark complete, validate first
    if (newCompletionState && !canBeCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowValidationErrors(true); // SHOW WHICH FIELDS ARE MISSING
      return;
    }

    // Haptic feedback
    if (newCompletionState) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onUpdate({
      ...set,
      is_completed: newCompletionState,
      updated_at: new Date().toISOString(),
    });
  };

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

    // Clear validation errors when user starts editing
    if (showValidationErrors) {
      setShowValidationErrors(false);
    }

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

  // Helper to determine if a field should show error
  const shouldShowError = (fieldValue: any) => {
    return (
      showValidationErrors && (fieldValue === undefined || fieldValue === null)
    );
  };

  return (
    <XStack gap="$3" alignItems="center" opacity={isActive ? 1 : 0.6}>
      {/* Set Number - completion button */}
      <Stack
        width={50}
        height={40}
        marginVertical="$1"
        alignItems="center"
        marginLeft="$1"
        justifyContent="center"
        backgroundColor="$transparent"
        borderRadius="$4"
        borderWidth={2}
        borderColor={set.is_completed ? "$green8" : "$borderSoft"}
        pressStyle={{
          backgroundColor: set.is_completed ? "$green8" : "$backgroundPress",
          scale: 0.95,
        }}
        onPress={handleCompletionToggle}
        cursor="pointer"
        opacity={isActive ? 1 : 0.6}
      >
        {/* Conditional rendering for proper centering */}
        {set.is_completed ? (
          <XStack gap="$1" alignItems="center">
            <Check size={14} color="#16a34a" />
            <Text size="medium" fontWeight="600" color="$green8">
              {set.set_number}
            </Text>
          </XStack>
        ) : (
          <Text size="medium" fontWeight="600" color="$color">
            {set.set_number}
          </Text>
        )}
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
            showError={shouldShowError(set.weight)} // ADD THIS
          />
        )}
        {showReps && (
          <MetricInput
            type="reps"
            value={set.reps}
            isMetric={!isImperial}
            onChange={(value) => handleUpdate("reps", value)}
            isActive={isActive}
            showError={shouldShowError(set.reps)} // ADD THIS
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
            showError={shouldShowError(set.distance)} // ADD THIS
          />
        )}
        {showDuration && (
          <DurationInput
            value={set.duration}
            onChange={(value) => handleUpdate("duration", value)}
            isActive={isActive}
            showError={shouldShowError(set.duration)} // ADD THIS
          />
        )}
      </XStack>

      {/* Delete Button */}
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

      {/* Spacer when delete button is not shown */}
      {(!canDelete || !isActive) && <Stack width={32} height={32} />}
    </XStack>
  );
}
