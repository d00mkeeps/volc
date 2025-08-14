import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Stack, Text } from "tamagui";
import { imageService } from "@/services/api/imageService";

interface ImagePickerButtonProps {
  label?: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
  onImageUploaded?: (imageId: string) => void;
  onError?: (error: string) => void;
}

const sizeConfig = {
  sm: { width: 40, height: 40, fontSize: "$2", iconSize: 16 }, // Made square and smaller
  md: { width: 48, height: 48, fontSize: "$3", iconSize: 20 }, // Made square
  lg: { width: 64, height: 64, fontSize: "$4", iconSize: 24 }, // Made square
};

export default function ImagePickerButton({
  label,
  icon = "add", // Changed default from "camera" to "add"
  size = "sm", // Changed default to sm for more subtle appearance
  onImageUploaded,
  onError,
}: ImagePickerButtonProps) {
  const [uploading, setUploading] = useState(false);

  const config = sizeConfig[size];

  const handleImagePick = async () => {
    setUploading(true);

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square for profile pics
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const imageUri = result.assets[0].uri;
      const fileExtension = imageUri.split(".").pop() || "jpg";

      // 1. Create temp image record + get upload URL
      const tempResponse = await imageService.createTempImage(fileExtension);

      if (
        !tempResponse.success ||
        !tempResponse.upload_url ||
        !tempResponse.image_id
      ) {
        throw new Error(tempResponse.error || "Failed to create temp image");
      }

      // 2. Upload file to Supabase storage
      const uploadSuccess = await imageService.uploadImage(
        tempResponse.upload_url,
        imageUri
      );

      if (!uploadSuccess) {
        throw new Error("Upload failed");
      }

      // 3. Notify parent with image_id
      console.log(
        `[ImagePickerButton] Image uploaded successfully: ${tempResponse.image_id}`
      );
      onImageUploaded?.(tempResponse.image_id);
    } catch (error) {
      console.error("[ImagePickerButton] Error:", error);
      onError?.(error instanceof Error ? error.message : String(error));
      Alert.alert("Upload Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Button
      width={config.width}
      height={config.height}
      alignSelf="center"
      backgroundColor="#374151" // Dark gray instead of $primary
      borderRadius="$3" // Rounded square
      pressStyle={{ backgroundColor: "#4B5563" }} // Slightly lighter on press
      onPress={handleImagePick}
      disabled={uploading}
      opacity={uploading ? 0.7 : 1}
      padding={0} // Remove padding for clean square look
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={label ? "$1" : 0}
        flex={1}
      >
        <Ionicons
          name={(uploading ? "sync" : icon) as any}
          size={config.iconSize}
          color="white"
        />
        {label && (
          <Text
            color="white"
            fontSize={config.fontSize}
            fontWeight="500" // Reduced from 700 for subtlety
            textAlign="center"
          >
            {uploading ? "..." : label}
          </Text>
        )}
      </Stack>
    </Button>
  );
}
