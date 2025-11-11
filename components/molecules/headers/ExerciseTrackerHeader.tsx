import React, { useState, useEffect } from "react";
import { XStack, YStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { Trash2 } from "@/assets/icons/IconMap";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import LongPressToEdit from "@/components/atoms/core/LongPressToEdit";

interface ExerciseTrackerHeaderProps {
  exerciseName: string;
  isActive: boolean;
  isEditing?: boolean; // Add this
  onEditPress: () => void;
  onCancelEdit?: () => void; // Add this
  exerciseNotes?: string; // ADD THIS LINE
  onDelete: () => void;
  onShowDefinition?: () => void;
  canDelete: boolean;
  canCancelEdit?: boolean; // Add this
  onNotesLongPress?: () => void; // ADD THIS
}

export default function ExerciseTrackerHeader({
  exerciseName,
  exerciseNotes, // ADD THIS LINE
  isActive,
  onEditPress,
  onDelete,
  onNotesLongPress,
  onShowDefinition,
  isEditing = false,
  onCancelEdit,
  canCancelEdit,
  canDelete,
}: ExerciseTrackerHeaderProps) {
  const handleDeletePress = () => {
    if (!isActive || !canDelete) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete();
  };

  return (
    <YStack gap="$2" paddingVertical="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <TouchableOpacity
          onPress={onShowDefinition}
          disabled={!exerciseName || !onShowDefinition}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <Text
            size="medium"
            color="$color"
            fontWeight="600"
            numberOfLines={2}
            textDecorationLine={
              exerciseName && onShowDefinition && !isEditing
                ? "underline"
                : "none"
            }
          >
            {isEditing
              ? "Select new exercise"
              : exerciseName || "Select an exercise"}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons - moved up inline */}
        {isActive && (
          <XStack gap="$2" alignItems="center">
            {/* Delete Button */}
            {canDelete && (
              <Stack
                width={40}
                height={40}
                borderRadius="$2"
                backgroundColor="transparent"
                justifyContent="center"
                alignItems="center"
                pressStyle={{
                  backgroundColor: "$backgroundPress",
                }}
                onPress={handleDeletePress}
                cursor="pointer"
              >
                <Trash2 size={20} color="#ef4444" />
              </Stack>
            )}

            {isEditing ? (
              canCancelEdit && (
                <Button
                  size="small"
                  backgroundColor="$backgroundMuted"
                  borderColor="$borderSoft"
                  borderWidth={1}
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  pressStyle={{
                    backgroundColor: "$backgroundPress",
                    scale: 0.95,
                  }}
                  onPress={onCancelEdit}
                >
                  <Text size="small" color="$text" fontWeight="500">
                    Back
                  </Text>
                </Button>
              )
            ) : (
              <Button
                size="small"
                backgroundColor="$backgroundStrong"
                borderColor="$borderSoft"
                borderWidth={1}
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                pressStyle={{
                  backgroundColor: "$backgroundPress",
                  scale: 0.95,
                }}
                onPress={onEditPress}
              >
                <Text size="small" color="$text" fontWeight="500">
                  Change
                </Text>
              </Button>
            )}
          </XStack>
        )}
      </XStack>

      {!isEditing && (
        <LongPressToEdit
          onLongPress={() => onNotesLongPress?.()}
          disabled={!isActive}
        >
          <Text
            size="medium"
            color={exerciseNotes ? "$textSoft" : "$textMuted"}
            lineHeight={18}
          >
            {exerciseNotes || "tap and hold to add notes"}
          </Text>
        </LongPressToEdit>
      )}
    </YStack>
  );
}
