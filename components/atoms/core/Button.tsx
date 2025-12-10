import React from "react";
import {
  Button as TamaguiButton,
  ButtonProps as TamaguiButtonProps,
  Stack,
} from "tamagui";
import { TouchableOpacity, useColorScheme } from "react-native";
import { BlurView } from "expo-blur";

interface __ButtonProps__ extends Omit<TamaguiButtonProps, "size" | "variant"> {
  size?: "small" | "medium" | "large" | "$2" | "$3" | "$4" | "$5" | "$6";
  variant?: "default" | "blur";
  blurIntensity?: number;
}

export const Button: React.FC<__ButtonProps__> = ({
  size = "medium",
  backgroundColor = "$primary",
  borderRadius = "$4",
  fontWeight = "600",
  color = "$white",
  pressStyle,
  disabledStyle,
  alignSelf = "center",
  variant = "default",
  blurIntensity = 60,
  disabled,
  onPress,
  children,
  ...props
}) => {
  const colorScheme = useColorScheme();

  // Map old Tamagui tokens to new semantic sizes
  const mapTokenToSemantic = (size: string): "small" | "medium" | "large" => {
    if (size.startsWith("$")) {
      switch (size) {
        case "$2":
        case "$3":
          return "small";
        case "$4":
          return "medium";
        case "$5":
        case "$6":
          return "large";
        default:
          return "medium";
      }
    }
    return size as "small" | "medium" | "large";
  };

  const semanticSize = mapTokenToSemantic(size);

  // Map semantic sizes to Tamagui size tokens
  const getSizeToken = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small":
        return "$3";
      case "medium":
        return "$4";
      case "large":
        return "$5";
    }
  };

  const getTabletSizeToken = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small":
        return "$4";
      case "medium":
        return "$5";
      case "large":
        return "$6";
    }
  };

  // Get padding based on size for blur variant
  const getPadding = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small":
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case "medium":
        return { paddingVertical: 12, paddingHorizontal: 20 };
      case "large":
        return { paddingVertical: 16, paddingHorizontal: 24 };
    }
  };

  // Get border radius value
  const getRadiusValue = () => {
    if (typeof borderRadius === "string" && borderRadius.startsWith("$")) {
      // Map token to numeric value
      const tokenMap: Record<string, number> = {
        $1: 4,
        $2: 8,
        $3: 12,
        $4: 16,
        $5: 20,
      };
      return tokenMap[borderRadius] || 16;
    }
    return typeof borderRadius === "number" ? borderRadius : 16;
  };

  // Render blur variant
  if (variant === "blur") {
    const padding = getPadding(semanticSize);
    const radiusValue = getRadiusValue();

    return (
      <TouchableOpacity
        onPress={onPress || undefined}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.5 : 1,
          overflow: "hidden",
          borderRadius: radiusValue,
          alignSelf: alignSelf as any,
        }}
        activeOpacity={0.7}
      >
        <BlurView
          intensity={blurIntensity}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={{
            ...padding,
            borderRadius: radiusValue,
            overflow: "hidden",
            borderColor: "#999",
            borderWidth: 0.25,
          }}
        >
          <Stack alignItems="center" justifyContent="center">
            {children}
          </Stack>
        </BlurView>
      </TouchableOpacity>
    );
  }

  // Default variant - standard Tamagui button
  return (
    <TamaguiButton
      size={getSizeToken(semanticSize)}
      $sm={{ size: getTabletSizeToken(semanticSize) }}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      fontWeight={fontWeight}
      color={color}
      alignSelf={alignSelf}
      disabled={disabled}
      onPress={onPress}
      pressStyle={{
        backgroundColor: "$primaryPress",
        scale: 0.98,
        ...pressStyle,
      }}
      disabledStyle={{
        backgroundColor: "$backgroundMuted",
        opacity: 0.7,
        ...disabledStyle,
      }}
      {...props}
    >
      {children}
    </TamaguiButton>
  );
};

export default Button;
