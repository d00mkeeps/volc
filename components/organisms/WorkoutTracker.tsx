import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { YStack, Text, XStack, Stack } from "tamagui";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
} from "react-native-reanimated";
import WorkoutTrackerHeader from "@/components/molecules/headers/WorkoutTrackerHeader";
import ExerciseTracker from "@/components/molecules/workout/ExerciseTracker";
import GradientBlur from "@/components/atoms/GradientBlur";
import { WorkoutExercise } from "@/types/workout";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutTrackerProps {
  currentTemplateName?: string;
}

export interface WorkoutTrackerRef {
  startWorkout: () => void;
  finishWorkout: () => void;
  expandToFull: () => void;
  snapToPeek: () => void;
}

const WorkoutTracker = forwardRef<WorkoutTrackerRef, WorkoutTrackerProps>(
  ({ currentTemplateName }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);

    const { currentWorkout, isActive, updateCurrentWorkout, updateExercise } =
      useUserSessionStore();

    // Animated values for tracking sheet position
    const animatedIndex = useSharedValue(1);
    const animatedPosition = useSharedValue(0);

    // Define snap points - using index 1 and 2 to avoid auto-generated index 0
    const snapPoints = useMemo(() => ["40%", "91%"], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        animatedIndex.value = index;
      },
      [animatedIndex]
    );

    // Force start at index 1 (40%) to avoid auto-generated index 0
    useEffect(() => {
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1);
      }, 100);
    }, []);

    // Expand to 91% (index 2)
    const expandSheet = useCallback(() => {
      bottomSheetRef.current?.snapToIndex(2);
    }, []);

    // Snap to 40% (index 1)
    const snapToPeek = useCallback(() => {
      bottomSheetRef.current?.snapToIndex(1);
    }, []);

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        startWorkout: snapToPeek, // Keep at 40% when starting
        finishWorkout: snapToPeek, // Return to 40% when finishing
        expandToFull: expandSheet,
        snapToPeek: snapToPeek,
      }),
      [expandSheet, snapToPeek]
    );

    // Animated style for the blur overlay - fades when expanding
    const blurAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(animatedIndex.value, [1, 2], [1, 0], "clamp");
      return { opacity };
    });

    // Exercise update handlers
    const handleExerciseUpdate = useCallback(
      (updatedExercise: WorkoutExercise) => {
        updateExercise(updatedExercise.id, updatedExercise);
      },
      [updateExercise]
    );

    const handleExerciseDelete = useCallback(
      (exerciseId: string) => {
        if (!isActive || !currentWorkout) return;

        if (currentWorkout.workout_exercises.length <= 1) {
          Alert.alert(
            "Cannot Delete Exercise",
            "You must have at least one exercise in your workout.",
            [{ text: "OK" }]
          );
          return;
        }

        const updatedWorkout = {
          ...currentWorkout,
          workout_exercises: currentWorkout.workout_exercises.filter(
            (exercise) => exercise.id !== exerciseId
          ),
        };
        updateCurrentWorkout(updatedWorkout);
      },
      [isActive, currentWorkout, updateCurrentWorkout]
    );

    const handleAddExercise = useCallback(() => {
      if (!isActive || !currentWorkout) return;

      const maxOrderIndex =
        currentWorkout.workout_exercises.length > 0
          ? Math.max(
              ...currentWorkout.workout_exercises.map((ex) => ex.order_index)
            )
          : -1;

      const newExercise: WorkoutExercise = {
        id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        definition_id: undefined,
        workout_id: currentWorkout.id,
        name: "",
        order_index: maxOrderIndex + 1,
        weight_unit: "kg",
        workout_exercise_sets: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedWorkout = {
        ...currentWorkout,
        workout_exercises: [...currentWorkout.workout_exercises, newExercise],
      };
      updateCurrentWorkout(updatedWorkout);
    }, [isActive, currentWorkout, updateCurrentWorkout]);

    const isExerciseLimitReached =
      (currentWorkout?.workout_exercises || []).length >= 10;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={1} // Start at index 1 (40%) to avoid auto-generated index 0
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        animatedIndex={animatedIndex}
        animatedPosition={animatedPosition}
        backgroundStyle={{
          backgroundColor: "#1a1a1a",
        }}
        handleIndicatorStyle={{
          backgroundColor: "#666",
          width: 40,
          height: 4,
        }}
        handleStyle={{
          paddingVertical: 8,
        }}
      >
        {/* Header - always visible, no blur */}
        <WorkoutTrackerHeader
          workoutName={currentWorkout?.name}
          workoutDescription={currentWorkout?.notes}
          isActive={isActive}
          currentTemplateName={currentTemplateName || currentWorkout?.name}
        />

        {/* Blur overlay covering everything below header */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 108, // Covers from top of content area (below header)
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1, // Above content but below any modals
            },
            blurAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <GradientBlur />
        </Animated.View>

        {/* Scrollable content - gets blurred when inactive */}
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$3">
            {(currentWorkout?.workout_exercises || [])
              .sort((a, b) => a.order_index - b.order_index)
              .map((exercise) => (
                <ExerciseTracker
                  key={exercise.id}
                  exercise={exercise}
                  isActive={isActive}
                  onExerciseUpdate={handleExerciseUpdate}
                  onExerciseDelete={handleExerciseDelete}
                  startInEditMode={exercise.name === ""}
                />
              ))}

            {isActive && isExerciseLimitReached && (
              <Text
                color="$textMuted"
                fontSize="$3"
                textAlign="center"
                marginTop="$2"
              >
                Exercise limit reached (10/10)
              </Text>
            )}

            {isActive && !isExerciseLimitReached && (
              <Stack
                marginTop="$2"
                padding="$3"
                borderRadius="$3"
                borderWidth={1}
                borderColor="$borderSoft"
                borderStyle="dashed"
                alignItems="center"
                backgroundColor="transparent"
                pressStyle={{
                  backgroundColor: "$primaryTint",
                  borderColor: "$primary",
                }}
                onPress={handleAddExercise}
              >
                <XStack gap="$2" alignItems="center">
                  <Ionicons name="add" size={20} color="$primary" />
                  <Text color="$primary" fontSize="$4" fontWeight="500">
                    Add Exercise
                  </Text>
                </XStack>
              </Stack>
            )}

            {(!currentWorkout?.workout_exercises ||
              currentWorkout.workout_exercises.length === 0) && (
              <YStack
                padding="$5"
                alignItems="center"
                gap="$3"
                backgroundColor="$backgroundSoft"
                borderRadius="$3"
                marginTop="$3"
              >
                <Text fontSize="$4" color="$textSoft" textAlign="center">
                  No exercises in this workout
                </Text>
                <Text fontSize="$4" color="$textMuted" textAlign="center">
                  Select a template or add exercises to get started
                </Text>
              </YStack>
            )}
          </YStack>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

export default WorkoutTracker;
