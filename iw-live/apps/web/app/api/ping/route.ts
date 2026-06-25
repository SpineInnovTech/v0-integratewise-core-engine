import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

/**
 * Health check endpoint - verifies Supabase connectivity
 * GET /api/ping
 */
export async function GET() {
  const start = Date.now()

  try {
    const supabase = createServiceClient()

    if (!supabase) {
      return NextResponse.json(
        {
          status: "degraded",
          message: "Database not configured",
          timestamp: new Date().toISOString(),
          latency_ms: Date.now() - start,
        },
        { status: 503 },
      )
    }

    // Query organizations table to verify connectivity
    const { data, error } = await supabase.from("clients").select("id").limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: error.message,
          timestamp: new Date().toISOString(),
          latency_ms: Date.now() - start,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      message: "Database connected",
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - start,
      db_check: "passed",
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - start,
      },
      { status: 500 },
    )
  }
}
