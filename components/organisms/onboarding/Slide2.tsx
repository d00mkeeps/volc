import React from "react";
import { YStack, Text, Input, Button } from "tamagui";
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

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <YStack gap="$4" paddingBottom="$4">
        <Text fontSize="$6" fontWeight="bold">
          Tell us about your goals
        </Text>

        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            What are your fitness goals?
          </Text>
          <Input
            value={goals}
            onChangeText={setGoals}
            placeholder="e.g., Build muscle, lose weight, get stronger..."
            placeholderTextColor="$textMuted"
            size="$4"
            multiline
            minHeight={80}
            onSubmitEditing={dismissKeyboard}
          />
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Current fitness level (Optional)
          </Text>
          <Input
            value={currentStats}
            onChangeText={setCurrentStats}
            placeholder="Tell us about your current training experience..."
            placeholderTextColor="$textMuted"
            size="$4"
            multiline
            minHeight={100}
            onSubmitEditing={dismissKeyboard}
          />
        </YStack>

        <Button
          size="$4"
          backgroundColor={canContinue ? "$primary" : "$gray6"}
          onPress={onContinue}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
