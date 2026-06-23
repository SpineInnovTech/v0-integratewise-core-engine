/**
 * L2 Cognitive Layer — Client API
 *
 * Read/write contract over the spine: one consistent interface for all views.
 * - Read: "Given user + domain + view, what should I show and highlight right now?"
 * - Write: "Given an event or user decision, how does this update context, insights, and audit?"
 *
 * Backed by /api/v1/l2/* (L2 Worker). When API is not configured or returns empty,
 * views still wire to this client so logic can roll out domain-by-domain without UI changes.
 */

import { apiFetch, type ApiError } from "@/lib/api-client";

// ─── Context & refs ────────────────────────────────────────────────────────

export type L2ViewContext = {
  userId: string;
  domain: string; // e.g. "REVOPS", "PRODUCT_ENGINEERING"
  viewId: string; // e.g. "pending-review", "incident-queue", "decision-log"
};

export type L2EntityRef = {
  type: string;
  id: string;
};

// ─── Insights (Flow C outputs) ───────────────────────────────────────────────

export type L2Insight = {
  id: string;
  title: string;
  body: string;
  /** Why this insight matters (for "Suggested by IntegrateWise" card) */
  whyItMatters?: string;
  severity?: "low" | "medium" | "high";
  entities?: L2EntityRef[];
  createdAt: string;
};

// ─── Recommendations & decisions (Governance) ──────────────────────────────

export type L2Recommendation = {
  id: string;
  title: string;
  description: string;
  evidenceRefs: L2EntityRef[];
  evidenceSummary?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  /** For pending: suggested action; for audit: decided action */
  suggestedAction?: string;
  /** Entity this recommendation is about (account, deal, ticket, etc.) */
  entity?: { id: string; name: string; type: string };
  /** When status is approved/rejected */
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
};

export type L2Decision = {
  decision: "approve" | "reject";
  reason?: string;
};

// ─── Entities + context (Spine-backed; optional for first iteration) ─────────

export type L2Entity = {
  ref: L2EntityRef;
  attributes: Record<string, unknown>;
  updatedAt: string;
};

export type L2Context = {
  entity: L2Entity;
  related: L2EntityRef[];
  timeline: Array<{ at: string; type: string; summary: string }>;
  docs: Array<{ id: string; title: string; type: string }>;
  aiSummary?: string;
};

// ─── Events (ingestion path for Flow A/B/C and user actions) ─────────────────

export type L2Event = {
  type: "connector" | "doc" | "ai_session" | "user_action";
  source: string;
  payload: Record<string, unknown>;
  entityRefs?: L2EntityRef[];
  timestamp?: string;
};

// ─── Error Types ───────────────────────────────────────────────────────────

export type L2Error = {
  code: string;
  message: string;
  status?: number;
  details?: any;
};

export class L2ClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = "L2ClientError";
  }
}

// ─── Error Helpers ───────────────────────────────────────────────────────────

function handleApiError(error: unknown, context: string): never {
  if (error && typeof error === "object" && "status" in error) {
    const apiError = error as ApiError;
    throw new L2ClientError(
      apiError.message || `${context} failed`,
      apiError.code || "API_ERROR",
      apiError.status,
      apiError.details
    );
  }

  if (error instanceof Error) {
    throw new L2ClientError(`${context}: ${error.message}`, "CLIENT_ERROR", undefined, error.stack);
  }

  throw new L2ClientError(`${context}: Unknown error`, "UNKNOWN_ERROR", undefined, error);
}

// ─── API: Insights + signals ────────────────────────────────────────────────

/**
 * What's important for this view right now? (AI-derived signals.)
 */
export async function getInsights(ctx: L2ViewContext): Promise<L2Insight[]> {
  try {
    const q = new URLSearchParams({
      domain: ctx.domain,
      viewId: ctx.viewId,
      userId: ctx.userId,
    });
    const data = await apiFetch<L2Insight[]>(`/api/v1/l2/insights?${q}`, {}, "L2");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    handleApiError(error, "getInsights");
  }
}

/**
 * Actionable suggestions with evidence refs (pending by default for approval views).
 */
export async function getRecommendations(
  ctx: L2ViewContext,
  options?: { status?: "pending" | "approved" | "rejected" }
): Promise<L2Recommendation[]> {
  try {
    const q = new URLSearchParams({
      domain: ctx.domain,
      viewId: ctx.viewId,
      userId: ctx.userId,
    });
    if (options?.status) q.set("status", options.status);
    const data = await apiFetch<L2Recommendation[]>(`/api/v1/l2/recommendations?${q}`, {}, "L2");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    handleApiError(error, "getRecommendations");
  }
}

/**
 * List decided recommendations (for decision log / audit view).
 */
