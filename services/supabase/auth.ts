// services/supabase/auth.ts
import { supabase } from '@/lib/supabaseClient'
import { AuthError, SignInCredentials, SignUpCredentials } from '@/types/auth'
import { AuthError as SupabaseAuthError } from '@supabase/supabase-js'

export const authService = {
  signIn: async ({ email, password }: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign-in error:', error)
      const authError = error as SupabaseAuthError
      throw {
        message: authError.message || 'Authentication failed',
        status: authError.status || 500
      }
    }
  },
  
  signUp: async ({ email, password }: SignUpCredentials) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign-up error:', error)
      const authError = error as SupabaseAuthError
      throw {
        message: authError.message || 'Registration failed',
        status: authError.status || 500
      }
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign-out error:', error)
      const authError = error as SupabaseAuthError
      throw {
        message: authError.message || 'Sign out failed',
        status: authError.status || 500
      }
    }
  },
  
  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      const authError = error as SupabaseAuthError
      throw {
        message: authError.message || 'Password reset failed',
        status: authError.status || 500
      }
    }
  }
}