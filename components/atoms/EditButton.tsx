import React from "react";
import { Stack } from "tamagui";
import { Pencil } from "@/assets/icons/IconMap";
import GradientBlur from "./core/GradientBlur";

interface EditButtonProps {
  onPress: () => void;
  size?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export default function EditButton({
  onPress,
  size = 40,
  position = "top-right",
}: EditButtonProps) {
  const iconSize = Math.round(size * 0.5); // Icon is 50% of button size

  // Position styles for flexibility
  const getPositionStyles = () => {
    const offset = "$2";
    switch (position) {
      case "top-right":
        return { top: offset, right: offset };
      case "top-left":
        return { top: offset, left: offset };
      case "bottom-right":
        return { bottom: offset, right: offset };
      case "bottom-left":
        return { bottom: offset, left: offset };
      default:
        return { top: offset, right: offset };
    }
  };

  return (
    <Stack
      position="absolute"
      {...getPositionStyles()}
      width={size}
      height={size}
      borderRadius={size / 2}
      overflow="hidden"
      pressStyle={{ scale: 0.95 }}
      onPress={onPress}
    >
      <GradientBlur />
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        justifyContent="center"
        alignItems="center"
      >
        <Pencil size={iconSize} color="white" />
      </Stack>
    </Stack>
  );
}
