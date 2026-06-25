/**
 * Structured Logging Utilities
 *
 * Provides consistent, structured logging with correlation ID propagation.
 * Follows best practices: no PII, no secrets, structured JSON output.
 */

import type { CorrelationContext } from "./correlation";

// ============================================================================
// Types
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlation_id?: string;
  tenant_id?: string;
  user_id?: string;
  stage?: string;
  queue_name?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  correlation_id: string;
  message: string;
  [key: string]: unknown;
}

// ============================================================================
// Sanitization
// ============================================================================

const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "api_key",
  "apikey",
  "authorization",
  "auth",
  "credit_card",
  "cvv",
  "ssn",
  "sin",
];

/**
 * Check if a field name indicates sensitive data
 */
function isSensitiveField(field: string): boolean {
  const lower = field.toLowerCase();
  return SENSITIVE_FIELDS.some((sensitive) => lower.includes(sensitive));
}

/**
 * Mask an email address
 * Example: john.doe@example.com -> jo***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Mask a phone number
 * Example: +1-555-123-4567 -> ***-4567
 */
export function maskPhone(phone: string): string {
  if (!phone) return "***";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 4) return "***";
  return `***-${cleaned.slice(-4)}`;
}

/**
 * Mask a generic value
 */
export function maskValue(value: string): string {
  if (!value) return "***";
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "****" + value.slice(-2);
}

/**
 * Sanitize log metadata to remove PII and secrets
 */
function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    // Skip sensitive fields entirely
    if (isSensitiveField(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Mask known PII fields
    if (key === "email" && typeof value === "string") {
      sanitized[key] = maskEmail(value);
    } else if (key === "phone" && typeof value === "string") {
      sanitized[key] = maskPhone(value);
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// Logging Functions
// ============================================================================

/**
 * Core logging function with structured output
 */
export function logWithContext(
  correlationId: string,
  level: LogLevel,
  message: string,
  meta: LogContext & Record<string, unknown> = {}
): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    correlation_id: correlationId,
    message,
    ...sanitizeMetadata(meta),
  };

  // Output structured JSON
  console.log(JSON.stringify(logEntry));
}

/**
 * Log pipeline step completion/failure
 */
export function logPipelineStep(
  env: { ENVIRONMENT?: string },
  payload: unknown,
  status: "started" | "completed" | "failed",
  durationMs: number,
  error?: Error
): void {
  const ctx = (payload as Record<string, string> | undefined)?.correlation_id
    ? { correlation_id: (payload as Record<string, string>).correlation_id }
    : { correlation_id: "none" };

  const level = status === "failed" ? "error" : "info";

  logWithContext(ctx.correlation_id, level, `Pipeline step ${status}`, {
    tenant_id: (payload as Record<string, string> | undefined)?.tenant_id,
    stage: (payload as Record<string, string> | undefined)?.stage,
    status,
    duration_ms: durationMs,
    environment: env.ENVIRONMENT,
    error: error?.message,
    ...(status === "failed" && error && { error_stack: error.stack }),
  });
}

/**
 * Debug level log
 */
export function debug(
  correlationId: string,
  message: string,
  meta?: Record<string, unknown>
): void {
  logWithContext(correlationId, "debug", message, meta);
}

/**
 * Info level log
 */
export function info(correlationId: string, message: string, meta?: Record<string, unknown>): void {
  logWithContext(correlationId, "info", message, meta);
}

/**
 * Warn level log
 */
export function warn(correlationId: string, message: string, meta?: Record<string, unknown>): void {
  logWithContext(correlationId, "warn", message, meta);
}

/**
 * Error level log
 */
export function error(
  correlationId: string,
  message: string,
  err: Error | unknown,
  meta?: Record<string, unknown>
): void {
  const errorMeta: Record<string, unknown> = {
    ...meta,
    error: err instanceof Error ? err.message : String(err),
  };

  if (err instanceof Error && err.stack) {
    errorMeta.error_stack = err.stack;
  }

  logWithContext(correlationId, "error", message, errorMeta);
}

// ============================================================================
// Queue-specific Logging
// ============================================================================

/**
 * Log queue message receipt
 */
export function logQueueReceipt(
  correlationId: string,
  queueName: string,
  messageId: string,
  meta?: Record<string, unknown>
): void {
  logWithContext(correlationId, "info", "Queue message received", {
    queue_name: queueName,
    message_id: messageId,
    ...meta,
  });
}

/**
 * Log queue message completion
 */
export function logQueueComplete(
  correlationId: string,
  queueName: string,
  messageId: string,
  durationMs: number,
  meta?: Record<string, unknown>
): void {
  logWithContext(correlationId, "info", "Queue message completed", {
    queue_name: queueName,
    message_id: messageId,
    duration_ms: durationMs,
    ...meta,
  });
}

/**
 * Log queue message failure
 */
export function logQueueFailure(
  correlationId: string,
  queueName: string,
  messageId: string,
  error: Error,
  willRetry: boolean,
  meta?: Record<string, unknown>
): void {
  logWithContext(correlationId, "error", "Queue message failed", {
    queue_name: queueName,
    message_id: messageId,
    error: error.message,
    will_retry: willRetry,
    ...meta,
  });
}

/**
 * Log DLQ insertion
 */
export function logDLQInsert(
  correlationId: string,
  queueName: string,
  stage: string,
  attempts: number,
  meta?: Record<string, unknown>
): void {
  logWithContext(correlationId, "error", "Message sent to DLQ", {
    queue_name: queueName,
    stage,
    attempts,
    dlq_sent: true,
    ...meta,
  });
}
