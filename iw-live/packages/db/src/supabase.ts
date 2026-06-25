/**
 * Supabase Database Client
 *
 * Replaces Neon with Supabase PostgreSQL
 * Uses connection pooling for serverless environments
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database schema for Spine
const SCHEMA = "hub";

// supabase-js encodes the schema name into the client type. Most of our code
// doesn't care which schema the client is bound to, so we widen it here.
type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

export interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  schema?: string;
}

function readProcessEnv(key: string): string | undefined {
  // Cloudflare Workers don't have `process.env`, but some server-side contexts do.
  const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  return env?.[key];
}

function resolveSupabaseUrl(): string {
  const url = readProcessEnv("SUPABASE_URL") || readProcessEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!url) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) environment variable");
  }
  return url;
}

function resolveServiceRoleKey(): string {
  const key = readProcessEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }
  return key;
}

/**
 * Create a Supabase admin client (bypasses RLS)
 * Use for: Server-side operations, migrations, admin functions
 */
export function createAdminClient(
  url: string = resolveSupabaseUrl(),
  serviceRoleKey: string = resolveServiceRoleKey()
): AnySupabaseClient {
  return createClient(url, serviceRoleKey, {
    db: { schema: SCHEMA },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _cachedDbClient: AnySupabaseClient | null = null;
let _cachedDbKey: string | null = null;

/**
 * Create a Supabase client with schema set.
 * Use for: Cloudflare Workers, Edge functions.
 *
 * The client is cached per unique (url + key + schema) combination to avoid
 * creating a new instance on every call.
 */
export function createDbClient(config?: Partial<DatabaseConfig>): AnySupabaseClient {
  const url = config?.url || resolveSupabaseUrl();
  const key = config?.serviceRoleKey || resolveServiceRoleKey();
  const schema = config?.schema || SCHEMA;

  const cacheKey = `${url}|${key}|${schema}`;
  if (_cachedDbClient && _cachedDbKey === cacheKey) {
    return _cachedDbClient;
  }

  const client = createClient(url, key, {
    db: { schema },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  _cachedDbClient = client;
  _cachedDbKey = cacheKey;

  return client;
}

/**
 * Raw SQL query helper for complex queries.
 *
 * @deprecated This function passes raw SQL to an `exec_sql` RPC and is a
 * SQL-injection vector if called with user-supplied input. Only use with
 * static, parameterized queries. Prefer the Supabase query builder or a
 * dedicated stored procedure instead.
 */
export async function query<T = any>(
  client: AnySupabaseClient,
  sql: string,
  params?: Record<string, any>
): Promise<T[]> {
  console.warn(
    "[DEPRECATED] query() passes raw SQL to exec_sql RPC. " +
      "Use the Supabase query builder or a stored procedure instead."
  );

  if (!params || Object.keys(params).length === 0) {
    console.warn(
      "[SECURITY] query() called without parameters – this is likely unsafe. " +
        "Always use parameterized queries."
    );
  }

  const { data, error } = await client.rpc("exec_sql", { sql, params });

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Check database connection health
 */
export async function checkHealth(
  client: AnySupabaseClient
): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();

  try {
    const { error } = await client.from("health_check").select("*").limit(1);
    const latency = Date.now() - start;

    // Non-fatal PostgREST errors that still indicate a healthy connection:
    //   PGRST116 – row not found / no rows returned
    //   PGRST204 – column not found
    //   42P01    – relation (table) does not exist
    const NON_FATAL_CODES = new Set(["PGRST116", "PGRST204", "42P01"]);
    const healthy = !error || NON_FATAL_CODES.has(error.code);
    return { healthy, latency };
  } catch (e) {
    return { healthy: false, latency: Date.now() - start };
  }
}

export { createClient, SupabaseClient };
