import { createContext, useContext, useState, useEffect } from 'react'
import { AuthState, AuthError } from '../types/auth'
import { authService } from '../services/auth'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType extends AuthState {
  signIn: typeof authService.signIn
  signUp: typeof authService.signUp
  signOut: typeof authService.signOut
  resetPassword: typeof authService.resetPassword
  error: AuthError | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  })
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Initialize auth state
    authService.getSession()
      .then(session => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false
        }))
      })
      .catch(err => setError(err))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false
        }))
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    ...state,
    error,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    resetPassword: authService.resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}