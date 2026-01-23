import React from "react";
import { Text as TamaguiText, TextProps as TamaguiTextProps } from "tamagui";
import { useLayoutStore } from "@/stores/layoutStore";

/**
 * Responsive Text component that automatically scales font size based on device.
 *
 * @usage
 * ```tsx
 * // Preferred: Use semantic size props (responsive)
 * <Text size="small">Caption text</Text>   // 12-14px depending on device
 * <Text size="medium">Body text</Text>     // 14-16px depending on device
 * <Text size="large">Heading text</Text>   // 16-20px depending on device
 * <Text size="xl">Large heading</Text>     // 20-24px depending on device
 * <Text size="xxl">Hero text</Text>        // 24-32px depending on device
 *
 * // Avoid: Hardcoded fontSize (not responsive)
 * <Text fontSize={16}>Fixed size</Text>    // ❌ Won't scale on SE
 * ```
 *
 * Font sizes by device:
 * - iPhone SE (small):    xs=10, sm=12, md=14, lg=16, xl=20, xxl=24
 * - Standard phones:      xs=11, sm=13, md=15, lg=18, xl=22, xxl=28
 * - Plus/Max phones:      xs=12, sm=14, md=16, lg=20, xl=24, xxl=32
 */

interface TextProps extends TamaguiTextProps {
  size?: "xs" | "small" | "medium" | "large" | "xl" | "xxl";
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
  const tokens = useLayoutStore((state) => state.tokens);

  // Map semantic size to responsive token value
  const getResponsiveFontSize = (
    size: "xs" | "small" | "medium" | "large" | "xl" | "xxl",
  ): number => {
    switch (size) {
      case "xs":
        return tokens.fontSize.xs;
      case "small":
        return tokens.fontSize.sm;
      case "medium":
        return tokens.fontSize.md;
      case "large":
        return tokens.fontSize.lg;
      case "xl":
        return tokens.fontSize.xl;
      case "xxl":
        return tokens.fontSize.xxl;
      default:
        return tokens.fontSize.md;
    }
  };

  // Set font family based on variant (only if not explicitly provided)
  const getFontFamily = (variant: "heading" | "body" | "caption") => {
    if (fontFamily) return fontFamily;
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
    if (fontWeight) return fontWeight;
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
      fontSize={fontSize || getResponsiveFontSize(size)}
      fontFamily={getFontFamily(variant)}
      fontWeight={getFontWeight(variant)}
      color={color}
      {...props}
    />
  );
};

export default Text;
