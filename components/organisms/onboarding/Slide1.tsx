import React from "react";
import { YStack, XStack, Switch } from "tamagui";
import Text from "@/components/atoms/Text";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
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
    // Remove any existing @ and add it back, limit length
    const cleanValue = value.replace(/^@/, "").toLowerCase();
    if (cleanValue.length <= 30) {
      // Instagram username limit
      setInstagramUsername(cleanValue ? "@" + cleanValue : "");
    }
  };

  const handleAgeChange = (value: string) => {
    // Only allow numbers and limit to 3 digits
    const numericValue = value.replace(/[^0-9]/g, "");
    if (numericValue.length <= 3) {
      setAgeGroup(numericValue);
    }
  };

  const handleFirstNameChange = (value: string) => {
    if (value.length <= 50) {
      setFirstName(value);
    }
  };

  const handleLastNameChange = (value: string) => {
    if (value.length <= 50) {
      setLastName(value);
    }
  };

  // Validation states
  const firstNameValid = firstName.trim().length >= 2;
  const lastNameValid = lastName.trim().length >= 2;
  const ageValid = parseInt(ageGroup) >= 13 && parseInt(ageGroup) <= 100;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <YStack gap="$4" paddingBottom="$4">
        <YStack gap="$2">
          <Text size="medium" fontWeight="bold" color="$primary">
            Welcome to Volc!
          </Text>
          <Text size="medium" color="$textMuted">
            Let's get your profile set up
          </Text>
        </YStack>

        <YStack gap="$2">
          <Text size="medium" fontWeight="600">
            Name
          </Text>
          <XStack gap="$3">
            <YStack flex={1}>
              <Input
                value={firstName}
                onChangeText={handleFirstNameChange}
                placeholder="First"
                placeholderTextColor="$textMuted"
                size="$4"
                borderColor={
                  firstName && !firstNameValid ? "$red8" : "$borderColor"
                }
                onSubmitEditing={dismissKeyboard}
              />
              {firstName && !firstNameValid && (
                <Text size="medium" color="$red8" marginTop="$1">
                  At least 2 characters
                </Text>
              )}
            </YStack>
            <YStack flex={1}>
              <Input
                value={lastName}
                onChangeText={handleLastNameChange}
                placeholder="Last"
                placeholderTextColor="$textMuted"
                size="$4"
                borderColor={
                  lastName && !lastNameValid ? "$red8" : "$borderColor"
                }
                onSubmitEditing={dismissKeyboard}
              />
              {lastName && !lastNameValid && (
                <Text size="medium" color="$red8" marginTop="$1">
                  At least 2 characters
                </Text>
              )}
            </YStack>
          </XStack>
        </YStack>

        <XStack gap="$4" alignItems="flex-start">
          <YStack gap="$2" flex={0.4}>
            <Text size="medium" fontWeight="600">
              Age
            </Text>
            <Input
              value={ageGroup}
              onChangeText={handleAgeChange}
              placeholder="25"
              placeholderTextColor="$textMuted"
              size="$4"
              keyboardType="numeric"
              borderColor={ageGroup && !ageValid ? "$red8" : "$borderColor"}
              onSubmitEditing={dismissKeyboard}
            />
            {ageGroup && !ageValid && (
              <Text size="medium" color="$red8">
                13-100 years
              </Text>
            )}
          </YStack>

          <YStack gap="$2" flex={0.6} paddingTop="$6">
            <Text size="medium" fontWeight="600">
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
          <Text size="medium" fontWeight="600">
            Instagram Username (Optional)
          </Text>
          <Input
            value={instagramUsername}
            onChangeText={handleInstagramChange}
            placeholder="@username"
            placeholderTextColor="$textMuted"
            size="$4"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={dismissKeyboard}
          />
          <Text size="medium" color="$textMuted">
            {instagramUsername.length}/31 characters
          </Text>
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
