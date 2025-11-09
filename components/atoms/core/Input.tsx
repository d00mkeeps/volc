import React, { forwardRef } from "react";
import {
  Input as TamaguiInput,
  InputProps as TamaguiInputProps,
} from "tamagui";

interface InputProps extends Omit<TamaguiInputProps, "size"> {
  size?: "small" | "medium" | "large" | "$2" | "$3" | "$4" | "$5" | "$6";
}

export const Input = forwardRef<any, InputProps>(
  (
    {
      size = "medium",
      backgroundColor = "$backgroundSoft",
      borderRadius = "$4",
      borderWidth = 1,
      borderColor = "$borderColor",
      color = "$color",
      placeholderTextColor = "$textMuted",
      alignSelf = "center",
      ...props
    },
    ref
  ) => {
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
          return "$2";
        case "medium":
          return "$3";
        case "large":
          return "$4";
      }
    };

    const getTabletSizeToken = (size: "small" | "medium" | "large") => {
      switch (size) {
        case "small":
          return "$3";
        case "medium":
          return "$4";
        case "large":
          return "$5";
      }
    };

    return (
      <TamaguiInput
        size={getSizeToken(semanticSize)}
        $sm={{ size: getTabletSizeToken(semanticSize) }}
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        borderColor={borderColor}
        color={color}
        placeholderTextColor={placeholderTextColor}
        alignSelf={alignSelf}
        {...props}
        ref={ref}
      />
    );
  }
);

export default Input;
