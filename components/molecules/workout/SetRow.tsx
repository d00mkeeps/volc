import React, { useState, useEffect, useMemo } from "react";
import { XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { WorkoutExerciseSet, ExerciseDefinition } from "@/types/workout";
import { AppIcon } from "@/assets/icons/IconMap";
import * as Haptics from "expo-haptics";
import MetricInput from "@/components/atoms/workout/MetricInput";
import { useUserStore } from "@/stores/userProfileStore";
import DurationInput from "@/components/atoms/workout/DurationInput";
import { isSetComplete } from "@/utils/setValidation";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";

interface SetRowProps {
  set: WorkoutExerciseSet;
  exerciseDefinition?: ExerciseDefinition;
  isActive?: boolean;
  onUpdate: (set: WorkoutExerciseSet) => void;
  onDelete?: (setId: string) => void;
  canDelete?: boolean;
  isDeleteRevealed?: boolean;
  onSwipe?: (setId: string, isRevealed: boolean) => void;
}

export default function SetRow({
  set,
  exerciseDefinition,
  isActive = true,
  onUpdate,
  onDelete,
  canDelete = true,
  isDeleteRevealed = false,
  onSwipe,
}: SetRowProps) {
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const { userProfile } = useUserStore();
  const isImperial = userProfile?.is_imperial ?? false;
  const colorScheme = useColorScheme();

  const iconColor = colorScheme === "dark" ? "#cdcdcdff" : "#6e6e6eff";

  const translateX = useSharedValue(0);
  const DELETE_BUTTON_WIDTH = 80;
  const SWIPE_THRESHOLD = -60;

  const canBeCompleted = useMemo(() => {
    return isSetComplete(set, exerciseDefinition);
  }, [set.weight, set.reps, set.distance, set.duration, exerciseDefinition]);

  useEffect(() => {
    if (canBeCompleted) {
      setShowValidationErrors(false);
    }
  }, [canBeCompleted]);

  useEffect(() => {
    if (!isDeleteRevealed) {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [isDeleteRevealed]);

  const handleCompletionToggle = async () => {
    if (!isActive) return;

    const newCompletionState = !set.is_completed;

    if (newCompletionState && !canBeCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowValidationErrors(true);
      return;
    }

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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.(set.id);
    onSwipe?.(set.id, false);
  };

  const handleUpdate = (field: string, value: any) => {
    if (!isActive) return;

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

  const shouldShowError = (fieldValue: any) => {
    return (
      showValidationErrors && (fieldValue === undefined || fieldValue === null)
    );
  };

  // /components/molecules/workout/SetRow.panGesture
  const panGesture = Gesture.Pan()
    .enabled(isActive && canDelete)
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-DELETE_BUTTON_WIDTH, {
          damping: 100,
          stiffness: 500,
        });
        if (onSwipe) {
          runOnJS(onSwipe)(set.id, true);
        }
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        translateX.value = withSpring(0, {
          damping: 1000,
          stiffness: 1000,
        });
        if (onSwipe) {
          runOnJS(onSwipe)(set.id, false);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Stack opacity={isActive ? 1 : 0.6}>
      {/* Delete button */}
      <Stack
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        width={DELETE_BUTTON_WIDTH}
        backgroundColor="$red10"
        borderTopLeftRadius={4}
        borderBottomLeftRadius={4}
        justifyContent="center"
        alignItems="center"
        pressStyle={{
          backgroundColor: "#dc2626",
        }}
        onPress={handleDeletePress}
        cursor="pointer"
      >
        <AppIcon name="Trash2" size={22} color="$white" />
      </Stack>

      {/* Main swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <XStack
            minHeight={55}
            alignItems="center"
            backgroundColor="$backgroundSoft"
          >
            <Stack
              width={50}
              height="100%"
              justifyContent="center"
              alignItems="center"
            >
              <Text size="large" fontWeight="600" color="$textMuted">
                {set.set_number}
              </Text>
            </Stack>

            {/* Metric Inputs - Fixed spacing */}
            <XStack flex={1} gap="$1.5" alignItems="flex-start">
              {showWeight && (
                <MetricInput
                  type="weight"
                  value={set.weight}
                  unit={isImperial ? "lbs" : "kg"}
                  isMetric={!isImperial}
                  onChange={(value) => handleUpdate("weight", value)}
                  isActive={isActive}
                  showError={shouldShowError(set.weight)}
                />
              )}
              {showReps && (
                <MetricInput
                  type="reps"
                  value={set.reps}
                  isMetric={!isImperial}
                  onChange={(value) => handleUpdate("reps", value)}
                  isActive={isActive}
                  showError={shouldShowError(set.reps)}
                />
              )}
              {showDistance && (
                <MetricInput
                  type="distance"
                  value={set.distance}
                  unit={isImperial ? "mi" : "km"}
                  isMetric={!isImperial}
                  onChange={(value) => handleUpdate("distance", value)}
                  isActive={isActive}
                  showError={shouldShowError(set.distance)}
                />
              )}
              {showDuration && (
                <DurationInput
                  value={set.duration}
                  onChange={(value) => handleUpdate("duration", value)}
                  isActive={isActive}
                  showError={shouldShowError(set.duration)}
                />
              )}
            </XStack>

            {/* Completion Button */}
            <Stack
              width={50}
              height="70%"
              justifyContent="center"
              alignItems="center"
              borderRadius={24}
              borderColor="$primaryMuted"
              borderWidth={0.25}
              backgroundColor={set.is_completed ? "$green8" : "transparent"}
              pressStyle={{
                backgroundColor: set.is_completed
                  ? "$green10"
                  : "$backgroundPress",
                scale: 0.96,
              }}
              onPress={handleCompletionToggle}
              cursor="pointer"
              margin="$1"
            >
              <AppIcon
                name="Check"
                size={32}
                color={set.is_completed ? "white" : iconColor}
              />
            </Stack>
          </XStack>
        </Animated.View>
      </GestureDetector>
    </Stack>
  );
}
