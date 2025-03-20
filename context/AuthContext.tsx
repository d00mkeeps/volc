import { createContext, useContext, useState, useEffect } from 'react'
import { AuthState, AuthError } from '../types/auth'
import { authService } from '../services/supabase/auth'
import { supabase } from '@/lib/supabaseClient'
import { getWebSocketService, connectBase, cleanup } from '@/services/websocket/GlobalWebsocketService'

interface AuthContextType extends AuthState {
  signIn: typeof authService.signIn
  signUp: typeof authService.signUp
  signOut: () => Promise<void>
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
        
        // Connect WebSocket when user is authenticated
        if (session?.user) {
          connectBase(session.user.id);
        }
      })
      .catch(err => setError(err))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false
        }))
        
        // Handle WebSocket connections based on auth events
        if (event === 'SIGNED_IN' && session?.user) {
          connectBase(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          cleanup();
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      cleanup() // Clean up WebSocket on unmount
    }
  }, [])

  const value = {
    ...state,
    error,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: async () => {
      cleanup(); // Clean up WebSocket connections first
      return authService.signOut();
    },
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