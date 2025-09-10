import React from "react";
import {
  Button as TamaguiButton,
  ButtonProps as TamaguiButtonProps,
} from "tamagui";

interface ButtonProps extends Omit<TamaguiButtonProps, "size"> {
  size?: "small" | "medium" | "large" | "$2" | "$3" | "$4" | "$5" | "$6";
}

export const Button: React.FC<ButtonProps> = ({
  size = "medium",
  backgroundColor = "$primary",
  borderRadius = "$4",
  fontWeight = "600",
  color = "$white",
  pressStyle,
  disabledStyle,
  maxWidth = "70%",
  alignSelf = "center",
  ...props
}) => {
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

  return (
    <TamaguiButton
      size={getSizeToken(semanticSize)}
      $sm={{ size: getTabletSizeToken(semanticSize) }}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      fontWeight={fontWeight}
      color={color}
      maxWidth={maxWidth}
      alignSelf={alignSelf}
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
    />
  );
};

export default Button;
