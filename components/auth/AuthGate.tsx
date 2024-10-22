import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { AuthScreen } from './screens/AuthScreen'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return user ? children : <AuthScreen />
}