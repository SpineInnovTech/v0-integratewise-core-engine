// Structured logging for Cloudflare Workers

export function getRequestId(existingId?: string | null): string {
  if (existingId) return existingId;
  return crypto.randomUUID();
}

export function structuredLog(requestId: string, environment: string) {
  const baseLog = {
    requestId,
    environment,
    service: "integratewise-webhooks",
  };

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(
        JSON.stringify({
          ...baseLog,
          level: "info",
          message,
          ...data,
          timestamp: new Date().toISOString(),
        })
      );
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(
        JSON.stringify({
          ...baseLog,
          level: "warn",
          message,
          ...data,
          timestamp: new Date().toISOString(),
        })
      );
    },
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(
        JSON.stringify({
          ...baseLog,
          level: "error",
          message,
          ...data,
          timestamp: new Date().toISOString(),
        })
      );
    },
  };
}
