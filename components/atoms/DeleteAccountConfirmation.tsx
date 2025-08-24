// components/DeleteAccountConfirmation.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { userService } from "@/services/api/userService";

interface DeleteAccountConfirmationProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountConfirmation: React.FC<
  DeleteAccountConfirmationProps
> = ({ visible, onClose, onConfirm }) => {
  const [confirmations, setConfirmations] = useState({
    understand_permanent: false,
    understand_data_loss: false,
    no_refund: false,
  });
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

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
    <TouchableOpacity
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
      onPress={onToggle}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 2,
          borderColor: checked ? "#FF3B30" : "#C7C7CC",
          backgroundColor: checked ? "#FF3B30" : "transparent",
          marginRight: 10,
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Text style={{ color: "white", fontSize: 12 }}>✓</Text>}
      </View>
      <Text style={{ flex: 1, fontSize: 14 }}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF3B30" }}>
            Delete Account
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={{ fontSize: 18, color: "#007AFF" }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, marginBottom: 20, lineHeight: 24 }}>
          This action will permanently delete your account and all associated
          data. This cannot be undone.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 15 }}>
          Please confirm you understand:
        </Text>

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

        <View style={{ marginTop: 30, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>
            Type{" "}
            <Text style={{ fontWeight: "bold", color: "#FF3B30" }}>
              DELETE MY ACCOUNT
            </Text>{" "}
            to confirm:
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#C7C7CC",
              borderRadius: 8,
              padding: 15,
              fontSize: 16,
            }}
            value={typedConfirmation}
            onChangeText={setTypedConfirmation}
            placeholder="DELETE MY ACCOUNT"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: isReadyToDelete() ? "#FF3B30" : "#C7C7CC",
            padding: 15,
            borderRadius: 8,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleDeleteAccount}
          disabled={!isReadyToDelete() || loading}
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {loading ? "Deleting Account..." : "DELETE MY ACCOUNT"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};
