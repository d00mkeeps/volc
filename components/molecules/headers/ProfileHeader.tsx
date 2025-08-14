import React, { useEffect } from "react";
import { YStack, XStack, Text } from "tamagui";
import { useUserStore } from "@/stores/userProfileStore";
import ProfileAvatar from "../ProfileAvatar";

export default function ProfileHeader() {
  const { userProfile } = useUserStore();

  if (!userProfile) return null;
  useEffect(() => {
    console.log("[ProfileHeader] Component mounted");
  }, []);
  const displayName =
    `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() ||
    "User";

  return (
    <XStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$4"
      alignItems="center"
      gap="$3"
    >
      <ProfileAvatar />

      <YStack flex={1} paddingLeft="$4">
        <Text fontSize="$4" fontWeight="600" color="$color">
          {displayName}
        </Text>
        {userProfile.instagram_username && (
          <Text fontSize="$4" color="$textMuted" paddingTop="$2">
            @{userProfile.instagram_username}
          </Text>
        )}
      </YStack>
    </XStack>
  );
}
