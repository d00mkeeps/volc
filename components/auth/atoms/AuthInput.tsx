import { TextInput, StyleSheet } from 'react-native'
import type { AuthInputProps } from '@/types/auth'

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default'
}: AuthInputProps) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#2a332a', // Slightly lighter than background
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#999',
    color: '#fff',
  }})
