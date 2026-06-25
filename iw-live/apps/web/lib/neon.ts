/**
 * Neon database client with circuit breaker, concurrency guard, and DR fallback.
 * @integratewise/os - Database Layer
 */

import { neon, neonConfig } from "@neondatabase/serverless"
import { resourceConfig } from "@/lib/resource-config"
import { dbGate } from "@/lib/db-concurrency"
import { dbBreaker } from "@/lib/circuit-breaker"
import { log } from "@/lib/logger"

// Configure Neon for serverless
neonConfig.fetchConnectionCache = true

// Create clients
const primaryClient = resourceConfig.dr.primaryUrl ? neon(resourceConfig.dr.primaryUrl) : null

const secondaryClient =
  resourceConfig.dr.enabled && resourceConfig.dr.secondaryUrl ? neon(resourceConfig.dr.secondaryUrl) : null

let usingDR = false

async function guardedQuery<T>(fn: () => Promise<T>, requestId?: string): Promise<T> {
  const release = await dbGate.acquire()
  const start = Date.now()

  try {
    const result = await dbBreaker.exec(fn)
    const duration = Date.now() - start

    if (duration > resourceConfig.adaptive.highLatencyMs) {
      await log("warn", "db_slow_query", { duration, requestId })
    }

    return result
  } catch (error: any) {
    // Try DR if primary fails and DR is enabled
    if (resourceConfig.dr.enabled && secondaryClient && !usingDR && error?.message?.includes("circuit_open")) {
      usingDR = true
      await log("warn", "db_dr_failover", { requestId })
      dbBreaker.reset()
    }
    throw error
  } finally {
    release()
  }
}

function getClient() {
  if (usingDR && secondaryClient) return secondaryClient
  if (primaryClient) return primaryClient
  throw new Error("No database connection configured")
}

export async function query<T = unknown>(sql: string, params: unknown[] = [], requestId?: string): Promise<T[]> {
  return guardedQuery(async () => {
    const client = getClient()
    const result = await client(sql, params)
    return result as T[]
  }, requestId)
}

export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = [],
  requestId?: string,
): Promise<T | null> {
  const rows = await query<T>(sql, params, requestId)
  return rows[0] ?? null
}

export function isDRActive(): boolean {
  return usingDR
}

export function resetDR(): void {
  usingDR = false
  dbBreaker.reset()
}
