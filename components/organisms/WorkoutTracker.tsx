// components/organisms/WorkoutTracker.tsx
import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { YStack, Text, XStack, Stack } from "tamagui";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import WorkoutTrackerHeader from "@/components/molecules/WorkoutTrackerHeader";
import ExerciseTracker from "@/components/molecules/ExerciseTracker";
import GradientBlur from "@/components/atoms/GradientBlur";
import { CompleteWorkout, WorkoutExercise } from "@/types/workout";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutTrackerProps {
  workout: CompleteWorkout;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
  currentTemplateName?: string;
  // Removed: timeString, isPaused, togglePause - header gets from store
}

export interface WorkoutTrackerRef {
  startWorkout: () => void;
  finishWorkout: () => void;
  expandToFull: () => void;
  snapToPeek: () => void;
}

const WorkoutTracker = forwardRef<WorkoutTrackerRef, WorkoutTrackerProps>(
  ({ workout, isActive, onActiveChange, currentTemplateName }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Local state for workout data updates
    const [workoutData, setWorkoutData] = useState<CompleteWorkout>(workout);

    // Update local state when workout prop changes
    React.useEffect(() => {
      setWorkoutData(workout);
    }, [workout]);

    // Animated values for tracking sheet position
    const animatedIndex = useSharedValue(0);
    const animatedPosition = useSharedValue(0);

    // Snap points: peek view and full view
    const snapPoints = useMemo(() => ["45%", "90%"], []);

    // Handle sheet position changes
    const handleSheetChanges = useCallback(
      (index: number) => {
        const newIsActive = index > 0;
        onActiveChange(newIsActive);
        animatedIndex.value = index;
      },
      [onActiveChange, animatedIndex]
    );

    // Expand sheet programmatically
    const expandSheet = useCallback(() => {
      bottomSheetRef.current?.expand();
    }, []);

    // Snap to peek view
    const snapToPeek = useCallback(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, []);

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        startWorkout: () => {
          bottomSheetRef.current?.expand();
        },
        finishWorkout: () => {
          bottomSheetRef.current?.snapToIndex(0);
        },
        expandToFull: expandSheet,
        snapToPeek: snapToPeek,
      }),
      [expandSheet, snapToPeek]
    );

    // Custom gesture for expanding on swipe up
    const panGesture = Gesture.Pan().onEnd((event) => {
      // Only expand if swiping up with sufficient velocity and currently at peek
      if (event.velocityY < -500 && animatedIndex.value === 0) {
        runOnJS(expandSheet)();
      }
    });

    // Animated style for the blur overlay
    const blurAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(animatedIndex.value, [0, 1], [1, 0], "clamp");
      return { opacity };
    });

    // Handle exercise updates
    const handleExerciseUpdate = useCallback(
      (updatedExercise: WorkoutExercise) => {
        if (!isActive) return;

        // Update local state for immediate UI response
        setWorkoutData((prev) => ({
          ...prev,
          workout_exercises: prev.workout_exercises.map((exercise) =>
            exercise.id === updatedExercise.id ? updatedExercise : exercise
          ),
        }));

        // Sync to session store
        const updatedWorkout = {
          ...workoutData,
          workout_exercises: workoutData.workout_exercises.map((exercise) =>
            exercise.id === updatedExercise.id ? updatedExercise : exercise
          ),
        };
        useUserSessionStore.getState().updateCurrentWorkout(updatedWorkout);

        console.log("Exercise updated:", updatedExercise);
      },
      [isActive, workoutData]
    );

    const handleExerciseDelete = useCallback(
      (exerciseId: string) => {
        if (!isActive) return;

        // Don't allow deleting the last exercise
        if (workoutData.workout_exercises.length <= 1) {
          Alert.alert(
            "Cannot Delete Exercise",
            "You must have at least one exercise in your workout.",
            [{ text: "OK" }]
          );
          return;
        }

        // Update local state for immediate UI response
        setWorkoutData((prev) => ({
          ...prev,
          workout_exercises: prev.workout_exercises.filter(
            (exercise) => exercise.id !== exerciseId
          ),
        }));

        // Sync to session store
        const updatedWorkout = {
          ...workoutData,
          workout_exercises: workoutData.workout_exercises.filter(
            (exercise) => exercise.id !== exerciseId
          ),
        };
        useUserSessionStore.getState().updateCurrentWorkout(updatedWorkout);

        console.log("Exercise deleted:", exerciseId);
      },
      [isActive, workoutData]
    );

    // Add exercise handler
    const handleAddExercise = useCallback(() => {
      if (!isActive) return;

      // Find the highest order_index and add 1 to put it at the bottom
      const maxOrderIndex =
        workoutData.workout_exercises.length > 0
          ? Math.max(
              ...workoutData.workout_exercises.map((ex) => ex.order_index)
            )
          : -1;

      // Create a new exercise with a temporary ID
      const newExercise: WorkoutExercise = {
        id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        definition_id: undefined,
        workout_id: workoutData.id,
        name: "",
        order_index: maxOrderIndex + 1,
        weight_unit: "kg",
        workout_exercise_sets: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update local state
      setWorkoutData((prev) => ({
        ...prev,
        workout_exercises: [...prev.workout_exercises, newExercise],
      }));

      // Sync to session store
      const updatedWorkout = {
        ...workoutData,
        workout_exercises: [...workoutData.workout_exercises, newExercise],
      };
      useUserSessionStore.getState().updateCurrentWorkout(updatedWorkout);

      console.log("New exercise added:", newExercise);
    }, [isActive, workoutData]);

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        enableHandlePanningGesture={false}
        enableContentPanningGesture={false}
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
        {/* Header with gesture detector for swipe up */}
        <GestureDetector gesture={panGesture}>
          <WorkoutTrackerHeader
            workoutName={workoutData.name}
            workoutDescription={workoutData.notes}
            isActive={isActive}
            currentTemplateName={currentTemplateName || workoutData.name}
            // Removed: timeString, isPaused, togglePause
          />
        </GestureDetector>

        {/* Scrollable content */}
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 120, // Extra space for FAB
          }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$3">
            {workoutData.workout_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((exercise, index) => (
                <ExerciseTracker
                  key={exercise.id}
                  exercise={exercise}
                  isInitiallyExpanded={false}
                  isActive={isActive}
                  onExerciseUpdate={handleExerciseUpdate}
                  onExerciseDelete={handleExerciseDelete}
                  startInEditMode={exercise.name === ""}
                />
              ))}

            {/* Add Exercise Button */}
            {isActive && (
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

            {/* Empty state if no exercises */}
            {workoutData.workout_exercises.length === 0 && (
              <YStack
                padding="$5"
                alignItems="center"
                gap="$3"
                backgroundColor="$backgroundSoft"
                borderRadius="$3"
                marginTop="$3"
              >
                <Text fontSize="$5" color="$textSoft" textAlign="center">
                  No exercises in this workout
                </Text>
                <Text fontSize="$3" color="$textMuted" textAlign="center">
                  Select a template or add exercises to get started
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Blur overlay that fades based on sheet position */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              },
              blurAnimatedStyle,
            ]}
            pointerEvents="none"
          >
            <GradientBlur />
          </Animated.View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

export default WorkoutTracker;
