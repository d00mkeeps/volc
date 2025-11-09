// /components/atoms/ImagePickerButton
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { Plus, RotateCw, Camera } from "@/assets/icons/IconMap";
import { Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { imageService } from "@/services/api/imageService";

interface ImagePickerButtonProps {
  label?: string;
  icon?: string;
  size?: "small" | "medium" | "large";
  fillContainer?: boolean;
  asFAB?: boolean;
  backgroundColor?: string; // ✅ NEW: Custom background color
  onImageUploaded?: (imageId: string) => void;
  onError?: (error: string) => void;
}

const getIconSize = (size: "small" | "medium" | "large") => {
  switch (size) {
    case "small":
      return 18;
    case "medium":
      return 22;
    case "large":
      return 26;
  }
};

// ✅ NEW: Get button height based on size
const getButtonHeight = (size: "small" | "medium" | "large") => {
  switch (size) {
    case "small":
      return 50;
    case "medium":
      return 60;
    case "large":
      return 70;
  }
};

// ✅ NEW: Get button height based on size
const getButtonWidth = (size: "small" | "medium" | "large") => {
  switch (size) {
    case "small":
      return 80;
    case "medium":
      return 100;
    case "large":
      return 150;
  }
};

export default function ImagePickerButton({
  label,
  icon = "add",
  size = "medium",
  fillContainer = false,
  asFAB = false,
  backgroundColor, // ✅ NEW
  onImageUploaded,
  onError,
}: ImagePickerButtonProps) {
  const [uploading, setUploading] = useState(false);

  const getIconComponent = (iconName: string, uploading: boolean) => {
    if (uploading) return RotateCw;
    if (iconName === "camera") return Camera;
    return iconName === "add" ? Plus : Plus;
  };

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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const imageUri = result.assets[0].uri;
      const fileExtension = imageUri.split(".").pop() || "jpg";

      const tempResponse = await imageService.createTempImage(fileExtension);
      if (
        !tempResponse.success ||
        !tempResponse.upload_url ||
        !tempResponse.image_id
      ) {
        throw new Error(tempResponse.error || "Failed to create temp image");
      }

      const uploadSuccess = await imageService.uploadImage(
        tempResponse.upload_url,
        imageUri
      );
      if (!uploadSuccess) {
        throw new Error("Upload failed");
      }

      console.log(
        `[ImagePickerButton] Committing image to permanent: ${tempResponse.image_id}`
      );
      const commitResponse = await imageService.commitImage(
        tempResponse.image_id
      );
      if (!commitResponse.success) {
        throw new Error(commitResponse.error || "Failed to commit image");
      }

      console.log(
        `[ImagePickerButton] Image uploaded and committed successfully: ${tempResponse.image_id}`
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

  // ✅ FAB Style
  if (asFAB) {
    // ✅ Icon size based on whether label exists
    const iconSize = label ? 20 : 28;
    const buttonHeight = getButtonHeight(size); // ✅ Dynamic button height based on size
    const buttonWidth = getButtonWidth(size);
    const bgColor =
      backgroundColor || (uploading ? "$backgroundMuted" : "$primary"); // ✅ Use custom or default color

    return (
      <Button
        width={buttonWidth}
        height={buttonHeight} // ✅ Dynamic height
        alignSelf="center"
        backgroundColor={bgColor} // ✅ Custom background color
        borderRadius="$4"
        pressStyle={
          uploading
            ? {}
            : {
                backgroundColor: backgroundColor
                  ? backgroundColor
                  : "$primaryMuted",
                scale: 0.98,
              }
        }
        hoverStyle={
          uploading
            ? {}
            : {
                backgroundColor: backgroundColor
                  ? backgroundColor
                  : "$primaryLight",
              }
        }
        opacity={uploading ? 0.6 : 1}
        onPress={uploading ? () => {} : handleImagePick}
        disabled={uploading}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          gap={label ? "$1" : 0}
          flex={1}
        >
          {React.createElement(getIconComponent(icon, uploading), {
            size: iconSize, // ✅ Dynamic icon size
            color: uploading ? "#999" : "white",
          })}
          {label && (
            <Text
              color={uploading ? "$textMuted" : "white"}
              size="large"
              fontWeight="700"
              textAlign="center"
            >
              {uploading ? "loading.." : label}
            </Text>
          )}
        </Stack>
      </Button>
    );
  }

  // ✅ Original Style
  return (
    <Button
      size={fillContainer ? undefined : size}
      width={fillContainer ? "100%" : undefined}
      height={fillContainer ? "100%" : undefined}
      alignSelf={fillContainer ? undefined : "center"}
      backgroundColor="$backgroundMuted"
      borderRadius={fillContainer ? "$0" : "$3"}
      pressStyle={{ backgroundColor: "#4B5563" }}
      onPress={handleImagePick}
      disabled={uploading}
      opacity={uploading ? 0.7 : 1}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={label ? "$1" : 0}
        flexDirection={label ? "column" : "row"}
      >
        {React.createElement(getIconComponent(icon, uploading), {
          size: getIconSize(size),
          color: "$text",
        })}
        {label && (
          <Text color="$text" size="medium" fontWeight="500" textAlign="center">
            {uploading ? "..." : label}
          </Text>
        )}
      </Stack>
    </Button>
  );
}
