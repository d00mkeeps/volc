// components/organisms/WorkoutTracker.tsx
import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { YStack, Text } from "tamagui";
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

interface WorkoutTrackerProps {
  workout: CompleteWorkout;
  isActive: boolean;
  timeString: string;
  isPaused: boolean;
  togglePause: () => void;
  onActiveChange: (active: boolean) => void;
}

export interface WorkoutTrackerRef {
  startWorkout: () => void;
  finishWorkout: () => void;
  expandToFull: () => void;
  snapToPeek: () => void;
}

const WorkoutTracker = forwardRef<WorkoutTrackerRef, WorkoutTrackerProps>(
  (
    { workout, isActive, timeString, isPaused, togglePause, onActiveChange },
    ref
  ) => {
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
    const snapPoints = useMemo(() => ["38%", "90%"], []);

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
            timeString={timeString}
            isPaused={isPaused}
            togglePause={togglePause}
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
                  isInitiallyExpanded={index === 0}
                  isActive={isActive}
                  onExerciseUpdate={handleExerciseUpdate}
                />
              ))}

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
                  Add exercises to get started with your workout
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
