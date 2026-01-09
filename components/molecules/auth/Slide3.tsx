import React from "react";
import { TouchableOpacity } from "react-native";
import { YStack, XStack, useTheme } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import Input from "@/components/atoms/core/Input";
import { AppIcon } from "@/assets/icons/IconMap";

interface Slide3Props {
  theme: ReturnType<typeof useTheme>;
  experienceLevel: string | null;
  setExperienceLevel: (level: string) => void;
  trainingLocation: string | null;
  setTrainingLocation: (location: string) => void;
  locationOther: string;
  setLocationOther: (text: string) => void;
  canProgressExperience: boolean;
  goToSlide: (index: number) => void;
}

export default function Slide3({
  theme,
  experienceLevel,
  setExperienceLevel,
  trainingLocation,
  setTrainingLocation,
  locationOther,
  setLocationOther,
  canProgressExperience,
  goToSlide,
}: Slide3Props) {
  const experienceOptions = [
    { value: "beginner", label: "0-2" },
    { value: "intermediate", label: "2-5" },
    { value: "advanced", label: "5-10" },
    { value: "elite", label: "10+" },
  ];

  return (
    <YStack paddingHorizontal="$6">
      {/* Header */}
      <YStack paddingBottom="$2">
        <XStack alignItems="center" gap="$2" marginBottom="$1">
          <TouchableOpacity
            onPress={() => goToSlide(1)}
            style={{ padding: 4, marginLeft: -4 }}
          >
            <AppIcon name="ChevronLeft" size={28} color={theme.color.val} />
          </TouchableOpacity>
          <Text size="large" fontWeight="700" fontSize={24}>
            Tell us about you
          </Text>
        </XStack>
      </YStack>

      {/* Content */}
      <YStack gap="$6" paddingTop="$4">
        {/* Experience Level */}
        <YStack gap="$3">
          <Text fontSize={16} fontWeight="600" color="$color">
            Training experience (years)
          </Text>
          <XStack
            backgroundColor="$gray4"
            borderRadius="$4"
            padding="$1.5"
            width="100%"
          >
            {experienceOptions.map((exp) => (
              <Button
                key={exp.value}
                flex={1}
                backgroundColor={
                  experienceLevel === exp.value ? "$background" : "transparent"
                }
                borderRadius="$3"
                paddingVertical="$2"
                onPress={() => {
                  console.log("[Slide3] Selected experience:", exp.value);
                  setExperienceLevel(exp.value);
                }}
                pressStyle={{ opacity: 0.8 }}
                borderColor="$primary"
                borderWidth={experienceLevel === exp.value ? 0.25 : 0}
                shadowColor={
                  experienceLevel === exp.value ? "$shadowColor" : "transparent"
                }
                shadowOffset={
                  experienceLevel === exp.value
                    ? { width: 0, height: 1 }
                    : { width: 0, height: 0 }
                }
                shadowOpacity={experienceLevel === exp.value ? 0.1 : 0}
                shadowRadius={experienceLevel === exp.value ? 2 : 0}
                elevation={experienceLevel === exp.value ? 2 : 0}
              >
                <Text
                  fontWeight={experienceLevel === exp.value ? "600" : "400"}
                  color={
                    experienceLevel === exp.value ? "$color" : "$textMuted"
                  }
                  fontSize={15}
                >
                  {exp.label}
                </Text>
              </Button>
            ))}
          </XStack>
        </YStack>

        {/* Training Location */}
        <YStack gap="$3">
          <Text fontSize={16} fontWeight="600" color="$color">
            Where do you train?
          </Text>
          <XStack
            backgroundColor="$gray4"
            borderRadius="$4"
            padding="$1.5"
            width="100%"
          >
            {["home", "gym", "other"].map((loc) =>
              loc === "other" && trainingLocation === "other" ? (
                <Input
                  key={loc}
                  placeholder="Where do you train?"
                  value={locationOther}
                  onChangeText={(text) => {
                    console.log("[Slide3] Location other:", text);
                    setLocationOther(text);
                  }}
                  size="medium"
                  flex={1}
                  borderWidth={0}
                  backgroundColor="$background"
                  focusStyle={{
                    borderColor: "$primary",
                    borderWidth: 0.5,
                  }}
                />
              ) : (
                <Button
                  key={loc}
                  width="25%"
                  backgroundColor={
                    trainingLocation === loc ? "$background" : "transparent"
                  }
                  borderRadius="$3"
                  paddingVertical="$2"
                  onPress={() => {
                    console.log("[Slide3] Selected location:", loc);
                    setTrainingLocation(loc);
                  }}
                  pressStyle={{ opacity: 0.8 }}
                  borderColor="$primary"
                  borderWidth={trainingLocation === loc ? 0.25 : 0}
                  shadowColor={
                    trainingLocation === loc ? "$shadowColor" : "transparent"
                  }
                  shadowOffset={
                    trainingLocation === loc
                      ? { width: 0, height: 1 }
                      : { width: 0, height: 0 }
                  }
                  shadowOpacity={trainingLocation === loc ? 0.1 : 0}
                  shadowRadius={trainingLocation === loc ? 2 : 0}
                  elevation={trainingLocation === loc ? 2 : 0}
                >
                  <Text
                    fontWeight={trainingLocation === loc ? "600" : "400"}
                    color={trainingLocation === loc ? "$color" : "$textMuted"}
                    fontSize={15}
                  >
                    {loc.charAt(0).toUpperCase() + loc.slice(1)}
                  </Text>
                </Button>
              )
            )}
          </XStack>
        </YStack>
      </YStack>

      {/* Button */}
      <Button
        onPress={() => goToSlide(3)}
        disabled={!canProgressExperience}
        size="large"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.15}
        shadowRadius={4}
        elevation={3}
        marginTop="$6"
        marginBottom="$2"
      >
        <Text color="white" fontWeight="600" fontSize={18}>
          Continue
        </Text>
      </Button>
    </YStack>
  );
}
