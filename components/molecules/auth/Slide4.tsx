// /components/organisms/Slide4.tsx
import React, { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { YStack, XStack, useTheme } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import Input from "@/components/atoms/core/Input";
import { AppIcon } from "@/assets/icons/IconMap";

interface Slide4Props {
  theme: ReturnType<typeof useTheme>;
  isImperial: boolean | null;
  height: string;
  setHeight: (height: string) => void;
  weight: string;
  setWeight: (weight: string) => void;
  loading: boolean;
  handleComplete: () => void;
  goToSlide: (index: number) => void;
}

export default function Slide4({
  theme,
  isImperial,
  height,
  setHeight,
  weight,
  setWeight,
  loading,
  handleComplete,
  goToSlide,
}: Slide4Props) {
  const [weightError, setWeightError] = useState("");
  const [heightError, setHeightError] = useState("");

  // Metric Limits: 250cm, 250kg
  // Imperial Limits: 100 inches (8'4"), 550 lbs
  const MAX_HEIGHT_CM = 250;
  const MAX_WEIGHT_KG = 250;
  const MAX_HEIGHT_IN = 100;
  const MAX_WEIGHT_LBS = 550;

  useEffect(() => {
    validateInputs();
  }, [height, weight, isImperial]);

  const validateInputs = () => {
    let wError = "";
    let hError = "";

    const wNum = parseFloat(weight);
    const hNum = parseFloat(height);

    if (weight) {
      if (isImperial) {
        if (wNum > MAX_WEIGHT_LBS) wError = `Max ${MAX_WEIGHT_LBS} lbs`;
      } else {
        if (wNum > MAX_WEIGHT_KG) wError = `Max ${MAX_WEIGHT_KG} kg`;
      }
    }

    if (height) {
      if (isImperial) {
        if (hNum > MAX_HEIGHT_IN) hError = `Max ${MAX_HEIGHT_IN} inches`;
      } else {
        if (hNum > MAX_HEIGHT_CM) hError = `Max ${MAX_HEIGHT_CM} cm`;
      }
    }

    setWeightError(wError);
    setHeightError(hError);
  };

  const isInvalid = !!weightError || !!heightError;

  return (
    <YStack paddingHorizontal="$6" justifyContent="space-between">
      <YStack>
        <YStack paddingBottom="$2">
          <XStack
            alignItems="center"
            justifyContent="space-between"
            marginBottom="$1"
          >
            <XStack alignItems="center" gap="$2">
              <TouchableOpacity
                onPress={() => goToSlide(2)}
                style={{ padding: 4, marginLeft: -4 }}
              >
                <AppIcon name="ChevronLeft" size={20} color={theme.color.val} />
              </TouchableOpacity>
              <Text size="large" fontWeight="700">
                Last step..
              </Text>
            </XStack>

            <TouchableOpacity
              onPress={() => {
                console.log("[Slide4] Skip pressed");
                handleComplete();
              }}
              disabled={loading}
              style={{ padding: 4 }}
            >
              <Text color="$textMuted" fontWeight="600" size="medium">
                Skip
              </Text>
            </TouchableOpacity>
          </XStack>
          <Text size="small" color="$textMuted" marginTop="$1" marginLeft="$2">
            Optional
          </Text>
        </YStack>

        <XStack gap="$6" paddingTop="$4" justifyContent="flex-start">
          {/* Height Input */}
          <YStack gap="$2">
            <Text size="medium" fontWeight="600" color="$color">
              Height ({isImperial ? "inches" : "cm"})
            </Text>
            <YStack>
              <Input
                placeholder="0"
                value={height}
                onChangeText={(val) => {
                  // Only allow numbers and one decimal
                  if (/^\d*\.?\d*$/.test(val)) setHeight(val);
                }}
                keyboardType="decimal-pad"
                inputMode="decimal"
                size="medium"
                minWidth={80}
                alignSelf="flex-start"
                borderColor={heightError ? "$red8" : "$borderColor"}
              />
              {heightError && (
                <Text size="xs" color="$red10" marginTop="$1">
                  {heightError}
                </Text>
              )}
            </YStack>
          </YStack>

          {/* Weight Input */}
          <YStack gap="$2">
            <Text size="medium" fontWeight="600" color="$color">
              Weight ({isImperial ? "lbs" : "kg"})
            </Text>
            <YStack>
              <Input
                placeholder="0"
                alignSelf="flex-start"
                value={weight}
                onChangeText={(val) => {
                  if (/^\d*\.?\d*$/.test(val)) setWeight(val);
                }}
                keyboardType="decimal-pad"
                inputMode="decimal"
                size="medium"
                minWidth={80}
                borderColor={weightError ? "$red8" : "$borderColor"}
              />
              {weightError && (
                <Text size="xs" color="$red10" marginTop="$1">
                  {weightError}
                </Text>
              )}
            </YStack>
          </YStack>
        </XStack>
      </YStack>

      <YStack paddingTop="$8">
        <Button
          onPress={handleComplete}
          disabled={loading || isInvalid}
          size="large"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.15}
          shadowRadius={4}
          elevation={3}
          backgroundColor={isInvalid ? "$backgroundDisabled" : "$primary"}
        >
          <Text
            color={isInvalid ? "$textMuted" : "white"}
            fontWeight="600"
            size="medium"
          >
            {loading ? "Saving..." : "Done"}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
