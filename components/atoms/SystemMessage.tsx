import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";

type MessageType = "error" | "success" | "info";

interface SystemMessageProps {
  message: string;
  type: MessageType;
}

export function SystemMessage({ message, type }: SystemMessageProps) {
  const getBackgroundColor = (type: MessageType) => {
    switch (type) {
      case "error":
        return "#ffebee";
      case "success":
        return "#e8f5e8";
      case "info":
        return "#e3f2fd";
    }
  };

  const getBorderColor = (type: MessageType) => {
    switch (type) {
      case "error":
        return "#ffcdd2";
      case "success":
        return "#c8e6c9";
      case "info":
        return "#bbdefb";
    }
  };

  const getTextColor = (type: MessageType) => {
    switch (type) {
      case "error":
        return "#c62828";
      case "success":
        return "#2e7d32";
      case "info":
        return "#1565c0";
    }
  };

  return (
    <YStack
      backgroundColor={getBackgroundColor(type)}
      padding="$3"
      borderRadius="$3"
      marginBottom="$4"
      borderWidth={1}
      borderColor={getBorderColor(type)}
    >
      <Text size="small" color={getTextColor(type)}>
        {type === "success" && "✅ "}
        {type === "error" && "❌ "}
        {message}
      </Text>
    </YStack>
  );
}

export default SystemMessage;
