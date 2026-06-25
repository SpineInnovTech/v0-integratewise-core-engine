/**
 * @deprecated This module is deprecated. Neon has been replaced with Supabase.
 * Use @integratewise/db or direct Supabase client instead.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Deprecated type - kept for backward compatibility
type SpineEvent = Record<string, any>;

// Re-export for backward compatibility
export interface DatabaseConfig {
  connectionString: string;
  url?: string;
  serviceRoleKey?: string;
}

// Deprecated: Use createAdminClient from @integratewise/db
export function createDbClient(config: DatabaseConfig) {
  console.warn("createDbClient from @integratewise/lib/neon is deprecated. Use @integratewise/db");

  const url = config.url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    query: async <T>(sql: string, params?: unknown[]): Promise<T[]> => {
      // Use Supabase RPC for SQL queries
      const { data, error } = await client.rpc("exec_sql", { sql, params });
      if (error) throw error;
      return data || [];
    },
  };
}

// Deprecated: Use Supabase client directly
export function saveEvent(_event: SpineEvent): Promise<void> {
  console.warn("saveEvent is deprecated. Use Supabase client directly.");
  return Promise.resolve();
}

// Deprecated: Use Supabase client directly
export function getEventsBySource(_source: string, _limit = 100): Promise<SpineEvent[]> {
  console.warn("getEventsBySource is deprecated. Use Supabase client directly.");
  return Promise.resolve([]);
}

// Deprecated: Use Supabase client directly
export function getEventById(_id: string): Promise<SpineEvent | null> {
  console.warn("getEventById is deprecated. Use Supabase client directly.");
  return Promise.resolve(null);
}
