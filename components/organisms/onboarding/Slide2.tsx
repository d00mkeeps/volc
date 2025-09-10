import React from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/Text";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

interface OnboardingSlide2Props {
  goals: string;
  setGoals: (value: string) => void;
  currentStats: string;
  setCurrentStats: (value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}

export function OnboardingSlide2({
  goals,
  setGoals,
  currentStats,
  setCurrentStats,
  onContinue,
  canContinue,
}: OnboardingSlide2Props) {
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleGoalsChange = (value: string) => {
    if (value.length <= 250) {
      setGoals(value);
    }
  };

  const handleStatsChange = (value: string) => {
    if (value.length <= 250) {
      setCurrentStats(value);
    }
  };

  const goalsValid = goals.trim().length >= 10;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <YStack gap="$4" paddingBottom="$4">
        <Text size="medium" fontWeight="bold">
          Tell us about your goals
        </Text>

        <YStack gap="$2">
          <Text size="medium" fontWeight="600">
            What are your fitness goals? *
          </Text>
          <Input
            value={goals}
            onChangeText={handleGoalsChange}
            placeholder="e.g., Build muscle, lose weight, get stronger..."
            placeholderTextColor="$textMuted"
            size="$4"
            multiline
            minHeight={80}
            borderColor={goals && !goalsValid ? "$red8" : "$borderColor"}
            onSubmitEditing={dismissKeyboard}
          />
          <XStack justifyContent="space-between">
            <Text
              size="medium"
              color={goals && !goalsValid ? "$red8" : "$textMuted"}
            >
              {goals && !goalsValid ? "At least 10 characters" : ""}
            </Text>
            <Text size="medium" color="$textMuted">
              {goals.length}/250
            </Text>
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Text size="medium" fontWeight="600">
            Current fitness level (Optional)
          </Text>
          <Input
            value={currentStats}
            onChangeText={handleStatsChange}
            placeholder="Tell us about your current training experience..."
            placeholderTextColor="$textMuted"
            size="$4"
            multiline
            minHeight={100}
            onSubmitEditing={dismissKeyboard}
          />
          <XStack justifyContent="flex-end">
            <Text size="medium" color="$textMuted">
              {currentStats.length}/250
            </Text>
          </XStack>
        </YStack>

        <Button
          size="$4"
          backgroundColor={canContinue ? "$primary" : "$gray6"}
          onPress={onContinue}
          disabled={!canContinue}
          marginTop="$2"
        >
          Continue
        </Button>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
