/**
 * Synthesis Pipeline — Continuity Object Factory
 *
 * Creates structured "Understanding Objects" from TriageClassifications.
 *
 * An Understanding Object is the canonical draft of organizational knowledge
 * before promotion to the persisted knowledge layer.
 *
 * Design: This is the DRAFT stage. It transforms classified extractions
 * into typed, referenceable, versioned objects.
 */

import type { TriageClassification, KnowledgeDomain } from "./triage-bot";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UnderstandingObject {
  objectId: string;
  version: string;
  schemaVersion: "2025-05-v1";
  classificationId: string;
  sessionId: string;
  tenantId: string;
  domain: KnowledgeDomain;
  status: "draft" | "under_review" | "approved" | "rejected" | "superseded";
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  content: UnderstandingContent;
  provenance: ProvenanceChain;
  lineage: LineageRecord;
  metadata: ObjectMetadata;
}

export interface UnderstandingContent {
  title: string;
  summary: string;
  body: string;
  keyFacts: string[];
  decisions: DecisionRecord[];
  actionItems: ActionItemRecord[];
  relationships: RelationshipRecord[];
  tags: string[];
}

export interface DecisionRecord {
  id: string;
  statement: string;
  context: string;
  confidence: number;
  sourceEventIds: string[];
  timestamp: string;
}

export interface ActionItemRecord {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  status: "open" | "in_progress" | "done" | "cancelled";
  sourceEventIds: string[];
}

export interface RelationshipRecord {
  from: { entityType: string; entityId: string };
  to: { entityType: string; entityId: string };
  relationType: string;
  confidence: number;
}

export interface ProvenanceChain {
  sourceSessionId: string;
  sourceEvents: string[];
  extractedBy: "triage-bot-v1";
  extractionTimestamp: string;
  classificationId: string;
}

