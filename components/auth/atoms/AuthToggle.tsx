import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import type { AuthToggleProps } from '@/types/auth'

export function AuthToggle({ mode, onToggle }: AuthToggleProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onToggle}
    >
      <Text style={styles.text}>
        {mode === 'signIn' 
          ? "Don't have an account? Sign Up" 
          : "Already have an account? Sign In"}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: 'center',
  },
  text: {
    color: '#007AFF',
    fontSize: 14,
  }
})