/**
 * Telemetry and Observability Handlers
 * Metrics, tracing, and monitoring endpoints
 */

import type { Context } from "hono";
import { metrics, trace, SpanStatusCode } from "@opentelemetry/api";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

// Initialize metrics
const meter = metrics.getMeter("integratewise-loader", "1.0.0");

// Define metrics
const requestCounter = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

const requestDuration = meter.createHistogram("http_request_duration_seconds", {
  description: "HTTP request duration in seconds",
});

const activeConnections = meter.createUpDownCounter("active_connections", {
  description: "Number of active connections",
});

const errorCounter = meter.createCounter("http_requests_errors_total", {
  description: "Total number of HTTP request errors",
});

/**
 * Get telemetry metrics
 */
export async function telemetryMetricsHandler(c: Context) {
  const log = c.get("log") as Log;

  try {
    // In a real implementation, you'd collect metrics from the OpenTelemetry SDK
    // For now, return basic service metrics
    const metrics = {
      service: "integratewise-loader",
      version: "1.0.0",
      uptime:
        typeof globalThis !== "undefined" && (globalThis as any).process?.uptime
          ? (globalThis as any).process.uptime()
          : 0,
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
      metrics: {
        requests_total: 0, // Would be collected from OpenTelemetry
        errors_total: 0,
        active_connections: 0,
        response_time_p50: 0,
        response_time_p95: 0,
        response_time_p99: 0,
      },
    };

    log.info("Telemetry metrics requested");
    return c.json(metrics);
  } catch (error) {
    log.error("Failed to get telemetry metrics", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return c.json({ error: "Failed to get telemetry metrics" }, 500);
  }
}

/**
 * Get service health and telemetry status
 */
export async function telemetryHealthHandler(c: Context) {
  const log = c.get("log") as Log;

  try {
    const health = {
      service: "integratewise-loader",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: c.env.ENVIRONMENT,
      telemetry: {
        enabled: true,
        metrics_collected: true,
        tracing_enabled: true,
      },
      dependencies: {
        database: "unknown", // Would check actual DB connection
        normalizer: c.env.NORMALIZER_URL ? "configured" : "missing",
        store: c.env.STORE_URL ? "configured" : "missing",
      },
    };

    log.info("Telemetry health check requested");
    return c.json(health);
  } catch (error) {
    log.error("Failed to get telemetry health", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return c.json({ error: "Failed to get telemetry health" }, 500);
  }
}

/**
 * Middleware to record telemetry for requests
 */
export function telemetryMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const startTime = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header("User-Agent") || "unknown";
    const requestId = c.get("requestId") || crypto.randomUUID();

    // Start span for tracing
    const tracer = trace.getTracer("integratewise-loader");
    const span = tracer.startSpan(`${method} ${path}`, {
      attributes: {
        "http.method": method,
        "http.url": path,
        "http.user_agent": userAgent,
        "request.id": requestId,
      },
    });

    try {
      // Increment active connections
      activeConnections.add(1);

      // Record request
      requestCounter.add(1, {
        method,
        path,
        status: "started",
      });

      await next();

      const duration = (Date.now() - startTime) / 1000;
      const statusCode = c.res.status;

      // Record successful request metrics
      requestDuration.record(duration, {
        method,
        path,
        status_code: statusCode.toString(),
      });

      // Update span
      span.setAttributes({
        "http.status_code": statusCode,
        "http.duration_ms": duration * 1000,
      });
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      // Preserve timing for traces even on failures.
      span.setAttributes({ "http.duration_ms": duration * 1000 });

      // Record error metrics
      errorCounter.add(1, {
        method,
        path,
        error_type: error instanceof Error ? error.name : "unknown",
      });

      // Update span
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    } finally {
      // Decrement active connections
      activeConnections.add(-1);

      span.end();
    }
  };
}
