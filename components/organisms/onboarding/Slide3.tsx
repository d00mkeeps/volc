import React, { useState, useEffect } from "react";
import { YStack, TextArea, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import ImagePickerButton from "@/components/atoms/ImagePickerButton";
import { Image } from "expo-image";
import { imageService } from "@/services/api/imageService";

interface OnboardingSlide3Props {
  firstName: string;
  onComplete: (data: { bio: string; profilePictureId: string | null }) => void;
}

export function OnboardingSlide3({
  firstName,
  onComplete,
}: OnboardingSlide3Props) {
  const [bio, setBio] = useState("");
  const [profilePictureId, setProfilePictureId] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch image URL for preview when profilePictureId changes
  useEffect(() => {
    const loadImagePreview = async () => {
      if (profilePictureId) {
        try {
          setLoadingPreview(true);
          console.log(
            `[OnboardingSlide3] Loading preview for image: ${profilePictureId}`
          );
          const urlResponse = await imageService.getImageUrl(profilePictureId);
          if (urlResponse.success && urlResponse.data.url) {
            console.log(
              `[OnboardingSlide3] Got preview URL: ${urlResponse.data.url}`
            );
            setProfilePictureUrl(urlResponse.data.url);
          }
        } catch (error) {
          console.error("[OnboardingSlide3] Error loading preview:", error);
          setProfilePictureUrl(null);
        } finally {
          setLoadingPreview(false);
        }
      } else {
        setProfilePictureUrl(null);
      }
    };

    loadImagePreview();
  }, [profilePictureId]);

  const handleImageUploaded = (imageId: string) => {
    console.log(`[OnboardingSlide3] Image uploaded: ${imageId}`);
    setProfilePictureId(imageId);
  };

  const handleImageError = (error: string) => {
    console.error(`[OnboardingSlide3] Image upload error: ${error}`);
  };

  const handleComplete = () => {
    onComplete({
      bio: bio.trim(),
      profilePictureId,
    });
  };

  return (
    <YStack gap="$6" paddingBottom="$4" alignItems="center">
      <Text size="medium" fontWeight="bold" textAlign="center">
        One last thing, {firstName}..
      </Text>

      {/* Profile Picture Section */}
      <YStack gap="$3" alignItems="center" width="100%">
        <Text size="medium" fontWeight="600" color="$color" textAlign="center">
          Add a profile picture
        </Text>

        <XStack gap="$3" alignItems="center">
          {/* Avatar Circle */}
          <Stack
            width={120}
            height={120}
            borderRadius={60}
            backgroundColor="$backgroundMuted"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
          >
            {loadingPreview ? (
              <Text color="white" size="medium">
                ...
              </Text>
            ) : profilePictureUrl ? (
              <Image
                source={{ uri: profilePictureUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <ImagePickerButton
                label="Upload Photo"
                size="medium"
                fillContainer={true}
                onImageUploaded={handleImageUploaded}
                onError={handleImageError}
              />
            )}
          </Stack>

          {/* Change Button - only show when image is uploaded */}
          {profilePictureId && (
            <ImagePickerButton
              label="Change"
              size="small"
              onImageUploaded={handleImageUploaded}
              onError={handleImageError}
            />
          )}
        </XStack>
      </YStack>

      {/* Bio Section */}
      <YStack gap="$3" width="100%" maxWidth={400}>
        <Text size="medium" fontWeight="600" color="$color" textAlign="center">
          Tell us about yourself
        </Text>
        <YStack gap="$2">
          <TextArea
            value={bio}
            onChangeText={setBio}
            placeholder="Fitness background, favorite animal, etc.."
            minHeight={100}
            maxLength={250}
            borderColor="$borderColor"
          />
          <Text size="small" color="$textSoft" alignSelf="flex-end">
            {bio.length}/250
          </Text>
        </YStack>
      </YStack>

      <Button
        size="large"
        backgroundColor="$primary"
        onPress={handleComplete}
        width="80%"
        maxWidth={300}
      >
        Get Started
      </Button>
    </YStack>
  );
}
