import React, { useState } from "react";
import { YStack, XStack, ScrollView } from "tamagui";
import { Alert } from "react-native";
import BaseModal from "@/components/atoms/core/BaseModal";
import Button from "@/components/atoms/core/Button";
import Input from "@/components/atoms/core/Input";
import Text from "@/components/atoms/core/Text";
import { userService } from "@/services/api/userService";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmations, setConfirmations] = useState({
    understand_permanent: false,
    understand_data_loss: false,
    no_refund: false,
  });
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const resetDeleteState = () => {
    console.log("🔴 resetDeleteState called");
    setConfirmations({
      understand_permanent: false,
      understand_data_loss: false,
      no_refund: false,
    });
    setTypedConfirmation("");
    setLoading(false);
    setShowDeleteConfirm(false);
  };

  const isReadyToDelete = () => {
    return (
      Object.values(confirmations).every((v) => v) &&
      typedConfirmation === "DELETE MY ACCOUNT"
    );
  };

  const handleDeleteAccount = async () => {
    console.log("🔴 handleDeleteAccount called");
    if (!isReadyToDelete()) return;

    setLoading(true);
    try {
      await userService.deleteAccount({
        confirmed: true,
        typed_confirmation: typedConfirmation,
      });

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error) {
      console.error("🔴 Delete account error:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ConfirmationCheckbox = ({
    checked,
    onToggle,
    text,
  }: {
    checked: boolean;
    onToggle: () => void;
    text: string;
  }) => (
    <Button
      backgroundColor="transparent"
      justifyContent="flex-start"
      alignSelf="stretch"
      maxWidth="100%"
      padding="$0"
      marginBottom="$3"
      onPress={onToggle}
    >
      <XStack alignItems="center" gap="$2">
        <YStack
          width={20}
          height={20}
          borderWidth={2}
          borderColor={checked ? "$red9" : "$borderSoft"}
          backgroundColor={checked ? "$red9" : "transparent"}
          borderRadius="$1"
          justifyContent="center"
          alignItems="center"
        >
          {checked && (
            <Text size="small" color="$white" fontWeight="600">
              ✓
            </Text>
          )}
        </YStack>
        <Text size="medium" flex={1}>
          {text}
        </Text>
      </XStack>
    </Button>
  );

  return (
    <BaseModal
      isVisible={visible}
      onClose={() => {
        resetDeleteState();
        onClose();
      }}
      widthPercent={90}
      heightPercent={70}
    >
      <YStack flex={1} padding="$4">
        {!showDeleteConfirm ? (
          <>
            {/* Settings Content */}
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
              <Text
                size="large"
                fontWeight="600"
                color="$red9"
                marginBottom="$3"
              >
                Danger Zone
              </Text>
              <Button
                backgroundColor="$red9"
                color="$white"
                alignSelf="stretch"
                onPress={() => {
                  console.log("🔴 Delete Account button pressed!");
                  setShowDeleteConfirm(true);
                }}
              >
                Delete Account
              </Button>
            </YStack>
          </>
        ) : (
          <>
            {/* Delete Account Confirmation Content */}
            <ScrollView flex={1}>
              <YStack gap="$4">
                {/* Header */}
                <XStack justifyContent="space-between" alignItems="center">
                  <Text size="xl" fontWeight="600" color="$red9">
                    Delete Account
                  </Text>
                  <Button
                    size="medium"
                    backgroundColor="transparent"
                    color="$primary"
                    onPress={() => {
                      console.log("🔴 Back button pressed");
                      setShowDeleteConfirm(false);
                    }}
                  >
                    Back
                  </Button>
                </XStack>

                {/* Warning Text */}
                <Text size="medium" lineHeight={24}>
                  This action will permanently delete your account and all
                  associated data. This cannot be undone.
                </Text>

                <Text size="large" fontWeight="600">
                  Please confirm you understand:
                </Text>

                {/* Checkboxes */}
                <YStack gap="$2">
                  <ConfirmationCheckbox
                    checked={confirmations.understand_permanent}
                    onToggle={() => {
                      console.log("🔴 Toggling understand_permanent");
                      setConfirmations((prev) => ({
                        ...prev,
                        understand_permanent: !prev.understand_permanent,
                      }));
                    }}
                    text="I understand this action is permanent and cannot be undone"
                  />
                  <ConfirmationCheckbox
                    checked={confirmations.understand_data_loss}
                    onToggle={() => {
                      console.log("🔴 Toggling understand_data_loss");
                      setConfirmations((prev) => ({
                        ...prev,
                        understand_data_loss: !prev.understand_data_loss,
                      }));
                    }}
                    text="I understand I will lose all my workouts, conversations, and data"
                  />
                  <ConfirmationCheckbox
                    checked={confirmations.no_refund}
                    onToggle={() => {
                      console.log("🔴 Toggling no_refund");
                      setConfirmations((prev) => ({
                        ...prev,
                        no_refund: !prev.no_refund,
                      }));
                    }}
                    text="I understand this does not entitle me to any refunds"
                  />
                </YStack>

                {/* Confirmation Input */}
                <YStack gap="$2">
                  <Text size="medium">
                    Type{" "}
                    <Text fontWeight="600" color="$red9">
                      DELETE MY ACCOUNT
                    </Text>{" "}
                    to confirm:
                  </Text>
                  <Input
                    value={typedConfirmation}
                    onChangeText={(text) => {
                      console.log("🔴 Input changed to:", text);
                      setTypedConfirmation(text);
                    }}
                    placeholder="DELETE MY ACCOUNT"
                    autoCapitalize="characters"
                    alignSelf="stretch"
                    maxWidth="100%"
                  />
                </YStack>

                {/* Delete Button */}
                <Button
                  backgroundColor={
                    isReadyToDelete() ? "$red9" : "$backgroundMuted"
                  }
                  color="$white"
                  disabled={!isReadyToDelete() || loading}
                  opacity={loading ? 0.7 : 1}
                  alignSelf="stretch"
                  maxWidth="100%"
                  onPress={() => {
                    console.log("🔴 Final DELETE MY ACCOUNT button pressed");
                    handleDeleteAccount();
                  }}
                >
                  {loading ? "Deleting Account..." : "DELETE MY ACCOUNT"}
                </Button>
              </YStack>
            </ScrollView>
          </>
        )}
      </YStack>
    </BaseModal>
  );
};
