/**
 * Structured JSON logging with optional external drain.
 * @integratewise/os - Observability
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  event: string
  timestamp: string
  requestId?: string
  correlationId?: string
  data?: Record<string, unknown>
}

const LOG_DRAIN_URL = process.env.LOG_DRAIN_URL

export async function log(
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>,
  requestId?: string,
  correlationId?: string,
): Promise<void> {
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    requestId,
    correlationId,
    data,
  }

  // Always log to console
  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  logFn(JSON.stringify(entry))

  // Optionally send to external drain
  if (LOG_DRAIN_URL && level !== "debug") {
    try {
      await fetch(LOG_DRAIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => {}) // Fire and forget
    } catch {
      // Ignore drain errors
    }
  }
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateCorrelationId(): string {
  return `cor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
