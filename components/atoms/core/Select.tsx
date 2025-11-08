// /components/atoms/core/Select.tsx

import React, { useState } from "react";
import { Stack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Lock } from "@/assets/icons/IconMap";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean; // Add this
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export default function Select({
  options,
  value,
  placeholder = "Select...",
  onValueChange,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Stack position="relative">
      {/* Select Trigger */}
      <Stack
        backgroundColor="$background"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$2"
        padding="$2"
        paddingRight="$4"
        minHeight="$2"
        justifyContent="center"
        pressStyle={{ backgroundColor: "$backgroundHover" }}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text
          color={selectedOption ? "$text" : "$textSoft"}
          size="medium"
          paddingLeft="$2"
          fontWeight="600"
        >
          {selectedOption?.label || placeholder}
        </Text>
        {/* Dropdown Arrow */}
        <Stack position="absolute" right="$3" top="40%">
          <Text color="$textSoft" size="medium">
            {isOpen ? "▲" : "▼"}
          </Text>
        </Stack>
      </Stack>

      {/* Options Dropdown */}
      {isOpen && (
        <Stack
          position="absolute"
          top="100%"
          left={0}
          right={0}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$2"
          marginTop="$1"
          zIndex={1000}
        >
          {options.map((option, index) => (
            <React.Fragment key={option.value}>
              <Stack
                padding="$2"
                pressStyle={
                  option.disabled
                    ? undefined
                    : { backgroundColor: "$backgroundHover" }
                }
                onPress={() => {
                  if (option.disabled) return;
                  onValueChange?.(option.value);
                  setIsOpen(false);
                }}
                opacity={option.disabled ? 0.5 : 1}
              >
                <XStack alignItems="center" gap="$2">
                  <Text
                    color={option.disabled ? "$textSoft" : "$text"}
                    size="medium"
                    flex={1}
                  >
                    {option.label}
                  </Text>
                  {option.disabled && <Lock size={16} color="$textSoft" />}
                </XStack>
              </Stack>
              {/* Separator - only show between options, not after the last one */}
              {index < options.length - 1 && (
                <Stack height={1} backgroundColor="#111" width="100%" />
              )}
            </React.Fragment>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
