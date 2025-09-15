import React, { useState, useEffect } from "react";
import { Stack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Image } from "expo-image";
import { useUserStore } from "@/stores/userProfileStore";
import { imageService } from "@/services/api/imageService";
import ImagePickerButton from "../atoms/ImagePickerButton";

interface ProfileAvatarProps {
  editMode?: boolean;
}

export default function ProfileAvatar({
  editMode = false,
}: ProfileAvatarProps) {
  const { userProfile, updateProfile } = useUserStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    console.log(
      "[ProfileAvatar] Component mounted, profile avatar_image_id:",
      userProfile?.avatar_image_id
    );
  }, []);

  const displayName =
    `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() ||
    "User";

  useEffect(() => {
    const loadAvatarUrl = async () => {
      if (userProfile?.avatar_image_id) {
        try {
          setLoadingImage(true);
          console.log(
            `[ProfileAvatar] Loading image id ${userProfile.avatar_image_id.slice(
              0,
              5
            )}`
          );
          const urlResponse = await imageService.getImageUrl(
            userProfile.avatar_image_id
          );
          console.log(`[ProfileAvatar] Full response:`, urlResponse);
          if (urlResponse.success && urlResponse.data.url) {
            console.log(`[ProfileAvatar] Got URL: ${urlResponse.data.url}`);
            setAvatarUrl(urlResponse.data.url);
          }
        } catch (error) {
          console.error("[ProfileAvatar] Error loading avatar URL:", error);
          setAvatarUrl(null);
        } finally {
          setLoadingImage(false);
        }
      } else {
        setAvatarUrl(null);
        setLoadingImage(false);
      }
    };

    loadAvatarUrl();
  }, [userProfile?.avatar_image_id]);

  const handleImageUploaded = async (imageId: string) => {
    try {
      await updateProfile({ avatar_image_id: imageId });
      console.log("[ProfileAvatar] Avatar updated successfully");
    } catch (error) {
      console.error("[ProfileAvatar] Failed to update avatar:", error);
    }
  };

  const handleImageError = (error: string) => {
    console.error(`[ProfileAvatar] Avatar upload error: ${error}`);
  };

  return (
    <YStack alignItems="center" gap="$2">
      <Stack
        width="100%"
        aspectRatio={1}
        minWidth={70}
        borderRadius={32}
        backgroundColor={editMode ? "$backgroundMuted" : "$transparent"}
        justifyContent="center"
        alignItems="center"
        overflow="hidden"
      >
        {editMode ? (
          <ImagePickerButton
            label="Change Photo"
            size="medium"
            onImageUploaded={handleImageUploaded}
            onError={handleImageError}
          />
        ) : loadingImage ? (
          <Text color="white" fontSize="$3">
            ...
          </Text>
        ) : avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Text color="white" fontSize="$4" fontWeight="600">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </Stack>
    </YStack>
  );
}
