// components/organisms/WorkoutTracker.tsx
import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { YStack } from "tamagui";
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
}

const WorkoutTracker = forwardRef<WorkoutTrackerRef, WorkoutTrackerProps>(
  (
    { workout, isActive, timeString, isPaused, togglePause, onActiveChange },
    ref
  ) => {
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Animated value that tracks sheet position
    const animatedIndex = useSharedValue(0);
    const animatedPosition = useSharedValue(0);

    const snapPoints = useMemo(() => ["38%", "90%"], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        const newIsActive = index > 0;
        onActiveChange(newIsActive);
        animatedIndex.value = index;
      },
      [onActiveChange, animatedIndex]
    );

    // Create a JS function to expand the sheet
    const expandSheet = useCallback(() => {
      bottomSheetRef.current?.expand();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        startWorkout: () => bottomSheetRef.current?.expand(),
        finishWorkout: () => bottomSheetRef.current?.snapToIndex(0),
      }),
      []
    );

    // Custom gesture - only allow upward swipes
    const panGesture = Gesture.Pan().onEnd((event) => {
      // Only expand if swiping up (negative velocity) and currently collapsed
      if (event.velocityY < -500 && animatedIndex.value === 0) {
        runOnJS(expandSheet)(); // Use runOnJS to call the function
      }
    });

    // Animated style for blur opacity based on sheet position
    const blurAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(animatedIndex.value, [0, 1], [1, 0], "clamp");

      return {
        opacity,
      };
    });

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
        }}
      >
        {/* Custom gesture detector on header area */}
        <GestureDetector gesture={panGesture}>
          <WorkoutTrackerHeader
            workoutName={workout.name}
            workoutDescription={workout.description}
            isActive={isActive}
            timeString={timeString}
            isPaused={isPaused}
            togglePause={togglePause}
          />
        </GestureDetector>

        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 6,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$3">
            {workout.workout_exercises
              .sort(
                (a: WorkoutExercise, b: WorkoutExercise) =>
                  a.order_index - b.order_index
              )
              .map((exercise: WorkoutExercise, index: number) => (
                <ExerciseTracker
                  key={exercise.id}
                  exercise={exercise}
                  isInitiallyExpanded={index === 0}
                />
              ))}
          </YStack>

          {/* Animated blur that follows sheet position */}
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
