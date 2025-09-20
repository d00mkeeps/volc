import React, { useState, useEffect } from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import Input from "@/components/atoms/core/Input";
import SystemMessage from "@/components/atoms/SystemMessage";
import { KeyboardAvoidingView, Platform } from "react-native";

interface Step1Props {
  onNext: (data: {
    firstName: string;
    lastName: string;
    age: string;
    units: "metric" | "imperial";
  }) => void;
}

interface ValidationState {
  firstName: { isValid: boolean; message: string };
  lastName: { isValid: boolean; message: string };
  age: { isValid: boolean; message: string };
}

export default function OnboardingStep1({ onNext }: Step1Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("imperial");
  const [showSystemMessage, setShowSystemMessage] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");

  const [validation, setValidation] = useState<ValidationState>({
    firstName: { isValid: true, message: "" },
    lastName: { isValid: true, message: "" },
    age: { isValid: true, message: "" },
  });

  // Auto-hide system message after 3 seconds (increased from 1s for debugging)
  useEffect(() => {
    if (showSystemMessage) {
      const timer = setTimeout(() => {
        setShowSystemMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSystemMessage]);

  // Handle age input to only allow numbers
  const handleAgeChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setAge(numericValue);
  };

  const validateField = (
    field: keyof ValidationState,
    value: string
  ): { isValid: boolean; message: string } => {
    switch (field) {
      case "firstName":
      case "lastName":
        if (!value.trim()) {
          return { isValid: false, message: "This field is required" };
        }
        if (value.trim().length < 2) {
          return { isValid: false, message: "Must be at least 2 characters" };
        }
        if (value.trim().length > 50) {
          return { isValid: false, message: "Must be less than 50 characters" };
        }
        return { isValid: true, message: "" };
      case "age":
        if (!value.trim()) {
          return { isValid: false, message: "Age is required" };
        }
        const ageNum = parseInt(value);
        if (isNaN(ageNum) || ageNum < 16 || ageNum > 120) {
          // Changed from 100 to 120
          return {
            isValid: false,
            message: "Please enter a valid age (16-120)", // Updated message
          };
        }
        return { isValid: true, message: "" };

      default:
        return { isValid: true, message: "" };
    }
  };

  const handleBlur = (field: keyof ValidationState, value: string) => {
    const fieldValidation = validateField(field, value);
    setValidation((prev) => ({
      ...prev,
      [field]: fieldValidation,
    }));
  };

  const isFormValid = () => {
    const firstNameValid = validateField("firstName", firstName).isValid;
    const lastNameValid = validateField("lastName", lastName).isValid;
    const ageValid = validateField("age", age).isValid;

    return firstNameValid && lastNameValid && ageValid;
  };

  const handleContinue = () => {
    console.log("Continue pressed"); // Debug log

    // Always show validation errors when Continue is pressed
    const firstNameValidation = validateField("firstName", firstName);
    const lastNameValidation = validateField("lastName", lastName);
    const ageValidation = validateField("age", age);

    const newValidation: ValidationState = {
      firstName: firstNameValidation,
      lastName: lastNameValidation,
      age: ageValidation,
    };

    setValidation(newValidation);

    // Check if form is valid
    if (
      firstNameValidation.isValid &&
      lastNameValidation.isValid &&
      ageValidation.isValid
    ) {
      onNext({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: age.trim(),
        units,
      });
    } else {
      // Show error message
      const invalidFields = [];

      if (!firstNameValidation.isValid) invalidFields.push("first name");
      if (!lastNameValidation.isValid) invalidFields.push("last name");
      if (!ageValidation.isValid) invalidFields.push("age");

      const message = `Please fix: ${invalidFields.join(", ")}`;
      console.log("Showing system message:", message); // Debug log

      setSystemMessage(message);
      setShowSystemMessage(true);
    }
  };

  return (
    <YStack gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text size="large" fontWeight="600" color="$primary">
          Welcome to Volc!
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

      {/* System Message - moved to top and always rendered for debugging */}
      {showSystemMessage && (
        <YStack>
          <SystemMessage message={systemMessage} type="error" />
          <Text size="small" color="$textSoft">
            Debug: Message is showing
          </Text>
        </YStack>
      )}
      {/* Form Content */}
      <YStack gap="$6">
        {/* Name Section */}
        <YStack gap="$3" paddingBottom="$3">
          <Text size="large" fontWeight="600" color="$color">
            Name
          </Text>
          <XStack gap="$3" justifyContent="flex-start">
            <YStack flex={1}>
              <Input
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => handleBlur("firstName", firstName)}
                placeholder="First"
                size="medium"
                width="80%"
                alignSelf="flex-start"
                borderColor={
                  !validation.firstName.isValid ? "$red9" : "$borderSoft"
                }
              />
              {!validation.firstName.isValid && (
                <Text
                  size="medium"
                  color="$red9"
                  position="absolute"
                  top="100%"
                  left={0}
                  marginTop="$1"
                  zIndex={1}
                >
                  {validation.firstName.message}
                </Text>
              )}
            </YStack>
            <YStack flex={1}>
              <Input
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => handleBlur("lastName", lastName)}
                placeholder="Last"
                size="medium"
                width="80%"
                alignSelf="flex-start"
                borderColor={
                  !validation.lastName.isValid ? "$red9" : "$borderSoft"
                }
              />
              {!validation.lastName.isValid && (
                <Text
                  size="medium"
                  color="$red9"
                  position="absolute"
                  top="100%"
                  left={0}
                  marginTop="$1"
                  zIndex={1}
                >
                  {validation.lastName.message}
                </Text>
              )}
            </YStack>
          </XStack>
        </YStack>

        {/* Age Section */}
        <YStack gap="$3" paddingTop="$3">
          <Text size="large" fontWeight="600" color="$color">
            Age
          </Text>
          <YStack>
            <Input
              value={age}
              onChangeText={handleAgeChange}
              onBlur={() => handleBlur("age", age)}
              placeholder="25"
              keyboardType="numeric"
              size="medium"
              maxLength={3}
              width={80}
              borderColor={!validation.age.isValid ? "$red9" : "$borderSoft"}
              alignSelf="flex-start"
            />
            {!validation.age.isValid && (
              <Text
                size="medium"
                color="$red9"
                position="absolute"
                top="100%"
                left={0}
                marginTop="$1"
                zIndex={1}
              >
                {validation.age.message}
              </Text>
            )}
          </YStack>
        </YStack>

        {/* Units Section */}
        <YStack gap="$3">
          <Text size="large" fontWeight="600" color="$color">
            Units
          </Text>
          <XStack alignItems="center" gap="$4">
            <Button
              size="$2"
              backgroundColor={
                units === "metric" ? "$primary" : "$backgroundSoft"
              }
              color={units === "metric" ? "white" : "$textSoft"}
              onPress={() => setUnits("metric")}
              borderRadius="$3"
              paddingHorizontal="$4"
            >
              kg/km
            </Button>
            <Button
              size="$2"
              backgroundColor={
                units === "imperial" ? "$primary" : "$backgroundSoft"
              }
              color={units === "imperial" ? "white" : "$textSoft"}
              onPress={() => setUnits("imperial")}
              borderRadius="$3"
              paddingHorizontal="$4"
            >
              lb/mi
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
