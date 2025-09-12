import React, { useState } from "react";
import { TextArea, XStack, YStack } from "tamagui";
import Text from "@/components/atoms/Text";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import { useUserSessionStore } from "@/stores/userSessionStore";
import ImagePickerButton from "../../atoms/buttons/ImagePickerButton";
import WorkoutImage from "../../molecules/workout/WorkoutImage";

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
      <Text size="medium" fontWeight="bold">
        Workout Complete!
      </Text>

      <YStack gap="$2">
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
          <Text color="$red9" size="medium">
            Please enter a workout name to continue
          </Text>
        )}
      </YStack>

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

      <YStack gap="$2">
        <Text size="medium" fontWeight="600">
          Notes
        </Text>
        <TextArea
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
          placeholder="Add notes for your workout..."
          minHeight={300}
          backgroundColor="$backgroundMuted"
        />
      </YStack>

      <XStack gap="$3" paddingTop="$2">
        {loadingState !== "continue" && (
          <Button
            size="$4"
            backgroundColor="$background" // Changed from variant="outlined" to grey background
            color="$text" // Add text color for grey button
            onPress={handleSkipChat}
            disabled={!isNameValid || loadingState === "skip"}
            opacity={isNameValid && loadingState !== "skip" ? 1 : 0.6}
            borderColor="$primary"
            borderWidth={1}
            flex={0.4} // Reduced from flex={1} to take less space
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
            flex={0.6} // Increased to take more space
          >
            {loadingState === "continue" ? "Loading..." : "Chat to Coach"}
          </Button>
        )}
      </XStack>
    </YStack>
  );
}
