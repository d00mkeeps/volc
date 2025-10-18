import React, { useState } from "react";
import { XStack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import ProfileAvatar from "@/components/molecules/ProfileAvatar";
import LongPressToEdit from "@/components/atoms/core/LongPressToEdit";
import TextEditModal from "@/components/molecules/core/TextEditModal";
import { UserProfile } from "@/types";

interface ProfileHeaderProps {
  userProfile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  pendingAvatarId: string | null;
  onAvatarSelected: (imageId: string) => void;
  isEditMode: boolean; // Keep for backward compatibility but unused
}

export default function ProfileHeader({
  userProfile,
  updateProfile,
  pendingAvatarId,
  onAvatarSelected,
}: ProfileHeaderProps) {
  const [bioModalVisible, setBioModalVisible] = useState(false);

  const handleBioLongPress = () => {
    setBioModalVisible(true);
  };

  const handleBioSave = async (bio: string) => {
    await updateProfile({ bio: bio.trim() });
  };

  return (
    <>
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
            pendingAvatarId={pendingAvatarId}
            onAvatarSelected={onAvatarSelected}
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

            <LongPressToEdit onLongPress={handleBioLongPress}>
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
            </LongPressToEdit>
          </YStack>
        </YStack>
      </XStack>

      <TextEditModal
        isVisible={bioModalVisible}
        onClose={() => setBioModalVisible(false)}
        currentNotes={userProfile?.bio || ""}
        onSave={handleBioSave}
        title="Edit Bio"
      />
    </>
  );
}
