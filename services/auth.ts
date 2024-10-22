import { AuthError, SignInCredentials, SignUpCredentials } from '../types/auth'
import { supabase } from '@/lib/supabaseClient'

export const authService = {
  signIn: async ({ email, password }: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    } catch (error) {
      throw handleAuthError(error)
    }
  },

  signUp: async ({ email, password }: SignUpCredentials) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return data
    } catch (error) {
      throw handleAuthError(error)
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      throw handleAuthError(error)
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      throw handleAuthError(error)
    }
  },

  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    } catch (error) {
      throw handleAuthError(error)
    }
  }
}

function handleAuthError(error: any): AuthError {
  console.error('Auth error:', error)
  return {
    message: error.message || 'An authentication error occurred',
    status: error.status
  }
}