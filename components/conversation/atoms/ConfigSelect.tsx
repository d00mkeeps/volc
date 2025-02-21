import React from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';

export const CHAT_CONFIGS = {
  'default': 'Workout Tracking',
  'workout-analysis': 'Workout Analysis'
} as const;

export type ChatConfigKey = keyof typeof CHAT_CONFIGS;

interface ConfigSelectProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (config: ChatConfigKey) => void;
}

const ConfigSelect: React.FC<ConfigSelectProps> = ({ visible, onClose, onSelect }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContent}>
          {Object.entries(CHAT_CONFIGS).map(([key, label], index, arr) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.menuItem,
                index === arr.length - 1 && styles.lastMenuItem
              ]}
              onPress={() => {
                onSelect(key as ChatConfigKey);
                onClose();
              }}
            >
              <Text style={styles.menuItemText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    backgroundColor: '#1f281f',
    borderRadius: 15,
    padding: 16,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#2a332a',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a332a',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  }
});

export default ConfigSelect;