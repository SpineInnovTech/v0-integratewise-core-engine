/**
 * Spine Canonical Entity: Plan
 *
 * Represents a plan, project, or initiative with milestones and objectives.
 */

export interface Plan {
  /** Unique identifier in Spine (UUID v4) */
  id: string;

  /** Objective or goal statement */
  objective: string;

  /** Array of milestone objects */
  milestones: Milestone[];

  /** User ID of plan owner */
  owner_id: string;

  /** ISO 8601 date string */
  start_date?: string;

  /** ISO 8601 date string */
  end_date?: string;

  /** Status: draft | active | completed | cancelled */
  status: "draft" | "active" | "completed" | "cancelled";

  /** ISO 8601 timestamp */
  created_at: string;

  /** ISO 8601 timestamp */
  updated_at: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface Milestone {
  /** Milestone identifier */
  id: string;

  /** Title */
  title: string;

  /** Description */
  description?: string;

  /** Target completion date (ISO 8601) */
  target_date?: string;

  /** Status: pending | in_progress | completed */
  status: "pending" | "in_progress" | "completed";

  /** Linked task IDs */
  task_ids?: string[];
}

/**
 * Plan relationship constraints:
 * - owner_id → User.id
 * - milestones[].task_ids → Task.id[]
 * - Can be linked to Notes via Note.linked_entity_ids
 */
