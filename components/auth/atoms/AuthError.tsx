import { View, Text, StyleSheet } from 'react-native'
import type { AuthErrorProps } from '@/types/auth'

export function AuthError({ message }: AuthErrorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  text: {
    color: '#c62828',
    fontSize: 14,
  }
})