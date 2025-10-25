import React, { useState } from "react";
import { TextArea, XStack, YStack, Stack, ScrollView } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Input from "@/components/atoms/core/Input";
import Button from "@/components/atoms/core/Button";
import { useUserSessionStore } from "@/stores/userSessionStore";
import ImagePickerButton from "../../atoms/ImagePickerButton";
import WorkoutImage from "../../molecules/workout/WorkoutImage";
import { ChevronDown, ChevronRight } from "@/assets/icons/IconMap";

interface WorkoutSummarySlideProps {
  onContinue: () => void;
  onSkip: () => void;
  showContinueButton?: boolean;
}

export function WorkoutSummarySlide({
  onContinue,
  onSkip,
  showContinueButton = true,
}: WorkoutSummarySlideProps) {
  const {
    currentWorkout,
    pendingImageId,
    setPendingImage,
    selectedTemplate,
    saveCompletedWorkout,
    initializeAnalysisAndChat,
    updateExercise,
  } = useUserSessionStore();

  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [showNameError, setShowNameError] = useState(false);
  const [loadingState, setLoadingState] = useState<
    "none" | "skip" | "continue"
  >("none");

  // Track which exercises are expanded
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
    new Set()
  );

  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      currentWorkout?.workout_exercises.forEach((ex) => {
        initial[ex.id] = ex.notes || "";
      });
      return initial;
    }
  );

  const handleNameChange = (name: string) => {
    setWorkoutName(name);
    if (showNameError && name.trim().length > 0) {
      setShowNameError(false);
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const isNameValid = workoutName.trim().length > 0;

  const handleImageUploaded = (imageId: string) => {
    console.log(`[WorkoutSummary] Image uploaded with ID: ${imageId}`);
    setPendingImage(imageId);
  };

  const handleImageError = (error: string) => {
    console.error(`[WorkoutSummary] Image upload error: ${error}`);
  };

  const handleContinue = async () => {
    if (!workoutName.trim()) {
      setShowNameError(true);
      return;
    }
    setShowNameError(false);

    console.log("=== SUMMARY SLIDE CONTINUE ===");
    setLoadingState("continue");

    try {
      await saveCompletedWorkout({
        name: workoutName.trim(),
        notes: workoutNotes.trim(),
        imageId: pendingImageId || undefined,
      });
      await initializeAnalysisAndChat();
      onContinue();
    } catch (error) {
      console.error("Failed to continue to chat:", error);
      setLoadingState("none");
    }
  };

  const handleSkipChat = async () => {
    if (!workoutName.trim()) {
      setShowNameError(true);
      return;
    }
    setShowNameError(false);

    console.log("=== SUMMARY SLIDE SKIP ===");
    setLoadingState("skip");

    // Sync exercise notes to store
    console.log("📝 Exercise notes before sync:", exerciseNotes);
    Object.entries(exerciseNotes).forEach(([exerciseId, notes]) => {
      updateExercise(exerciseId, { notes });
    });

    // Get fresh state from store after updates
    const freshWorkout = useUserSessionStore.getState().currentWorkout;
    console.log(
      "📝 Fresh store exercises after sync:",
      freshWorkout?.workout_exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        notes: ex.notes,
      }))
    );

    try {
      await saveCompletedWorkout({
        name: workoutName.trim(),
        notes: workoutNotes.trim(),
        imageId: pendingImageId || undefined,
      });
      onSkip();
    } catch (error) {
      console.error("Failed to save workout:", error);
      setLoadingState("none");
    }
  };

  return (
    <YStack flex={1} justifyContent="space-between">
      {/* Scrollable Content */}
      <ScrollView
        flex={1}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4">
          <Text size="large" fontWeight="bold">
            Workout Complete!
          </Text>

          {/* Name */}
          <YStack gap="$2">
            <Text size="medium" fontWeight="600">
              Name
            </Text>
            <Input
              value={workoutName}
              onChangeText={handleNameChange}
              placeholder={selectedTemplate?.name || "Name your workout..."}
              placeholderTextColor="$textMuted"
              size="$4"
              width="100%"
              borderColor={showNameError ? "$red9" : "$borderColor"}
              backgroundColor="$backgroundMuted"
            />
            {showNameError && (
              <Text color="$red9" size="small">
                please add name
              </Text>
            )}
          </YStack>

          {/* Photo */}
          <YStack gap="$2">
            <Text size="medium" fontWeight="600">
              Photo
            </Text>
            {pendingImageId || currentWorkout?.image_id ? (
              <YStack alignItems="center" gap="$2">
                <WorkoutImage size={300} />
                <ImagePickerButton
                  label="Change Photo"
                  icon="camera"
                  onImageUploaded={handleImageUploaded}
                  onError={handleImageError}
                />
              </YStack>
            ) : (
              <XStack justifyContent="center">
                <ImagePickerButton
                  label="Add Photo"
                  icon="camera"
                  size="medium"
                  onImageUploaded={handleImageUploaded}
                  onError={handleImageError}
                />
              </XStack>
            )}
          </YStack>

          {/* Exercise Notes - Expandable */}
          <YStack gap="$2">
            <Text size="medium" fontWeight="600">
              Notes
            </Text>
            <YStack gap="$2">
              {currentWorkout?.workout_exercises.map((exercise) => {
                const isExpanded = expandedExercises.has(exercise.id);
                return (
                  <YStack
                    key={exercise.id}
                    backgroundColor="$backgroundSoft"
                    borderRadius="$3"
                    overflow="hidden"
                  >
                    {/* Header - always visible */}
                    <Stack
                      paddingHorizontal="$3"
                      paddingVertical="$3"
                      pressStyle={{ backgroundColor: "$backgroundPress" }}
                      onPress={() => toggleExercise(exercise.id)}
                      cursor="pointer"
                    >
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text size="medium" fontWeight="600" color="$color">
                          {exercise.name}
                        </Text>
                        {isExpanded ? (
                          <ChevronDown size={20} color="$text" />
                        ) : (
                          <ChevronRight size={20} color="$text" />
                        )}
                      </XStack>
                    </Stack>

                    {/* Expandable notes area */}
                    {isExpanded && (
                      <YStack padding="$3" paddingTop="$0" gap="$2">
                        <TextArea
                          value={
                            exerciseNotes[exercise.id] ?? exercise.notes ?? ""
                          }
                          onChangeText={(notes) =>
                            setExerciseNotes((prev) => ({
                              ...prev,
                              [exercise.id]: notes,
                            }))
                          }
                          placeholder="add notes.."
                          minHeight={100}
                          backgroundColor="$background"
                          borderColor="$borderSoft"
                        />
                      </YStack>
                    )}
                  </YStack>
                );
              })}
            </YStack>
          </YStack>

          <YStack gap="$2">
            <TextArea
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              placeholder="How did the workout feel overall? (optional)"
              minHeight={100}
              backgroundColor="$backgroundMuted"
            />
          </YStack>
        </YStack>
      </ScrollView>

      <XStack
        gap="$3"
        padding="$4"
        paddingBottom="$6"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderSoft"
      >
        {loadingState !== "continue" && (
          <Button
            size="$4"
            backgroundColor={isNameValid ? "$primary" : "$background"}
            color="$text"
            onPress={handleSkipChat}
            disabled={loadingState === "skip"}
            opacity={loadingState !== "skip" ? 1 : 0.6}
            borderColor="$primary"
            borderWidth={1}
            flex={1}
          >
            {loadingState === "skip" ? "saving.." : "Save & Exit"}
          </Button>
        )}
        {/* 
        {loadingState !== "skip" && (
          <Button
            size="$4"
            backgroundColor="$primary"
            onPress={handleContinue}
            disabled={!isNameValid || loadingState === "continue"}
            opacity={isNameValid && loadingState !== "continue" ? 1 : 0.6}
            flex={0.6}
          >
            {loadingState === "continue" ? "Loading..." : "Chat to Coach"}
          </Button>
        )} */}
      </XStack>
    </YStack>
  );
}
