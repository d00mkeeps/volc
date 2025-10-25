import React from "react";
import { YStack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import PulsingLoader from "./PulsingLoader";

interface LoadingMessageProps {
  statusMessage?: string | null;
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({
  statusMessage,
}) => {
  return (
    <XStack
      width="100%"
      justifyContent="flex-start"
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <YStack maxWidth="90%" gap="$2" alignItems="flex-start">
        {/* Pulsing loader */}
        <YStack
          minHeight={50}
          justifyContent="center"
          alignItems="center"
          paddingVertical="$2"
        >
          <PulsingLoader size={30} />
        </YStack>

        {/* Status message */}
        {statusMessage && (
          <Text size="small" color="$textMuted">
            {statusMessage}
          </Text>
        )}
      </YStack>
    </XStack>
  );
};