export interface LineageRecord {
  parentObjectId?: string;
  derivedObjects: string[];
  mergeHistory: Array<{ mergedAt: string; mergedFrom: string[] }>;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface ObjectMetadata {
  eventCount: number;
  extractionCount: number;
  avgConfidence: number;
  priority: "low" | "medium" | "high" | "critical";
  requiresGovernance: boolean;
  autoExpireAt?: string;
}

// ─── Factory Configuration ──────────────────────────────────────────────────

export interface FactoryConfig {
  defaultTtlDays: number;
  maxTitleLength: number;
  maxSummaryLength: number;
  maxBodyLength: number;
}

const DEFAULT_FACTORY_CONFIG: FactoryConfig = {
  defaultTtlDays: 90,
  maxTitleLength: 200,
  maxSummaryLength: 1000,
  maxBodyLength: 10000,
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Create an Understanding Object from a TriageClassification.
 *
 * This is the canonical draft builder. It structures raw extractions
 * into a typed object ready for the Promotion Gate.
 */
export function createUnderstandingObject(
  classification: TriageClassification,
  config: Partial<FactoryConfig> = {}
): UnderstandingObject {
  const mergedConfig = { ...DEFAULT_FACTORY_CONFIG, ...config };
  const now = new Date().toISOString();

  const content = buildContent(classification, mergedConfig);
  const metadata = buildMetadata(classification);

  return {
    objectId: `uo:${classification.sessionId}:${Date.now().toString(36)}`,
    version: "1.0.0",
    schemaVersion: "2025-05-v1",
    classificationId: classification.classificationId,
    sessionId: classification.sessionId,
    tenantId: classification.tenantId,
    domain: classification.suggestedDomain,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    content,
    provenance: {
      sourceSessionId: classification.sessionId,
      sourceEvents: classification.extractions.flatMap((e) => e.sourceEvents),
      extractedBy: "triage-bot-v1",
      extractionTimestamp: classification.createdAt,
      classificationId: classification.classificationId,
    },
    lineage: {
      derivedObjects: [],
      mergeHistory: [],
      auditTrail: [
        {
          at: now,
          actor: "continuity-object-factory",
          action: "created_from_classification",
          detail: classification.reasoning,
        },
      ],
    },
    metadata,
  };
}

/**
 * Merge multiple Understanding Objects into a single consolidated object.
 * Used when multiple sessions cover the same topic / entity.
 */
export function mergeUnderstandingObjects(
  objects: UnderstandingObject[],
  mergerId: string,
  config: Partial<FactoryConfig> = {}
): UnderstandingObject {
  if (objects.length === 0) throw new Error("Cannot merge empty array");
  if (objects.length === 1) return objects[0];

  const mergedConfig = { ...DEFAULT_FACTORY_CONFIG, ...config };
  const now = new Date().toISOString();
  const primary = objects[0];

  // Merge content
  const allFacts = new Set<string>();
  const allDecisions: DecisionRecord[] = [];
  const allActions: ActionItemRecord[] = [];
  const allRelationships: RelationshipRecord[] = [];
  const allTags = new Set<string>();

  for (const obj of objects) {
    obj.content.keyFacts.forEach((f) => allFacts.add(f));
    allDecisions.push(...obj.content.decisions);
    allActions.push(...obj.content.actionItems);
    allRelationships.push(...obj.content.relationships);
    obj.content.tags.forEach((t) => allTags.add(t));
  }

  const mergedContent: UnderstandingContent = {
    title: truncate(`Merged: ${primary.content.title}`, mergedConfig.maxTitleLength),
    summary: truncate(
      `Consolidated from ${objects.length} sessions. ${primary.content.summary}`,
      mergedConfig.maxSummaryLength
    ),
    body: truncate(
      objects.map((o) => o.content.body).join("\n\n---\n\n"),
      mergedConfig.maxBodyLength
    ),
    keyFacts: Array.from(allFacts),
    decisions: deduplicateDecisions(allDecisions),
    actionItems: deduplicateActionItems(allActions),
    relationships: deduplicateRelationships(allRelationships),
    tags: Array.from(allTags),
  };

  // Compute merged metadata
  const avgConfidence =
    objects.reduce((sum, o) => sum + o.metadata.avgConfidence, 0) / objects.length;

  const merged: UnderstandingObject = {
    objectId: `uo:merged:${Date.now().toString(36)}`,
    version: "1.0.0",
    schemaVersion: "2025-05-v1",
    classificationId: primary.classificationId,
    sessionId: primary.sessionId,
    tenantId: primary.tenantId,
    domain: primary.domain,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    content: mergedContent,
    provenance: {
      ...primary.provenance,
      extractionTimestamp: now,
    },
    lineage: {
      parentObjectId: primary.objectId,
      derivedObjects: objects.map((o) => o.objectId),
      mergeHistory: [
        ...(primary.lineage.mergeHistory || []),
        { mergedAt: now, mergedFrom: objects.map((o) => o.objectId) },
      ],
      auditTrail: [
        ...primary.lineage.auditTrail,
        {
          at: now,
          actor: mergerId,
          action: "merged_objects",
          detail: `Merged ${objects.length} objects`,
        },
      ],
    },
    metadata: {
      eventCount: objects.reduce((sum, o) => sum + o.metadata.eventCount, 0),
      extractionCount: objects.reduce((sum, o) => sum + o.metadata.extractionCount, 0),
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      priority: objects.some((o) => o.metadata.priority === "critical")
        ? "critical"
        : objects.some((o) => o.metadata.priority === "high")
          ? "high"
          : "medium",
      requiresGovernance: objects.some((o) => o.metadata.requiresGovernance),
      autoExpireAt: computeExpiry(primary.domain, mergedConfig.defaultTtlDays),
    },
  };

  return merged;
}

// ─── Content Builders ───────────────────────────────────────────────────────

function buildContent(
  classification: TriageClassification,
  config: FactoryConfig
): UnderstandingContent {
  const extractions = classification.extractions;

  const title =
    extractions.find((e) => e.type === "decision")?.content ||
    extractions[0]?.content ||
    `Session ${classification.sessionId}`;

  const summary = classification.reasoning;

  const body = extractions.map((e) => `[${e.type}] ${e.content}`).join("\n\n");

  return {
    title: truncate(title, config.maxTitleLength),
    summary: truncate(summary, config.maxSummaryLength),
    body: truncate(body, config.maxBodyLength),
    keyFacts: extractions.filter((e) => e.type === "fact").map((e) => e.content),
    decisions: extractions
      .filter((e) => e.type === "decision")
      .map((e) => ({
        id: `dec:${e.sourceEvents[0]?.slice(-12) || Date.now().toString(36)}`,
        statement: e.content,
        context: classification.reasoning,
        confidence: e.confidence,
        sourceEventIds: e.sourceEvents,
        timestamp: classification.createdAt,
      })),
    actionItems: extractions
      .filter((e) => e.type === "action_item")
      .map((e) => ({
        id: `act:${e.sourceEvents[0]?.slice(-12) || Date.now().toString(36)}`,
        description: e.content,
        status: "open",
        sourceEventIds: e.sourceEvents,
      })),
    relationships: extractions
      .filter((e) => e.type === "relationship" && e.entityRefs)
      .flatMap((e) =>
        (e.entityRefs || []).map((ref) => ({
          from: ref,
          to: ref, // Simplified — real impl would parse relation direction
          relationType: "mentioned_in",
          confidence: e.confidence,
        }))
      ),
    tags: Array.from(new Set(extractions.map((e) => e.category).filter(Boolean))),
  };
}

function buildMetadata(classification: TriageClassification): ObjectMetadata {
  const confidences = classification.extractions.map((e) => e.confidence);
  const avgConfidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

  return {
    eventCount: classification.extractions.reduce((sum, e) => sum + e.sourceEvents.length, 0),
    extractionCount: classification.extractions.length,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    priority: classification.extractions.some((e) => e.priority === "high") ? "high" : "medium",
    requiresGovernance: classification.requiresHitl,
  };
}

// ─── Deduplication ──────────────────────────────────────────────────────────

function deduplicateDecisions(decisions: DecisionRecord[]): DecisionRecord[] {
  const seen = new Set<string>();
  return decisions.filter((d) => {
    const key = d.statement.slice(0, 100).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateActionItems(actions: ActionItemRecord[]): ActionItemRecord[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = a.description.slice(0, 100).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateRelationships(rels: RelationshipRecord[]): RelationshipRecord[] {
  const seen = new Set<string>();
  return rels.filter((r) => {
    const key = `${r.from.entityType}:${r.from.entityId}-${r.to.entityType}:${r.to.entityId}-${r.relationType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

function computeExpiry(domain: KnowledgeDomain, defaultTtlDays: number): string {
  const date = new Date();
  // Critical domains get longer retention
  const multiplier = ["executive", "finance", "infrastructure-and-security"].includes(domain)
    ? 2
    : 1;
  date.setDate(date.getDate() + defaultTtlDays * multiplier);
  return date.toISOString();
}
