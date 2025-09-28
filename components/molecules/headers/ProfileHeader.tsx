import React, { useState } from "react";
import { XStack, YStack, Stack, TextArea } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import ProfileAvatar from "@/components/molecules/ProfileAvatar";
import { UserProfile } from "@/types";

interface ProfileHeaderProps {
  userProfile: UserProfile | null; // ← Allow null
  editingCard: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isEditMode: boolean;
  editedBio: string;
  onBioChange: (bio: string) => void;
  refreshProfile: () => Promise<void>;
  setIsEditMode: (editMode: boolean) => void; // ✅ Add this
}

export default function ProfileHeader({
  userProfile,
  editingCard,
  updateProfile,
  isEditMode,
  editedBio,
  onBioChange,
  refreshProfile,
  setIsEditMode,
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
        <ProfileAvatar
          editMode={isEditMode}
          refreshProfile={refreshProfile}
          setIsEditMode={setIsEditMode} // ✅ Pass it down
        />

        <YStack alignItems="center" gap="$1">
          <Text
            size="medium"
            fontWeight="600"
            color="$color"
            textAlign="center"
          >
            {userProfile
              ? `${userProfile.first_name || ""} ${
                  userProfile.last_name || ""
                }`.trim() || "User"
              : "Loading..."}
            {userProfile?.age && `, ${userProfile.age}`}
          </Text>
          {userProfile?.instagram_username ? (
            <Text size="medium" color="$textMuted" textAlign="center">
              @{userProfile.instagram_username}
            </Text>
          ) : userProfile === null ? (
            <Text size="medium" color="$textMuted" textAlign="center">
              Loading...
            </Text>
          ) : null}
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
              {userProfile === null
                ? "Loading..."
                : userProfile.bio || "Tell us about yourself..."}
            </Text>
          )}
        </YStack>
      </YStack>
    </XStack>
  );
}
