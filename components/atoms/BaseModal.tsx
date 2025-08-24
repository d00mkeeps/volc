import React from "react";
import { Modal, TouchableOpacity } from "react-native";

interface BaseModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthPercent?: number;
  heightPercent?: number;
  topOffset?: number; // Add this new prop
}

export default function BaseModal({
  isVisible,
  onClose,
  children,
  widthPercent = 90,
  heightPercent = 55,
  topOffset = 0, // Default to 0 (no offset)
}: BaseModalProps) {
  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={{
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            backgroundColor: "#231f20",
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            marginTop: topOffset, // Apply the offset here
          }}
          activeOpacity={1}
          onPress={() => {}} // Keep this! It prevents tap bubbling
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
