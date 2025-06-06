import React, { useState, useEffect } from "react";
import { Platform, Keyboard, KeyboardAvoidingView } from "react-native";
import { YStack, XStack, Text, Progress, Button, ScrollView } from "tamagui";
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
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const { currentWorkout } = useUserSessionStore();
  const workoutAnalysisStore = useWorkoutAnalysisStore();
  const analysisProgress = workoutAnalysisStore.getProgress();

  useEffect(() => {
    if (isVisible) {
      setCurrentSlide("summary");
      setRetryCount(0);
      setShowCloseConfirmation(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && currentWorkout) {
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
  }, [isVisible]);

  const handleCloseAttempt = () => {
    setShowCloseConfirmation(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    handleClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleChatError = (error: Error) => {
    console.error("[WorkoutCompletionModal] Chat error:", error);
    if (retryCount === 0) {
      setCurrentSlide("summary");
      setRetryCount(1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
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
      onClose={handleCloseAttempt}
      widthPercent={98}
      heightPercent={80}
    >
      <YStack flex={1}>
        {currentSlide === "summary" ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView flex={1} padding="$3">
              <WorkoutSummarySlide onContinue={handleContinueToChat} />
            </ScrollView>
          </KeyboardAvoidingView>
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

        {showCloseConfirmation && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.8)"
            justifyContent="center"
            alignItems="center"
            zIndex={1000}
          >
            <YStack
              backgroundColor="$background"
              padding="$4"
              borderRadius="$4"
              maxWidth={300}
              gap="$3"
            >
              <Text fontSize="$4" fontWeight="bold" textAlign="center">
                Exit Workout Summary?
              </Text>
              <XStack gap="$3" justifyContent="center">
                <Button onPress={handleCancelClose} variant="outlined" flex={1}>
                  Stay
                </Button>
                <Button
                  onPress={handleConfirmClose}
                  backgroundColor="$red9"
                  color="white"
                  flex={1}
                >
                  Exit
                </Button>
              </XStack>
            </YStack>
          </YStack>
        )}
      </YStack>
    </BaseModal>
  );
}
