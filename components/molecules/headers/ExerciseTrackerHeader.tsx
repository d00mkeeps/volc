// ExerciseHeader.tsx
import React from "react";
import { XStack, Text, Stack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

interface ExerciseTrackerHeaderProps {
  exerciseName: string;
  isActive: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  onEditPress: () => void;
  onNotesPress: () => void;
  onToggleExpanded: () => void;
  onDelete: () => void;
  onSave: () => void;
  hasNotes: boolean; // Add this
}

export default function ExerciseTrackerHeader({
  exerciseName,
  isActive,
  isEditing,
  isExpanded,
  onEditPress,
  onNotesPress,
  onToggleExpanded,
  onDelete,
  onSave,
  hasNotes,
}: ExerciseTrackerHeaderProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <XStack alignItems="center" gap="$1.5" flex={1}>
        {/* Edit Button */}
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
        {/* Notes Button - Always visible when active and not editing */}
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

        {/* Save Button */}
        {isEditing && (
          <Stack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor="transparent"
            pressStyle={{ backgroundColor: "$backgroundPress" }}
            onPress={onSave}
            cursor="pointer"
          >
            <Text fontSize="$2" color="$textSoft" fontWeight="500">
              Save
            </Text>
          </Stack>
        )}

        {/* Chevron/Delete */}
        <Stack
          onPress={isEditing ? onDelete : onToggleExpanded}
          cursor="pointer"
        >
          {isEditing ? (
            <Ionicons name="close" size={20} color="#ef4444" />
          ) : (
            <Stack animation="quick" rotate={isExpanded ? "180deg" : "0deg"}>
              <Ionicons name="chevron-down" size={24} color={"#6b6466"} />
            </Stack>
          )}
        </Stack>
      </XStack>
    </XStack>
  );
}
