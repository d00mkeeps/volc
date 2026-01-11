import React from "react";
import { XStack, YStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { AppIcon } from "@/assets/icons/IconMap";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import LongPressToEdit from "@/components/atoms/core/LongPressToEdit";
// import TourStep from "@/components/molecules/tour/TourStep";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

interface ExerciseTrackerHeaderProps {
  exerciseName: string;
  isActive: boolean;
  isEditing?: boolean;
  onEditPress: () => void;
  onCancelEdit?: () => void;
  exerciseNotes?: string;
  onDelete: () => void;
  onShowDefinition?: () => void;
  canDelete: boolean;
  canCancelEdit?: boolean;
  onNotesLongPress?: () => void;
  onMoveUp?: () => void; // NEW
  onMoveDown?: () => void; // NEW
}

// Hold-to-move button component
function HoldToMoveButton({
  onMove,
  direction,
  disabled,
}: {
  onMove: () => void;
  direction: "up" | "down";
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onBegin(() => {
      if (disabled) return;
      scale.value = withSpring(0.9);
      opacity.value = withSpring(0.7);
    })
    .onStart(() => {
      if (disabled) return;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(onMove)();
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    });

  if (disabled) {
    return null;
  }

  const iconName = direction === "up" ? "ChevronUp" : "ChevronDown";

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View style={animatedStyle}>
        <Stack
          width={32}
          height={32}
          borderRadius="$2"
          backgroundColor="$backgroundMuted"
          justifyContent="center"
          alignItems="center"
        >
          <AppIcon name={iconName} size={18} color="$textMuted" />
        </Stack>
      </Animated.View>
    </GestureDetector>
  );
}

export default function ExerciseTrackerHeader({
  exerciseName,
  exerciseNotes,
  isActive,
  onEditPress,
  onDelete,
  onNotesLongPress,
  onShowDefinition,
  isEditing = false,
  onCancelEdit,
  canCancelEdit,
  canDelete,
  onMoveUp, // NEW
  onMoveDown, // NEW
}: ExerciseTrackerHeaderProps) {
  const handleDeletePress = () => {
    if (!isActive || !canDelete) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete();
  };

  return (
    <YStack gap="$2" paddingVertical="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack flex={1} alignItems="center" gap="$2">
          {/* Move Up/Down Buttons */}
          {!isEditing && isActive && (
            <XStack gap="$1">
              <HoldToMoveButton
                onMove={onMoveUp!}
                direction="up"
                disabled={!onMoveUp}
              />
              <HoldToMoveButton
                onMove={onMoveDown!}
                direction="down"
                disabled={!onMoveDown}
              />
            </XStack>
          )}

          <TouchableOpacity
            onPress={onShowDefinition}
            disabled={!exerciseName || !onShowDefinition || isEditing}
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
        </XStack>

        {/* Action Buttons */}
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
                <AppIcon name="Trash2" size={20} color="#ef4444" />
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
              // <TourStep
              //   stepId="exercise_change"
              //   title="Change Exercise"
              //   message="Tap here to swap this exercise for a different one from the library."
              //   triggerCondition={isActive && !!exerciseName}
              // >
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
              // </TourStep>
            )}
          </XStack>
        )}
      </XStack>

      {!isEditing && (
        // <TourStep
        //   stepId="exercise_notes"
        //   title="Exercise Notes"
        //   message="Long-press here to add notes about form, RPE targets, or reminders for this exercise."
        //   triggerCondition={isActive && !!exerciseName}
        // >
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
        // </TourStep>
      )}
    </YStack>
  );
}
