import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";

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
      <Text size="medium" fontWeight="bold" textAlign="center">
        You're all set up!
      </Text>
      <Text size="medium" color="$textMuted" textAlign="center">
        Welcome to Volc, {firstName}! Your profile is ready and you can start
        tracking workouts.
      </Text>

      <Button size="$4" backgroundColor="$primary" onPress={onComplete}>
        Get Started
      </Button>
    </YStack>
  );
}
