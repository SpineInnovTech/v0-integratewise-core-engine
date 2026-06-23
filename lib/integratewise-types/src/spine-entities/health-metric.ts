/**
 * Spine Canonical Entity: HealthMetric (Customer Success)
 *
 * Represents a health metric computed for customer success intelligence.
 */

export interface HealthMetric {
  /** Unique identifier in Spine (UUID v4) */
  id: string;

  /** Account ID (references Account entity) */
  account_id: string;

  /** Metric type: usage | nps | ticket_severity | renewal_proximity | engagement */
  metric_type: "usage" | "nps" | "ticket_severity" | "renewal_proximity" | "engagement";

  /** Raw metric value */
  value: number;

  /** Weight for composite health score calculation (0-1) */
  weight: number;

  /** Period: daily | weekly | monthly */
  period: "daily" | "weekly" | "monthly";

  /** ISO 8601 timestamp when metric was computed */
  computed_at: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * HealthMetric relationship constraints:
 * - account_id → Account.id
 * - Used by CS Lens to compute composite health_score
 * - Normalized values (0-100) used in health_score formula
 */
