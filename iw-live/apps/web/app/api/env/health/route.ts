import { NextResponse } from "next/server"
import { ENV, isServiceRoleConfigured, isOpenAIConfigured, isWebhookSecretsConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * Environment Health Check Endpoint
 * 
 * Returns environment configuration status without exposing secrets.
 * Use this to verify wiring and connectivity.
 * 
 * GET /api/env/health
 */
export async function GET() {
  // Check database connectivity
  let dbReachable = false
  let dbError: string | null = null

  const supabase = createAdminClient()
  if (supabase) {
    try {
      // Minimal read to test DB connectivity
      const { error } = await supabase
        .from("webhooks")
        .select("id")
        .limit(1)

      if (error) {
        // Try alternative tables if webhooks doesn't exist
        const { error: altError } = await supabase
          .from("interactions")
          .select("id")
          .limit(1)

        dbReachable = !altError
        if (altError) {
          dbError = altError.message
        }
      } else {
        dbReachable = true
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : "Unknown error"
    }
  }

  // Build response (no secrets)
  const response = {
    ok: dbReachable,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    
    // Supabase configuration (safe to expose URL)
    supabaseUrl: ENV?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    
    // Configuration status (boolean only, no secrets)
    configured: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRole: isServiceRoleConfigured(),
      openai: isOpenAIConfigured(),
      webhookSecrets: isWebhookSecretsConfigured(),
    },
    
    // Vector/embedding configuration (safe to expose)
    vector: {
      model: ENV?.EMBEDDING_MODEL_ID || "openai-text-embedding-3-small",
      dim: ENV?.EMBEDDING_DIMENSION || 1536,
      metric: ENV?.VECTOR_DISTANCE_METRIC || "cosine",
    },
    
    // Feature flags (safe to expose)
    features: {
      cronEnabled: ENV?.CRON_ENABLED === "true",
      autoExecute: ENV?.AUTO_EXECUTE_LOW_RISK_ACTIONS === "true",
      moderation: ENV?.CONTENT_MODERATION_ENABLED === "true",
    },
    
    // Database status
    dbReachable,
    ...(dbError && { dbError }),
  }

  return NextResponse.json(response, {
    status: dbReachable ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
