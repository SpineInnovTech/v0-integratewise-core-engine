/**
 * Synthesis Pipeline — Lineage Tracker
 *
 * Records provenance for all knowledge operations.
 *
 * Every Understanding Object carries a lineage record. This module
 * provides the canonical lineage operations:
 * - Record creation provenance
 * - Record merge history
 * - Record promotion audit trail
 * - Query lineage by object, session, or entity
 *
 * Design: Immutable append-only lineage. Every mutation creates
 * a new audit entry. The lineage graph is DAG-shaped (merges allowed).
 */

import type { UnderstandingObject, AuditEntry, LineageRecord } from "./continuity-object-factory";
import type { TriageClassification } from "./triage-bot";
import type { PromotionResult } from "./promotion-gate";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LineageQuery {
  objectId?: string;
  sessionId?: string;
  entityId?: string;
  entityType?: string;
  tenantId: string;
  since?: string;
  until?: string;
  limit?: number;
}

export interface LineageSnapshot {
  snapshotId: string;
  objectId: string;
  tenantId: string;
  lineage: LineageRecord;
  classification: TriageClassificationSummary;
  promotion?: PromotionSummary;
  createdAt: string;
}

export interface TriageClassificationSummary {
  classificationId: string;
  outcome: string;
  confidence: number;
  extractionCount: number;
}

export interface PromotionSummary {
  decision: string;
  approvedBy?: string;
  approvedAt?: string;
  promotedPath?: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface LineageNode {
  id: string;
  type: "object" | "session" | "event" | "promotion" | "merge";
  label: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LineageEdge {
  from: string;
  to: string;
  relation: string;
  timestamp: string;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Record the creation of an Understanding Object.
 */
export function recordCreation(
  object: UnderstandingObject,
  classification: TriageClassification
): LineageSnapshot {
  const now = new Date().toISOString();

  const snapshot: LineageSnapshot = {
    snapshotId: `snap:${object.objectId}:${Date.now().toString(36)}`,
    objectId: object.objectId,
    tenantId: object.tenantId,
    lineage: object.lineage,
    classification: {
      classificationId: classification.classificationId,
      outcome: classification.outcome,
      confidence: classification.confidence,
      extractionCount: classification.extractions.length,
    },
    createdAt: now,
  };

  return snapshot;
}

/**
 * Record a promotion decision in an object's lineage.
 */
export function recordPromotion(
  object: UnderstandingObject,
  result: PromotionResult
): UnderstandingObject {
  const now = new Date().toISOString();

  const entry: AuditEntry = {
    at: now,
    actor: result.approvedBy || "promotion-gate",
    action: `promotion:${result.decision}`,
    detail: result.reason,
  };

  object.lineage.auditTrail.push(entry);
  object.updatedAt = now;

  if (result.decision === "auto_approved" || result.decision === "hitl_required") {
    object.status = result.decision === "auto_approved" ? "approved" : "under_review";
    if (result.approvedAt) object.approvedAt = result.approvedAt;
    if (result.approvedBy) object.approvedBy = result.approvedBy;
  } else if (result.decision === "rejected") {
    object.status = "rejected";
  } else if (result.decision === "deferred") {
    object.status = "under_review";
  }

  return object;
}

/**
 * Record a merge operation in lineage.
 */
export function recordMerge(
  targetObject: UnderstandingObject,
  sourceObjectIds: string[],
  actor: string
): UnderstandingObject {
  const now = new Date().toISOString();

  targetObject.lineage.mergeHistory.push({
    mergedAt: now,
    mergedFrom: sourceObjectIds,
  });

  targetObject.lineage.auditTrail.push({
    at: now,
    actor,
    action: "merge",
    detail: `Merged from ${sourceObjectIds.join(", ")}`,
  });

  targetObject.updatedAt = now;
  return targetObject;
}

/**
 * Record a supersede operation (when a newer version replaces an old one).
 */
export function recordSupersede(
  oldObject: UnderstandingObject,
  newObjectId: string,
  actor: string,
  reason: string
): UnderstandingObject {
  const now = new Date().toISOString();

  oldObject.status = "superseded";
  oldObject.lineage.derivedObjects.push(newObjectId);
  oldObject.lineage.auditTrail.push({
    at: now,
    actor,
    action: "superseded",
    detail: reason,
  });

  oldObject.updatedAt = now;
  return oldObject;
}

/**
 * Build a lineage graph from an object for visualization.
 */
export function buildLineageGraph(object: UnderstandingObject): LineageGraph {
  const nodes: LineageNode[] = [];
  const edges: LineageEdge[] = [];

  // Root object node
  nodes.push({
    id: object.objectId,
    type: "object",
    label: object.content.title,
    timestamp: object.createdAt,
    metadata: {
      domain: object.domain,
      status: object.status,
      confidence: object.metadata.avgConfidence,
    },
  });

  // Session node
  nodes.push({
    id: object.sessionId,
    type: "session",
    label: `Session ${object.sessionId.slice(0, 12)}`,
    timestamp: object.createdAt,
  });
  edges.push({
    from: object.sessionId,
    to: object.objectId,
    relation: "produced",
    timestamp: object.createdAt,
  });

  // Audit trail nodes
  for (const entry of object.lineage.auditTrail) {
    const nodeId = `audit:${entry.at}:${entry.action}`;
    nodes.push({
      id: nodeId,
      type: "promotion",
      label: entry.action,
      timestamp: entry.at,
      metadata: { actor: entry.actor, detail: entry.detail },
    });
    edges.push({
      from: object.objectId,
      to: nodeId,
      relation: "audited",
      timestamp: entry.at,
    });
  }

  // Merge history nodes
  for (const merge of object.lineage.mergeHistory) {
    const mergeNodeId = `merge:${merge.mergedAt}`;
    nodes.push({
      id: mergeNodeId,
      type: "merge",
      label: `Merge ${merge.mergedFrom.length} objects`,
      timestamp: merge.mergedAt,
    });
    for (const fromId of merge.mergedFrom) {
      edges.push({
        from: fromId,
        to: mergeNodeId,
        relation: "merged_into",
        timestamp: merge.mergedAt,
      });
    }
    edges.push({
      from: mergeNodeId,
      to: object.objectId,
      relation: "produced",
      timestamp: merge.mergedAt,
    });
  }

  // Derived objects
  for (const derivedId of object.lineage.derivedObjects) {
    edges.push({
      from: object.objectId,
      to: derivedId,
      relation: "superseded_by",
      timestamp: object.updatedAt,
    });
  }

  return { nodes, edges };
}

/**
 * Serialize lineage to a CouchDB-compatible document.
 */
export function serializeLineage(object: UnderstandingObject): Record<string, unknown> {
  return {
    _id: `lineage:${object.objectId}`,
    type: "lineage.snapshot",
    tenant_id: object.tenantId,
    object_id: object.objectId,
    session_id: object.sessionId,
    lineage: object.lineage,
    provenance: object.provenance,
    created_at: object.createdAt,
    updated_at: object.updatedAt,
  };
}

/**
 * Compute a lineage hash for integrity verification.
 */
export async function computeLineageHash(object: UnderstandingObject): Promise<string> {
  const data = JSON.stringify({
    objectId: object.objectId,
    auditTrail: object.lineage.auditTrail,
    mergeHistory: object.lineage.mergeHistory,
    derivedObjects: object.lineage.derivedObjects,
  });

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
