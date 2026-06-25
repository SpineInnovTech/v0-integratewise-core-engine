import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { ENV, isServiceRoleConfigured } from "@/lib/env"

/**
 * Creates a Supabase client for server-side use with cookie-based auth.
 * Use this in Server Components and Server Actions.
 * Returns null if Supabase environment variables are not configured.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  const cookieStore = await cookies()

  return createSupabaseServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  )
}

// Named export for convenience
export async function createServerClient() {
  return createClient()
}

/**
 * Creates a Supabase client with service role key (bypasses RLS).
 * Use only on server-side for admin operations.
 * Falls back to anon client if service role key not configured.
 * Returns null if Supabase environment variables are not configured.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  if (!isServiceRoleConfigured() || !ENV) {
    console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY not configured, using anon client")
    return createSupabaseClient(
      url,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return createSupabaseClient(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: "public" },
    }
  )
}

/**
 * Creates an admin Supabase client (service role if available, anon otherwise).
 * Returns null if configuration is missing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("[Supabase] Missing URL or key, returning null client")
    return null
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: { schema: "public" },
  })
}

/**
 * Lazy-initialized singleton server client with service role key for API routes.
 * Use this for server-side operations that need RLS bypass.
 */
let _supabaseServer: ReturnType<typeof createSupabaseClient> | null = null

export function getSupabaseServer() {
  if (_supabaseServer) return _supabaseServer
  
  if (!isServiceRoleConfigured() || !ENV) {
    return null
  }
  
  _supabaseServer = createSupabaseClient(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      db: { schema: "public" },
    }
  )
  
  return _supabaseServer
}

// For backwards compatibility - use getSupabaseServer() for lazy initialization
export const supabaseServer = null as ReturnType<typeof createSupabaseClient> | null
