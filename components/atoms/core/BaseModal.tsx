import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import { useTheme } from "tamagui";
interface BaseModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthPercent?: number;
  heightPercent?: number;
  topOffset?: number;
  dismissable?: boolean; // NEW
}

export default function BaseModal({
  isVisible,
  onClose,
  children,
  widthPercent = 90,
  heightPercent = 55,
  topOffset = 0,
  dismissable = true, // NEW - defaults to true for existing modals
}: BaseModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={dismissable ? onClose : undefined} // MODIFIED
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
          onPress={dismissable ? onClose : undefined} // MODIFIED
        />

        {/* Modal content */}
        <View
          style={{
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            backgroundColor: theme.background.val,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            marginTop: topOffset,
          }}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}
