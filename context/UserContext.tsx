import { createContext, useContext, useState } from 'react'
import type { UserProfile } from '@/types'
import { supabase } from '@/lib/supabaseClient'

interface UserContextType {
  userProfile: UserProfile | null
  loading: boolean
  error: Error | null
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const MAX_RETRIES = 3
const RETRY_DELAY = 100 // 1 second

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchProfileWithRetry = async (retryCount = 0): Promise<UserProfile | null> => {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        return null
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_uuid', session.session.user.id)
        .single()

      if (error) throw error
      
      return data as UserProfile
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY * Math.pow(2, retryCount)) // Exponential backoff
        return fetchProfileWithRetry(retryCount + 1)
      }
      throw err
    }
  }

  const refreshProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchProfileWithRetry()
      setUserProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true)
      setError(null)

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('No authenticated user')
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('auth_user_uuid', session.session.user.id)

      if (error) throw error

      // Refresh the profile to get updated data
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'))
      console.error('Error updating profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    userProfile,
    loading,
    error,
    refreshProfile,
    updateProfile
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}