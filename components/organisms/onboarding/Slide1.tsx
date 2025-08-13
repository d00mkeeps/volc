import React from "react";
import { YStack, XStack, Text, Input, Button, Switch } from "tamagui";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

interface OnboardingSlide1Props {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  ageGroup: string;
  setAgeGroup: (value: string) => void;
  isImperial: boolean;
  setIsImperial: (value: boolean) => void;
  instagramUsername: string;
  setInstagramUsername: (value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}

export function OnboardingSlide1({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  ageGroup,
  setAgeGroup,
  isImperial,
  setIsImperial,
  instagramUsername,
  setInstagramUsername,
  onContinue,
  canContinue,
}: OnboardingSlide1Props) {
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleInstagramChange = (value: string) => {
    // Auto-add @ if user starts typing without it
    if (value.length > 0 && !value.startsWith("@")) {
      setInstagramUsername("@" + value.toLowerCase());
    } else {
      setInstagramUsername(value);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <YStack gap="$4" paddingBottom="$4">
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$primary">
            Welcome to Volc!
          </Text>
          <Text fontSize="$4" color="$textMuted">
            Let's get your profile set up
          </Text>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Name
          </Text>
          <XStack gap="$3">
            <Input
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First"
              placeholderTextColor="$textMuted"
              size="$4"
              flex={1}
              onSubmitEditing={dismissKeyboard}
            />
            <Input
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last"
              placeholderTextColor="$textMuted"
              size="$4"
              flex={1}
              onSubmitEditing={dismissKeyboard}
            />
          </XStack>
        </YStack>

        <XStack gap="$4" alignItems="flex-end">
          <YStack gap="$2" flex={0.4}>
            <Text fontSize="$5" fontWeight="600">
              Age
            </Text>
            <Input
              value={ageGroup}
              onChangeText={setAgeGroup}
              placeholder="25"
              placeholderTextColor="$textMuted"
              size="$4"
              keyboardType="numeric"
              onSubmitEditing={dismissKeyboard}
            />
          </YStack>

          <YStack gap="$2" flex={0.6}>
            <Text fontSize="$5" fontWeight="600">
              Units
            </Text>
            <XStack alignItems="center" gap="$3" justifyContent="center">
              <Text
                color={!isImperial ? "$primary" : "$textMuted"}
                fontWeight={!isImperial ? "600" : "400"}
              >
                kg/km
              </Text>
              <Switch
                checked={isImperial}
                onCheckedChange={setIsImperial}
                backgroundColor={isImperial ? "$primary" : "$gray6"}
              >
                <Switch.Thumb backgroundColor="white" />
              </Switch>
              <Text
                color={isImperial ? "$primary" : "$textMuted"}
                fontWeight={isImperial ? "600" : "400"}
              >
                lb/mi
              </Text>
            </XStack>
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Instagram Username (Optional)
          </Text>
          <Input
            value={instagramUsername}
            onChangeText={handleInstagramChange}
            placeholder="@username"
            placeholderTextColor="$textMuted"
            size="$4"
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
