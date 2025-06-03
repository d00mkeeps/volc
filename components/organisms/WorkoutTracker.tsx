import React, {
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { YStack, Text, XStack, Stack } from "tamagui";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSharedValue } from "react-native-reanimated";
import WorkoutTrackerHeader from "@/components/molecules/WorkoutTrackerHeader";
import ExerciseTracker from "@/components/molecules/ExerciseTracker";
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

    // Simplified animated values - just like the working test
    const animatedIndex = useSharedValue(0);
    const animatedPosition = useSharedValue(0);

    // Use your working percentages
    const snapPoints = useMemo(() => ["36%", "91%"], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        animatedIndex.value = index;
        console.log("📊 WorkoutTracker sheet index:", index);
      },
      [animatedIndex]
    );

    // Simplified expand/collapse methods
    const expandSheet = useCallback(() => {
      bottomSheetRef.current?.snapToIndex(2); // 91%
    }, []);

    const snapToPeek = useCallback(() => {
      bottomSheetRef.current?.snapToIndex(1); // 40%
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

    // Simplified exercise handlers (same logic, cleaner structure)
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

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
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
        {/* Simplified header - remove complex gesture detection for now */}
        <WorkoutTrackerHeader
          workoutName={currentWorkout?.name}
          workoutDescription={currentWorkout?.notes}
          isActive={isActive}
          currentTemplateName={currentTemplateName || currentWorkout?.name}
        />

        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$3">
            {currentWorkout?.workout_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((exercise) => (
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
                <Text fontSize="$5" color="$textSoft" textAlign="center">
                  No exercises in this workout
                </Text>
                <Text fontSize="$3" color="$textMuted" textAlign="center">
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
