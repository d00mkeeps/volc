// /components/atoms/Select.tsx
import React, { useState } from "react";
import { Stack, Text } from "tamagui";

interface SelectOption {
  value: string;
  label: string;
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
        <Text color={selectedOption ? "$text" : "$textSoft"} fontSize="$3">
          {selectedOption?.label || placeholder}
        </Text>

        {/* Dropdown Arrow */}
        <Stack position="absolute" right="$2.5" top="50%">
          <Text color="$textSoft" fontSize="$3">
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
                pressStyle={{ backgroundColor: "$backgroundHover" }}
                onPress={() => {
                  onValueChange?.(option.value);
                  setIsOpen(false);
                }}
              >
                <Text color="$text" fontSize="$3">
                  {option.label}
                </Text>
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
