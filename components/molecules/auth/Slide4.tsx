// /components/organisms/Slide4.tsx
import React from "react";
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
  return (
    <YStack paddingHorizontal="$6" justifyContent="space-between">
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
              <AppIcon name="ChevronLeft" size={28} color={theme.color.val} />
            </TouchableOpacity>
            <Text size="large" fontWeight="700" fontSize={24}>
              Height & weight
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
            <Text color="$textMuted" fontWeight="600" fontSize={16}>
              Skip
            </Text>
          </TouchableOpacity>
        </XStack>
        <Text fontSize={14} color="$textMuted" marginTop="$1">
          Optional
        </Text>
      </YStack>

      <XStack gap="$6" paddingTop="$4" justifyContent="center">
        <YStack gap="$2">
          <Text fontSize={16} fontWeight="600" color="$color">
            Height ({isImperial ? "inches" : "cm"})
          </Text>
          <Input
            placeholder="0"
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            inputMode="decimal"
            size="medium"
            minWidth={80}
            alignSelf="flex-start"
          />
        </YStack>

        <YStack gap="$2">
          <Text fontSize={16} fontWeight="600" color="$color">
            Weight ({isImperial ? "lbs" : "kg"})
          </Text>
          <Input
            placeholder="0"
            alignSelf="flex-start"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            inputMode="decimal"
            size="medium"
            minWidth={80}
          />
        </YStack>
      </XStack>

      <YStack marginTop="$4">
        <Button
          onPress={handleComplete}
          disabled={loading}
          size="large"
          marginTop="$10"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.15}
          shadowRadius={4}
          elevation={3}
        >
          <Text color="white" fontWeight="600" fontSize={18}>
            {loading ? "Saving..." : "Done"}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
