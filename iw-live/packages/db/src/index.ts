/**
 * IntegrateWise Database Package
 *
 * Supabase-only implementation (Neon removed)
 * Provides database clients for Workers and server environments
 */

import { createDbClient } from "./supabase";

// Supabase client exports
export {
  createAdminClient,
  createDbClient,
  query,
  checkHealth,
  createClient,
  SupabaseClient,
  type DatabaseConfig,
} from "./supabase";

// Backward compatibility - redirects to Supabase
export function createDb(_connectionString?: string) {
  console.warn("createDb() is deprecated, use createDbClient() from @integratewise/db");
  return createDbClient();
}
