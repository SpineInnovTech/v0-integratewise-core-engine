/**
 * Memory Promotion Engine (spine-hydration-lifecycle Phase 5 — the missing layer).
 *
 * Spine grows → selected entities/signals become Memory. This is what turns the
 * Spine from "a database" into Continuity: not every record is promoted, only the
 * ones that qualify against the 7 Promotion_Signals — important, repeated,
 * strategic, behavioral, decision, preference, exception.
 *
 * Flow (Cloudflare-only, No ETL):
 *   writeToSpine() emits `spine.written` → MEMORY_PROMOTE queue →
 *   handleMemoryPromoteBatch() → scoreForPromotion() (pure) → governance gate →
 *   org_memory (D1) + memory_promotion_audit (D1) + AI Search index.
 *
 * Governance: promotions whose category is in the tenant's governanceDefaults
 * .requiresApproval (or when autoPromote is false) land in `staging` — the Twin
 * must not use them until approved (R11.3). Others land `approved`.
 */

import { indexOrgMemoryBulk } from "./memory-indexer";

export type PromotionSignal =
  | "important"
  | "repeated"
  | "strategic"
  | "behavioral"
  | "decision"
  | "preference"
  | "exception";

export interface SpineWriteEvent {
  event?: string;
  tenant_id: string;
  entity_id: string;
  entity_type: string;
  domain?: string;
  name?: string;
  source?: string;
  data?: Record<string, unknown>;
  written_at?: string;
}

export interface PromotionSchema {
  memoryCategories: string[];
  governanceDefaults: { autoPromote: boolean; requiresApproval: string[] };
}

export interface PromotionScore {
  entityId: string;
  signals: PromotionSignal[];
  score: number;
  promote: boolean;
  category: string;
  governanceState: "approved" | "staging";
  rationale: string;
}

// Signal weights — "strong" signals (>=2) can promote alone; weak signals need company.
const SIGNAL_WEIGHTS: Record<PromotionSignal, number> = {
  strategic: 2,
  decision: 2,
  exception: 2,
  important: 1,
  repeated: 1,
  behavioral: 1,
  preference: 1,
};

const PROMOTE_THRESHOLD = 2;

// Entity types that are inherently strategic (carry org-level meaning).
const STRATEGIC_TYPES = new Set([
  "account",
  "deal",
  "opportunity",
  "renewal",
  "contract",
  "vendor",
  "invoice",
  "subscription",
  "incident",
  "repository", // GitHub / source control — core organizational context
  "repo",
]);

const BEHAVIORAL_TYPES = new Set(["activity", "engagement", "interaction_event", "event"]);

