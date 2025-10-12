import React from "react";
import { YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import BaseModal from "@/components/atoms/core/BaseModal";

interface UnderConstructionModalProps {
  isVisible: boolean;
  onConfirm: () => void;
}

export default function UnderConstructionModal({
  isVisible,
  onConfirm,
}: UnderConstructionModalProps) {
  return (
    <BaseModal
      isVisible={isVisible}
      onClose={() => {}} // No-op since it's not dismissable
      dismissable={false}
      widthPercent={85}
      heightPercent={25}
    >
      <YStack flex={1} paddingHorizontal="$6" justifyContent="center" gap="$6">
        <YStack gap="$4">
          <Text size="large" fontWeight="700" textAlign="center">
            Under Construction!
          </Text>
          <Text size="medium" color="$textMuted" textAlign="center">
            We're making the leaderboard even better, and you'll be among the
            first to know when it's ready.
          </Text>
        </YStack>
        <Button onPress={onConfirm} size="large" alignSelf="center">
          Ok
        </Button>
      </YStack>
    </BaseModal>
  );
}
