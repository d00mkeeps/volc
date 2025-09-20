import React, { useState, useEffect } from "react";
import { YStack, ScrollView } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import {
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useUserStore } from "@/stores/userProfileStore";
import OnboardingStep1 from "./Slide1";
import OnboardingStep2 from "./Slide2";
import { OnboardingSlide3 } from "./Slide3";
import BaseModal from "@/components/atoms/core/BaseModal";

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

  // ... all your existing state variables
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("imperial");
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");

  const { updateProfile } = useUserStore();

  useEffect(() => {
    if (isVisible) {
      setCurrentSlide(1);
      setShowExitWarning(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setShowExitWarning(true);
  };

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    // Don't actually close - user must complete onboarding
  };

  // ... all your existing handler functions stay the same ...
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

    Keyboard.dismiss();

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        age: age ? parseInt(age) : null,
        is_imperial: units === "imperial",
        bio: bio || null,
        goals: { content: goals },
        current_stats: fitnessLevel,
        instagram_username: cleanInstagramUsername || null,
      });

      setTimeout(() => {
        onComplete();
      }, 100);
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }
  };

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={handleClose}
      widthPercent={98}
      heightPercent={85}
    >
      <YStack flex={1}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              <YStack gap="$4">
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
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>

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
