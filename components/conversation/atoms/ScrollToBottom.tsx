import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

interface ScrollToBottomButtonProps {
  onPress: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onPress }) => (
  <TouchableOpacity 
    style={styles.button}
    onPress={onPress}
  >
    <AntDesign name="downcircle" size={24} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#000',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
});