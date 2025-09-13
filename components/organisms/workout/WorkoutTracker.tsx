import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
} from "react-native-reanimated";
import WorkoutTrackerHeader from "@/components/molecules/headers/WorkoutTrackerHeader";
import ExerciseTracker from "@/components/molecules/workout/ExerciseTracker";
import GradientBlur from "@/components/atoms/core/GradientBlur";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Alert } from "react-native";
import { PlusCircle } from "@/assets/icons/IconMap";
import { useTheme } from "tamagui";
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
    const theme = useTheme();

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

      // Create default empty set
      const defaultSet: WorkoutExerciseSet = {
        id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        exercise_id: `exercise-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`, // Will be updated with actual exercise ID
        set_number: 1,
        weight: undefined,
        reps: undefined,
        distance: undefined,
        duration: undefined,
        rpe: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const exerciseId = `exercise-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Update the set's exercise_id
      defaultSet.exercise_id = exerciseId;

      const newExercise: WorkoutExercise = {
        id: exerciseId,
        definition_id: undefined,
        workout_id: currentWorkout.id,
        name: "",
        order_index: maxOrderIndex + 1,
        weight_unit: "kg",
        workout_exercise_sets: [defaultSet], // Include the default set
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
          backgroundColor: theme.background.val,
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
              top: 130, // Covers from top of content area (below header)
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
                size="medium"
                textAlign="center"
                marginTop="$2"
              >
                Exercise limit reached (10/10)
              </Text>
            )}

            {isActive && !isExerciseLimitReached && (
              <Stack
                marginTop="$3"
                padding="$3"
                borderRadius="$4"
                backgroundColor="$primary"
                alignItems="center"
                pressStyle={{
                  backgroundColor: "$primaryPress",
                  scale: 0.98,
                }}
                onPress={handleAddExercise}
              >
                <XStack gap="$2" alignItems="center">
                  <PlusCircle size={20} color="white" />
                  <Text color="white" size="medium" fontWeight="600">
                    Add Exercise
                  </Text>
                </XStack>
              </Stack>
            )}

            {(!currentWorkout?.workout_exercises ||
              currentWorkout.workout_exercises.length === 0) && (
              <YStack
                padding="$6"
                alignItems="center"
                gap="$4"
                backgroundColor="$backgroundSoft"
                borderRadius="$4"
                marginTop="$4"
              >
                <Text size="medium">💪</Text>
                <YStack alignItems="center" gap="$2">
                  <Text
                    size="medium"
                    color="$color"
                    textAlign="center"
                    fontWeight="600"
                  >
                    Ready to start?
                  </Text>
                  <Text
                    size="medium"
                    color="$textMuted"
                    textAlign="center"
                    lineHeight={18}
                  >
                    Add your first exercise to begin tracking
                  </Text>
                </YStack>
              </YStack>
            )}
          </YStack>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

export default WorkoutTracker;