export async function listDecisions(
  ctx: L2ViewContext,
  filters?: { status?: "approved" | "rejected"; limit?: number }
): Promise<L2Recommendation[]> {
  try {
    const q = new URLSearchParams({
      domain: ctx.domain,
      viewId: ctx.viewId,
      userId: ctx.userId,
      status: "approved,rejected",
    });
    if (filters?.limit) q.set("limit", String(filters.limit));
    const data = await apiFetch<L2Recommendation[]>(`/api/v1/l2/recommendations?${q}`, {}, "L2");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Record approve/reject decision — routed through Workflow HITL queue.
 * Workflow updates the action in the `actions` table, sends approved actions to ACT_QUEUE,
 * writes learning signals for denials, and creates audit log entries.
 *
 * @deprecated Do NOT call L2 Worker directly for decisions. Use Workflow HITL.
 * Old path: POST /api/v1/l2/recommendations/:id/decision → L2 Worker
 * New path: POST /api/v1/cognitive/hitl/queue → Workflow
 */
export async function decideOnRecommendation(
  ctx: L2ViewContext,
  recommendationId: string,
  decision: L2Decision
): Promise<void> {
  try {
    await apiFetch(
      "/api/v1/cognitive/hitl/queue",
      {
        method: "POST",
        body: {
          action_id: recommendationId,
          decision: decision.decision === "approve" ? "approve" : "deny",
          reason: decision.reason,
          actor: ctx.userId,
          domain: ctx.domain,
          viewId: ctx.viewId,
        },
      },
      "WorkflowHITL"
    );
  } catch (error) {
    handleApiError(error, "decideOnRecommendation");
  }
}

// ─── API: Entities + context ─────────────────────────────────────────────────

export async function getEntities(
  domain: string,
  entityType: string,
  filters?: Record<string, string>
): Promise<L2Entity[]> {
  try {
    const q = new URLSearchParams({ domain, entity_type: entityType, ...filters });
    const data = await apiFetch<{ entities?: any[] }>(
      `/api/v1/workspace/entities?${q}`,
      {},
      "L2:Entities"
    );
    const raw = data?.entities || (Array.isArray(data) ? data : []);
    return raw.map((e: any) => ({
      ref: { type: e.entity_type || entityType, id: e.id || e.spine_id },
      attributes: e.fields || e.attributes || e,
      updatedAt: e.updated_at || e.updatedAt || new Date().toISOString(),
    }));
  } catch (error) {
    handleApiError(error, "getEntities");
  }
}

export async function getContextFor(entityRef: L2EntityRef): Promise<L2Context | null> {
  try {
    const data = await apiFetch<any>(
      `/api/v1/cognitive/evidence/${encodeURIComponent(entityRef.id)}`,
      {},
      "L2:Context"
    );
    if (!data) return null;
    return {
      entity: {
        ref: entityRef,
        attributes: data.entity?.fields || data.entity?.attributes || {},
        updatedAt: data.entity?.updated_at || new Date().toISOString(),
      },
      related: (data.related || []).map((r: any) => ({ type: r.entity_type || r.type, id: r.id })),
      timeline: (data.timeline || data.evidence_trail || []).map((t: any) => ({
        at: t.created_at || t.at || t.timestamp,
        type: t.type || t.action || "event",
        summary: t.summary || t.description || t.details || "",
      })),
      docs: (data.docs || data.documents || []).map((d: any) => ({
        id: d.id,
        title: d.title || d.name,
        type: d.type || "document",
      })),
      aiSummary: data.ai_summary || data.aiSummary || undefined,
    };
  } catch {
    return null;
  }
}

export async function getHITLQueue(): Promise<any[]> {
  try {
    const data = await apiFetch<{ approvals?: any[] }>(
      "/api/v1/cognitive/hitl/queue",
      {},
      "L2:HITLQueue"
    );
    return data?.approvals || [];
  } catch {
    return [];
  }
}

export async function approveHITLAction(
  actionId: string,
  decision: "approve" | "deny"
): Promise<void> {
  await apiFetch(
    "/api/v1/cognitive/hitl/queue",
    {
      method: "POST",
      body: { action_id: actionId, decision },
    },
    "L2:HITLAction"
  );
}

export async function getAuditTrail(limit = 50): Promise<any[]> {
  try {
    const data = await apiFetch<{ entries?: any[] }>(
      `/api/v1/cognitive/audit?limit=${limit}`,
      {},
      "L2:Audit"
    );
    return data?.entries || [];
  } catch {
    return [];
  }
}

// ─── API: Event ingestion ────────────────────────────────────────────────────

/**
 * Record user action or system event for L2 state updates.
 */
export async function recordEvent(_event: L2Event): Promise<void> {
  try {
    await apiFetch(
      "/api/v1/l2/events",
      {
        method: "POST",
        body: _event,
      },
      "L2"
    );
  } catch (error) {
    // Best-effort operation - don't throw, just log
    console.warn("[L2Client] Failed to record event:", error);
    // Silently fail for non-critical events
  }
}

// All types and functions are already exported individually above
// No need for re-export block to avoid isolatedModules conflicts
