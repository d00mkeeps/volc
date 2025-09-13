import React from "react";
import { YStack } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import type { AuthToggleProps } from "@/types/auth";

export function AuthToggle({ mode, onToggle }: AuthToggleProps) {
  return (
    <YStack marginTop="$4" alignItems="center">
      <Button
        backgroundColor="transparent"
        color="$primary"
        onPress={onToggle}
        maxWidth="100%"
        alignSelf="center"
      >
        <Text size="medium" color="$primary">
          {" "}
          {/* Responsive text size for iPad */}
          {mode === "signIn"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </Text>
      </Button>
    </YStack>
  );
}
