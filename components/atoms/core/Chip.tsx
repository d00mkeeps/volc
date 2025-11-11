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
  borderWidth?: number;
  borderColor?: string;
  selectedTextColor?: string;
  selectedBorderColor?: string;
  selectedBackgroundColor?: string;
  selectedBackgroundOpacity?: number;
}

export default function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
  borderWidth = 1,
  borderColor,
  selectedTextColor = "$primary",
  selectedBorderColor = "$primary",
  selectedBackgroundColor = "$primaryTint",
  selectedBackgroundOpacity = 1,
}: ChipProps) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled}>
      <Stack
        position="relative"
        paddingHorizontal="$3"
        paddingVertical="$2.5"
        borderRadius={16}
        borderWidth={borderWidth}
        borderColor={
          selected ? selectedBorderColor : borderColor || "$borderSoft"
        }
        minHeight={44}
        justifyContent="center"
        alignItems="center"
        opacity={disabled ? 0.5 : 1}
      >
        {/* Background layer with opacity */}
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor={
            selected ? selectedBackgroundColor : "$backgroundMuted"
          }
          opacity={selected ? selectedBackgroundOpacity : 1}
          borderRadius={16}
          zIndex={0}
        />

        {/* Text content at full opacity */}
        <Stack zIndex={1}>
          <Text
            size="medium"
            color={selected ? selectedTextColor : "$text"}
            fontWeight={selected ? "700" : "500"}
          >
            {label}
          </Text>
        </Stack>
      </Stack>
    </TouchableOpacity>
  );
}
