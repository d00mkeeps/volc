// /components/organisms/onboarding/Slide3.tsx
import React, { useState } from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import Input from "@/components/atoms/core/Input";

interface OnboardingSlide3Props {
  firstName: string;
  onComplete: (data: { instagramUsername: string }) => void;
}

export function OnboardingSlide3({
  firstName,
  onComplete,
}: OnboardingSlide3Props) {
  const [instagramUsername, setInstagramUsername] = useState("");

  const handleInstagramChange = (value: string) => {
    // Remove any existing @ and add it back, limit length
    const cleanValue = value.replace(/^@/, "").toLowerCase();
    if (cleanValue.length <= 30) {
      // Instagram username limit
      setInstagramUsername(cleanValue ? "@" + cleanValue : "");
    }
  };

  const handleComplete = () => {
    onComplete({ instagramUsername });
  };

  return (
    <YStack gap="$4" paddingBottom="$4" alignItems="center">
      <Text size="medium" fontWeight="bold" textAlign="center">
        One last thing..
      </Text>
      <Text size="medium" color="$textMuted" textAlign="center">
        Add your Instagram to connect with other Volc users
      </Text>

      <YStack gap="$2" width="100%" maxWidth={300}>
        <Input
          value={instagramUsername}
          onChangeText={handleInstagramChange}
          placeholder="Username"
          placeholderTextColor="$textMuted"
          size="$4"
          width="60%"
          autoCapitalize="none"
          autoCorrect={false}
          textAlign="center"
        />
      </YStack>

      <Button size="$4" backgroundColor="$primary" onPress={handleComplete}>
        Get Started
      </Button>
    </YStack>
  );
}
