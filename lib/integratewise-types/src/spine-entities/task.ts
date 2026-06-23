/**
 * Spine Canonical Entity: Task
 *
 * Represents a task or action item that can originate from any source tool
 * and be normalized into the Spine structure.
 */

export interface Task {
  /** Unique identifier in Spine (UUID v4) */
  id: string;

  /** Human-readable title */
  title: string;

  /** Detailed description (markdown supported) */
  description?: string;

  /** Status: pending | in_progress | completed | cancelled | blocked */
  status: "pending" | "in_progress" | "completed" | "cancelled" | "blocked";

  /** Priority: low | medium | high | urgent */
  priority: "low" | "medium" | "high" | "urgent";

  /** ISO 8601 date string */
  due_date?: string;

  /** User ID of assignee (references User entity) */
  assignee_id?: string;

  /** Source tool identifier (e.g., 'notion', 'slack', 'gmail') */
  source_tool: string;

  /** External reference ID from source tool */
  external_ref: string;

  /** ISO 8601 timestamp */
  created_at: string;

  /** ISO 8601 timestamp */
  updated_at: string;

  /** Additional metadata (tool-specific fields preserved here) */
  metadata?: Record<string, unknown>;
}

/**
 * Task relationship constraints:
 * - assignee_id → User.id (optional)
 * - Can be linked to Notes via Note.linked_entity_ids
 * - Can be part of Plans via Plan.milestones
 */
