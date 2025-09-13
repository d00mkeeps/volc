// components/SettingsModal.tsx
import React, { useState } from "react";
import { YStack, XStack } from "tamagui";
import BaseModal from "@/components/atoms/core/BaseModal";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { DeleteAccountConfirmation } from "../atoms/DeleteAccountConfirmation";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <BaseModal
        isVisible={visible}
        onClose={onClose}
        widthPercent={90}
        heightPercent={70}
      >
        <YStack flex={1} padding="$4">
          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$6"
          >
            <Text size="xl" fontWeight="600">
              Settings
            </Text>
            <Button
              size="medium"
              backgroundColor="transparent"
              color="$primary"
              onPress={onClose}
            >
              Done
            </Button>
          </XStack>

          {/* Other settings options here */}

          {/* Danger Zone */}
          <YStack
            marginTop="auto"
            paddingTop="$4"
            borderTopWidth={1}
            borderTopColor="$borderSoft"
          >
            <Text size="large" fontWeight="600" color="$red9" marginBottom="$3">
              Danger Zone
            </Text>

            <Button
              backgroundColor="$red9"
              color="$white"
              alignSelf="stretch"
              onPress={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </YStack>
        </YStack>
      </BaseModal>

      <DeleteAccountConfirmation
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onClose(); // Close settings modal after deletion
        }}
      />
    </>
  );
};
