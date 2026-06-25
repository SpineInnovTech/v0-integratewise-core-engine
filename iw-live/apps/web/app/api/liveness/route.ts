/**
 * Liveness Check Endpoint
 * Endpoint: GET /api/liveness
 * Basic liveness probe (always returns 200 if service is running)
 */

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime_ms: process.uptime() * 1000,
  })
}
