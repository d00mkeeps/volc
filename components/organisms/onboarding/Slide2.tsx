import React, { useState, useEffect } from "react";
import { YStack, TextArea, XStack, Stack } from "tamagui";
import { KeyboardAvoidingView, Platform } from "react-native";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import Select from "@/components/atoms/core/Select";
import SystemMessage from "@/components/atoms/core/SystemMessage";

const fitnessLevelOptions = [
  { value: "beginner", label: "Beginner: under 1 year" },
  { value: "intermediate", label: "Intermediate: 1-5 years" },
  { value: "advanced", label: "Advanced: 5-10 years" },
  { value: "elite", label: "Elite: 10+ years" },
];

interface Step2Props {
  onNext: (data: { goals: string; fitnessLevel: string }) => void; // ✅ Removed bio
}

interface ValidationState {
  goals: { isValid: boolean; message: string };
  fitnessLevel: { isValid: boolean; message: string };
}

export default function OnboardingStep2({ onNext }: Step2Props) {
  // ✅ Removed bio state
  const [goals, setGoals] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [showSystemMessage, setShowSystemMessage] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");

  const [validation, setValidation] = useState<ValidationState>({
    goals: { isValid: true, message: "" },
    fitnessLevel: { isValid: true, message: "" },
  });

  // Auto-hide system message after 3 seconds
  useEffect(() => {
    if (showSystemMessage) {
      const timer = setTimeout(() => {
        setShowSystemMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSystemMessage]);

  // /components/onboarding/OnboardingStep2.validateField
  const validateField = (
    field: keyof ValidationState,
    value: string
  ): { isValid: boolean; message: string } => {
    switch (field) {
      case "fitnessLevel":
        if (!value.trim()) {
          return {
            isValid: false,
            message: "Please select your experience level",
          };
        }
        return { isValid: true, message: "" };
      case "goals":
        if (!value.trim()) {
          return { isValid: false, message: "Fitness goals are required" };
        }
        if (value.trim().length < 10) {
          return {
            isValid: false,
            message: "Please provide more detail (at least 10 characters)",
          };
        }
        return { isValid: true, message: "" };
      default:
        return { isValid: true, message: "" };
    }
  };

  // /components/onboarding/OnboardingStep2.handleBlur
  const handleBlur = (field: keyof ValidationState, value: string) => {
    const fieldValidation = validateField(field, value);
    setValidation((prev) => ({
      ...prev,
      [field]: fieldValidation,
    }));
  };

  // /components/onboarding/OnboardingStep2.handleContinue
  const handleContinue = () => {
    // Validate goals and fitness level
    const goalsValidation = validateField("goals", goals);
    const fitnessLevelValid = fitnessLevel.length > 0;

    const newValidation: ValidationState = {
      goals: goalsValidation,
      fitnessLevel: {
        isValid: fitnessLevelValid,
        message: fitnessLevelValid ? "" : "Please select your experience level",
      },
    };

    setValidation(newValidation);

    // Check if form is valid
    if (goalsValidation.isValid && fitnessLevelValid) {
      onNext({
        // ✅ Removed bio from data
        goals: goals.trim(),
        fitnessLevel,
      });
    } else {
      // Show error message
      const invalidFields = [];

      if (!goalsValidation.isValid) invalidFields.push("fitness goals");
      if (!fitnessLevelValid) invalidFields.push("experience level");

      const message = `Please fix: ${invalidFields.join(", ")}`;
      setSystemMessage(message);
      setShowSystemMessage(true);
    }
  };

  const canContinue = goals.trim().length >= 10 && fitnessLevel.length > 0;

  return (
    <YStack gap="$4">
      {/* Header with title and button */}
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text size="medium" fontWeight="600" color="$primary">
            Almost there..
          </Text>
          <Button
            onPress={handleContinue}
            backgroundColor="$primary"
            color="white"
            size="medium"
            paddingHorizontal="$4"
          >
            Continue
          </Button>
        </XStack>

        {/* System Message */}
        {showSystemMessage && (
          <SystemMessage message={systemMessage} type="error" />
        )}
      </YStack>

      {/* Form Content - Wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack gap="$6">
          {/* Fitness Level - required select */}
          <YStack gap="$2">
            <Text size="medium" fontWeight="600" color="$color">
              How long have you been consistently training?
            </Text>
            <Stack zIndex={1}>
              <Select
                options={fitnessLevelOptions}
                value={fitnessLevel}
                placeholder="Select your experience level"
                onValueChange={setFitnessLevel}
              />
            </Stack>
            {!validation.fitnessLevel.isValid && (
              <Text size="medium" color="$red9" marginTop="$1">
                {validation.fitnessLevel.message}
              </Text>
            )}
          </YStack>

          {/* ✅ REMOVED Bio Section */}

          <YStack gap="$3">
            <Text size="medium" fontWeight="600" color="$color">
              What are your fitness goals? (Be specific!)
            </Text>
            <YStack>
              <TextArea
                value={goals}
                onChangeText={setGoals}
                onBlur={() => handleBlur("goals", goals)}
                placeholder="Build muscle, lose weight, be active..."
                minHeight={100}
                maxLength={250}
                borderColor={
                  !validation.goals.isValid ? "$red9" : "$borderColor"
                }
              />
              <XStack
                justifyContent="space-between"
                alignItems="center"
                marginTop="$1"
              >
                {!validation.goals.isValid && (
                  <Text size="medium" color="$red9">
                    {validation.goals.message}
                  </Text>
                )}
                <Text size="small" color="$textSoft" marginLeft="auto">
                  {goals.length}/250
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </YStack>
  );
}
