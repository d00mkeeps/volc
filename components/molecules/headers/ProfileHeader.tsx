import React from "react";
import { YStack, XStack, Text, Avatar, Stack } from "tamagui";
import { UserProfile } from "@/types";
import ImagePickerButton from "@/components/atoms/buttons/ImagePickerButton";

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const displayName =
    profile.display_name ||
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "User";

  const handleImageUploaded = (imagePath: string) => {
    console.log(`[ProfileHeader] Profile image uploaded: ${imagePath}`);
    // TODO: Update user profile with new image
  };

  const handleImageError = (error: string) => {
    console.error(`[ProfileHeader] Profile image error: ${error}`);
  };

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

      <ImagePickerButton
        workoutId="profile" // Use special ID for profile images
        label="📷"
        size="sm"
        onImageUploaded={handleImageUploaded}
        onError={handleImageError}
      />

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
