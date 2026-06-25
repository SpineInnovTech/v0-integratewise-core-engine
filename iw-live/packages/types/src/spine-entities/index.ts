/**
 * Spine Canonical Entity Types
 *
 * Central export for all Spine entity schemas.
 * These represent the normalized structure that preserves meaning
 * across different source tools.
 */

export * from "./task.js";
export * from "./note.js";
export * from "./conversation.js";
export * from "./plan.js";
export * from "./health-metric.js";

/**
 * Reserved fields across all Spine entities:
 * - id: UUID v4 (required, immutable)
 * - created_at: ISO 8601 timestamp (required, immutable)
 * - updated_at: ISO 8601 timestamp (required, auto-updated)
 * - source_tool: string (required, identifies origin)
 * - external_ref: string (required, source tool's ID)
 * - metadata: Record<string, unknown> (optional, tool-specific fields)
 *
 * Normalization rules:
 * 1. All timestamps normalized to ISO 8601 UTC
 * 2. All IDs normalized to UUID v4 (Spine generates if missing)
 * 3. Relationships use Spine entity IDs, not external refs
 * 4. Tool-specific fields preserved in metadata
 * 5. Status enums normalized to canonical values
 */
