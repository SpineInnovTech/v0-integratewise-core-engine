/**
 * Database Provider Factory
 * Returns the appropriate database provider based on configuration
 */

import type { DatabaseProvider } from './types'
import { dbConfig } from './env'
import { supabaseDatabaseProvider } from './providers/supabase-db'
import { d1DatabaseProvider } from './providers/d1-db'

let dbProviderInstance: DatabaseProvider | null = null

/**
 * Get the configured database provider
 */
export function getDatabaseProvider(): DatabaseProvider {
  if (dbProviderInstance) {
    return dbProviderInstance
  }

  switch (dbConfig.provider) {
    case 'supabase':
      dbProviderInstance = supabaseDatabaseProvider
      break
    case 'd1':
      dbProviderInstance = d1DatabaseProvider
      break
    default:
      throw new Error(`Unknown database provider: ${dbConfig.provider}`)
  }

  return dbProviderInstance
}

/**
 * Get current database provider name
 */
export function getDatabaseProviderName(): 'supabase' | 'd1' {
  return dbConfig.provider
}

/**
 * Check if using Supabase database
 */
export function isSupabaseDatabase(): boolean {
  return dbConfig.provider === 'supabase'
}

/**
 * Check if using Cloudflare D1
 */
export function isD1Database(): boolean {
  return dbConfig.provider === 'd1'
}
