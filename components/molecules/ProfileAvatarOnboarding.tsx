// /components/molecules/onboarding/ProfileAvatarOnboarding.tsx
import React, { useState, useEffect } from "react";
import { Stack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Image } from "expo-image";
import { imageService } from "@/services/api/imageService";
import ImagePickerButton from "@/components/atoms/ImagePickerButton";

interface ProfileAvatarOnboardingProps {
  firstName?: string;
  lastName?: string;
  onAvatarSelected?: (imageId: string) => void;
}

export default function ProfileAvatarOnboarding({
  firstName = "",
  lastName = "",
  onAvatarSelected,
}: ProfileAvatarOnboardingProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const displayName = `${firstName} ${lastName}`.trim() || "User";

  // Load avatar URL when imageId changes
  useEffect(() => {
    const loadAvatarUrl = async () => {
      if (selectedImageId) {
        try {
          setLoadingImage(true);
          console.log(
            `[ProfileAvatarOnboarding] Loading image id ${selectedImageId.slice(
              0,
              5
            )}`
          );
          const urlResponse = await imageService.getImageUrl(selectedImageId);
          if (urlResponse.success && urlResponse.data.url) {
            console.log(
              `[ProfileAvatarOnboarding] Got URL: ${urlResponse.data.url}`
            );
            setAvatarUrl(urlResponse.data.url);
          }
        } catch (error) {
          console.error(
            "[ProfileAvatarOnboarding] Error loading avatar URL:",
            error
          );
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
  }, [selectedImageId]);

  // /components/molecules/onboarding/ProfileAvatarOnboarding.handleImageUploaded
  const handleImageUploaded = async (imageId: string) => {
    console.log(`[ProfileAvatarOnboarding] Image uploaded with ID: ${imageId}`);
    setSelectedImageId(imageId);
    if (onAvatarSelected) {
      onAvatarSelected(imageId);
    }
  };

  // /components/molecules/onboarding/ProfileAvatarOnboarding.handleImageError
  const handleImageError = (error: string) => {
    console.error(`[ProfileAvatarOnboarding] Avatar upload error: ${error}`);
  };

  return (
    <YStack alignItems="center" gap="$2">
      <Stack
        width={120}
        height={120}
        borderRadius={60}
        backgroundColor="$backgroundMuted"
        justifyContent="center"
        alignItems="center"
        overflow="hidden"
        position="relative"
      >
        {/* Avatar Image or Fallback */}
        {loadingImage ? (
          <Text color="$text" fontSize="$3">
            Loading
          </Text>
        ) : avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <YStack alignItems="center" gap="$1">
            <Text color="$textSoft" fontSize="$5" fontWeight="600">
              {displayName.charAt(0).toUpperCase()}
            </Text>
            <Text color="$textSoft" fontSize="$1">
              Add Photo
            </Text>
          </YStack>
        )}

        {/* Image Picker Overlay - Always visible */}
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor={
            avatarUrl ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.2)"
          }
          justifyContent="center"
          alignItems="center"
          opacity={avatarUrl ? 0 : 1}
          hoverStyle={{ opacity: 1 }}
          pressStyle={{ opacity: 1 }}
        >
          <ImagePickerButton
            label={avatarUrl ? "Change" : undefined}
            icon="camera"
            size="small"
            onImageUploaded={handleImageUploaded}
            onError={handleImageError}
          />
        </Stack>
      </Stack>
    </YStack>
  );
}
