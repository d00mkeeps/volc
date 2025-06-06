// components/WorkoutCompletionModal.tsx
import React, { useState, useEffect } from "react";
import { YStack, XStack, Text, Progress } from "tamagui";
import BaseModal from "../atoms/Modal";
import { WorkoutSummarySlide } from "./WorkoutSummarySlide";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { WorkoutAnalysisSlide } from "./WorkoutAnalysisSlide";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface WorkoutCompletionModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function WorkoutCompletionModal({
  isVisible,
  onClose,
}: WorkoutCompletionModalProps) {
  const [currentSlide, setCurrentSlide] = useState<"summary" | "chat">(
    "summary"
  );
  const [retryCount, setRetryCount] = useState(0);

  const { currentWorkout } = useUserSessionStore();
  const workoutAnalysisStore = useWorkoutAnalysisStore();
  const analysisProgress = workoutAnalysisStore.getProgress();

  useEffect(() => {
    if (isVisible) {
      setCurrentSlide("summary");
      setRetryCount(0);
    }
  }, [isVisible]);

  // Trigger workout analysis when modal opens
  // Trigger workout analysis when modal opens
  useEffect(() => {
    if (isVisible && currentWorkout) {
      console.log(
        "[WorkoutCompletionModal] Triggering workout analysis for:",
        currentWorkout.name
      );

      workoutAnalysisStore.submitAnalysis(currentWorkout, {
        onProgress: (progress) => {
          console.log("[WorkoutCompletionModal] Analysis progress:", progress);
        },
        onComplete: (result) => {
          console.log("[WorkoutCompletionModal] Analysis completed:", result);
        },
        onError: (error) => {
          console.error("[WorkoutCompletionModal] Analysis error:", error);
        },
      });
    }
  }, [isVisible]); // Only trigger when modal opens

  const handleChatError = (error: Error) => {
    console.error("[WorkoutCompletionModal] Chat error:", error);

    if (retryCount === 0) {
      console.log("Toast: Error connecting to workout analysis. Tap to retry.");
      setCurrentSlide("summary");
      setRetryCount(1);
    } else {
      console.log("Toast: Workout analysis chat unavailable");
      handleClose();
    }
  };

  const handleClose = () => {
    console.log(
      "[WorkoutCompletionModal] Closing modal and resetting analysis"
    );
    workoutAnalysisStore.resetAnalysis();
    setRetryCount(0);
    onClose();
  };

  const handleContinueToChat = () => {
    setCurrentSlide("chat");
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleClose}
      widthPercent={98}
      heightPercent={80}
    >
      <YStack flex={1} padding="$3">
        {currentSlide === "summary" ? (
          <WorkoutSummarySlide onContinue={handleContinueToChat} />
        ) : (
          <WorkoutAnalysisSlide onError={handleChatError} />
        )}

        {analysisProgress.status === "loading" && (
          <YStack
            position="absolute"
            bottom="$3"
            left="$3"
            right="$3"
            backgroundColor="$background"
            padding="$3"
            borderRadius="$3"
            borderTopWidth={1}
            borderTopColor="$borderSoft"
          >
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$textSoft">
                  Analyzing workout...
                </Text>
                <Text fontSize="$3" color="$textMuted">
                  {Math.round(analysisProgress.progress)}%
                </Text>
              </XStack>

              <Progress
                value={analysisProgress.progress}
                backgroundColor="$backgroundMuted"
              >
                <Progress.Indicator
                  animation="bouncy"
                  backgroundColor="$primary"
                />
              </Progress>

              {analysisProgress.progress >= 100 && (
                <Text fontSize="$3" color="$primary" textAlign="center">
                  Analysis ready!
                </Text>
              )}
            </YStack>
          </YStack>
        )}
      </YStack>
    </BaseModal>
  );
}
