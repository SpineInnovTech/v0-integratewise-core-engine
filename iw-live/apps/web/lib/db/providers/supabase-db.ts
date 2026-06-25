/**
 * Supabase Database Provider Implementation
 */

import { createClient } from '@supabase/supabase-js'
import type { DatabaseProvider, QueryResult, QueryOptions } from '../types'
import { env } from '../env'

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const supabaseDatabaseProvider: DatabaseProvider = {
  provider: 'supabase',

  async query<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const { data, error, count } = await supabase.rpc('query', {
        sql,
        params: params || [],
      })

      if (error) {
        return { data: null, error }
      }

      return { data: (data || []) as T[], error: null, count }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async insert<T = any>(
    table: string,
    data: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const { data: result, error, count } = await supabase
        .from(table)
        .insert(data)
        .select()

      if (error) {
        return { data: null, error }
      }

      return { data: (result || []) as T[], error: null, count }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async update<T = any>(
    table: string,
    updates: Record<string, any>,
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase.from(table).update(updates)

      // Apply where conditions
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value)
      }

      const { data, error, count } = await query.select()

      if (error) {
        return { data: null, error }
      }

      return { data: (data || []) as T[], error: null, count }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async delete(
    table: string,
    where: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult> {
    try {
      let query = supabase.from(table).delete()

      // Apply where conditions
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value)
      }

      const { error } = await query

      if (error) {
        return { data: null, error }
      }

      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async raw<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const { data, error } = await supabase.rpc('raw_query', {
        sql,
        params: params || [],
      })

      if (error) {
        return { data: null, error }
      }

      return { data: (data || []) as T[], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  async beginTransaction(): Promise<void> {
    // Supabase doesn't expose transaction API directly
    // Transactions handled server-side or via custom RPC
  },

  async commit(): Promise<void> {
    // Handled by Supabase server
  },

  async rollback(): Promise<void> {
    // Handled by Supabase server
  },

  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('pg_tables').select('*').limit(1)
      return !error
    } catch {
      return false
    }
  },
}
