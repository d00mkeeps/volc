import React from "react";
import { Platform } from "react-native";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import BaseModal from "@/components/atoms/core/BaseModal";

interface UpdatePromptModalProps {
  isVisible: boolean;
  currentVersion: string | null;
  minimumVersion: string;
  onUpdate: () => void;
}

export function UpdatePromptModal({
  isVisible,
  currentVersion,
  minimumVersion,
  onUpdate,
}: UpdatePromptModalProps) {
  return (
    <BaseModal
      isVisible={isVisible}
      onClose={() => {}} // Empty function - prevent closing for required update
      widthPercent={90}
      heightPercent={30}
    >
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$6"
        space="$4"
      >
        {/* Title */}
        <Text size="xl" variant="heading" textAlign="center">
          Great news!
        </Text>

        {/* Message */}
        <YStack space="$2" width="100%">
          <Text
            size="medium"
            variant="caption"
            color="$gray10"
            textAlign="center"
          >
            There's an update available. {"\n\n"}Please go to the App Store to
            download the latest version
          </Text>
        </YStack>

        {/* Update Button */}
        <Button
          width="100%"
          size="large"
          backgroundColor="$red9"
          pressStyle={{ backgroundColor: "$red10" }}
          marginTop="$2"
          onPress={onUpdate}
        >
          Update Now
        </Button>

        <Text
          size="small"
          variant="caption"
          color="$gray9"
          textAlign="center"
          marginTop="$1"
        >
          You'll be redirected to the {Platform.OS === "ios" ? "App" : "Play"}{" "}
          Store
        </Text>
      </YStack>
    </BaseModal>
  );
}
