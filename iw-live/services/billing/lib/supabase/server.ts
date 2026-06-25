/**
 * Minimal Supabase client for billing lib when used outside Workers (e.g. tests).
 * In production Workers, billing uses fetch() to Supabase REST in src/index.ts.
 */

export function createClient(): any {
  return {} as any;
}
