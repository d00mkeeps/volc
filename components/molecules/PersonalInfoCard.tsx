import React from "react";
import { YStack, XStack, Text } from "tamagui";
import { UserProfile } from "@/types";

interface PersonalInfoCardProps {
  profile: UserProfile;
}

const AGE_GROUPS = {
  1: "Under 18",
  2: "18-25",
  3: "26-35",
  4: "36-45",
  5: "46-55",
  6: "Over 55",
};

export default function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  return (
    <YStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$3"
    >
      <Text fontSize="$4" fontWeight="600" color="$color">
        Personal Information
      </Text>

      <XStack justifyContent="space-between">
        <Text fontSize="$3" color="$textSoft">
          Age Group
        </Text>
        <Text fontSize="$3" color="$color" fontWeight="500">
          {AGE_GROUPS[profile.age_group as keyof typeof AGE_GROUPS] ||
            "Not set"}
        </Text>
      </XStack>

      <XStack justifyContent="space-between">
        <Text fontSize="$3" color="$textSoft">
          Units
        </Text>
        <Text fontSize="$3" color="$color" fontWeight="500">
          {profile.is_imperial ? "Imperial (lbs, ft)" : "Metric (kg, cm)"}
        </Text>
      </XStack>
    </YStack>
  );
}
