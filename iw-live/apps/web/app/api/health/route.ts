/**
 * Health Check Endpoint
 * Endpoint: GET /api/health
 * Checks all dependencies (DB, integrations, providers)
 * @integratewise/os - Observability
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resourceConfig } from "@/lib/resource-config"
import { dbGate } from "@/lib/db-concurrency"
import { dbBreaker } from "@/lib/circuit-breaker"
import { isDRActive } from "@/lib/neon"

export async function GET(request: NextRequest) {
  const start_time = Date.now()
  const checks: Record<string, { status: "up" | "down" | "degraded"; latency_ms?: number; error?: string }> = {}

  // Check Supabase database
  try {
    const db_start = Date.now()
    const supabase = createClient()
    const { error } = await supabase.from("integrations").select("id").limit(1)

    if (error) {
      checks.database = { status: "down", error: error.message }
    } else {
      checks.database = { status: "up", latency_ms: Date.now() - db_start }
    }
  } catch (error: any) {
    checks.database = { status: "down", error: error.message }
  }

  // Check environment variables
  const required_env = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const missing_env = required_env.filter((env) => !process.env[env])
  checks.environment = {
    status: missing_env.length > 0 ? "degraded" : "up",
    error: missing_env.length > 0 ? `Missing: ${missing_env.join(", ")}` : undefined,
  }

  const breakerState = dbBreaker.getState()
  checks.circuit_breaker = {
    status: breakerState === "open" ? "down" : breakerState === "half-open" ? "degraded" : "up",
    error: breakerState !== "closed" ? `State: ${breakerState}` : undefined,
  }

  // Overall health status
  const has_down = Object.values(checks).some((c) => c.status === "down")
  const has_degraded = Object.values(checks).some((c) => c.status === "degraded")

  const overall_status = has_down ? "unhealthy" : has_degraded ? "degraded" : "healthy"

  return NextResponse.json(
    {
      status: overall_status,
      timestamp: new Date().toISOString(),
      uptime_ms: process.uptime() * 1000,
      checks,
      resources: {
        env: resourceConfig.env,
        db: dbGate.stats(),
        dr_active: isDRActive(),
      },
      response_time_ms: Date.now() - start_time,
    },
    { status: overall_status === "unhealthy" ? 503 : 200 },
  )
}
