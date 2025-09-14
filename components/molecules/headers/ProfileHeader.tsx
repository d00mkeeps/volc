import React, { useState } from "react";
import { XStack, YStack, Stack, TextArea } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import ProfileAvatar from "@/components/molecules/ProfileAvatar";
import { UserProfile } from "@/types";

const PLACEHOLDER_BIO =
  "This is my fitness journey! I love working out and staying healthy. Always pushing myself to be better than yesterday. 💪";

interface ProfileHeaderProps {
  userProfile: UserProfile;
  editingCard: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isEditMode: boolean;
  editedBio: string;
  onBioChange: (bio: string) => void;
}

export default function ProfileHeader({
  userProfile,
  editingCard,
  updateProfile,
  isEditMode,
  editedBio,
  onBioChange,
}: ProfileHeaderProps) {
  const handleImageUploaded = async (imageId: string) => {
    try {
      await updateProfile({ avatar_image_id: imageId });
    } catch (error) {
      console.error("Failed to update avatar:", error);
    }
  };

  return (
    <XStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$3"
      minHeight={150}
    >
      {/* Left side - Avatar with name/age/instagram below */}
      <YStack alignItems="center" gap="$3" width="35%" flex={0.5}>
        <ProfileAvatar />
        {isEditMode && (
          <Button
            size="small"
            backgroundColor="$primary"
            color="white"
            onPress={() => {
              /* TODO: implement photo picker */
            }}
          >
            Change Photo
          </Button>
        )}
        <YStack alignItems="center" gap="$1">
          <Text
            size="medium"
            fontWeight="600"
            color="$color"
            textAlign="center"
          >
            {`${userProfile.first_name || ""} ${
              userProfile.last_name || ""
            }`.trim() || "User"}
            {userProfile.age && `, ${userProfile.age}`}
          </Text>
          {userProfile.instagram_username && (
            <Text size="medium" color="$textMuted" textAlign="center">
              @{userProfile.instagram_username}
            </Text>
          )}
        </YStack>
      </YStack>

      {/* Right side - Bio section */}
      <YStack
        flex={1}
        position="relative"
        justifyContent="flex-start"
        paddingTop="$6"
      >
        <YStack gap="$2">
          <Text size="medium" color="$textSoft">
            Bio
          </Text>
          {isEditMode ? (
            <TextArea
              value={editedBio}
              onChangeText={onBioChange}
              placeholder="Tell us about yourself..."
              size="medium"
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderSoft"
              borderRadius="$3"
              minHeight={80}
            />
          ) : (
            <Text
              size="medium"
              color="$color"
              lineHeight={20}
              ellipsizeMode="tail"
            >
              {userProfile.bio || "Tell us about yourself..."}
            </Text>
          )}
        </YStack>
      </YStack>
    </XStack>
  );
}
