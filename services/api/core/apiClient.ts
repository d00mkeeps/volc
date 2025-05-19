// services/api/apiClient.ts
import { getLocalIpAddress } from '@/utils/network'
import { supabase } from '@/lib/supabaseClient'

// State variables for base URLs
let API_BASE_URL: string | null = null
let WS_BASE_URL: string | null = null

/**
 * Initialize the API client with the correct base URLs
 * Must be called before making any API requests
 */
export async function initializeApiClient(): Promise<void> {
  if (!API_BASE_URL) {
    try {
      const ipAddress = await getLocalIpAddress()
      API_BASE_URL = `http://${ipAddress}:8000`
      WS_BASE_URL = `ws://${ipAddress}:8000`
      console.log(`[apiClient] Initialized with base URL: ${API_BASE_URL}`)
    } catch (error) {
      console.error('[apiClient] Failed to initialize:', error)
      throw new Error('Failed to initialize API client: Could not resolve IP address')
    }
  }
}

/**
 * Get the current base URL for API requests
 */
export async function getApiBaseUrl(): Promise<string> {
  await initializeApiClient()
  return API_BASE_URL!
}

/**
 * Get the current base URL for WebSocket connections
 */
export async function getWsBaseUrl(): Promise<string> {
  await initializeApiClient()
  return WS_BASE_URL!
}

/**
 * Endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = [
  '/health',
  '/status',
  // Add other public endpoints as needed
]

/**
 * Check if an endpoint requires authentication
 */
function requiresAuth(endpoint: string): boolean {
  return !PUBLIC_ENDPOINTS.some(publicEndpoint => 
    endpoint.startsWith(publicEndpoint)
  )
}

/**
 * Generic API request function with authentication
 * Gets tokens directly from Supabase
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount: number = 3
): Promise<T> {
  try {
    // Ensure API client is initialized
    await initializeApiClient()
    
    // Normalize endpoint
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${API_BASE_URL}${normalizedEndpoint}`
    
    console.log(`[apiClient] Request to: ${url}`)
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
      
    // Safely add any existing headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value
        } else if (value !== undefined && value !== null) {
          headers[key] = String(value)
        }
      })
    }
    
    // Add authorization header if required
    if (requiresAuth(normalizedEndpoint)) {
      // Get session directly from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else {
        console.warn('[apiClient] No auth token available for authenticated endpoint')
      }
    }
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    // Handle response
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.log('[apiClient] Received 401, refreshing session...')
        // Let Supabase handle token refresh - just try to get a fresh session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          console.log('[apiClient] Session refreshed, retrying request')
          // Retry the original request
          return apiRequest(endpoint, options, retryCount - 1)
        }
      }
      
      // Try to parse error response
      let errorDetail: string
      try {
        const errorJson = await response.json()
        errorDetail = errorJson.detail || errorJson.message || `HTTP error ${response.status}`
      } catch {
        errorDetail = `API error: ${response.status} ${response.statusText}`
      }
      
      throw new Error(errorDetail)
    }
    
    // Check for empty response
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      // Handle non-JSON responses
      return { success: true } as unknown as T
    }
  } catch (error) {
    console.error(`[apiClient] Request failed: ${endpoint}`, error)
    
    // Handle retry logic
    if (retryCount > 0 && isRetryableError(error)) {
      console.log(`[apiClient] Retrying... (${retryCount} attempts left)`)
      
      // Exponential backoff
      const backoffDelay = 1000 * Math.pow(2, 3 - retryCount)
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
      
      return apiRequest(endpoint, options, retryCount - 1)
    }
    
    throw error
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('network')) {
    return true
  }
  
  // Server errors (5xx) are retryable
  if (error.message && error.message.includes('500')) {
    return true
  }
  
  // Default to not retrying
  return false
}

// Helper methods
export const apiGet = <T = any>(endpoint: string, params: Record<string, any> = {}) => {
  // Convert params to query string
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  const url = queryString ? `${endpoint}?${queryString}` : endpoint
  
  return apiRequest<T>(url, { method: 'GET' })
}

export const apiPost = <T = any>(endpoint: string, data: any) => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const apiPut = <T = any>(endpoint: string, data: any) => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const apiPatch = <T = any>(endpoint: string, data: any) => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export const apiDelete = <T = any>(endpoint: string) => {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}