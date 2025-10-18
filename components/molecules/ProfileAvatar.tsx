import React, { useState, useEffect } from "react";
import { Stack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Image } from "expo-image";
import { useUserStore } from "@/stores/userProfileStore";
import { imageService } from "@/services/api/imageService";
import ImagePickerButton from "../atoms/ImagePickerButton";
import LongPressToEdit from "../atoms/core/LongPressToEdit";

interface ProfileAvatarProps {
  editMode?: boolean;
  pendingAvatarId?: string | null;
  onAvatarSelected?: (imageId: string) => void;
}

export default function ProfileAvatar({
  editMode = false,
  pendingAvatarId = null,
  onAvatarSelected,
}: ProfileAvatarProps) {
  const { userProfile } = useUserStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [longPressEditMode, setLongPressEditMode] = useState(false);

  useEffect(() => {
    console.log(
      "[ProfileAvatar] Component mounted, profile avatar_image_id:",
      userProfile?.avatar_image_id
    );
  }, []);

  const displayName =
    `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() ||
    "User";

  // Load current saved avatar
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

  // Load pending avatar preview in edit mode
  useEffect(() => {
    const loadPendingAvatarUrl = async () => {
      if (pendingAvatarId) {
        try {
          console.log(
            `[ProfileAvatar] Loading pending image id ${pendingAvatarId.slice(
              0,
              5
            )}`
          );
          const urlResponse = await imageService.getImageUrl(pendingAvatarId);
          if (urlResponse.success && urlResponse.data.url) {
            console.log(
              `[ProfileAvatar] Got pending URL: ${urlResponse.data.url}`
            );
            setPendingAvatarUrl(urlResponse.data.url);
          }
        } catch (error) {
          console.error(
            "[ProfileAvatar] Error loading pending avatar URL:",
            error
          );
          setPendingAvatarUrl(null);
        }
      } else {
        setPendingAvatarUrl(null);
      }
    };
    loadPendingAvatarUrl();
  }, [pendingAvatarId]);

  const handleLongPress = () => {
    setLongPressEditMode(true);
  };

  const handleImageUploaded = async (imageId: string) => {
    console.log(`[ProfileAvatar] Image uploaded with ID: ${imageId}`);
    if (onAvatarSelected) {
      onAvatarSelected(imageId);
    }
    // Exit edit mode after successful upload
    setLongPressEditMode(false);
  };

  const handleImageError = (error: string) => {
    console.error(`[ProfileAvatar] Avatar upload error: ${error}`);
    // Exit edit mode on error too
    setLongPressEditMode(false);
  };

  // Show edit overlay if either external editMode or internal longPressEditMode is true
  const isInEditMode = editMode || longPressEditMode;

  // In edit mode, show pending avatar if exists, otherwise show current
  const displayUrl =
    isInEditMode && pendingAvatarUrl ? pendingAvatarUrl : avatarUrl;

  return (
    <YStack alignItems="center" gap="$2">
      <LongPressToEdit onLongPress={handleLongPress}>
        <Stack
          width="100%"
          aspectRatio={1}
          minWidth={70}
          borderRadius={32}
          backgroundColor="$backgroundMuted"
          justifyContent="center"
          alignItems="center"
          overflow="hidden"
          position="relative"
        >
          {/* Avatar Image */}
          {loadingImage ? (
            <Text color="$text" fontSize="$3">
              Loading
            </Text>
          ) : displayUrl ? (
            <Image
              source={{ uri: displayUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <Text color="$text" fontSize="$4" fontWeight="600">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}

          {/* Edit Mode Overlay */}
          {isInEditMode && (
            <Stack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              backgroundColor="rgba(0, 0, 0, 0.5)"
              justifyContent="center"
              alignItems="center"
            >
              <ImagePickerButton
                label="Change"
                size="small"
                onImageUploaded={handleImageUploaded}
                onError={handleImageError}
              />
            </Stack>
          )}
        </Stack>
      </LongPressToEdit>
    </YStack>
  );
}
