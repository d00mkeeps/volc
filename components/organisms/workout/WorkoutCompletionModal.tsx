import React, { useState, useEffect, useCallback } from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack, XStack, ScrollView } from "tamagui";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";
import BaseModal from "../../atoms/BaseModal";
import { WorkoutSummarySlide } from "./WorkoutSummarySlide";
import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
import { WorkoutAnalysisSlide } from "./WorkoutAnalysisSlide";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface WorkoutCompletionModalProps {
  isVisible: boolean;
  onClose: () => void;
}

let count = 0;

export function WorkoutCompletionModal({
  isVisible,
  onClose,
}: WorkoutCompletionModalProps) {
  console.log(`=== postworkout modal render count: ${count} ===`);
  count++;

  const [currentSlide, setCurrentSlide] = useState<"summary" | "chat">(
    "summary"
  );
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Use selective selector to avoid timer renders
  const currentWorkout = useUserSessionStore((state) => state.currentWorkout);
  const workoutAnalysisStore = useWorkoutAnalysisStore();

  useEffect(() => {
    if (isVisible) {
      setCurrentSlide("summary");
      setShowCloseConfirmation(false);
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
    handleClose();
  };

  const handleClose = () => {
    workoutAnalysisStore.resetAnalysis();
    // Clear active conversation when modal closes
    useUserSessionStore.getState().setActiveConversation(null);

    onClose();
  };

  const handleContinueToChat = useCallback(async () => {
    console.log("Continuing to chat slide");
    setCurrentSlide("chat");
  }, []);

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
                onSkip={handleClose}
                onContinue={handleContinueToChat}
                showContinueButton={true}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          // No more conversationId prop - gets it from session store
          <WorkoutAnalysisSlide onError={handleChatError} />
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
              <Text size="medium" fontWeight="bold" textAlign="center">
                Exit Workout Summary?
              </Text>
              <XStack gap="$3" justifyContent="center">
                <Button
                  onPress={handleCancelClose}
                  backgroundColor="$background" // Changed from variant="outlined" to grey
                  color="$text" // Add text color
                  borderColor="$primary"
                  borderWidth={1}
                  flex={1}
                >
                  Stay
                </Button>
                <Button
                  onPress={handleConfirmClose}
                  backgroundColor="$red9" // Keep red
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
