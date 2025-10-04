import React, { useState } from "react";
import { YStack, XStack, Stack } from "tamagui";
import { TouchableOpacity } from "react-native";
import Text from "@/components/atoms/core/Text";
import ExerciseDefinitionView from "@/components/molecules/workout/ExerciseDefinitionView";
import { WorkoutExercise, WorkoutExerciseSet } from "@/types/workout";
import { ArrowLeft, Check, Info, X } from "@/assets/icons/IconMap";

interface WorkoutTemplateViewProps {
  data: {
    name: string;
    notes?: string;
    workout_exercises: WorkoutExercise[];
  };
  onApprove?: (templateData: any) => void; // Add this
}

export default function WorkoutTemplateView({
  data,
  onApprove,
}: WorkoutTemplateViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );

  const renderExercisePreview = (exercise: WorkoutExercise) => {
    const sets = exercise.workout_exercise_sets || [];
    const setCount = sets.length;

    const reps = sets
      .map((set: WorkoutExerciseSet) => set.reps)
      .filter((rep): rep is number => rep !== undefined && rep !== null);

    const repRange =
      reps.length > 0
        ? reps.length === 1
          ? `${reps[0]} reps`
          : Math.min(...reps) === Math.max(...reps)
          ? `${Math.min(...reps)} reps`
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
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Text
            size="medium"
            color="$color"
            textDecorationLine="underline"
            textDecorationColor="$color"
          >
            {exercise.name}
          </Text>
          <Info size={16} color="$textSoft" />
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
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
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
            <Info size={16} color="$textSoft" />
          </TouchableOpacity>
          {exercise.notes && (
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
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
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
          <Info size={16} color="$textSoft" />
        </TouchableOpacity>
        {exercise.notes && (
          <Text size="small" color="$textSoft">
            {exercise.notes}
          </Text>
        )}
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
      {rejected ? (
        // Rejected state - simple display with undo
        <YStack gap="$2">
          <YStack
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            padding="$3"
            marginVertical="$2"
            borderWidth={1}
            borderColor="$borderSoft"
            gap="$2"
          >
            <Text size="medium" fontWeight="600" color="$color">
              {data.name} (Rejected)
            </Text>
          </YStack>

          {/* Undo Button */}
          <XStack justifyContent="center" paddingBottom="$2">
            <Stack
              paddingHorizontal="$4"
              paddingVertical="$2.5"
              borderRadius="$3"
              backgroundColor="$backgroundStrong"
              borderWidth={1}
              borderColor="$borderColor"
              pressStyle={{
                backgroundColor: "$backgroundPress",
                scale: 0.95,
              }}
              onPress={() => {
                console.log("Template rejection undone!");
                setRejected(false);
              }}
              cursor="pointer"
            >
              <XStack gap="$2" alignItems="center">
                <ArrowLeft size={18} color="$textSoft" />
                <Text size="medium" color="$color" fontWeight="500">
                  Undo
                </Text>
              </XStack>
            </Stack>
          </XStack>
        </YStack>
      ) : (
        <YStack gap="$2">
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
                      .slice(0, 3)
                      .map(renderExercisePreview)}

                {!expanded && data.workout_exercises.length > 3 && (
                  <Text size="small" color="$textSoft" textAlign="center">
                    +{data.workout_exercises.length - 3} more exercises
                  </Text>
                )}
              </YStack>
            </YStack>
          </TouchableOpacity>

          {/* Action Buttons */}
          <XStack gap="$3" justifyContent="center" paddingBottom="$2">
            <Stack
              width={48}
              height={48}
              borderRadius="$3"
              backgroundColor="$red9"
              borderWidth={1}
              borderColor="$borderColor"
              justifyContent="center"
              alignItems="center"
              pressStyle={{
                backgroundColor: "$backgroundPress",
                scale: 0.95,
              }}
              onPress={() => {
                console.log("Template rejected!");
                setRejected(true);
              }}
              cursor="pointer"
            >
              <X size={24} />
            </Stack>

            <Stack
              width={48}
              height={48}
              borderRadius="$3"
              backgroundColor="$green8"
              borderWidth={1}
              borderColor="$borderColor"
              justifyContent="center"
              alignItems="center"
              pressStyle={{
                backgroundColor: "$backgroundPress",
                scale: 0.95,
              }}
              onPress={() => {
                console.log("Template approved!");
                onApprove?.(data); // Call the callback with the template data
              }}
              cursor="pointer"
            >
              <Check size={24} color="$green8" />
            </Stack>
          </XStack>
        </YStack>
      )}
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
