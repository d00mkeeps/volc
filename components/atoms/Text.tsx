import React from "react";
import { Text as TamaguiText, TextProps as TamaguiTextProps } from "tamagui";

interface TextProps extends TamaguiTextProps {
  size?:
    | "small"
    | "medium"
    | "large"
    | "xl"
    | "$1"
    | "$2"
    | "$3"
    | "$4"
    | "$5"
    | "$6"
    | "$8"
    | "$9";
  variant?: "heading" | "body" | "caption";
}

export const Text: React.FC<TextProps> = ({
  size = "medium",
  variant = "body",
  color = "$color",
  fontSize, // Extract fontSize so we can override it
  fontFamily, // Extract fontFamily so we can override it
  fontWeight, // Extract fontWeight so we can override it
  ...props
}) => {
  // Map old Tamagui tokens to new semantic sizes
  const mapTokenToSemantic = (
    size: string
  ): "small" | "medium" | "large" | "xl" => {
    if (size.startsWith("$")) {
      switch (size) {
        case "$1":
        case "$2":
          return "small";
        case "$3":
        case "$4":
          return "medium";
        case "$5":
        case "$6":
          return "large";
        case "$8":
        case "$9":
          return "xl";
        default:
          return "medium";
      }
    }
    return size as "small" | "medium" | "large" | "xl";
  };

  const semanticSize = mapTokenToSemantic(size);

  // Map semantic sizes to Tamagui fontSize tokens
  const getSizeToken = (size: "small" | "medium" | "large" | "xl") => {
    switch (size) {
      case "small":
        return "$2"; // 14px mobile
      case "medium":
        return "$4"; // 18px mobile
      case "large":
        return "$5"; // 20px mobile
      case "xl":
        return "$8"; // 28px mobile
    }
  };

  const getTabletSizeToken = (size: "small" | "medium" | "large" | "xl") => {
    switch (size) {
      case "small":
        return "$3"; // 16px tablet
      case "medium":
        return "$5"; // 20px tablet
      case "large":
        return "$6"; // 24px tablet
      case "xl":
        return "$9"; // 32px tablet
    }
  };

  // Set font family based on variant (only if not explicitly provided)
  const getFontFamily = (variant: "heading" | "body" | "caption") => {
    if (fontFamily) return fontFamily; // Use explicit fontFamily if provided
    switch (variant) {
      case "heading":
        return "$heading";
      case "body":
      case "caption":
        return "$body";
    }
  };

  // Set font weight based on variant (only if not explicitly provided)
  const getFontWeight = (variant: "heading" | "body" | "caption") => {
    if (fontWeight) return fontWeight; // Use explicit fontWeight if provided
    switch (variant) {
      case "heading":
        return "600";
      case "body":
        return "400";
      case "caption":
        return "400";
    }
  };

  return (
    <TamaguiText
      fontSize={fontSize || getSizeToken(semanticSize)} // Use explicit fontSize or our responsive one
      $sm={{ fontSize: fontSize || getTabletSizeToken(semanticSize) }}
      fontFamily={getFontFamily(variant)}
      fontWeight={getFontWeight(variant)}
      color={color}
      {...props}
    />
  );
};

export default Text;
