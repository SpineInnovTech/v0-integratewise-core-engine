/**
 * Synthesis Pipeline — Promotion Gate
 *
 * Decides whether an Understanding Object is promoted to the
 * knowledge-persisted layer.
 *
 * Two paths:
 * 1. AUTO-APPROVE: High confidence + no governance flags + trusted domain
 * 2. HITL: Everything else routes to a human approval queue
 *
 * Design: This is the GOVERNANCE stage. It enforces the wall between
 * draft knowledge and canonical organizational memory.
 */

import type { UnderstandingObject } from "./continuity-object-factory";
import type { KnowledgeDomain } from "./triage-bot";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PromotionDecision = "auto_approved" | "hitl_required" | "rejected" | "deferred";

export interface PromotionResult {
  decision: PromotionDecision;
  objectId: string;
  reason: string;
  hitlQueueId?: string;
  approvedAt?: string;
  approvedBy?: string;
  promotedPath?: string; // e.g., /product/knowledge-persisted/uo:abc
}

export interface PromotionGateConfig {
  autoApproveThreshold: number;
  autoApproveDomains: KnowledgeDomain[];
  neverAutoApproveDomains: KnowledgeDomain[];
  maxDailyAutoPromotions: number;
  requireGovernanceForTypes: string[];
  rejectionKeywords: string[];
}

// ─── Default Configuration ──────────────────────────────────────────────────

