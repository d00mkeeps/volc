import React, { useState } from "react";
import { YStack, XStack, Stack } from "tamagui";
import { TouchableOpacity } from "react-native";
import Text from "@/components/atoms/core/Text";
import ExerciseDefinitionView from "@/components/molecules/workout/ExerciseDefinitionView";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";

interface WorkoutTemplateViewProps {
  data: {
    name: string;
    notes?: string;
    workout_exercises: WorkoutExercise[];
  };
}

export default function WorkoutTemplateView({
  data,
}: WorkoutTemplateViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );

  const renderExercisePreview = (exercise: WorkoutExercise) => {
    const sets = exercise.workout_exercise_sets || [];
    const setCount = sets.length;

    // Get rep ranges for preview - filter out undefined values properly
    const reps = sets
      .map((set: WorkoutExerciseSet) => set.reps)
      .filter((rep): rep is number => rep !== undefined && rep !== null);

    const repRange =
      reps.length > 0
        ? reps.length === 1
          ? `${reps[0]} reps`
          : Math.min(...reps) === Math.max(...reps)
          ? `${Math.min(...reps)} reps` // Same min/max, show single number
          : `${Math.min(...reps)}-${Math.max(...reps)} reps`
        : "No reps";

    return (
      <XStack
        key={exercise.definition_id}
        justifyContent="space-between"
        alignItems="center"
      >
        <TouchableOpacity
          onPress={() => setSelectedExerciseId(exercise.definition_id || null)}
          style={{ flex: 1 }}
        >
          <Text
            size="medium"
            color="$color"
            textDecorationLine="underline"
            textDecorationColor="$color"
          >
            {exercise.name}
          </Text>
        </TouchableOpacity>
        <Text size="small" color="$textSoft">
          {setCount} {setCount === 1 ? "set" : "sets"} • {repRange}
        </Text>
      </XStack>
    );
  };

  const renderExerciseDetailed = (exercise: WorkoutExercise) => {
    const sets = exercise.workout_exercise_sets || [];

    if (sets.length === 0) {
      return (
        <YStack key={exercise.definition_id} gap="$2">
          <TouchableOpacity
            onPress={() =>
              setSelectedExerciseId(exercise.definition_id || null)
            }
          >
            <Text
              size="medium"
              fontWeight="600"
              color="$color"
              textDecorationLine="underline"
              textDecorationColor="$color"
            >
              {exercise.name}
            </Text>
          </TouchableOpacity>
          {exercise.notes && ( // ADD THIS BLOCK
            <Text size="medium" color="$textSoft" fontStyle="italic">
              {exercise.notes}
            </Text>
          )}
          <Text size="small" color="$textSoft" fontStyle="italic">
            No sets planned
          </Text>
        </YStack>
      );
    }

    return (
      <YStack key={exercise.definition_id} gap="$2">
        <TouchableOpacity
          onPress={() => setSelectedExerciseId(exercise.definition_id || null)}
        >
          <Text
            size="medium"
            fontWeight="600"
            color="$color"
            textDecorationLine="underline"
            textDecorationColor="$color"
          >
            {exercise.name}
          </Text>
        </TouchableOpacity>
        {exercise.notes && ( // ADD THIS BLOCK
          <Text size="small" color="$textSoft">
            {exercise.notes}
          </Text>
        )}
        {/* KEEP ALL THE EXISTING SETS DISPLAY: */}
        <YStack
          gap="$1"
          backgroundColor="$backgroundSoft"
          borderRadius="$2"
          padding="$2"
        >
          {sets
            .sort(
              (a: WorkoutExerciseSet, b: WorkoutExerciseSet) =>
                (a.set_number || 0) - (b.set_number || 0)
            )
            .map((set: WorkoutExerciseSet, index: number) => (
              <XStack
                key={index}
                justifyContent="space-between"
                alignItems="center"
              >
                <Text size="small" color="$textSoft">
                  Set {set.set_number || index + 1}
                </Text>
                <XStack gap="$2">
                  {set.reps && (
                    <Text size="small" color="$color">
                      {set.reps} reps
                    </Text>
                  )}
                  {set.weight && (
                    <Text size="small" color="$color">
                      {set.weight}kg
                    </Text>
                  )}
                </XStack>
              </XStack>
            ))}
        </YStack>
      </YStack>
    );
  };

  return (
    <>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <YStack
          backgroundColor="$backgroundSoft"
          borderRadius="$3"
          padding="$3"
          gap="$3"
          marginVertical="$2"
          borderWidth={1}
          borderColor="$borderSoft"
        >
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1}>
              <Text size="medium" fontWeight="600" color="$color">
                {data.name}
              </Text>
              <Text size="small" color="$textSoft">
                {data.workout_exercises.length} exercises
              </Text>
            </YStack>
            <Text size="small" color="$primary">
              {expanded ? "Collapse" : "Expand"}
            </Text>
          </XStack>

          {/* Notes */}
          {data.notes && (
            <Text size="small" color="$textSoft" fontStyle="italic">
              {expanded
                ? data.notes
                : data.notes.length > 50
                ? `${data.notes.substring(0, 50)}...`
                : data.notes}
            </Text>
          )}

          {/* Exercises */}
          <YStack gap="$2">
            {expanded
              ? data.workout_exercises
                  .sort(
                    (a: WorkoutExercise, b: WorkoutExercise) =>
                      a.order_index - b.order_index
                  )
                  .map(renderExerciseDetailed)
              : data.workout_exercises
                  .sort(
                    (a: WorkoutExercise, b: WorkoutExercise) =>
                      a.order_index - b.order_index
                  )
                  .slice(0, 3) // Show first 3 in collapsed view
                  .map(renderExercisePreview)}

            {!expanded && data.workout_exercises.length > 3 && (
              <Text size="small" color="$textSoft" textAlign="center">
                +{data.workout_exercises.length - 3} more exercises
              </Text>
            )}
          </YStack>
        </YStack>
      </TouchableOpacity>

      {/* Exercise Definition Modal */}
      {selectedExerciseId && (
        <ExerciseDefinitionView
          definitionId={selectedExerciseId}
          isVisible={!!selectedExerciseId}
          onClose={() => setSelectedExerciseId(null)}
        />
      )}
    </>
  );
}
