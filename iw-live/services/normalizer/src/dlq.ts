/**
 * IntegrateWise Normalizer Service - Dead Letter Queue (DLQ) Module
 *
 * Handles failed normalization attempts by routing them to a DLQ for
 * review, retry, and resolution.
 */

import type {
  EntityType,
  ValidationError,
  ErrorClassification,
  DLQWriteResult,
  DLQEntry,
} from "./types";

// =============================================================================
// DATABASE CONFIG
// =============================================================================

export interface DatabaseConfig {
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

/**
 * Classifies errors into categories for better triage and handling
 */
export function classifyErrors(errors: ValidationError[]): ErrorClassification {
  if (!errors || errors.length === 0) {
    return "system";
  }

  // Check for missing field errors first (most actionable)
  const hasMissingField = errors.some(
    (e) => e.code === "missing_field" || e.message.toLowerCase().indexOf("required") !== -1
  );
  if (hasMissingField) {
    return "missing_field";
  }

  // Check for format errors (dates, UUIDs, emails, etc.)
  const hasFormatError = errors.some(
    (e) =>
      e.code === "format_error" ||
      e.message.toLowerCase().indexOf("format") !== -1 ||
      e.message.toLowerCase().indexOf("pattern") !== -1
  );
  if (hasFormatError) {
    return "format";
  }

  // Default to validation error
  return "validation";
}

/**
 * Maps AJV error keywords to our error codes
 */
export function mapAjvErrorToCode(keyword: string): ErrorClassification {
  const mapping: Record<string, ErrorClassification> = {
    required: "missing_field",
    additionalProperties: "validation",
    type: "validation",
    enum: "validation",
    format: "format",
    pattern: "format",
    minimum: "validation",
    maximum: "validation",
    minLength: "validation",
    maxLength: "validation",
  };
  return mapping[keyword] || "validation";
}

// =============================================================================
// DLQ WRITER
// =============================================================================

/**
 * Write a failed normalization attempt to the Dead Letter Queue
 */
export async function writeToDLQ(
  tenant_id: string,
  entity_type: EntityType,
  raw_data: Record<string, unknown>,
  errors: ValidationError[],
  dbConfig?: DatabaseConfig
): Promise<DLQWriteResult> {
  const classification = classifyErrors(errors);
  let dlq_id: string;
  try {
    dlq_id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "";
  } catch {
    dlq_id = "";
  }
  if (!dlq_id) dlq_id = `dlq-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const occurred_at = new Date().toISOString();

  const entry: DLQEntry = {
    id: dlq_id,
    tenant_id,
    entity_type,
    raw_data,
    errors,
    error_classification: classification,
    source_system: raw_data.source_system as string | undefined,
    occurred_at,
    resolved: false,
    retry_count: 0,
  };

  // If no database config, return the entry for external handling
  if (!dbConfig?.supabaseUrl || !dbConfig?.supabaseServiceKey) {
    console.log(
      "[DLQ] No database config provided, returning entry for external handling",
      createDLQSummary(entry)
    );
    return {
      success: true,
      dlq_id,
    };
  }

  try {
    // Use fetch to call Supabase REST API
    const supabaseUrl = dbConfig.supabaseUrl.replace("/rest/v1", "");
    const response = await fetch(`${supabaseUrl}/rest/v1/normalization_errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: dbConfig.supabaseServiceKey,
        Authorization: `Bearer ${dbConfig.supabaseServiceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: dlq_id,
        tenant_id,
        entity_type,
        raw_data,
        errors,
        occurred_at,
        resolved: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DLQ] Failed to write to database:", errorText);
      return {
        success: false,
        dlq_id,
        error: `Database write failed: ${response.status}`,
      };
    }

    console.log(`[DLQ] Written entry ${dlq_id} for ${entity_type} - ${classification}`);
    return {
      success: true,
      dlq_id,
    };
  } catch (error) {
    console.error("[DLQ] Error writing to DLQ:", error);
    return {
      success: false,
      dlq_id,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// DLQ UTILITIES
// =============================================================================

/**
 * Format errors for human-readable display
 */
export function formatErrorsForDisplay(errors: ValidationError[]): string {
  return errors.map((e) => `• ${e.field}: ${e.message}`).join("\n");
}

/**
 * Create a summary of DLQ entry for logging
 */
export function createDLQSummary(entry: Partial<DLQEntry>): string {
  return JSON.stringify({
    id: entry.id,
    entity_type: entry.entity_type,
    classification: entry.error_classification,
    error_count: entry.errors?.length || 0,
    occurred_at: entry.occurred_at,
  });
}

/**
 * Check if an error is retryable
 */
export function isRetryable(classification: ErrorClassification): boolean {
  // System errors might be retryable (transient failures)
  // Other errors typically require data fixes
  return classification === "system";
}
