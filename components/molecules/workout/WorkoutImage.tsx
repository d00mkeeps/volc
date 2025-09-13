import React, { useState, useEffect } from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Image } from "expo-image";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { imageService } from "@/services/api/imageService";

interface WorkoutImageProps {
  size?: number;
  borderRadius?: number;
  fallbackText?: string;
  imageId?: string;
}

export default function WorkoutImage({
  size = 200,
  borderRadius = 8,
  fallbackText = "No Image",
  imageId: propImageId,
}: WorkoutImageProps) {
  const { currentWorkout, pendingImageId } = useUserSessionStore();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Priority: pendingImageId > currentWorkout.image_id
  const imageId = propImageId || pendingImageId || currentWorkout?.image_id;

  useEffect(() => {
    const loadImageUrl = async () => {
      if (imageId) {
        try {
          setLoading(true);
          console.log(
            `[WorkoutImage] Loading image ID: ${imageId.slice(0, 8)}`
          );
          const urlResponse = await imageService.getImageUrl(imageId);
          if (urlResponse.success && urlResponse.data.url) {
            // ✅ Fixed: use urlResponse.data.url
            console.log(`[WorkoutImage] Got URL for display`);
            setImageUrl(urlResponse.data.url);
          } else {
            console.log(`[WorkoutImage] Failed to get URL:`, urlResponse.error);
            setImageUrl(null);
          }
        } catch (error) {
          console.error("[WorkoutImage] Error loading image URL:", error);
          setImageUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        setImageUrl(null);
        setLoading(false);
      }
    };

    loadImageUrl();
  }, [imageId]);

  return (
    <Stack
      width={size}
      height={size}
      borderRadius={borderRadius}
      backgroundColor="$backgroundSoft"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
    >
      {loading ? (
        <Text color="$textMuted" size="medium">
          Loading...
        </Text>
      ) : imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      ) : (
        <Text color="$textMuted" size="medium">
          {fallbackText}
        </Text>
      )}
    </Stack>
  );
}
