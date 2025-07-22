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

  useEffect(() => {
    console.log("=== MODAL WORKOUT CHANGED ===");
    console.log("Modal sees workout ID:", currentWorkout?.id);
    console.log("Modal sees workout notes:", currentWorkout?.notes);
    console.log(
      "Modal sees workout notes length:",
      currentWorkout?.notes?.length
    );
    console.log(
      "Modal sees workout exercises count:",
      currentWorkout?.workout_exercises?.length
    );
  }, [currentWorkout]);

  const workoutAnalysisStore = useWorkoutAnalysisStore();

  useEffect(() => {
    if (isVisible) {
      setCurrentSlide("summary");
      setConversationId(null);
      setShowCloseConfirmation(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      const result = workoutAnalysisStore.getResult();
      if (result?.conversation_id) {
        setConversationId(result.conversation_id);
      }
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
    onClose();
  };

  const handleContinueToChat = async () => {
    // Get fresh data from store instead of using stale closure
    const freshWorkout = useUserSessionStore.getState().currentWorkout;

    console.log("=== JUST BEFORE UPDATE CALL ===");
    console.log("Fresh workout from store notes:", freshWorkout?.notes);
    console.log("Fresh workout notes length:", freshWorkout?.notes?.length);
    console.log("Stale currentWorkout notes:", currentWorkout?.notes);
    console.log(
      "Stale currentWorkout notes length:",
      currentWorkout?.notes?.length
    );

    if (freshWorkout) {
      console.log("Using fresh workout data for update");
      await workoutService.updateWorkout(freshWorkout.id, freshWorkout);
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
                showContinueButton={true}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          conversationId && (
            <WorkoutAnalysisSlide
              conversationId={conversationId}
              onError={handleChatError}
            />
          )
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
