/**
 * Correlation ID Utilities
 *
 * Provides correlation ID generation and propagation for distributed tracing.
 */

/**
 * Generate a unique correlation ID
 * Format: corr_<timestamp>_<random>
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `corr_${timestamp}_${random}`;
}

/**
 * Generate a unique message ID
 * Format: msg_<timestamp>_<random>
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `msg_${timestamp}_${random}`;
}

/**
 * Generate a unique operation ID
 * Format: op_<timestamp>_<random>
 */
export function generateOperationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `op_${timestamp}_${random}`;
}

/**
 * Extract correlation ID from request headers
 */
export function getCorrelationIdFromHeaders(headers: Headers): string | undefined {
  return headers.get("x-correlation-id") || undefined;
}

/**
 * Create correlation context for propagation
 */
export interface CorrelationContext {
  correlation_id: string;
  parent_id?: string;
  trace_path: string[];
}

/**
 * Create a child correlation context
 */
export function createChildContext(
  parentContext: CorrelationContext,
  stage: string
): CorrelationContext {
  return {
    correlation_id: parentContext.correlation_id,
    parent_id: generateOperationId(),
    trace_path: [...parentContext.trace_path, stage],
  };
}

/**
 * Initialize root correlation context
 */
export function createRootContext(correlationId?: string): CorrelationContext {
  return {
    correlation_id: correlationId || generateCorrelationId(),
    trace_path: ["root"],
  };
}
