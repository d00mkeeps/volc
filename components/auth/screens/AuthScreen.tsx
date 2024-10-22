import { useState } from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import { SignInForm } from '../molecules/SignInForm'
import { SignUpForm } from '../molecules/SignUpForm'
import { AuthToggle } from '../atoms/AuthToggle'
import { AuthError } from '../atoms/AuthError'
import { useAuth } from '../../../context/AuthContext'

type AuthMode = 'signIn' | 'signUp'

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn')
  const { error } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {error && <AuthError message={error.message} />}
        
        <View style={styles.formWrapper}>
          {mode === 'signIn' ? <SignInForm /> : <SignUpForm />}
        </View>

        <View style={styles.toggleContainer}>
          <AuthToggle 
            mode={mode} 
            onToggle={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} 
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formWrapper: {
    flex: 1,
    height: '100%', // Ensure consistent height
    paddingTop: '30%', // Push content down
  },
  toggleContainer: {
    padding: 20,
    marginBottom: 20,
  }
})