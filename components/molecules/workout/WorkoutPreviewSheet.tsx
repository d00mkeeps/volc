// /components/molecules/workout/WorkoutPreviewSheet.tsx
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSharedValue } from "react-native-reanimated";
import { useTheme } from "tamagui";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { CompleteWorkout, WorkoutExercise } from "@/types/workout";
import WorkoutImage from "@/components/molecules/workout/WorkoutImage";
import { AppIcon } from "@/assets/icons/IconMap";

interface WorkoutPreviewSheetProps {
  workoutIds: string[];
  onClose: () => void;
}

export default function WorkoutPreviewSheet({
  workoutIds,
  onClose,
}: WorkoutPreviewSheetProps) {
  // console.log("🔍 [WorkoutPreviewSheet] Render - workoutIds:", workoutIds);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useTheme();
  const { workouts } = useWorkoutStore();
  const setWorkoutDetailOpen = useUserSessionStore(
    (state) => state.setWorkoutDetailOpen
  );
  const [expandedWorkoutId, setExpandedWorkoutId] = React.useState<
    string | null
  >(null);

  // Animated values for tracking sheet position (like WorkoutTracker)
  const animatedIndex = useSharedValue(-1);
  const animatedPosition = useSharedValue(0);

  // Define snap points: 0 = preview (35%), 1 = expanded (85%)
  const snapPoints = useMemo(() => ["35%", "85%"], []);

  // Find workouts from store
  const selectedWorkouts = useMemo(() => {
    // console.log(
    //   "🔍 [WorkoutPreviewSheet] useMemo calculating - workoutIds:",
    //   workoutIds,
    //   "workouts count:",
    //   workouts.length
    // );
    const found = workoutIds
      .map((id) => workouts.find((w) => w.id === id))
      .filter((w): w is CompleteWorkout => w !== undefined);

    // console.log(
    //   "🔍 [WorkoutPreviewSheet] Found workouts:",
    //   found.length,
    //   found.map((w) => w.id)
    // );
    return found;
  }, [workoutIds, workouts]);

  const isOpen = workoutIds.length > 0 && selectedWorkouts.length > 0;
  // console.log(
  //   "🔍 [WorkoutPreviewSheet] isOpen:",
  //   isOpen,
  //   "workoutIds.length:",
  //   workoutIds.length,
  //   "selectedWorkouts.length:",
  //   selectedWorkouts.length
  // );

  const handleSheetChanges = useCallback(
    (index: number) => {
      // console.log(
      //   "🔍 [WorkoutPreviewSheet] handleSheetChanges - index:",
      //   index
      // );
      animatedIndex.value = index;

      if (index === -1) {
        setWorkoutDetailOpen(false);
        onClose();
      } else {
        setWorkoutDetailOpen(true);
      }

      if (index === 0 && expandedWorkoutId) {
        setExpandedWorkoutId(null);
      }
    },
    [animatedIndex, onClose, expandedWorkoutId, setWorkoutDetailOpen]
  );

  useEffect(() => {
    // console.log(
    //   "🔍 [WorkoutPreviewSheet] useEffect triggered - isOpen:",
    //   isOpen
    // );
    if (isOpen) {
      // console.log(
      //   "🔍 [WorkoutPreviewSheet] Opening sheet - calling setWorkoutDetailOpen(true) and snapToIndex(0)"
      // );
      setWorkoutDetailOpen(true);
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
      setExpandedWorkoutId(null);
    } else {
      // console.log(
      //   "🔍 [WorkoutPreviewSheet] Closing sheet - calling setWorkoutDetailOpen(false) and close()"
      // );
      setWorkoutDetailOpen(false);
      setTimeout(() => {
        bottomSheetRef.current?.close();
      }, 100);
    }
  }, [isOpen, setWorkoutDetailOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${dayName}, ${monthName} ${day} • ${displayHours}:${minutes} ${ampm}`;
  };

  // Calculate workout stats
  const getWorkoutStats = (workout: CompleteWorkout) => {
    const exerciseCount = workout.workout_exercises.length;
    const setCount = workout.workout_exercises.reduce(
      (total, exercise) => total + exercise.workout_exercise_sets.length,
      0
    );
    return { exerciseCount, setCount };
  };

  // Handle expanding a workout to full view
  const handleViewFullWorkout = useCallback((workoutId: string) => {
    setExpandedWorkoutId(workoutId);
    bottomSheetRef.current?.snapToIndex(1); // Expand to 85%
  }, []);

  // Handle going back to preview
  const handleBackToPreview = useCallback(() => {
    setExpandedWorkoutId(null);
    bottomSheetRef.current?.snapToIndex(0); // Back to 35%
  }, []);

  // Render the workout preview card
  const renderWorkoutPreview = (workout: CompleteWorkout) => {
    const { exerciseCount, setCount } = getWorkoutStats(workout);

    return (
      <Stack
        key={workout.id}
        backgroundColor="$backgroundSoft"
        borderRadius="$4"
        padding="$4"
        pressStyle={{
          opacity: 0.8,
          scale: 0.98,
        }}
        onPress={() => handleViewFullWorkout(workout.id)}
        cursor="pointer"
      >
        <YStack gap="$3">
          <YStack gap="$2">
            <Text size="large" fontWeight="600" color="$color">
              {workout.name || "Unnamed Workout"}
            </Text>
            <Text size="medium" color="$textSoft">
              {formatDate(workout.created_at)}
            </Text>
          </YStack>

          <XStack gap="$4">
            <Text size="medium" color="$textSoft">
              📊 {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""} •{" "}
              {setCount} set
              {setCount !== 1 ? "s" : ""}
            </Text>
          </XStack>

          <XStack
            alignItems="center"
            gap="$2"
            alignSelf="flex-end"
            marginTop="$2"
          >
            <Text size="medium" color="$primary" fontWeight="600">
              View Full Workout
            </Text>
            <AppIcon name="ChevronRight" size={16} color={theme.primary.val} />
          </XStack>
        </YStack>
      </Stack>
    );
  };

  // Render full workout details
  const renderFullWorkout = (workout: CompleteWorkout) => {
    const formatDuration = (duration: string) => {
      if (!duration) return null;
      const parts = duration.split(":");
      if (parts.length !== 3) return duration;
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      if (hours === 0 && minutes === 0) return `${seconds}s`;
      if (hours === 0) return `${minutes}:${parts[2]}`;
      return `${hours}:${parts[1]}:${parts[2]}`;
    };

    const renderExerciseSets = (exercise: WorkoutExercise) => {
      const sets = exercise.workout_exercise_sets || [];
      const weightUnit = exercise.weight_unit || "kg";
      const distanceUnit = exercise.distance_unit || "m";

      if (sets.length === 0) {
        return (
          <YStack gap="$3">
            <Text size="medium" fontWeight="600" color="$color">
              {exercise.name}
            </Text>
            <Text size="medium" color="$textSoft" fontStyle="italic">
              No sets recorded
            </Text>
          </YStack>
        );
      }

      const hasWeight = sets.some(
        (set) => set.weight !== null && set.weight !== undefined
      );
      const hasReps = sets.some(
        (set) => set.reps !== null && set.reps !== undefined
      );
      const hasDistance = sets.some(
        (set) => set.distance !== null && set.distance !== undefined
      );
      const hasDuration = sets.some(
        (set) => set.duration !== null && set.duration !== undefined
      );
      const hasRpe = sets.some(
        (set) => set.rpe !== null && set.rpe !== undefined
      );

      const columns: { key: string; label: string }[] = [];
      if (hasReps) columns.push({ key: "reps", label: "reps" });
      if (hasWeight)
        columns.push({ key: "weight", label: `weight (${weightUnit})` });
      if (hasDistance)
        columns.push({ key: "distance", label: `distance (${distanceUnit})` });
      if (hasDuration) columns.push({ key: "duration", label: "time" });
      if (hasRpe) columns.push({ key: "rpe", label: "rpe" });

      const renderCellValue = (set: any, columnKey: string) => {
        const value = set[columnKey];
        if (value === null || value === undefined || value === "") {
          return (
            <Text size="medium" color="$textMuted" fontStyle="italic">
              n/a
            </Text>
          );
        }
        if (columnKey === "duration") {
          return (
            <Text size="medium" color="$color">
              {formatDuration(value)}
            </Text>
          );
        }
        return (
          <Text size="medium" color="$color">
            {value}
          </Text>
        );
      };

      return (
        <YStack gap="$3">
          <Text size="medium" fontWeight="600" color="$color">
            {exercise.name}
          </Text>
          {exercise.notes && (
            <Text size="medium" color="$textSoft" fontStyle="italic">
              {exercise.notes}
            </Text>
          )}
          <YStack
            gap="$2"
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            padding="$3"
          >
            <XStack gap="$2" alignItems="center" paddingBottom="$2">
              <Stack width="$3" alignItems="center">
                <Text size="medium" fontWeight="600" color="$textSoft">
                  set #
                </Text>
              </Stack>
              {columns.map((column) => (
                <XStack key={column.key} flex={1} justifyContent="center">
                  <Text size="medium" fontWeight="600" color="$textSoft">
                    {column.label}
                  </Text>
                </XStack>
              ))}
            </XStack>
            <YStack height={1} backgroundColor="$borderSoft" />
            <YStack gap="$2">
              {sets
                .sort(
                  (a: any, b: any) => (a.set_number || 0) - (b.set_number || 0)
                )
                .map((set: any, index: number) => (
                  <XStack
                    key={set.id || index}
                    gap="$2"
                    alignItems="center"
                    minHeight={40}
                  >
                    <Stack
                      width="$2"
                      height="$2"
                      backgroundColor="$background"
                      borderRadius="$2"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text size="medium" fontWeight="600" color="$color">
                        {set.set_number || index + 1}
                      </Text>
                    </Stack>
                    {columns.map((column) => (
                      <XStack key={column.key} flex={1} justifyContent="center">
                        {renderCellValue(set, column.key)}
                      </XStack>
                    ))}
                  </XStack>
                ))}
            </YStack>
          </YStack>
        </YStack>
      );
    };

    return (
      <YStack flex={1}>
        <XStack
          padding="$4"
          paddingBottom="$2"
          alignItems="center"
          gap="$3"
          pressStyle={{ opacity: 0.7 }}
          onPress={handleBackToPreview}
          cursor="pointer"
        >
          <Text size="large" color="$primary" fontWeight="600">
            ← Back
          </Text>
        </XStack>

        <YStack padding="$4" paddingTop="$2" paddingBottom="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text size="medium" fontWeight="600" color="$color">
              {workout.name || "Unnamed Workout"}
            </Text>
            <Text size="medium" color="$textSoft">
              {formatDate(workout.created_at)}
            </Text>
          </XStack>
        </YStack>

        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {workout.image_id ? (
            <YStack marginBottom="$4" alignItems="center">
              <WorkoutImage size={300} imageId={workout.image_id} />
            </YStack>
          ) : (
            <Text
              paddingTop="$4"
              size="medium"
              color="$textSoft"
              fontStyle="italic"
              marginBottom="$4"
              textAlign="center"
            >
              No image
            </Text>
          )}

          <Text size="medium" color="$color" marginBottom="$4">
            {workout.notes || "no notes"}
          </Text>

          <YStack gap="$4">
            {workout.workout_exercises?.length > 0 ? (
              workout.workout_exercises.map((exercise, index) => (
                <YStack key={exercise.id || index}>
                  {renderExerciseSets(exercise)}
                  {index < workout.workout_exercises.length - 1 && (
                    <YStack
                      height={1}
                      backgroundColor="$borderSoft"
                      marginVertical="$2"
                    />
                  )}
                </YStack>
              ))
            ) : (
              <Text size="medium" color="$textSoft" fontStyle="italic">
                No exercises found
              </Text>
            )}
          </YStack>
        </BottomSheetScrollView>
      </YStack>
    );
  };

  const expandedWorkout = expandedWorkoutId
    ? selectedWorkouts.find((w) => w.id === expandedWorkoutId)
    : null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
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
      {expandedWorkout ? (
        renderFullWorkout(expandedWorkout)
      ) : selectedWorkouts.length > 0 ? (
        <YStack padding="$4" gap="$3">
          <Text size="large" fontWeight="600" color="$color">
            {selectedWorkouts.length === 1
              ? "Workout"
              : `${selectedWorkouts.length} Workouts`}
          </Text>

          <BottomSheetScrollView
            contentContainerStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {selectedWorkouts.map((workout) => renderWorkoutPreview(workout))}
          </BottomSheetScrollView>
        </YStack>
      ) : (
        <YStack padding="$4" alignItems="center" justifyContent="center">
          <Text size="medium" color="$textSoft">
            No workout data
          </Text>
        </YStack>
      )}
    </BottomSheet>
  );
}
