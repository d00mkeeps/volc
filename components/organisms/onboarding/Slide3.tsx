import React from "react";
import { YStack, Text, Button } from "tamagui";

interface OnboardingSlide3Props {
  firstName: string;
  onComplete: () => void;
}

export function OnboardingSlide3({
  firstName,
  onComplete,
}: OnboardingSlide3Props) {
  return (
    <YStack gap="$4" paddingBottom="$4" alignItems="center">
      <Text fontSize="$6" fontWeight="bold" textAlign="center">
        You're all set up!
      </Text>
      <Text fontSize="$4" color="$textMuted" textAlign="center">
        Welcome to Volc, {firstName}! Your profile is ready and you can start
        tracking workouts.
      </Text>

      <Button size="$4" backgroundColor="$primary" onPress={onComplete}>
        Get Started
      </Button>
    </YStack>
  );
}
