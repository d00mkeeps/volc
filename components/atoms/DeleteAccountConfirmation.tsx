import React, { useState } from "react";
import { Modal, Alert } from "react-native";
import { YStack, XStack, ScrollView } from "tamagui";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Text from "@/components/atoms/Text";
import { userService } from "@/services/api/userService";

interface DeleteAccountConfirmationProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountConfirmation = ({
  visible,
  onClose,
  onConfirm,
}: DeleteAccountConfirmationProps) => {
  const [confirmations, setConfirmations] = useState({
    understand_permanent: false,
    understand_data_loss: false,
    no_refund: false,
  });
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  // ... rest of your component logic stays exactly the same

  const resetState = () => {
    setConfirmations({
      understand_permanent: false,
      understand_data_loss: false,
      no_refund: false,
    });
    setTypedConfirmation("");
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const isReadyToDelete = () => {
    return (
      Object.values(confirmations).every((v) => v) &&
      typedConfirmation === "DELETE MY ACCOUNT"
    );
  };

  const handleDeleteAccount = async () => {
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
        [{ text: "OK", onPress: onConfirm }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete account. Please try again.");
      console.error("Delete account error:", error);
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <ScrollView
        flex={1}
        backgroundColor="$background"
        contentContainerStyle={{ padding: 20 }}
      >
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
              onPress={handleClose}
            >
              Cancel
            </Button>
          </XStack>

          {/* Warning Text */}
          <Text size="medium" lineHeight={24}>
            This action will permanently delete your account and all associated
            data. This cannot be undone.
          </Text>

          <Text size="large" fontWeight="600">
            Please confirm you understand:
          </Text>

          {/* Checkboxes */}
          <YStack gap="$2">
            <ConfirmationCheckbox
              checked={confirmations.understand_permanent}
              onToggle={() =>
                setConfirmations((prev) => ({
                  ...prev,
                  understand_permanent: !prev.understand_permanent,
                }))
              }
              text="I understand this action is permanent and cannot be undone"
            />

            <ConfirmationCheckbox
              checked={confirmations.understand_data_loss}
              onToggle={() =>
                setConfirmations((prev) => ({
                  ...prev,
                  understand_data_loss: !prev.understand_data_loss,
                }))
              }
              text="I understand I will lose all my workouts, conversations, and data"
            />

            <ConfirmationCheckbox
              checked={confirmations.no_refund}
              onToggle={() =>
                setConfirmations((prev) => ({
                  ...prev,
                  no_refund: !prev.no_refund,
                }))
              }
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
              onChangeText={setTypedConfirmation}
              placeholder="DELETE MY ACCOUNT"
              autoCapitalize="characters"
              alignSelf="stretch"
              maxWidth="100%"
            />
          </YStack>

          {/* Delete Button */}
          <Button
            backgroundColor={isReadyToDelete() ? "$red9" : "$backgroundMuted"}
            color="$white"
            disabled={!isReadyToDelete() || loading}
            opacity={loading ? 0.7 : 1}
            alignSelf="stretch"
            maxWidth="100%"
            onPress={handleDeleteAccount}
          >
            {loading ? "Deleting Account..." : "DELETE MY ACCOUNT"}
          </Button>
        </YStack>
      </ScrollView>
    </Modal>
  );
};
