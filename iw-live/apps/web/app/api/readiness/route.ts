/**
 * Readiness Check Endpoint
 * Endpoint: GET /api/readiness
 * Checks if the service is ready to accept traffic
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const supabase = createClient()
    const { error } = await supabase.from("integrations").select("id").limit(1)

    if (error) {
      return NextResponse.json(
        {
          ready: false,
          reason: "Database not accessible",
          error: error.message,
        },
        { status: 503 }
      )
    }

    // Service is ready
    return NextResponse.json({
      ready: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ready: false,
        reason: "Service not ready",
        error: error.message,
      },
      { status: 503 }
    )
  }
}
