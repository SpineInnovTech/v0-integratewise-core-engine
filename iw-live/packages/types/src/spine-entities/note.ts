/**
 * Spine Canonical Entity: Note
 *
 * Represents a note, document, or knowledge artifact that can be linked
 * to other entities and preserved across tools.
 */

export interface Note {
  /** Unique identifier in Spine (UUID v4) */
  id: string;

  /** Title or subject */
  title: string;

  /** Body content (markdown supported) */
  body_md: string;

  /** Tags for categorization */
  tags: string[];

  /** Source tool identifier */
  source_tool: string;

  /** External reference ID from source tool */
  external_ref: string;

  /** Array of linked entity IDs (Tasks, Conversations, Plans, etc.) */
  linked_entity_ids: string[];

  /** ISO 8601 timestamp */
  created_at: string;

  /** ISO 8601 timestamp */
  updated_at: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Note relationship constraints:
 * - linked_entity_ids → Any Spine entity ID (Task, Conversation, Plan, etc.)
 * - Can reference multiple entities for cross-tool context
 */