function truthy(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (typeof v === "string") return v.trim() !== "" && v !== "false" && v !== "0";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Map a fired signal to a memory category, preferring the tenant's identity-derived
// categories when one matches; otherwise use the canonical category for the signal.
function categoryForSignals(signals: PromotionSignal[], schema: PromotionSchema): string {
  const preference: Array<[PromotionSignal, string[]]> = [
    ["decision", ["decision"]],
    ["exception", ["risk", "incident"]],
    ["strategic", ["strategic_context", "account_context", "org_context"]],
    ["preference", ["preference"]],
    ["behavioral", ["behavior", "process_context"]],
    ["important", ["account_context", "org_context", "context"]],
    ["repeated", ["behavior", "context"]],
  ];
  for (const [sig, cats] of preference) {
    if (!signals.includes(sig)) continue;
    const inSchema = cats.find((c) => schema.memoryCategories.includes(c));
    if (inSchema) return inSchema;
  }
  // Fallback: first canonical category for the highest-weight fired signal.
  const ordered = [...signals].sort((a, b) => SIGNAL_WEIGHTS[b] - SIGNAL_WEIGHTS[a]);
  const map: Record<PromotionSignal, string> = {
    decision: "decision",
    exception: "risk",
    strategic: "strategic_context",
    preference: "preference",
    behavioral: "behavior",
    important: "context",
    repeated: "context",
  };
  return ordered.length ? map[ordered[0]] : "context";
}

/**
 * Pure: score a single Spine write against the 7 Promotion_Signals. Rules-first,
 * deterministic, unit-testable. No I/O (dedupe/"repeated" reconciliation happens
 * in promote()). Returns whether to promote, the category, and a rationale.
 */
export function scoreForPromotion(event: SpineWriteEvent, schema: PromotionSchema): PromotionScore {
  const data = event.data || {};
  const type = (event.entity_type || "").toLowerCase();
  const fired = new Set<PromotionSignal>();

  // strategic / important — by entity nature or material value
  if (STRATEGIC_TYPES.has(type)) {
    fired.add("strategic");
    fired.add("important");
  }
  if (type === "repository" || type === "repo") {
    // Repos are strategic; activity/stars make them "important" for context
    if (
      Number(data.stars ?? 0) > 0 ||
      truthy(data.last_activity) ||
      truthy(data.language) ||
      truthy(data.open_issues)
    ) {
      fired.add("important");
    }
    // If has recent pushes or multiple contributors, treat as repeated/ behavioral signal
    if (Number(data.forks_count ?? data.stargazers_count ?? 0) > 1) fired.add("repeated");
  }
  const value = Number(data.arr ?? data.revenue ?? data.amount ?? data.value ?? 0);
  if (Number.isFinite(value) && value > 0) fired.add("important");

  // decision — explicit decision provenance
  if (type === "decision" || truthy(data.decided_by) || truthy(data.decided_at)) {
    fired.add("decision");
  }

  // exception — risk / anomaly / breach / blocked / churn / overdue
  const status = String(data.status ?? "").toLowerCase();
  const exceptionStatus = ["at_risk", "blocked", "failed", "churned", "overdue", "escalated"];
  if (
    exceptionStatus.includes(status) ||
    truthy(data.blocked_by) ||
    truthy(data.risk) ||
    truthy(data.anomaly) ||
    truthy(data.sla_breach) ||
    truthy(data.escalation) ||
    truthy(data.churn) ||
    truthy(data.overdue)
  ) {
    fired.add("exception");
  }

  // behavioral — activity/engagement entities represent behavior over time
  if (BEHAVIORAL_TYPES.has(type)) fired.add("behavioral");

  // preference — explicit preference signal on a person/contact
  if (truthy(data.preference) || truthy(data.preferences)) fired.add("preference");

  // repeated — when the event carries an occurrence/repeat count > 1
  const occ = Number(data.occurrence_count ?? data.repeat_count ?? 0);
  if (Number.isFinite(occ) && occ > 1) fired.add("repeated");

  const signals = [...fired];
  const score = signals.reduce((sum, s) => sum + SIGNAL_WEIGHTS[s], 0);
  const promote = score >= PROMOTE_THRESHOLD;
  const category = categoryForSignals(signals, schema);

  // Governance gate: sensitive categories or autoPromote=false → staging.
  const needsApproval =
    !schema.governanceDefaults.autoPromote ||
    schema.governanceDefaults.requiresApproval.includes(category);
  const governanceState: "approved" | "staging" = needsApproval ? "staging" : "approved";

  const rationale = promote
    ? `Promoted (${score}): ${signals.join(", ")} → ${category} [${governanceState}]`
    : `Not promoted (${score} < ${PROMOTE_THRESHOLD}); signals: ${signals.join(", ") || "none"}`;

  return {
    entityId: event.entity_id,
    signals,
    score,
    promote,
    category,
    governanceState,
    rationale,
  };
}

// ── I/O side: load schema, promote, audit ───────────────────────────────────

export interface PromoterEnv {
  CACHE_DB: D1Database;
  AI_SEARCH?: unknown;
}

const DEFAULT_SCHEMA: PromotionSchema = {
  memoryCategories: ["context", "decision", "risk", "preference", "behavior"],
  governanceDefaults: { autoPromote: true, requiresApproval: ["risk", "decision", "policy"] },
};

async function loadPromotionSchema(db: D1Database, tenantId: string): Promise<PromotionSchema> {
  try {
    const row = await db
      .prepare(
        `SELECT memory_categories, governance_defaults FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`
      )
      .bind(tenantId)
      .first<{ memory_categories: string | null; governance_defaults: string | null }>();
    if (!row) return DEFAULT_SCHEMA;
    const memoryCategories = safeParse<string[]>(
      row.memory_categories,
      DEFAULT_SCHEMA.memoryCategories
    );
    const governanceDefaults = safeParse<PromotionSchema["governanceDefaults"]>(
      row.governance_defaults,
      DEFAULT_SCHEMA.governanceDefaults
    );
    return { memoryCategories, governanceDefaults };
  } catch {
    return DEFAULT_SCHEMA;
  }
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Promote a single Spine write into Memory (or record a no-promote audit).
 * Deduplicates by lineage_ref (the source entity): a repeated observation
 * strengthens the existing Memory rather than creating a duplicate (R6.5).
 * Always writes a memory_promotion_audit row (R6.6 / Property 5).
 * Returns true when an APPROVED memory was written/updated (for indexing).
 */
export async function promote(event: SpineWriteEvent, env: PromoterEnv): Promise<boolean> {
  const db = env.CACHE_DB;
  const schema = await loadPromotionSchema(db, event.tenant_id);
  const score = scoreForPromotion(event, schema);
  const now = new Date().toISOString();
  const auditId = crypto.randomUUID();

  if (!score.promote) {
    await db
      .prepare(
        `INSERT INTO memory_promotion_audit
           (id, tenant_id, entity_id, signals, score, category, promoted, governance_state, rationale, decided_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
      )
      .bind(
        auditId,
        event.tenant_id,
        event.entity_id,
        JSON.stringify(score.signals),
        score.score,
        score.category,
        "n/a",
        score.rationale,
        "memory-promoter",
        now
      )
      .run();
    return false;
  }

  const content = buildMemoryContent(event, score);
  const topic = event.name || `${event.entity_type} ${event.entity_id}`;

  // Dedupe/reconcile by lineage_ref (source Spine entity).
  const existing = await db
    .prepare(
      `SELECT id, confidence FROM org_memory WHERE tenant_id = ? AND lineage_ref = ? LIMIT 1`
    )
    .bind(event.tenant_id, event.entity_id)
    .first<{ id: string; confidence: number | null }>();

  if (existing) {
    const newConfidence = Math.min(1, (existing.confidence ?? 0.5) + 0.1);
    await db
      .prepare(
        `UPDATE org_memory SET content = ?, confidence = ?, governance_state = ?, updated_at = ? WHERE id = ?`
      )
      .bind(content, newConfidence, score.governanceState, now, existing.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO org_memory
           (id, tenant_id, topic, category, content, source_session_id, governance_state, confidence,
            embedding, metadata, created_at, updated_at, related_entity_ids, related_departments, access_scope, lineage_ref, tier)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        event.tenant_id,
        topic,
        score.category,
        content,
        score.governanceState,
        0.6,
        JSON.stringify({
          source: event.source,
          entity_type: event.entity_type,
          signals: score.signals,
        }),
        now,
        now,
        JSON.stringify([event.entity_id]),
        JSON.stringify(event.domain ? [event.domain] : []),
        "org",
        event.entity_id,
        "standard"
      )
      .run();
  }

  await db
    .prepare(
      `INSERT INTO memory_promotion_audit
         (id, tenant_id, entity_id, signals, score, category, promoted, governance_state, rationale, decided_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
    )
    .bind(
      auditId,
      event.tenant_id,
      event.entity_id,
      JSON.stringify(score.signals),
      score.score,
      score.category,
      score.governanceState,
      score.rationale,
      "memory-promoter",
      now
    )
    .run();

  return score.governanceState === "approved";
}

function buildMemoryContent(event: SpineWriteEvent, score: PromotionScore): string {
  const d = event.data || {};
  const facts: string[] = [];
  if (d.status) facts.push(`status=${d.status}`);
  for (const k of ["arr", "revenue", "amount", "due_date", "owner", "assignee", "priority"]) {
    if (d[k] !== undefined && d[k] !== null) facts.push(`${k}=${d[k]}`);
  }
  const factStr = facts.length ? ` (${facts.join(", ")})` : "";
  return `${event.entity_type} "${event.name || event.entity_id}"${factStr} — ${score.signals.join("/")}.`;
}

/**
 * Queue consumer entry for the `memory-promote` queue. Best-effort per message;
 * a single failure retries that message without blocking the batch. Indexes the
 * tenant's approved memory into AI Search once per batch (idempotent).
 */
export async function handleMemoryPromoteBatch(
  batch: MessageBatch<SpineWriteEvent>,
  env: PromoterEnv
): Promise<void> {
  const approvedTenants = new Set<string>();
  for (const msg of batch.messages) {
    try {
      const wroteApproved = await promote(msg.body, env);
      if (wroteApproved) approvedTenants.add(msg.body.tenant_id);
      msg.ack();
    } catch (err) {
      console.error("[memory-promoter] promote failed:", err instanceof Error ? err.message : err);
      msg.retry();
    }
  }

  // Index approved memory into AI Search (reuses the existing indexer; idempotent).
  if (env.AI_SEARCH) {
    for (const tenantId of approvedTenants) {
      try {
        await indexOrgMemoryBulk(env as { CACHE_DB: D1Database; AI_SEARCH: unknown }, tenantId);
      } catch (err) {
        console.warn(
          "[memory-promoter] index skipped (non-fatal):",
          err instanceof Error ? err.message : err
        );
      }
    }
  }
}
