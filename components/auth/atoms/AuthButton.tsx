import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import type { AuthButtonProps } from '@/types/auth'

export function AuthButton({ onPress, loading, title }: AuthButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1f281f',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 3,
    borderColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
})