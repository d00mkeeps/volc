// components/SettingsModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 18, color: "#007AFF" }}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Other settings options here */}

        {/* Danger Zone */}
        <View
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: "#E5E5E7",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#FF3B30",
              marginBottom: 15,
            }}
          >
            Danger Zone
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#FF3B30",
              padding: 15,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        <DeleteAccountConfirmation
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onClose(); // Close settings modal after deletion
          }}
        />
      </View>
    </Modal>
  );
};
