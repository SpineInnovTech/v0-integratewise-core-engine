/**
 * Spine Canonical Entity: Conversation
 *
 * Represents a conversation thread (Slack, email, AI chat, etc.)
 * that can be ingested and linked to other work artifacts.
 */

export interface Conversation {
  /** Unique identifier in Spine (UUID v4) */
  id: string;

  /** Source: slack | gmail | chatgpt | claude | gemini | etc. */
  source: string;

  /** Total message count in thread */
  message_count: number;

  /** Topic or subject line */
  topic?: string;

  /** Array of participant user IDs or email addresses */
  participants: string[];

  /** ISO 8601 timestamp */
  created_at: string;

  /** ISO 8601 timestamp */
  updated_at: string;

  /** Linkage score (0-100) indicating relevance to other entities */
  linkage_score?: number;

  /** Additional metadata (thread_id, channel_id, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Conversation relationship constraints:
 * - participants → User.email or User.id
 * - Can be linked to Notes via Note.linked_entity_ids
 * - linkage_score computed by Brain agent for relevance
 */
