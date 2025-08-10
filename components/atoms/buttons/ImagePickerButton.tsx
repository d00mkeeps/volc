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
  onImageUploaded?: (imageId: string) => void; // Changed: now returns imageId instead of imagePath
  onError?: (error: string) => void;
}

const sizeConfig = {
  sm: { width: "40%", height: 45, fontSize: "$7", iconSize: 16 },
  md: { width: "60%", height: 60, fontSize: "$9", iconSize: 20 },
  lg: { width: "80%", height: 75, fontSize: "$11", iconSize: 24 },
};

export default function ImagePickerButton({
  label = "Add Photo",
  icon = "camera",
  size = "md",
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

      // 3. Notify parent with image_id (not path!)
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
      backgroundColor="$primary"
      borderRadius="$4"
      pressStyle={{ backgroundColor: "$primaryLight" }}
      onPress={handleImagePick}
      disabled={uploading}
      opacity={uploading ? 0.7 : 1}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={icon ? "$1" : 0}
        flex={1}
      >
        {icon && (
          <Ionicons
            name={(uploading ? "sync" : icon) as any}
            size={config.iconSize}
            color="white"
          />
        )}
        <Text
          color="white"
          fontSize={config.fontSize}
          fontWeight="700"
          textAlign="center"
        >
          {uploading ? "Uploading..." : label}
        </Text>
      </Stack>
    </Button>
  );
}
