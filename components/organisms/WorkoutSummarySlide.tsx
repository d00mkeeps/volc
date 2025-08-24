import React, { useState } from "react";
import { YStack, Text, Input, Button, TextArea, XStack } from "tamagui";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import ImagePickerButton from "../atoms/buttons/ImagePickerButton";
import WorkoutImage from "../molecules/WorkoutImage";
import { imageService } from "@/services/api/imageService";
import { useDashboardStore } from "@/stores/dashboardStore";

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
  } = useUserSessionStore();

  const [workoutName, setWorkoutName] = useState("");
  const [showNameError, setShowNameError] = useState(false);
  const [loadingState, setLoadingState] = useState<
    "none" | "skip" | "continue"
  >("none"); // ← New loading state
  const [workoutNotes, setWorkoutNotes] = useState(() => {
    console.log("=== WORKOUT SUMMARY DEBUG ===");
    console.log("currentWorkout:", currentWorkout);
    console.log("workout_exercises:", currentWorkout?.workout_exercises);

    if (currentWorkout?.notes) {
      return currentWorkout.notes;
    }

    const exercises = currentWorkout?.workout_exercises || [];
    console.log("Using exercises fallback:", exercises);

    return (
      exercises.map((exercise) => `${exercise.name}:\n\n`).join("\n") || ""
    );
  });

  const handleNameChange = (name: string) => {
    setWorkoutName(name);
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
    setLoadingState("continue"); // ← Start loading

    try {
      await saveCompletedWorkout({
        name: workoutName,
        notes: workoutNotes,
        imageId: pendingImageId || undefined,
      });
      await initializeAnalysisAndChat();
      onContinue();
    } catch (error) {
      console.error("Failed to continue to chat:", error);
      setLoadingState("none"); // ← Reset on error
    }
  };

  const handleSkipChat = async () => {
    if (!workoutName.trim()) {
      setShowNameError(true);
      return;
    }
    setShowNameError(false);

    console.log("=== SUMMARY SLIDE SKIP ===");
    setLoadingState("skip"); // ← Start loading

    try {
      await saveCompletedWorkout({
        name: workoutName,
        notes: workoutNotes,
        imageId: pendingImageId || undefined,
      });
      onSkip();
    } catch (error) {
      console.error("Failed to save workout:", error);
      setLoadingState("none"); // ← Reset on error
    }
  };

  return (
    <YStack gap="$4" paddingBottom="$4">
      <Text fontSize="$4" fontWeight="bold">
        Workout Complete!
      </Text>

      <YStack gap="$2">
        <Input
          value={workoutName}
          onChangeText={handleNameChange}
          placeholder={selectedTemplate?.name || "Name your workout..."}
          placeholderTextColor="$textMuted"
          size="$4"
          borderColor={showNameError ? "$red9" : "$borderColor"}
        />
        {showNameError && (
          <Text color="$red9" fontSize="$2">
            Please enter a workout name to continue
          </Text>
        )}
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600">
          Add a Photo
        </Text>

        {pendingImageId || currentWorkout?.image_id ? (
          <YStack alignItems="center" gap="$2">
            <WorkoutImage width={300} height={240} />
            <ImagePickerButton
              label="Change Photo"
              icon="camera"
              size="lg"
              onImageUploaded={handleImageUploaded}
              onError={handleImageError}
            />
          </YStack>
        ) : (
          <XStack justifyContent="center">
            <ImagePickerButton
              label="Add Photo"
              icon="camera"
              size="md"
              onImageUploaded={handleImageUploaded}
              onError={handleImageError}
            />
          </XStack>
        )}
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600">
          Notes
        </Text>
        <TextArea
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
          placeholder="Add notes for your workout..."
          minHeight={300}
          backgroundColor="$background"
        />
      </YStack>

      {/* ← Updated loading-aware button section */}
      <XStack gap="$3" paddingTop="$2">
        {loadingState !== "continue" && (
          <Button
            size="$4"
            variant="outlined"
            onPress={handleSkipChat}
            disabled={!isNameValid || loadingState === "skip"}
            opacity={isNameValid && loadingState !== "skip" ? 1 : 0.6}
            flex={1}
          >
            {loadingState === "skip" ? "Loading..." : "Save & Exit"}
          </Button>
        )}

        {loadingState !== "skip" && (
          <Button
            size="$4"
            backgroundColor={
              isNameValid && loadingState !== "continue" ? "$primary" : "$gray6"
            }
            onPress={handleContinue}
            disabled={!isNameValid || loadingState === "continue"}
            opacity={isNameValid && loadingState !== "continue" ? 1 : 0.6}
            flex={1}
          >
            {loadingState === "continue" ? "Loading..." : "Continue to Coach"}
          </Button>
        )}
      </XStack>
    </YStack>
  );
}
