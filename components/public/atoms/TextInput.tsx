import React from 'react';
import { TextInput as RNTextInput, StyleSheet, TextInputProps } from 'react-native';

export const TextInput: React.FC<TextInputProps> = (props) => (
  <RNTextInput
    style={[styles.input, props.style]}
    placeholderTextColor="#999"
    {...props}
  />
);

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
});