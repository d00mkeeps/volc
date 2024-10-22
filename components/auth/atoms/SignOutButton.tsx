import { StyleSheet } from 'react-native'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '../../public/atoms'

export function SignOutButton() {
  const { signOut } = useAuth()
  
  return (
    <Button
      onPress={signOut}
      style={styles.button}
    >
      Sign Out
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#280202',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginHorizontal: 20,
  }
})