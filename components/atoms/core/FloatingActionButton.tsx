// /components/atoms/FloatingActionButton
import { AppIcon, AppIconName } from "@/assets/icons/IconMap";
import React from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";

interface ActionButtonProps {
  icon?: React.ComponentType<{ size: number; color: string }>; // ✅ Now accepts icon component
  iconName?: string; // ✅ Keep backward compatibility with icon name strings
  label?: string; // ✅ Now optional
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: string; // ✅ NEW: Custom background color
}

const getIconName = (iconName: string): AppIconName => {
  const iconMap: Record<string, AppIconName> = {
    "add-circle": "PlusCircle",
    "settings-outline": "Settings",
    play: "Play",
    pause: "Pause",
  };
  return iconMap[iconName] || "PlusCircle";
};

export default function FloatingActionButton({
  icon,
  iconName,
  label,
  onPress,
  disabled = false,
  backgroundColor, // ✅ NEW
}: ActionButtonProps) {
  // Use provided icon component, or fall back to iconName lookup
  const resolvedIconName = iconName ? getIconName(iconName) : "PlusCircle";

  // ✅ Icon size based on whether label exists
  const iconSize = label ? 20 : 28;

  // ✅ Determine background color
  const bgColor =
    backgroundColor || (disabled ? "$backgroundMuted" : "$primary");

  return (
    <Button
      width="50%"
      height={60}
      alignSelf="center"
      backgroundColor={bgColor}
      borderRadius="$4"
      pressStyle={
        disabled
          ? {}
          : {
              backgroundColor: backgroundColor
                ? backgroundColor
                : "$primaryMuted",
              scale: 0.98,
            }
      }
      hoverStyle={
        disabled
          ? {}
          : {
              backgroundColor: backgroundColor
                ? backgroundColor
                : "$primaryLight",
            }
      }
      opacity={disabled ? 0.6 : 1}
      onPress={disabled ? () => {} : onPress}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={label ? "$1" : 0}
        flex={1}
      >
        {icon ? (
          React.createElement(icon, {
            size: iconSize,
            color: disabled ? "#999" : "white",
          })
        ) : (
          <AppIcon
            name={resolvedIconName}
            size={iconSize}
            color={disabled ? "#999" : "white"}
          />
        )}
        {label && (
          <Text
            color={disabled ? "$textMuted" : "white"}
            size="large"
            fontWeight="700"
            textAlign="center"
          >
            {label}
          </Text>
        )}
      </Stack>
    </Button>
  );
}
