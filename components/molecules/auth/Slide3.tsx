import React from "react";
import { TouchableOpacity, ScrollView } from "react-native";
import { YStack, XStack, useTheme, Stack } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { AppIcon } from "@/assets/icons/IconMap";

interface Slide3Props {
  theme: ReturnType<typeof useTheme>;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
  trainingLocation: string;
  setTrainingLocation: (val: string) => void;
  goToSlide: (index: number) => void;
}

const EXPERIENCE_LEVELS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const LOCATIONS = [
  { label: "Gym", value: "gym", icon: "Dumbbell" },
  { label: "Home", value: "home", icon: "Home" },
  { label: "Other", value: "other", icon: "Globe" },
];

export default function Slide3({
  theme,
  experienceLevel,
  setExperienceLevel,
  trainingLocation,
  setTrainingLocation,
  goToSlide,
}: Slide3Props) {
  return (
    <YStack paddingHorizontal="$6" flex={1}>
      {/* Header */}
      <YStack paddingBottom="$2">
        <XStack alignItems="center" gap="$4" marginBottom="$1">
          <TouchableOpacity
            onPress={() => goToSlide(1)}
            style={{ padding: 4, marginLeft: -4 }}
          >
            <AppIcon name="ChevronLeft" size={20} color={theme.color.val} />
          </TouchableOpacity>
          <Text size="large" fontWeight="700" fontSize={24}>
            Your training style
          </Text>
        </XStack>
      </YStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$6" paddingTop="$4">
          {/* Experience Level */}
          <YStack gap="$3">
            <Text size="medium" fontWeight="600" color="$color">
              Experience Level (0-10)
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setExperienceLevel(level)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: experienceLevel === level ? theme.primary.val : theme.backgroundStrong.val,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: experienceLevel === level ? theme.primary.val : theme.borderColor.val,
                  }}
                >
                  <Text
                    fontWeight="600"
                    color={experienceLevel === level ? "white" : "$color"}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </XStack>
            <Text size="xs" color="$textMuted">
              0 = Total beginner, 10 = Pro athlete
            </Text>
          </YStack>

          {/* Training Location */}
          <YStack gap="$3">
            <Text size="medium" fontWeight="600" color="$color">
              Primary Training Location
            </Text>
            <YStack gap="$2">
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.value}
                  onPress={() => setTrainingLocation(loc.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: trainingLocation === loc.value ? theme.primary.val + "10" : theme.backgroundStrong.val,
                    borderWidth: 1.5,
                    borderColor: trainingLocation === loc.value ? theme.primary.val : theme.borderColor.val,
                    gap: 12,
                  }}
                >
                   {/* @ts-ignore */}
                  <AppIcon name={loc.icon} size={20} color={trainingLocation === loc.value ? theme.primary.val : theme.color.val} />
                  <Text
                    fontWeight="600"
                    color={trainingLocation === loc.value ? theme.primary.val : "$color"}
                  >
                    {loc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      {/* Spacer */}
      <Stack flex={1} minHeight="$4" />

      <Button
        onPress={() => goToSlide(3)}
        disabled={!experienceLevel || !trainingLocation}
        marginBottom="$4"
        size="large"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.15}
        shadowRadius={4}
        elevation={3}
      >
        <Text color="white" fontWeight="600" fontSize={18}>
          Continue
        </Text>
      </Button>
    </YStack>
  );
}