const DEFAULT_GATE_CONFIG: PromotionGateConfig = {
  autoApproveThreshold: 0.85,
  autoApproveDomains: [
    "product",
    "engineering",
    "design",
    "marketing",
    "sales",
    "customer-success",
    "business-operations",
  ],
  neverAutoApproveDomains: ["executive", "finance", "infrastructure-and-security"],
  maxDailyAutoPromotions: 50,
  requireGovernanceForTypes: ["doctrine_update", "policy_change", "security_alert"],
  rejectionKeywords: ["test", "draft", "temporary", "ignore", "wip", "placeholder"],
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Evaluate an Understanding Object for promotion.
 *
 * Returns a PromotionResult with the decision and optional HITL queue ID.
 */
export async function evaluatePromotion(
  object: UnderstandingObject,
  env: { EXECUTION_META?: KVNamespace; HITL_GATE?: DurableObjectNamespace },
  config: Partial<PromotionGateConfig> = {}
): Promise<PromotionResult> {
  const mergedConfig = { ...DEFAULT_GATE_CONFIG, ...config };

  // 1. Rejection guard — check for rejection keywords in title/body
  const text = `${object.content.title} ${object.content.body}`.toLowerCase();
  if (mergedConfig.rejectionKeywords.some((kw) => text.includes(kw))) {
    return {
      decision: "rejected",
      objectId: object.objectId,
      reason: "Content contains rejection keywords (test/draft/temporary)",
    };
  }

  // 2. Governance guard — certain types always require HITL
  const hasGovernanceType = object.content.decisions.some((d) =>
    mergedConfig.requireGovernanceForTypes.some((t) => d.statement.toLowerCase().includes(t))
  );
  if (hasGovernanceType || object.metadata.requiresGovernance) {
    return routeToHitl(object, env, "Governance-type content requires human review");
  }

  // 3. Domain guard — never auto-approve certain domains
  if (mergedConfig.neverAutoApproveDomains.includes(object.domain)) {
    return routeToHitl(object, env, `${object.domain} domain requires mandatory review`);
  }

  // 4. Confidence guard
  if (object.metadata.avgConfidence < mergedConfig.autoApproveThreshold) {
    return routeToHitl(
      object,
      env,
      `Confidence ${object.metadata.avgConfidence} below threshold ${mergedConfig.autoApproveThreshold}`
    );
  }

  // 5. Rate limit guard — daily auto-promotion cap
  const withinRateLimit = await checkDailyAutoPromotionLimit(
    object.tenantId,
    env,
    mergedConfig.maxDailyAutoPromotions
  );
  if (!withinRateLimit) {
    return routeToHitl(object, env, "Daily auto-approval limit reached");
  }

  // 6. Auto-approve
  const now = new Date().toISOString();
  const promotedPath = buildKnowledgePath(object.domain, object.objectId);

  // Increment counter
  await incrementDailyCounter(object.tenantId, env);

  return {
    decision: "auto_approved",
    objectId: object.objectId,
    reason: "Met all auto-approval criteria",
    approvedAt: now,
    approvedBy: "promotion-gate:auto",
    promotedPath,
  };
}

/**
 * Approve an object that was previously sent to HITL.
 */
export function approveObject(
  object: UnderstandingObject,
  approvedBy: string,
  reason?: string
): PromotionResult {
  const now = new Date().toISOString();

  return {
    decision: "auto_approved",
    objectId: object.objectId,
    reason: reason || `Approved by ${approvedBy}`,
    approvedAt: now,
    approvedBy,
    promotedPath: buildKnowledgePath(object.domain, object.objectId),
  };
}

/**
 * Reject an object from HITL review.
 */
export function rejectObject(
  object: UnderstandingObject,
  rejectedBy: string,
  reason: string
): PromotionResult {
  return {
    decision: "rejected",
    objectId: object.objectId,
    reason: `Rejected by ${rejectedBy}: ${reason}`,
  };
}

/**
 * Defer an object for later review.
 */
export function deferObject(
  object: UnderstandingObject,
  deferredBy: string,
  reason: string,
  _reviewAt?: string
): PromotionResult {
  return {
    decision: "deferred",
    objectId: object.objectId,
    reason: `Deferred by ${deferredBy}: ${reason}`,
    hitlQueueId: `defer:${object.objectId}`,
  };
}

// ─── HITL Routing ───────────────────────────────────────────────────────────

function routeToHitl(
  object: UnderstandingObject,
  env: { HITL_GATE?: DurableObjectNamespace },
  reason: string
): PromotionResult {
  const hitlQueueId = `hitl:${object.tenantId}:${object.objectId}`;

  // Fire-and-forget HITL creation via Durable Object
  if (env.HITL_GATE) {
    const id = env.HITL_GATE.idFromName("global");
    const stub = env.HITL_GATE.get(id);
    stub
      .fetch(
        new Request("http://hitl/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signal_id: hitlQueueId,
            workspace_id: object.tenantId,
            analysis: {
              object_id: object.objectId,
              domain: object.domain,
              title: object.content.title,
              summary: object.content.summary,
              confidence: object.metadata.avgConfidence,
              requires_governance: object.metadata.requiresGovernance,
            },
          }),
        })
      )
      .catch(() => {
        /* non-blocking */
      });
  }

  return {
    decision: "hitl_required",
    objectId: object.objectId,
    reason,
    hitlQueueId,
  };
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

async function checkDailyAutoPromotionLimit(
  tenantId: string,
  env: { EXECUTION_META?: KVNamespace },
  maxDaily: number
): Promise<boolean> {
  if (!env.EXECUTION_META) return true;

  const key = `daily-auto-promotions:${tenantId}:${new Date().toISOString().slice(0, 10)}`;
  const current = await env.EXECUTION_META.get(key);
  const count = current ? parseInt(current, 10) : 0;
  return count < maxDaily;
}

async function incrementDailyCounter(
  tenantId: string,
  env: { EXECUTION_META?: KVNamespace }
): Promise<void> {
  if (!env.EXECUTION_META) return;

  const key = `daily-auto-promotions:${tenantId}:${new Date().toISOString().slice(0, 10)}`;
  const current = await env.EXECUTION_META.get(key);
  const count = current ? parseInt(current, 10) : 0;
  await env.EXECUTION_META.put(key, String(count + 1), { expirationTtl: 86400 });
}

// ─── Knowledge Path Builder ─────────────────────────────────────────────────

function buildKnowledgePath(domain: KnowledgeDomain, objectId: string): string {
  return `/${domain}/knowledge-persisted/${objectId}`;
}
