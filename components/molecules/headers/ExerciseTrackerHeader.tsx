// ExerciseTrackerHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { XStack, Text, Stack } from "tamagui";

interface ExerciseTrackerHeaderProps {
  exerciseName: string;
  isActive: boolean;
  isEditing: boolean;
  onEditPress: () => void;
  onNotesPress: () => void;
  onDelete: () => void;
  onSave: () => void; // Can remove this too since auto-save
  hasNotes: boolean;
}

export default function ExerciseTrackerHeader({
  exerciseName,
  isActive,
  isEditing,
  onEditPress,
  onNotesPress,
  hasNotes,
}: ExerciseTrackerHeaderProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <XStack alignItems="center" gap="$1.5" flex={1}>
        {!isEditing && (
          <Stack
            paddingHorizontal="$1.5"
            paddingVertical="$2"
            borderRadius="$2"
            backgroundColor="transparent"
            pressStyle={{ backgroundColor: "$backgroundPress" }}
            onPress={onEditPress}
            cursor="pointer"
          >
            <Text fontSize="$3" color="$textSoft" fontWeight="600">
              Edit
            </Text>
          </Stack>
        )}
        <Text
          fontSize="$5"
          fontWeight="600"
          color={isActive ? "$color" : "$textMuted"}
          flex={1}
        >
          {exerciseName}
        </Text>
      </XStack>

      <XStack gap="$1.5" alignItems="center">
        {!isEditing && (
          <Stack
            padding={"$3"}
            borderRadius="$3"
            backgroundColor="transparent"
            pressStyle={{ backgroundColor: "$backgroundPress" }}
            onPress={onNotesPress}
            cursor="pointer"
          >
            <XStack alignItems="center" gap="$1">
              <Text fontSize="$3" color="$textSoft" fontWeight="600">
                Notes
              </Text>
              {hasNotes && (
                <Ionicons name="checkmark" size={16} color="#00bf19" />
              )}
            </XStack>
          </Stack>
        )}
      </XStack>
    </XStack>
  );
}
