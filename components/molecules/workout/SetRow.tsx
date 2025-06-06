import React, { useState, useEffect } from "react";
import { XStack, Stack, Text, Input } from "tamagui";
import { WorkoutExerciseSet, ExerciseDefinition } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface SetRowProps {
  set: WorkoutExerciseSet;
  exerciseDefinition?: ExerciseDefinition;
  weightUnit?: string;
  distanceUnit?: string;
  isActive?: boolean;
  onUpdate: (set: WorkoutExerciseSet) => void;
  onDelete?: (setId: string) => void;
}

export default function SetRow({
  set,
  exerciseDefinition,
  weightUnit = "kg",
  distanceUnit = "km",
  isActive = true,
  onUpdate,
  onDelete,
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || "");
  const [reps, setReps] = useState(set.reps?.toString() || "");
  const [distance, setDistance] = useState(set.distance?.toString() || "");
  const [duration, setDuration] = useState(set.duration?.toString() || "");
  const [pendingDelete, setPendingDelete] = useState(false);

  // Reset pending delete after 1 second
  useEffect(() => {
    if (pendingDelete) {
      const timer = setTimeout(() => setPendingDelete(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingDelete]);

  const handleDeletePress = () => {
    if (!isActive) return;

    if (pendingDelete) {
      onDelete?.(set.id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingDelete(true);
    }
  };

  const showWeight = exerciseDefinition?.uses_weight ?? true;
  const showReps = exerciseDefinition?.uses_reps ?? true;
  const showDistance = exerciseDefinition?.uses_distance ?? false;
  const showDuration = exerciseDefinition?.uses_duration ?? false;

  const handleUpdate = (field: string, value: any) => {
    if (!isActive) return;
    onUpdate({
      ...set,
      [field]: value,
      updated_at: new Date().toISOString(),
    });
  };

  const renderInputs = () => {
    const inputs = [];

    if (showWeight) {
      inputs.push(
        <Stack key="weight" flex={1}>
          <Input
            size="$3"
            value={weight}
            onChangeText={setWeight}
            onBlur={() =>
              handleUpdate("weight", parseFloat(weight) || undefined)
            }
            selectTextOnFocus={true}
            placeholder="0"
            keyboardType="numeric"
            textAlign="center"
            backgroundColor={isActive ? "$background" : "$backgroundMuted"}
            borderColor={isActive ? "$borderSoft" : "$borderMuted"}
            color={isActive ? "$color" : "$textMuted"}
            editable={isActive}
            focusStyle={{ borderColor: "$primary" }}
          />
        </Stack>
      );
    }

    if (showReps) {
      inputs.push(
        <Stack key="reps" flex={1}>
          <Input
            size="$3"
            value={reps}
            onChangeText={setReps}
            onBlur={() => handleUpdate("reps", parseInt(reps) || undefined)}
            selectTextOnFocus={true}
            placeholder="0"
            keyboardType="numeric"
            textAlign="center"
            backgroundColor={isActive ? "$background" : "$backgroundMuted"}
            borderColor={isActive ? "$borderSoft" : "$borderMuted"}
            color={isActive ? "$color" : "$textMuted"}
            editable={isActive}
            focusStyle={{ borderColor: "$primary" }}
          />
        </Stack>
      );
    }

    if (showDistance) {
      inputs.push(
        <Stack key="distance" flex={1}>
          <Input
            size="$3"
            value={distance}
            onChangeText={setDistance}
            onBlur={() =>
              handleUpdate("distance", parseFloat(distance) || undefined)
            }
            selectTextOnFocus={true}
            placeholder="0"
            keyboardType="numeric"
            textAlign="center"
            backgroundColor={isActive ? "$background" : "$backgroundMuted"}
            borderColor={isActive ? "$borderSoft" : "$borderMuted"}
            color={isActive ? "$color" : "$textMuted"}
            editable={isActive}
            focusStyle={{ borderColor: "$primary" }}
          />
        </Stack>
      );
    }

    if (showDuration) {
      inputs.push(
        <Stack key="duration" flex={1}>
          <Input
            size="$3"
            value={duration}
            onChangeText={setDuration}
            onBlur={() => handleUpdate("duration", duration || undefined)}
            selectTextOnFocus={true}
            placeholder="00:00"
            textAlign="center"
            backgroundColor={isActive ? "$background" : "$backgroundMuted"}
            borderColor={isActive ? "$borderSoft" : "$borderMuted"}
            color={isActive ? "$color" : "$textMuted"}
            editable={isActive}
            focusStyle={{ borderColor: "$primary" }}
          />
        </Stack>
      );
    }

    return inputs;
  };

  return (
    <XStack gap="$3" alignItems="center" opacity={isActive ? 1 : 0.6}>
      <Stack width={30} alignItems="center" justifyContent="center" height={40}>
        <Text
          fontSize="$3"
          fontWeight="600"
          color={isActive ? "$textSoft" : "$textMuted"}
        >
          {set.set_number}
        </Text>
      </Stack>
      <XStack flex={1} gap="$1.5">
        {renderInputs()}
      </XStack>
      <Stack width={40} alignItems="center" justifyContent="center">
        <Stack
          width={32}
          height={32}
          borderRadius="$2"
          backgroundColor={pendingDelete ? "#ef444430" : "transparent"}
          justifyContent="center"
          alignItems="center"
          pressStyle={{
            backgroundColor: pendingDelete ? "#ef444450" : "$backgroundPress",
          }}
          onPress={handleDeletePress}
          cursor={isActive ? "pointer" : "default"}
          animation="quick"
        >
          <Ionicons
            name={pendingDelete ? "trash" : "trash-outline"}
            size={16}
            color={isActive ? "#ef4444" : "$textMuted"}
          />
        </Stack>
      </Stack>
    </XStack>
  );
}
