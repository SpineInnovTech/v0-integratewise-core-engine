/**
 * IntegrateWise Normalizer - Idempotency Module (D1 Edition)
 *
 * Best Practice Guardrail #2: Idempotency Keys
 *
 * Ensures no duplicate canonical writes by tracking:
 * - source + external_id + tenant_id as deterministic key
 * - First processed timestamp
 * - Process count for observability
 */

import type { EntityType } from "./types";

interface IdempotencyCheckResult {
  isDuplicate: boolean;
  existingEntityId?: string;
  firstProcessedAt?: string;
  processCount?: number;
}

/**
 * Generate a deterministic idempotency key
 */
export function generateIdempotencyKey(
  sourceSystem: string,
  externalId: string,
  tenantId: string
): string {
  const normalizedSource = sourceSystem.toLowerCase().trim();
  const normalizedExtId = String(externalId).trim();
  const normalizedTenant = tenantId.toLowerCase().trim();

  return `${normalizedSource}:${normalizedExtId}:${normalizedTenant}`;
}

/**
 * Generate an idempotency key from raw data
 */
export function generateKeyFromData(
  _entityType: EntityType,
  tenantId: string,
  data: Record<string, unknown>
): string {
  const sourceSystem = (data.source_system as string) || "unknown";
  const externalId = (data.external_id as string) || (data.id as string) || "unknown";

  return generateIdempotencyKey(sourceSystem, externalId, tenantId);
}

/**
 * Check if an idempotency key has already been processed using D1
 */
export async function checkIdempotency(
  idempotencyKey: string,
  tenantId: string,
  _entityType: EntityType,
  db: D1Database
): Promise<IdempotencyCheckResult> {
  try {
    const existing = await db
      .prepare(
        `
      SELECT entity_id, first_processed_at, process_count 
      FROM idempotency_keys 
      WHERE idempotency_key = ? AND tenant_id = ?
    `
      )
      .bind(idempotencyKey, tenantId)
      .first<{
        entity_id: string;
        first_processed_at: string;
        process_count: number;
      }>();

    if (existing) {
      // Update process count
      await db
        .prepare(
          `
        UPDATE idempotency_keys 
        SET process_count = process_count + 1, last_seen_at = CURRENT_TIMESTAMP 
        WHERE idempotency_key = ?
      `
        )
        .bind(idempotencyKey)
        .run();

      return {
        isDuplicate: true,
        existingEntityId: existing.entity_id,
        firstProcessedAt: existing.first_processed_at,
        processCount: existing.process_count + 1,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("[Idempotency] D1 Error:", error);
    return { isDuplicate: false };
  }
}

/**
 * Register a new idempotency key after successful processing
 */
export async function registerIdempotencyKey(
  idempotencyKey: string,
  tenantId: string,
  entityType: EntityType,
  entityId: string,
  db: D1Database
): Promise<void> {
  try {
    await db
      .prepare(
        `
      INSERT INTO idempotency_keys (idempotency_key, tenant_id, entity_type, entity_id)
      VALUES (?, ?, ?, ?)
    `
      )
      .bind(idempotencyKey, tenantId, entityType, entityId)
      .run();
  } catch (error) {
    console.error("[Idempotency] D1 Registration Error:", error);
  }
}
