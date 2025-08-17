import React, { useState } from "react";
import { YStack, Text, Input, Button, TextArea, XStack } from "tamagui";
import { useUserSessionStore } from "@/stores/userSessionStore";
import ImagePickerButton from "../atoms/buttons/ImagePickerButton";
import WorkoutImage from "../molecules/WorkoutImage";

interface WorkoutSummarySlideProps {
  onContinue: () => void;
  onSkip: () => void; // ← New prop
  showContinueButton?: boolean;
}

export function WorkoutSummarySlide({
  onContinue,
  onSkip, // ← New prop
  showContinueButton = true,
}: WorkoutSummarySlideProps) {
  const {
    currentWorkout,
    pendingImageId,
    setPendingImage,
    selectedTemplate,
    saveCompletedWorkout, // ← New method
    initializeAnalysisAndChat, // ← New method
  } = useUserSessionStore();

  const [workoutName, setWorkoutName] = useState("");
  const [showNameError, setShowNameError] = useState(false);
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
    // Validate workout name first
    if (!workoutName.trim()) {
      setShowNameError(true);
      return;
    }
    setShowNameError(false);

    console.log("=== SUMMARY SLIDE CONTINUE ===");
    console.log("Workout name:", workoutName);
    console.log("Workout notes:", workoutNotes);
    console.log("Pending image ID:", pendingImageId);

    try {
      // Step 1: Save workout with metadata
      await saveCompletedWorkout({
        name: workoutName,
        notes: workoutNotes,
        imageId: pendingImageId || undefined,
      });

      // Step 2: Initialize analysis and chat
      await initializeAnalysisAndChat();

      // Step 3: Navigate to chat
      onContinue();
    } catch (error) {
      console.error("Failed to continue to chat:", error);
      // Could add error toast here
    }
  };

  const handleSkipChat = async () => {
    // Validate workout name first
    if (!workoutName.trim()) {
      setShowNameError(true);
      return;
    }
    setShowNameError(false);

    console.log("=== SUMMARY SLIDE SKIP ===");
    console.log("Saving workout and exiting");

    try {
      // Just save workout with metadata and close
      await saveCompletedWorkout({
        name: workoutName,
        notes: workoutNotes,
        imageId: pendingImageId || undefined,
      });

      // Close modal
      onSkip();
    } catch (error) {
      console.error("Failed to save workout:", error);
      // Could add error toast here
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

      {/* ← Updated button section */}
      <XStack gap="$3" paddingTop="$2">
        <Button
          size="$4"
          variant="outlined"
          onPress={handleSkipChat}
          disabled={!isNameValid}
          opacity={isNameValid ? 1 : 0.6}
          flex={1}
        >
          Save & Exit
        </Button>
        <Button
          size="$4"
          backgroundColor={isNameValid ? "$primary" : "$gray6"}
          onPress={handleContinue}
          disabled={!isNameValid}
          opacity={isNameValid ? 1 : 0.6}
          flex={1}
        >
          Continue to Coach
        </Button>
      </XStack>
    </YStack>
  );
}
