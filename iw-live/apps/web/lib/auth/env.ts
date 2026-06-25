/**
 * Auth Environment Configuration
 */

const AUTH_PROVIDER = process.env.NEXT_PUBLIC_AUTH_PROVIDER as 'supabase' | 'clerk' | undefined

// Validation
if (!AUTH_PROVIDER || !['supabase', 'clerk'].includes(AUTH_PROVIDER)) {
  console.error(
    'NEXT_PUBLIC_AUTH_PROVIDER must be set to "supabase" or "clerk"'
  )
}

export const authConfig = {
  provider: AUTH_PROVIDER || 'clerk' as 'supabase' | 'clerk',
}

// Supabase config (required if using Supabase Auth)
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

// Clerk config (required if using Clerk Auth)
export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  secretKey: process.env.CLERK_SECRET_KEY || '',
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseConfig.url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseConfig.anonKey,
}
