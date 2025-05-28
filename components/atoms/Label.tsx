import React from "react";
import { Text } from "tamagui";

interface LabelProps {
  children: string;
  isActive: boolean;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
}

export default function Label({
  children,
  isActive,
  fontSize = "$2",
  fontWeight = "600",
  textAlign = "left",
}: LabelProps) {
  return (
    <Text
      fontSize={fontSize}
      fontWeight={fontWeight}
      color={isActive ? "$textSoft" : "$textMuted"}
      textAlign={textAlign}
    >
      {children}
    </Text>
  );
}
