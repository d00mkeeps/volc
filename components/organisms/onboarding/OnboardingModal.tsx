// /components/organisms/onboarding/OnboardingModal.tsx
import React, { useState } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { KeyboardAvoidingView, Platform } from "react-native";
import BaseModal from "../../atoms/core/BaseModal";
import { useUserStore } from "@/stores/userProfileStore";
import OnboardingStep1 from "./Slide1";
import OnboardingStep2 from "./Slide2";
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
  const [age, setAge] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("imperial");

  // Slide 2 - Personal Info
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");

  // Slide 3 - Instagram
  const [instagramUsername, setInstagramUsername] = useState("");

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
      lastName.trim().length <= 50
  );

  const canContinueSlide2 = Boolean(
    goals.trim() &&
      goals.trim().length >= 10 &&
      goals.trim().length <= 250 &&
      fitnessLevel.length > 0
  );

  const handleSlide1Continue = (data: {
    firstName: string;
    lastName: string;
    age: string;
    units: "metric" | "imperial";
  }) => {
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setAge(data.age);
    setUnits(data.units);
    setCurrentSlide(2);
  };

  const handleSlide2Continue = (data: {
    bio: string;
    goals: string;
    fitnessLevel: string;
  }) => {
    setBio(data.bio);
    setGoals(data.goals);
    setFitnessLevel(data.fitnessLevel);
    setCurrentSlide(3);
  };

  const handleComplete = async (data: { instagramUsername: string }) => {
    setInstagramUsername(data.instagramUsername);

    const cleanInstagramUsername = data.instagramUsername
      .replace(/^@/, "")
      .trim();

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        age: age ? parseInt(age) : null,
        is_imperial: units === "imperial",
        bio: bio || null,
        goals: { content: goals },
        current_stats: fitnessLevel,
        instagram_username: cleanInstagramUsername || null, // Store without @ symbol
      });

      onComplete();
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }
  };
  // Adjust height based on current slide
  const getModalHeight = () => {
    switch (currentSlide) {
      case 1:
        return 55; // Basic info form
      case 2:
        return 65; // Longer form with bio, goals, select
      case 3:
        return 25; // Instagram input screen
      default:
        return 60;
    }
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleClose}
      widthPercent={95}
      heightPercent={getModalHeight()}
      topOffset={-100}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1} padding="$4">
          {currentSlide === 1 && (
            <OnboardingStep1 onNext={handleSlide1Continue} />
          )}
          {currentSlide === 2 && (
            <OnboardingStep2 onNext={handleSlide2Continue} />
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
