/**
 * Memory Writeback with Retry & DLQ
 *
 * Handles memory writes after execution completion with:
 * - Structured logging (handoff_id, memory_id, success/failure, error)
 * - Exponential backoff retry (configurable max retries, default 3)
 * - DLQ for persistent failures
 *
 * Phase 4 Tasks 15-17
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

export interface MemoryWritebackParams {
  handoff_id: string;
  memory_id: string;
  tenant_id: string;
  content: string;
  category: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryWritebackEnv {
  D1: D1Database;
  OPS_DLQ_QUEUE?: { send(message: unknown): Promise<void> };
}

export interface MemoryWritebackConfig {
  maxRetries: number;
  backoffBaseMs: number;
}

const DEFAULT_CONFIG: MemoryWritebackConfig = {
  maxRetries: 3,
  backoffBaseMs: 200,
};

interface WritebackResult {
  success: boolean;
  attempts: number;
  error?: string;
  dlq?: boolean;
}

/**
 * Write memory with structured logging, retry, and DLQ fallback.
 * Returns { success: false } if all retries exhausted — caller MUST NOT return 200.
 */
export async function writeMemoryWithRetry(
  params: MemoryWritebackParams,
  env: MemoryWritebackEnv,
  config: MemoryWritebackConfig = DEFAULT_CONFIG
): Promise<WritebackResult> {
  const { handoff_id, memory_id, tenant_id, content, category, metadata } = params;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      // Structured log: attempt
      console.log(
        JSON.stringify({
          event: "memory_writeback_attempt",
          handoff_id,
          memory_id,
          tenant_id,
          attempt,
          max_retries: config.maxRetries,
          timestamp: new Date().toISOString(),
        })
      );

      await env.D1.prepare(
        `INSERT INTO conversational_memory (id, tenant_id, content, category, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(
          memory_id,
          tenant_id,
          content,
          category,
          metadata ? JSON.stringify(metadata) : "{}"
        )
        .run();

      // Structured log: success
      console.log(
        JSON.stringify({
          event: "memory_writeback_success",
          handoff_id,
          memory_id,
          tenant_id,
          attempt,
          timestamp: new Date().toISOString(),
        })
      );

      return { success: true, attempts: attempt };
    } catch (err: any) {
      lastError = err?.message || String(err);

      // Structured log: failure
      console.error(
        JSON.stringify({
          event: "memory_writeback_failure",
          handoff_id,
          memory_id,
          tenant_id,
          attempt,
          max_retries: config.maxRetries,
          error: lastError,
          transient: attempt < config.maxRetries,
          timestamp: new Date().toISOString(),
        })
      );

      // Exponential backoff (skip on last attempt)
      if (attempt < config.maxRetries) {
        const delayMs = config.backoffBaseMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted — write to DLQ
  console.error(
    JSON.stringify({
      event: "memory_writeback_dlq",
      handoff_id,
      memory_id,
      tenant_id,
      error: lastError,
      timestamp: new Date().toISOString(),
    })
  );

  // Push to DLQ queue if available
  if (env.OPS_DLQ_QUEUE) {
    try {
      await env.OPS_DLQ_QUEUE.send({
        type: "memory_writeback_failure",
        handoff_id,
        memory_id,
        tenant_id,
        content,
        category,
        metadata,
        error: lastError,
        failed_at: new Date().toISOString(),
      });
    } catch (dlqErr: any) {
      console.error(
        JSON.stringify({
          event: "memory_writeback_dlq_send_failed",
          handoff_id,
          memory_id,
          error: dlqErr?.message || String(dlqErr),
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  // Persistent failure — caller MUST NOT return 200
  return { success: false, attempts: config.maxRetries, error: lastError, dlq: true };
}
