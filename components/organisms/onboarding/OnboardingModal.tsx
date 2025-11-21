// /components/organisms/onboarding/OnboardingModal.tsx
import React, { useState, useEffect } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import BaseModal from "@/components/atoms/core/BaseModal";
import { ChatInterface } from "@/components/organisms/chat/ChatInterface";
import { useOnboarding } from "@/hooks/chat/useOnboarding";

interface OnboardingModalProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function OnboardingModal({
  isVisible,
  onComplete,
}: OnboardingModalProps) {
  const onboarding = useOnboarding();
  const { updateProfile } = useUserStore();
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Connect when modal opens, disconnect when it closes
  useEffect(() => {
    if (isVisible) {
      console.log("[OnboardingModal] Modal opened - connecting to websocket");
      onboarding.connect();
      setShowExitWarning(false);
    } else {
      console.log(
        "[OnboardingModal] Modal closed - disconnecting from websocket"
      );
      onboarding.disconnect();
    }
  }, [isVisible]);

  // /components/organisms/onboarding/OnboardingModal.handleClose
  const handleClose = () => {
    setShowExitWarning(true);
  };

  // /components/organisms/onboarding/OnboardingModal.handleConfirmExit
  const handleConfirmExit = () => {
    setShowExitWarning(false);
  };

  // /components/organisms/onboarding/OnboardingModal.handleSend
  const handleSend = async (content: string) => {
    try {
      await onboarding.sendMessage(content);
    } catch (error) {
      console.error("[OnboardingModal] Failed to send message:", error);
    }
  };

  // /components/organisms/onboarding/OnboardingModal.handleProfileConfirm
  const handleProfileConfirm = () => {
    console.log("[OnboardingModal] Profile confirmed - completing onboarding");
    // ProfileConfirmationView handles the actual save, so we just close the modal
    onComplete();
  };

  // /components/organisms/onboarding/OnboardingModal.getConnectionState
  const getConnectionState = ():
    | "ready"
    | "expecting_ai_message"
    | "disconnected" => {
    if (onboarding.connectionState === "disconnected") {
      return "disconnected";
    }
    if (onboarding.messages.length === 0 && !onboarding.streamingMessage) {
      return "expecting_ai_message";
    }
    return "ready";
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleClose}
      widthPercent={98}
      heightPercent={85}
    >
      <YStack flex={1}>
        {/* Header */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$5"
          paddingTop="$3"
        >
          <Text size="large" fontWeight="600" color="$primary">
            Welcome to Volc!
          </Text>
        </XStack>

        {/* Chat Interface */}
        <YStack flex={1}>
          <ChatInterface
            messages={onboarding.messages}
            streamingMessage={onboarding.streamingMessage}
            onSend={handleSend}
            placeholder="Type your response..."
            connectionState={getConnectionState()}
            onProfileConfirm={handleProfileConfirm}
            keyboardVerticalOffset={120}
          />
        </YStack>

        {/* Exit warning overlay */}
        {showExitWarning && (
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
                Complete Your Profile
              </Text>
              <Text textAlign="center" color="$textMuted">
                Please finish setting up your profile to continue using Volc.
              </Text>
              <Button onPress={handleConfirmExit} backgroundColor="$primary">
                Continue Setup
              </Button>
            </YStack>
          </YStack>
        )}
      </YStack>
    </BaseModal>
  );
}
