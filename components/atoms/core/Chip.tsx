import React from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export default function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
}: ChipProps) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled}>
      <Stack
        paddingHorizontal="$3"
        paddingVertical="$2.5"
        borderRadius={16}
        borderWidth={1}
        borderColor={selected ? "$primary" : "$borderSoft"}
        backgroundColor={selected ? "$primaryTint" : "$backgroundMuted"}
        minHeight={44}
        justifyContent="center"
        alignItems="center"
        opacity={disabled ? 0.5 : 1}
      >
        <Text
          size="medium"
          color={selected ? "$primary" : "$text"}
          fontWeight={selected ? "700" : "500"}
        >
          {label}
        </Text>
      </Stack>
    </TouchableOpacity>
  );
}
