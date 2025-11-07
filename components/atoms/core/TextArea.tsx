import React, { forwardRef, useRef } from "react";
import {
  TextArea as TamaguiTextArea,
  TextAreaProps as TamaguiTextAreaProps,
} from "tamagui";

interface TextAreaProps extends Omit<TamaguiTextAreaProps, "size"> {
  size?: "small" | "medium" | "large" | "$2" | "$3" | "$4" | "$5" | "$6";
  enableMarkdownHelpers?: boolean; // New prop to enable/disable markdown features
}

export const TextArea = forwardRef<any, TextAreaProps>(
  (
    {
      size = "medium",
      backgroundColor = "$backgroundSoft",
      borderRadius = "$4",
      borderWidth = 1,
      borderColor = "$primary",
      color = "$color",
      placeholderTextColor = "$textMuted",
      alignSelf = "center",
      enableMarkdownHelpers = false,
      onChangeText,
      ...props
    },
    ref
  ) => {
    const previousTextRef = useRef(props.value || props.defaultValue || "");
    const selectionRef = useRef({ start: 0, end: 0 });

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
          return "$3";
        case "medium":
          return "$4";
        case "large":
          return "$5";
      }
    };

    const handleTextChange = (newText: string) => {
      const prevText = previousTextRef.current;

      // If markdown helpers are disabled, just pass through
      if (!enableMarkdownHelpers) {
        previousTextRef.current = newText;
        onChangeText?.(newText);
        return;
      }

      // Detect if exactly one newline character was added
      if (newText.length === prevText.length + 1 && newText.includes("\n")) {
        // Find where the newline was added
        let newlinePos = -1;
        for (let i = 0; i < newText.length; i++) {
          if (i >= prevText.length || newText[i] !== prevText[i]) {
            if (newText[i] === "\n") {
              newlinePos = i;
            }
            break;
          }
        }

        if (newlinePos !== -1) {
          // Get the line before the newline
          const textBeforeNewline = newText.substring(0, newlinePos);
          const lines = textBeforeNewline.split("\n");
          const previousLine = lines[lines.length - 1] || "";

          // Match bullet patterns: "- " or "* " with optional leading spaces
          const bulletMatch = previousLine.match(/^(\s*)([-*])\s(.*)$/);

          // Match numbered list patterns: "1. " or "2. " with optional leading spaces
          const numberedMatch = previousLine.match(/^(\s*)(\d+)\.\s(.*)$/);

          if (bulletMatch) {
            const indent = bulletMatch[1];
            const bulletChar = bulletMatch[2];
            const content = bulletMatch[3];

            // If the line only has a bullet with no content, break out of list
            if (content.trim() === "") {
              const beforeBullet = newText.substring(
                0,
                newlinePos - previousLine.length
              );
              const afterNewline = newText.substring(newlinePos + 1);
              const updatedText = beforeBullet + "\n" + afterNewline;

              previousTextRef.current = updatedText;
              onChangeText?.(updatedText);
              return;
            }

            // Add new bullet with same indentation
            const newBullet = `${indent}${bulletChar} `;
            const afterNewline = newText.substring(newlinePos + 1);
            const updatedText =
              newText.substring(0, newlinePos + 1) + newBullet + afterNewline;

            previousTextRef.current = updatedText;
            onChangeText?.(updatedText);
            return;
          } else if (numberedMatch) {
            const indent = numberedMatch[1];
            const number = parseInt(numberedMatch[2], 10);
            const content = numberedMatch[3];

            // If the line only has a number with no content, break out of list
            if (content.trim() === "") {
              const beforeNumber = newText.substring(
                0,
                newlinePos - previousLine.length
              );
              const afterNewline = newText.substring(newlinePos + 1);
              const updatedText = beforeNumber + "\n" + afterNewline;

              previousTextRef.current = updatedText;
              onChangeText?.(updatedText);
              return;
            }

            // Add new numbered item with incremented number
            const nextNumber = number + 1;
            const newNumberedItem = `${indent}${nextNumber}. `;
            const afterNewline = newText.substring(newlinePos + 1);
            const updatedText =
              newText.substring(0, newlinePos + 1) +
              newNumberedItem +
              afterNewline;

            previousTextRef.current = updatedText;
            onChangeText?.(updatedText);
            return;
          }
        }
      }

      // Normal text change
      previousTextRef.current = newText;
      onChangeText?.(newText);
    };

    return (
      <TamaguiTextArea
        size={getSizeToken(semanticSize)}
        $sm={{ size: getTabletSizeToken(semanticSize) }}
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        borderColor={borderColor}
        color={color}
        placeholderTextColor={placeholderTextColor}
        alignSelf={alignSelf}
        onChangeText={handleTextChange}
        onSelectionChange={(e) => {
          selectionRef.current = e.nativeEvent.selection;
        }}
        {...props}
        ref={ref}
      />
    );
  }
);

export default TextArea;
