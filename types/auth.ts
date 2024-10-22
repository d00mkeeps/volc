import { Session, User } from '@supabase/supabase-js'

export interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

export interface AuthError {
  message: string
  status?: number
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends SignInCredentials {
  // Add any additional sign-up fields here
}

// components/auth/atoms/types.ts
export interface AuthInputProps {
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    secureTextEntry?: boolean
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  }
  
export interface AuthButtonProps {
    onPress: () => void
    loading?: boolean
    title: string
  }
  
export interface AuthErrorProps {
    message: string
  }
  
export interface AuthToggleProps {
    mode: 'signIn' | 'signUp'
    onToggle: () => void
  }