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
      heightPercent={35}
    >
      <YStack flex={1} padding="$6" justifyContent="space-between">
        <YStack gap="$4" flex={1} justifyContent="center">
          <Text size="large" fontWeight="700" textAlign="center">
            Under Construction
          </Text>

          <Text size="medium" color="$textMuted" textAlign="center">
            This feature is currently under construction, and we'll let you know
            when it's ready. Check back soon!
          </Text>
        </YStack>

        <Button onPress={onConfirm} size="large">
          Ok
        </Button>
      </YStack>
    </BaseModal>
  );
}
