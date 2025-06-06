import React from "react";
import { YStack, XStack, Text, Avatar, Stack } from "tamagui";
import { UserProfile } from "@/types";

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const displayName =
    profile.display_name ||
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "User";

  return (
    <XStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$4"
      alignItems="center"
      gap="$3"
    >
      <Stack
        width={60}
        height={60}
        borderRadius={30}
        backgroundColor="$primary"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="white" fontSize="$5" fontWeight="600">
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </Stack>

      <YStack flex={1}>
        <Text fontSize="$6" fontWeight="600" color="$color">
          {displayName}
        </Text>
        <Text fontSize="$3" color="$textSoft">
          {profile.is_imperial ? "Imperial units" : "Metric units"}
        </Text>
      </YStack>
    </XStack>
  );
}
