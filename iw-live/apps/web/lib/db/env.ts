/**
 * Database Environment Configuration
 */

const DB_PROVIDER = process.env.NEXT_PUBLIC_DB_PROVIDER as 'supabase' | 'd1' | undefined

// Validation
if (!DB_PROVIDER || !['supabase', 'd1'].includes(DB_PROVIDER)) {
  console.error(
    'NEXT_PUBLIC_DB_PROVIDER must be set to "supabase" or "d1"'
  )
}

export const dbConfig = {
  provider: DB_PROVIDER || 'supabase' as 'supabase' | 'd1',
}

// Supabase config
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

// D1 config (no env needed - DB binding injected by Cloudflare)
export const d1Config = {
  // D1 is injected as global binding
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseConfig.url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseConfig.anonKey,
}
