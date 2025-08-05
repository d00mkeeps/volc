import React, { useState, useEffect } from "react";
import { YStack, XStack, Text } from "tamagui";

export const LoadingMessage = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 4); // 0 -> 1 -> 2 -> 3 -> 0
    }, 200); // 0.2s intervals

    return () => clearInterval(interval);
  }, []);

  const getDotsText = () => {
    switch (phase) {
      case 0:
        return "";
      case 1:
        return ".";
      case 2:
        return ". .";
      case 3:
        return ". . .";
      default:
        return "";
    }
  };

  return (
    <XStack
      width="100%"
      justifyContent="flex-start" // Same as assistant messages
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <YStack
        maxWidth={"90%"}
        backgroundColor="transparent" // Same as assistant messages
        paddingHorizontal="$0"
        paddingVertical="$1"
        borderRadius="$0"
        opacity={0.7} // Slightly faded like streaming messages
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: 16,
            lineHeight: 18,
            fontWeight: "400",
            minHeight: 18, // Prevent layout jumps
            minWidth: 20, // Reserve space for dots
          }}
        >
          {getDotsText()}
        </Text>
      </YStack>
    </XStack>
  );
};
