/**
 * Structured logging utility for Cloudflare Workers
 */

export interface StructuredLog {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Generate a request ID or use provided one
 */
export function getRequestId(providedId?: string | null): string {
  if (providedId) {
    return providedId;
  }
  // Generate a UUID-like ID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a trace ID for distributed tracing
 */
export function getTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a structured logger instance
 */
export function structuredLog(requestId: string, environment?: string): StructuredLog {
  const baseContext = {
    requestId,
    environment: environment || "development",
    timestamp: new Date().toISOString(),
  };

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: "info", message, ...baseContext, ...data }));
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: "warn", message, ...baseContext, ...data }));
    },
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(JSON.stringify({ level: "error", message, ...baseContext, ...data }));
    },
    debug: (message: string, data?: Record<string, unknown>) => {
      if (environment === "development") {
        console.log(JSON.stringify({ level: "debug", message, ...baseContext, ...data }));
      }
    },
  };
}
