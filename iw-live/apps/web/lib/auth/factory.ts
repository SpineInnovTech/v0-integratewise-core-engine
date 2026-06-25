/**
 * Auth Provider Factory
 * Returns the appropriate auth provider based on configuration
 */

import type { AuthProvider } from './types'
import { authConfig } from './env'
import { supabaseAuthProvider } from './providers/supabase-auth'
import { clerkAuthProvider } from './providers/clerk-auth'

let authProviderInstance: AuthProvider | null = null

/**
 * Get the configured auth provider
 */
export function getAuthProvider(): AuthProvider {
  if (authProviderInstance) {
    return authProviderInstance
  }

  switch (authConfig.provider) {
    case 'supabase':
      authProviderInstance = supabaseAuthProvider
      break
    case 'clerk':
      authProviderInstance = clerkAuthProvider
      break
    default:
      throw new Error(`Unknown auth provider: ${authConfig.provider}`)
  }

  return authProviderInstance
}

/**
 * Get current auth provider name
 */
export function getAuthProviderName(): 'supabase' | 'clerk' {
  return authConfig.provider
}

/**
 * Check if using Supabase Auth
 */
export function isSupabaseAuth(): boolean {
  return authConfig.provider === 'supabase'
}

/**
 * Check if using Clerk Auth
 */
export function isClerkAuth(): boolean {
  return authConfig.provider === 'clerk'
}
