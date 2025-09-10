import React, { useState } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";
import { KeyboardAvoidingView, Platform } from "react-native";
import BaseModal from "../../atoms/BaseModal";
import { useUserStore } from "@/stores/userProfileStore";
import { OnboardingSlide1 } from "./Slide1";
import { OnboardingSlide2 } from "./Slide2";
import { OnboardingSlide3 } from "./Slide3";

interface OnboardingModalProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function OnboardingModal({
  isVisible,
  onComplete,
}: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState<1 | 2 | 3>(1);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Slide 1 - Basic Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [isImperial, setIsImperial] = useState(true);
  const [instagramUsername, setInstagramUsername] = useState("");

  // Slide 2 - Goals
  const [goals, setGoals] = useState("");
  const [currentStats, setCurrentStats] = useState("");

  const { updateProfile } = useUserStore();

  const handleClose = () => {
    setShowExitWarning(true);
  };

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    // Don't actually close - user must complete onboarding
  };

  const canContinueSlide1 = Boolean(
    firstName.trim() &&
      firstName.trim().length >= 2 &&
      firstName.trim().length <= 50 &&
      lastName.trim() &&
      lastName.trim().length >= 2 &&
      lastName.trim().length <= 50 &&
      ageGroup.trim() &&
      parseInt(ageGroup) >= 13 &&
      parseInt(ageGroup) <= 100
  );

  const canContinueSlide2 = Boolean(
    goals.trim() && goals.trim().length >= 10 && goals.trim().length <= 250
  );

  const handleSlide1Continue = () => {
    if (canContinueSlide1) {
      setCurrentSlide(2);
    }
  };

  const handleSlide2Continue = () => {
    if (canContinueSlide2) {
      setCurrentSlide(3);
    }
  };

  const handleComplete = async () => {
    try {
      // Save the profile data
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        age: parseInt(ageGroup), // Changed from age_group
        is_imperial: isImperial,
        instagram_username: instagramUsername.startsWith("@")
          ? instagramUsername.substring(1)
          : instagramUsername || null,
        goals: { primary: goals },
        current_stats: { notes: currentStats },
      });

      onComplete();
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }
  };

  // Adjust height based on current slide - refined heights
  const getModalHeight = () => {
    switch (currentSlide) {
      case 1:
        return 58; // Slide 1 has multiple fields but not too many
      case 2:
        return 55; // Slide 2 has text areas
      case 3:
        return 22; // Slide 3 is minimal
      default:
        return 68;
    }
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleClose}
      widthPercent={95}
      heightPercent={getModalHeight()}
      topOffset={-100} // Shift up by 80 points
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1} padding="$4">
          {currentSlide === 1 && (
            <OnboardingSlide1
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              ageGroup={ageGroup}
              setAgeGroup={setAgeGroup}
              isImperial={isImperial}
              setIsImperial={setIsImperial}
              instagramUsername={instagramUsername}
              setInstagramUsername={setInstagramUsername}
              onContinue={handleSlide1Continue}
              canContinue={canContinueSlide1}
            />
          )}
          {currentSlide === 2 && (
            <OnboardingSlide2
              goals={goals}
              setGoals={setGoals}
              currentStats={currentStats}
              setCurrentStats={setCurrentStats}
              onContinue={handleSlide2Continue}
              canContinue={canContinueSlide2}
            />
          )}
          {currentSlide === 3 && (
            <OnboardingSlide3
              firstName={firstName}
              onComplete={handleComplete}
            />
          )}

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
      </KeyboardAvoidingView>
    </BaseModal>
  );
}
