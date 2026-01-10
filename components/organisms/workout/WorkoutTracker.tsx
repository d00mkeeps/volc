// /components/organisms/WorkoutTracker.tsx

import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { YStack, XStack, Stack } from "tamagui";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useSharedValue } from "react-native-reanimated";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useTheme } from "tamagui";
import WorkoutTrackerHeader from "@/components/molecules/headers/WorkoutTrackerHeader";
import ExerciseTracker from "@/components/molecules/workout/ExerciseTracker";
import Text from "@/components/atoms/core/Text";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";
import Toast from "react-native-toast-message";
import { AppIcon } from "@/assets/icons/IconMap";

interface WorkoutTrackerProps {
  currentTemplateName?: string;
  onFinishPress?: () => void;
  hasAtLeastOneCompleteSet?: boolean;
}

export interface WorkoutTrackerRef {
  startWorkout: () => void;
  finishWorkout: () => void;
  expandToFull: () => void;
  snapToPeek: () => void;
}

const WorkoutTracker = forwardRef<WorkoutTrackerRef, WorkoutTrackerProps>(
  ({ currentTemplateName, onFinishPress, hasAtLeastOneCompleteSet }, ref) => {
    const theme = useTheme();
    const { currentWorkout, isActive, updateCurrentWorkout } =
      useUserSessionStore();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const animatedIndex = useSharedValue(-1);
    const animatedPosition = useSharedValue(0);

    const [isAnyExerciseEditing, setIsAnyExerciseEditing] = useState(false);

    const snapPoints = useMemo(() => ["45%", "92%"], []);

    const handleSheetChanges = (index: number) => {
      console.log("🟡 [WorkoutTracker] handleSheetChanges -", index);
      animatedIndex.value = index;
    };

    // Add effect to log state changes
    useEffect(() => {
      console.log("🟢 [WorkoutTracker] State:", {
        isActive,
        hasWorkout: !!currentWorkout?.id,
        computedIndex: isActive && currentWorkout?.id ? 0 : -1,
      });
    }, [isActive, currentWorkout?.id]);

    useImperativeHandle(
      ref,
      () => ({
        startWorkout: () => {},
        finishWorkout: () => {
          console.log("🔴 [WorkoutTracker] finishWorkout called");
          bottomSheetRef.current?.close();
        },
        expandToFull: () => bottomSheetRef.current?.snapToIndex(1),
        snapToPeek: () => bottomSheetRef.current?.snapToIndex(0),
      }),
      []
    );

    // Track editing state across all exercises
    const handleEditingChange = useCallback((isEditing: boolean) => {
      setIsAnyExerciseEditing(isEditing);
    }, []);

    const handleExerciseUpdate = useCallback(
      (updatedExercise: WorkoutExercise) => {
        if (!isActive || !currentWorkout) return;

        const updatedWorkout = {
          ...currentWorkout,
          workout_exercises: currentWorkout.workout_exercises.map((exercise) =>
            exercise.id === updatedExercise.id ? updatedExercise : exercise
          ),
        };
        updateCurrentWorkout(updatedWorkout);
      },
      [isActive, currentWorkout, updateCurrentWorkout]
    );

    const handleExerciseDelete = useCallback(
      (exerciseId: string) => {
        if (!isActive || !currentWorkout) return;

        // Find the exercise being deleted
        const deletedExercise = currentWorkout.workout_exercises.find(
          (exercise) => exercise.id === exerciseId
        );

        if (!deletedExercise) return;

        // Remove the exercise
        const updatedWorkout = {
          ...currentWorkout,
          workout_exercises: currentWorkout.workout_exercises.filter(
            (exercise) => exercise.id !== exerciseId
          ),
        };
        updateCurrentWorkout(updatedWorkout);

        // Only show toast for named exercises (not for canceled new exercises)
        if (deletedExercise.name) {
          Toast.show({
            type: "success",
            text1: `${deletedExercise.name} removed`,
            text2: "Tap to undo",
            visibilityTime: 2000,
            onPress: () => {
              // Undo: restore the exercise at its original position
              const restoredWorkout = {
                ...currentWorkout,
                workout_exercises: [...currentWorkout.workout_exercises],
              };
              updateCurrentWorkout(restoredWorkout);
              Toast.hide();
            },
          });
        }
      },
      [isActive, currentWorkout, updateCurrentWorkout]
    );

    const handleAddExercise = useCallback(() => {
      if (!isActive || !currentWorkout || isAnyExerciseEditing) return;

      // Check if there are any unnamed exercises
      const hasUnnamedExercise = currentWorkout.workout_exercises.some(
        (exercise) => !exercise.name
      );

      if (hasUnnamedExercise) return; // Don't add if there's already an unnamed exercise

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
          .substr(2, 9)}`,
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
        workout_exercise_sets: [defaultSet],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedWorkout = {
        ...currentWorkout,
        workout_exercises: [...currentWorkout.workout_exercises, newExercise],
      };
      updateCurrentWorkout(updatedWorkout);
    }, [isActive, currentWorkout, updateCurrentWorkout, isAnyExerciseEditing]);

    useEffect(() => {
      if (!isActive || !currentWorkout?.id) {
        console.log("🔴 [WorkoutTracker] Forcing close via snapToIndex(-1)");
        bottomSheetRef.current?.close();
      }
    }, [isActive, currentWorkout?.id]);

    // Handle moving exercise up
    const handleMoveExerciseUp = useCallback(
      (exerciseId: string) => {
        if (!currentWorkout) return;

        const currentIndex = sortedExercises.findIndex(
          (ex) => ex.id === exerciseId
        );
        if (currentIndex <= 0) return; // Already at top

        // Swap with previous exercise
        const reorderedExercises = [...sortedExercises];
        [
          reorderedExercises[currentIndex - 1],
          reorderedExercises[currentIndex],
        ] = [
          reorderedExercises[currentIndex],
          reorderedExercises[currentIndex - 1],
        ];

        // Update order_index for all
        const updatedExercises = reorderedExercises.map((ex, index) => ({
          ...ex,
          order_index: index,
        }));

        const updatedWorkout = {
          ...currentWorkout,
          workout_exercises: updatedExercises,
        };
        updateCurrentWorkout(updatedWorkout);
      },
      [currentWorkout, updateCurrentWorkout]
    );

    // Handle moving exercise down
    const handleMoveExerciseDown = useCallback(
      (exerciseId: string) => {
        if (!currentWorkout) return;

        const currentIndex = sortedExercises.findIndex(
          (ex) => ex.id === exerciseId
        );
        if (currentIndex >= sortedExercises.length - 1) return; // Already at bottom

        // Swap with next exercise
        const reorderedExercises = [...sortedExercises];
        [
          reorderedExercises[currentIndex],
          reorderedExercises[currentIndex + 1],
        ] = [
          reorderedExercises[currentIndex + 1],
          reorderedExercises[currentIndex],
        ];

        // Update order_index for all
        const updatedExercises = reorderedExercises.map((ex, index) => ({
          ...ex,
          order_index: index,
        }));

        const updatedWorkout = {
          ...currentWorkout,
          workout_exercises: updatedExercises,
        };
        updateCurrentWorkout(updatedWorkout);
      },
      [currentWorkout, updateCurrentWorkout]
    );

    const sortedExercises = useMemo(() => {
      return (currentWorkout?.workout_exercises || []).sort(
        (a, b) => a.order_index - b.order_index
      );
    }, [currentWorkout?.workout_exercises]);

    const isExerciseLimitReached =
      (currentWorkout?.workout_exercises || []).length >= 10;

    // Check if we should disable the add button
    const hasUnnamedExercise = (currentWorkout?.workout_exercises || []).some(
      (exercise) => !exercise.name
    );
    const shouldDisableAddButton = isAnyExerciseEditing || hasUnnamedExercise;

    const renderHeader = () => (
      <YStack gap="$3">
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
                Are you ready?
              </Text>
              <Text
                size="medium"
                color="$textMuted"
                textAlign="center"
                lineHeight={18}
              >
                Press start below or add an exercise
              </Text>
            </YStack>
          </YStack>
        )}
      </YStack>
    );

    const renderFooter = () => (
      <YStack gap="$3" marginTop="$3">
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
            padding="$4"
            borderRadius="$4"
            width="60%"
            alignSelf="center"
            backgroundColor={
              shouldDisableAddButton ? "$backgroundMuted" : "$primary"
            }
            alignItems="center"
            opacity={shouldDisableAddButton ? 0.6 : 1}
            pressStyle={
              shouldDisableAddButton
                ? {}
                : {
                    backgroundColor: "$primaryPress",
                    scale: 0.98,
                  }
            }
            onPress={handleAddExercise}
            cursor={shouldDisableAddButton ? "default" : "pointer"}
          >
            <XStack gap="$2" alignItems="center">
              <AppIcon
                name="PlusCircle"
                size={20}
                color={shouldDisableAddButton ? "#666" : "white"}
              />
              <Text
                color={shouldDisableAddButton ? "$textMuted" : "white"}
                size="medium"
                fontWeight="600"
              >
                Add Exercise
              </Text>
            </XStack>
          </Stack>
        )}
      </YStack>
    );

    const renderItem = useCallback(
      ({ item: exercise, index }: { item: WorkoutExercise; index: number }) => {
        const isFirst = index === 0;
        const isLast = index === sortedExercises.length - 1;

        return (
          <YStack marginBottom="$3">
            <ExerciseTracker
              key={exercise.id}
              exercise={exercise}
              isActive={isActive}
              onExerciseUpdate={handleExerciseUpdate}
              onExerciseDelete={handleExerciseDelete}
              startInEditMode={exercise.name === ""}
              onEditingChange={handleEditingChange}
              onMoveUp={
                !isFirst ? () => handleMoveExerciseUp(exercise.id) : undefined
              }
              onMoveDown={
                !isLast ? () => handleMoveExerciseDown(exercise.id) : undefined
              }
            />
          </YStack>
        );
      },
      [
        isActive,
        handleExerciseUpdate,
        handleExerciseDelete,
        handleEditingChange,
        sortedExercises.length,
        handleMoveExerciseUp,
        handleMoveExerciseDown,
      ]
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={isActive && currentWorkout?.id ? 0 : -1}
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
        {/* Header - always visible */}
        <WorkoutTrackerHeader
          workoutName={currentWorkout?.name}
          workoutDescription={currentWorkout?.notes}
          isActive={isActive}
          onFinishPress={onFinishPress}
          hasAtLeastOneCompleteSet={hasAtLeastOneCompleteSet}
          currentTemplateName={currentTemplateName || currentWorkout?.name}
        />

        <BottomSheetFlatList
          data={sortedExercises}
          keyExtractor={(item: WorkoutExercise) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
        />
      </BottomSheet>
    );
  }
);

export default WorkoutTracker;
