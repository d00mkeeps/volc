import React, { useState, useEffect } from "react";
import { Platform, Keyboard, KeyboardAvoidingView } from "react-native";
import { YStack, XStack, Text, Button, ScrollView } from "tamagui";
import BaseModal from "../atoms/Modal";
import { WorkoutSummarySlide } from "./WorkoutSummarySlide";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { WorkoutAnalysisSlide } from "./WorkoutAnalysisSlide";
import { workoutService } from "@/services/db/workout";
import { useUserStore } from "@/stores/userProfileStore";
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const { currentWorkout } = useUserSessionStore();
  const workoutAnalysisStore = useWorkoutAnalysisStore();
  const analysisProgress = workoutAnalysisStore.getProgress();

  // Determine if analysis is ready
  const isAnalysisReady = analysisProgress.status === "success";

  useEffect(() => {
    if (isVisible) {
      setCurrentSlide("summary");
      setConversationId(null);
      setShowCloseConfirmation(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const initiateAnalysis = async () => {
      if (isVisible && currentWorkout) {
        try {
          const result = await workoutAnalysisStore.submitAnalysis({
            ...currentWorkout,
            exercises: currentWorkout.workout_exercises || [],
          });
          setConversationId(result.conversation_id);
        } catch (error) {
          console.error("[WorkoutCompletionModal] Analysis submission failed:", error);
        }
      }
    };
    initiateAnalysis();
  }, [isVisible, currentWorkout]);

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
    handleClose();
  };

  const handleClose = () => {
    workoutAnalysisStore.resetAnalysis();
    onClose();
  };

  const handleContinueToChat = async () => {
    if (currentWorkout) {
      await workoutService.updateWorkout(currentWorkout.id, currentWorkout);
    }
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
              <WorkoutSummarySlide
                onContinue={handleContinueToChat}
                showContinueButton={isAnalysisReady}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          conversationId && <WorkoutAnalysisSlide conversationId={conversationId} onError={handleChatError} />
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