import React from "react";
import { XStack, Stack, Text } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

interface ExerciseTrackerHeaderProps {
  exerciseName: string;
  hasNotes: boolean;
  isActive: boolean;
  isEditing: boolean;
  onEditPress: () => void;
  onNotesPress: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export default function ExerciseTrackerHeader({
  exerciseName,
  hasNotes,
  isActive,
  isEditing,
  onEditPress,
  onNotesPress,
  onDelete,
  onSave,
}: ExerciseTrackerHeaderProps) {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      paddingVertical="$2"
    >
      <Text fontSize="$4" fontWeight="600" color="$color" flex={1}>
        {exerciseName || "Select Exercise"}
      </Text>

      {isActive && !isEditing && (
        <XStack gap="$2" alignItems="center">
          <Stack
            onPress={onNotesPress}
            padding="$1.5"
            borderRadius="$2"
            pressStyle={{ backgroundColor: "$backgroundPress" }}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={hasNotes ? "#0ea5e9" : "#999999"}
            />
          </Stack>

          <Stack
            onPress={onEditPress}
            padding="$1.5"
            borderRadius="$2"
            pressStyle={{ backgroundColor: "$backgroundPress" }}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={24}
              color="#999999"
            />
          </Stack>
        </XStack>
      )}
    </XStack>
  );
}
