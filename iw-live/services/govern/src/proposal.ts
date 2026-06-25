/**
 * Governed Cognition Proposal — Lifecycle Engine
 *
 * ALL proposal reads/writes go through D1 (edge-local SQLite).
 * Continuity writeback to org_memory still uses Supabase REST.
 *
 * FLOW:
 *   Twin produces signal → createProposal() → Triage scores governance level
 *   → pending_review → human approves/rejects → executing → completed
 *   → continuity writeback to Spine/org_memory
 *
 * RULES:
 *   - Only Triage Bot submits proposals (status: draft → pending_review)
 *   - Only humans (or auto-policy) approve/reject
 *   - Every terminal state writes back to Spine via continuity_writeback
 *   - Superseded proposals are never deleted — lineage is immutable
 */

import type {
  Proposal,
  CreateProposalInput,
  ProposalStatus,
  ProposalGovernanceLevel,
  ProposalExecutionResult,
  ProposalContinuityWriteback,
} from "@integratewise/types";
import { canTransition, toOpsProjection } from "@integratewise/types";
import { logDecision } from "./audit";
import type { Env } from "./types";

// ─── D1 JSON helpers ──────────────────────────────────────────────────────────

function toJSON(value: any): string {
  return JSON.stringify(value);
}

function fromJSON<T>(value: string | null): T | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function serializeForD1(record: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    if (typeof value === "object" && value !== null) {
      out[key] = toJSON(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function deserializeProposal(row: Record<string, any>): Proposal {
  return {
    ...row,
    originating_signal: fromJSON(row.originating_signal) ?? row.originating_signal,
    action_target: fromJSON(row.action_target) ?? row.action_target,
    action_parameters: fromJSON(row.action_parameters) ?? row.action_parameters,
    execution_result: fromJSON(row.execution_result),
    continuity_writeback: fromJSON(row.continuity_writeback),
  } as Proposal;
}

// ─── Governance Level Resolution ─────────────────────────────────────────────

function getDomainForType(type: string): "decide" | "build" | "grow" | "run" | "cross" {
  const t = type.toLowerCase();
  if (
    ["okr", "strategic_objective", "business_context", "kpi", "decision", "commitment"].includes(t)
  ) {
    return "decide";
  }
  if (["task", "workflow", "document", "blocker", "calendar_event"].includes(t)) {
    return "build";
  }
  if (["account", "contact", "opportunity", "ticket", "renewal", "risk"].includes(t)) {
    return "grow";
  }
  if (["ops_metric", "ops_metrics"].includes(t)) {
    return "run";
  }
  return "cross";
}

function resolveGovernanceLevel(
  confidence: number,
  signal_severity: string,
  action_type: string
): ProposalGovernanceLevel {
  const restrictedActions = new Set([
    "archive_entity",
    "create_record",
    "update_entity",
    "trigger_workflow",
  ]);
  if (restrictedActions.has(action_type) && signal_severity === "critical") {
    return "restricted";
  }
  const safeActions = new Set(["notify", "draft_communication", "schedule_call", "request_data"]);
  if (confidence >= 0.85 && safeActions.has(action_type) && signal_severity !== "critical") {
    return "auto";
  }
  return "manual";
}

function resolveOpsPriority(signal_severity: string, confidence: number): Proposal["ops_priority"] {
  if (signal_severity === "critical") return "critical";
  if (signal_severity === "high" && confidence >= 0.8) return "high";
  if (signal_severity === "medium") return "medium";
  return "low";
}

function resolveOpsSurface(
  governance_level: ProposalGovernanceLevel,
  ops_priority: Proposal["ops_priority"]
): Proposal["ops_surface"] {
  if (governance_level === "restricted" || ops_priority === "critical") return "command_center";
  if (governance_level === "manual") return "queue";
  if (ops_priority === "high") return "tile";
  if (ops_priority === "medium") return "notification";
  return "timeline";
}

// ─── Triage Bot Proposal Scoring Pipeline ────────────────────────────────────

export function extractKeyTerms(text: string): string[] {
  const stopwords = new Set([
    "the",
    "a",
    "an",
    "is",
    "was",
    "are",
    "were",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "and",
    "or",
    "but",
    "not",
    "this",
    "that",
    "it",
    "be",
    "has",
    "have",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export async function scoreProposal(
  db: any,
  proposal: Proposal
): Promise<{
  score: number;
  breakdown: Record<string, number>;
  decision: "auto_approved" | "pending_review" | "rejected";
  reasoning: string;
}> {
  // 1. Evidence Quality (0.30)
  const references = new Set<string>();
  if (proposal.originating_entity_id) references.add(proposal.originating_entity_id);
  if (proposal.action_target?.entity_id) references.add(proposal.action_target.entity_id);

  const extraEntities = (proposal as any).linked_entities;
  if (Array.isArray(extraEntities)) {
    for (const id of extraEntities) {
      if (typeof id === "string") references.add(id);
    }
  }
  const sourceRefs = (proposal as any).source_references;
  if (Array.isArray(sourceRefs)) {
    for (const id of sourceRefs) {
      if (typeof id === "string") references.add(id);
    }
  }
  const convCtx = (proposal as any).conversation_context;
  if (Array.isArray(convCtx)) {
    for (const id of convCtx) {
      if (typeof id === "string") references.add(id);
    }
  }

  let verifiedCount = 0;
  const totalClaimed = references.size;
  if (totalClaimed > 0) {
    const domains = ["decide", "build", "grow", "run", "cross"];
    for (const id of references) {
      let found = false;
      for (const dom of domains) {
        try {
          const exists = await db
            .prepare(`SELECT 1 FROM ${dom}_data WHERE id = ? LIMIT 1`)
            .bind(id)
            .first();
          if (exists) {
            found = true;
            break;
          }
        } catch {}
      }
      if (found) verifiedCount++;
    }
  }
  const evidenceScore = totalClaimed === 0 ? 0.3 : verifiedCount / totalClaimed;

  // 2. Category Fit (0.20)
  const coreTraits = new Set([
    "doctrine",
    "decision",
    "workflow",
    "policy",
    "insight",
    "pattern",
    "commitment",
    "learning",
    "churn_risk",
    "renewal_risk",
    "expansion",
    "blocker",
    "escalation",
    "anomaly",
    "compliance",
    "threshold",
    "drift",
    "health",
  ]);
  const category = (
    (proposal as any).category ||
    proposal.originating_signal?.signal_category ||
    ""
  )
    .toLowerCase()
    .trim();
  let categoryScore = 0.2;
  if (category) {
    if (coreTraits.has(category)) {
      categoryScore = 1.0;
    } else {
      let matched = false;
      for (const trait of coreTraits) {
        if (category.includes(trait) || trait.includes(category)) {
          categoryScore = 0.7;
          matched = true;
          break;
        }
      }
      if (!matched) {
        categoryScore = 0.2;
      }
    }
  }

  // 3. Novelty (0.20)
  let noveltyScore = 1.0;
  try {
    const keyTerms = extractKeyTerms(
      (proposal.action_description || "") + " " + (proposal.reasoning_summary || "")
    );
    const recentEntries = await db
      .prepare(
        `
      SELECT id, name, data FROM cross_data 
      WHERE created_at > datetime('now', '-30 days')
      UNION ALL
      SELECT id, name, proposal_data as data FROM governance_data
      WHERE created_at > datetime('now', '-30 days')
    `
      )
      .all();

    let maxOverlap = 0;
    if (recentEntries.results && recentEntries.results.length > 0 && keyTerms.length > 0) {
      for (const entry of recentEntries.results) {
        let entryText = entry.name || "";
        if (entry.data) {
          try {
            const parsed = JSON.parse(entry.data);
            entryText +=
              " " +
              (parsed.action_description ||
                parsed.reasoning_summary ||
                parsed.description ||
                JSON.stringify(parsed));
          } catch {
            entryText += " " + entry.data;
          }
        }
        const entryTerms = extractKeyTerms(entryText);
        const overlap = jaccardSimilarity(keyTerms, entryTerms);
        maxOverlap = Math.max(maxOverlap, overlap);
      }
    }
    noveltyScore = 1.0 - maxOverlap;
  } catch {}
  noveltyScore = Math.min(1.0, Math.max(0.0, noveltyScore));

  // 4. Specificity (0.15)
  const descText = (
    (proposal.action_description || "") +
    " " +
    (proposal.reasoning_summary || "")
  ).toLowerCase();
  const words = descText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  let wordScore = 1.0;
  if (wordCount < 20) wordScore = 0.2;
  else if (wordCount <= 50) wordScore = 0.5;
  else if (wordCount <= 2000) wordScore = 1.0;
  else wordScore = 0.7;

  const vagueWords = [
    "something",
    "stuff",
    "things",
    "process",
    "maybe",
    "might",
    "could",
    "possibly",
    "kind of",
    "sort of",
    "basically",
    "generally",
  ];
  let vagueCount = 0;
  for (const word of vagueWords) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = descText.match(regex);
    if (matches) vagueCount += matches.length;
  }
  const penalty = wordCount === 0 ? 0 : Math.min(0.5, vagueCount / wordCount);
  const specificityScore = wordScore * (1.0 - penalty);

  // 5. Entity Linkage (0.15)
  const linkedEntities = new Set<string>();
  if (proposal.action_target?.entity_id) linkedEntities.add(proposal.action_target.entity_id);
  const extraLinked = (proposal as any).linked_entities;
  if (Array.isArray(extraLinked)) {
    for (const id of extraLinked) {
      if (typeof id === "string") linkedEntities.add(id);
    }
  }

  const linkedCount = linkedEntities.size;
  let linkageScore = 0.5;
  if (linkedCount === 0) {
    linkageScore = 0.1;
  } else if (linkedCount <= 2) {
    linkageScore = linkedCount === 1 ? 0.5 : 0.8;
  } else {
    linkageScore = 1.0;
  }

  let verifiedLinkedCount = 0;
  if (linkedCount > 0) {
    const domains = ["decide", "build", "grow", "run", "cross"];
    for (const id of linkedEntities) {
      let found = false;
      for (const dom of domains) {
        try {
          const exists = await db
            .prepare(`SELECT 1 FROM ${dom}_data WHERE id = ? LIMIT 1`)
            .bind(id)
            .first();
          if (exists) {
            found = true;
            break;
          }
        } catch {}
      }
      if (found) verifiedLinkedCount++;
    }
  }
  const multiplier = linkedCount === 0 ? 1.0 : verifiedLinkedCount === linkedCount ? 1.0 : 0.7;
  linkageScore = linkageScore * multiplier;

  // Weighted total
  const score = parseFloat(
    (
      evidenceScore * 0.3 +
      categoryScore * 0.2 +
      noveltyScore * 0.2 +
      specificityScore * 0.15 +
      linkageScore * 0.15
    ).toFixed(4)
  );

  let decision: "auto_approved" | "pending_review" | "rejected" = "pending_review";
  let reasoning = "Stages for manual human-in-the-loop review.";
  if (score >= 0.85) {
    decision = "auto_approved";
    reasoning = "Auto-approved due to high evidence confidence and specificity.";
  } else if (score < 0.6) {
    decision = "rejected";
    reasoning = "Auto-rejected due to low specificity, novelty or evidence support.";
  }

  return {
    score,
    breakdown: {
      evidence_quality: evidenceScore,
      category_fit: categoryScore,
      novelty: noveltyScore,
      specificity: specificityScore,
      entity_linkage: linkageScore,
    },
    decision,
    reasoning,
  };
}

// Helper to update a proposal's record inside D1 governance_data
async function saveProposal(db: any, proposal: Proposal): Promise<void> {
  const now = new Date().toISOString();
  const record = serializeForD1(proposal);
  const proposalDataStr = JSON.stringify(record);

  await db
    .prepare(
      `UPDATE governance_data
       SET status = ?, proposal_data = ?, decided_by = ?, decided_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      proposal.status,
      proposalDataStr,
      proposal.reviewed_by || null,
      proposal.reviewed_at || null,
      now,
      proposal.id
    )
    .run();
}

// ─── Create Proposal ─────────────────────────────────────────────────────────

export async function createProposal(env: Env, input: CreateProposalInput): Promise<Proposal> {
  const db = env.D1;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const governance_level =
    input.governance_level ??
    resolveGovernanceLevel(
      input.confidence,
      input.originating_signal.signal_severity,
      input.action_type
    );

  const ops_priority =
    input.ops_priority ??
    resolveOpsPriority(input.originating_signal.signal_severity, input.confidence);

  const ops_surface = input.ops_surface ?? resolveOpsSurface(governance_level, ops_priority);
  const lineage_id = input.lineage_id ?? crypto.randomUUID();

  const draftProposal: Proposal = {
    id,
    tenant_id: input.tenant_id,
    status: "draft",
    governance_level,
    originating_entity_id: input.originating_entity_id,
    originating_entity_type: input.originating_entity_type,
    originating_signal: input.originating_signal,
    lineage_id,
    parent_proposal_id: input.parent_proposal_id ?? undefined,
    action_type: input.action_type,
    action_target: input.action_target,
    action_parameters: input.action_parameters,
    action_description: input.action_description,
    confidence: input.confidence,
    reasoning_summary: input.reasoning_summary,
    evidence_count: input.evidence_count ?? 0,
    ops_priority,
    ops_surface,
    review_deadline: input.review_deadline ?? undefined,
    created_at: now,
    updated_at: now,
  };

  let finalStatus: ProposalStatus = "pending_review";
  let finalGovLevel = governance_level;
  let finalScore: number | null = null;
  let finalScoreBreakdown: any = null;
  let reviewNotes: string | undefined = undefined;

  const source = (input as any).source || (input as any).proposed_by || "agent";

  if (source === "user") {
    // Skip scoring. Human initiated. Respect the intent.
    finalStatus = "pending_review";
    finalGovLevel = "manual";
    reviewNotes = "User-initiated proposal bypassing triage scoring.";
  } else {
    // Run the scoring pipeline
    const scoreResult = await scoreProposal(db, draftProposal);
    finalScore = scoreResult.score;
    finalScoreBreakdown = scoreResult.breakdown;

    if (scoreResult.decision === "auto_approved") {
      finalStatus = "approved";
      finalGovLevel = "auto";
    } else if (scoreResult.decision === "rejected") {
      finalStatus = "rejected";
      reviewNotes = `Auto-rejected: ${scoreResult.reasoning}`;
    } else {
      finalStatus = "pending_review";
      finalGovLevel = "manual";
      reviewNotes = "Stages for manual human-in-the-loop review.";
    }
  }

  const updatedDraft = {
    ...draftProposal,
    status: finalStatus,
    governance_level: finalGovLevel,
    review_notes: reviewNotes,
    source,
  };

  const record = serializeForD1(updatedDraft);
  const proposalDataStr = JSON.stringify(record);

  // Write to governance_data D1 table
  await db
    .prepare(
      `INSERT INTO governance_data (id, type, proposal_type, proposal_data, status, proposed_by, proposed_at, urgency, score, score_breakdown, created_at, updated_at)
       VALUES (?1, 'approval', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
    )
    .bind(
      id,
      input.action_type || "memory_proposal",
      proposalDataStr,
      finalStatus,
      source === "user" ? "user" : "system-twin",
      now,
      ops_priority,
      finalScore !== null ? finalScore.toFixed(2) : null,
      finalScoreBreakdown !== null ? JSON.stringify(finalScoreBreakdown) : null,
      now,
      now
    )
    .run();

  const finalProposal = deserializeProposal(record);

  // Trigger Operator execution asynchronously if auto-approved
  if (finalStatus === "approved") {
    try {
      await executeAction(env, finalProposal);
    } catch (err: any) {
      console.error(`Failed to execute auto-approved proposal ${id}: ${err.message}`);
    }
  }

  return finalProposal;
}

// ─── Get Proposal ─────────────────────────────────────────────────────────────

export async function getProposal(
  env: Env,
  _tenant_id: string,
  proposal_id: string
): Promise<Proposal | null> {
  const db = env.D1;
  const row = await db
    .prepare("SELECT proposal_data FROM governance_data WHERE id = ? AND type = 'approval'")
    .bind(proposal_id)
    .first<{ proposal_data: string }>();

  if (!row) return null;

  try {
    const record = JSON.parse(row.proposal_data);
    return deserializeProposal(record);
  } catch {
    return null;
  }
}

// ─── List Proposals for Ops Queue ────────────────────────────────────────────

export async function listProposalsForOps(
  env: Env,
  tenant_id: string,
  filters: {
    status?: ProposalStatus | ProposalStatus[];
    ops_surface?: Proposal["ops_surface"];
    entity_type?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const db = env.D1;
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  const statuses: ProposalStatus[] = filters.status
    ? Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    : ["pending_review", "approved"];

  // Build dynamic SQL for status IN clause on governance_data
  const conditions: string[] = [
    "type = 'approval'",
    "json_extract(proposal_data, '$.tenant_id') = ?",
  ];
  const params: (string | number)[] = [tenant_id];

  if (statuses.length === 1) {
    conditions.push("status = ?");
    params.push(statuses[0]);
  } else {
    const inPlaceholders = statuses.map(() => "?").join(", ");
    conditions.push(`status IN (${inPlaceholders})`);
    params.push(...statuses);
  }

  if (filters.ops_surface) {
    conditions.push("json_extract(proposal_data, '$.ops_surface') = ?");
    params.push(filters.ops_surface);
  }

  if (filters.entity_type) {
    conditions.push("json_extract(proposal_data, '$.originating_entity_type') = ?");
    params.push(filters.entity_type);
  }

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT proposal_data FROM governance_data WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();
  return (result.results || [])
    .map((row: any) => {
      const record = JSON.parse(row.proposal_data);
      return deserializeProposal(record);
    })
    .map(toOpsProjection);
}

// ─── Approve Proposal ────────────────────────────────────────────────────────

export async function approveProposal(
  env: Env,
  tenant_id: string,
  proposal_id: string,
  reviewed_by: string,
  review_notes: string | undefined,
  signatureKey: string
): Promise<Proposal> {
  const proposal = await getProposal(env, tenant_id, proposal_id);
  if (!proposal) throw new Error(`Proposal not found: ${proposal_id}`);
  if (!canTransition(proposal.status, "approved")) {
    throw new Error(`Cannot approve proposal in status: ${proposal.status}`);
  }

  const now = new Date().toISOString();
  const updatedProposal = {
    ...proposal,
    status: "approved" as ProposalStatus,
    reviewed_by,
    reviewed_at: now,
    review_notes,
  };

  await saveProposal(env.D1, updatedProposal);

  await logDecision(
    env,
    {
      tenant_id,
      action_id: proposal_id,
      user_id: reviewed_by,
      decision: "approved",
      reason: review_notes ?? "Proposal approved",
      action_type: proposal.action_type,
      metadata: {
        proposal_id,
        lineage_id: proposal.lineage_id,
        entity_id: proposal.originating_entity_id,
        confidence: proposal.confidence,
      },
    },
    signatureKey
  );

  // Create Execution Package on approval (Priority 2 integration)
  // This turns the approved proposal into a first-class handoff artifact.
  const pkgId = `epkg:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const pkgNow = new Date().toISOString();
  try {
    await env.D1.prepare(
      `INSERT OR REPLACE INTO execution_packages 
       (id, tenant_id, title, status, proposal_id, approval_id, workflow_json, tools_json, context_json, created_at, updated_at)
       VALUES (?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        pkgId,
        tenant_id,
        proposal.action_description || "Execution Package",
        proposal_id,
        proposal_id, // approval same as proposal for now
        JSON.stringify(proposal.action_parameters || { steps: [] }),
        JSON.stringify([]),
        JSON.stringify({
          entity: proposal.originating_entity_id,
          reasoning: proposal.reasoning_summary,
        }),
        pkgNow,
        pkgNow
      )
      .run();
  } catch (e) {
    console.error("Failed to create execution_package on approve", e);
  }

  // Trigger Operator Execution handoff asynchronously (for CZ; customers get package export instead)
  try {
    await executeAction(env, updatedProposal);
  } catch (err: any) {
    console.error(`Failed to execute approved proposal ${proposal_id}: ${err.message}`);
  }

  return updatedProposal;
}

// ─── Reject Proposal ─────────────────────────────────────────────────────────

export async function rejectProposal(
  env: Env,
  tenant_id: string,
  proposal_id: string,
  reviewed_by: string,
  review_notes: string,
  signatureKey: string
): Promise<Proposal> {
  const proposal = await getProposal(env, tenant_id, proposal_id);
  if (!proposal) throw new Error(`Proposal not found: ${proposal_id}`);
  if (!canTransition(proposal.status, "rejected")) {
    throw new Error(`Cannot reject proposal in status: ${proposal.status}`);
  }

  const now = new Date().toISOString();
  const updatedProposal = {
    ...proposal,
    status: "rejected" as ProposalStatus,
    reviewed_by,
    reviewed_at: now,
    review_notes,
  };

  await saveProposal(env.D1, updatedProposal);

  await logDecision(
    env,
    {
      tenant_id,
      action_id: proposal_id,
      user_id: reviewed_by,
      decision: "rejected",
      reason: review_notes,
      action_type: proposal.action_type,
      metadata: { proposal_id, lineage_id: proposal.lineage_id },
    },
    signatureKey
  );

  await writebackContinuity(env, updatedProposal, "rejected");
  return updatedProposal;
}

// ─── Lineage & External Action Adapters ──────────────────────────────────────

export interface LineageRecord {
  entity_id: string;
  action: string;
  source: string;
  proposal_id: string;
  details: string;
}

export async function recordLineage(env: Env, execution: LineageRecord): Promise<void> {
  // Try sending to BFF service binding if it exists
  if (env.BFF) {
    try {
      const res = await env.BFF.fetch(
        new Request("https://internal/lineage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_id: execution.entity_id,
            action: execution.action,
            source: execution.source, // 'operator'
            source_id: execution.proposal_id,
            details: execution.details,
            timestamp: new Date().toISOString(),
          }),
        })
      );
      if (res && res.ok) {
        console.log(`Lineage recorded via BFF for entity ${execution.entity_id}`);
        return;
      }
    } catch (err: any) {
      console.warn(`Lineage via BFF failed: ${err.message}`);
    }
  }

  // Fallback: Write to Supabase spine_lineage table via REST if credentials exist
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    try {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/spine_lineage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          entity_id: execution.entity_id,
          action: execution.action,
          source: execution.source, // 'operator'
          source_id: execution.proposal_id,
          details: execution.details,
          created_at: new Date().toISOString(),
        }),
      });
      if (res && res.ok) {
        console.log(`Lineage recorded via Supabase REST for entity ${execution.entity_id}`);
        return;
      }
    } catch (err: any) {
      console.warn(`Lineage via Supabase REST failed: ${err.message}`);
    }
  }

  // Always log to console
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: "lineage_recorded",
      ...execution,
    })
  );
}

export async function executeExternalAction(
  env: Env,
  proposal: Proposal
): Promise<{ status: "completed" | "failed" | "simulated"; result?: any; error?: string }> {
  const target_tool = proposal.action_target?.tool || "unknown";
  const action_type = proposal.action_type;
  const parameters = proposal.action_parameters;

  const db = env.D1;
  const connection = await db
    .prepare(
      `SELECT * FROM governance_data WHERE type = 'sync_status' AND tool_name = ? AND status = 'connected'`
    )
    .bind(target_tool)
    .first();

  if (connection) {
    // Live connector exists. Execute via BFF or ACT or a fetch mock
    try {
      const targetEndpoint = env.ACT ? env.ACT : env.BFF ? env.BFF : null;
      if (targetEndpoint) {
        const res = await targetEndpoint.fetch(
          new Request("https://internal/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: target_tool, action: action_type, params: parameters }),
          })
        );
        if (res && res.ok) {
          return { status: "completed", result: await res.json() };
        } else {
          return {
            status: "failed",
            error: `Live connector execution failed: ${res ? res.status : "no response"}`,
          };
        }
      }
    } catch (err: any) {
      return { status: "failed", error: err.message };
    }
  }

  // No live connector or no endpoint available. Simulate and log.
  return {
    status: "simulated",
    result: {
      tool: target_tool,
      action: action_type,
      parameters,
      message: `Simulated: would execute ${action_type} on ${target_tool}`,
    },
  };
}

// ─── Operator Handoff & Action Execution ─────────────────────────────────────

export async function executeAction(env: Env, proposal: Proposal): Promise<void> {
  const db = env.D1;
  const now = new Date().toISOString();
  let outcomeSummary = "Action executed successfully.";

  // Mark as executing
  await markProposalExecuting(env, proposal.tenant_id, proposal.id, "operator");

  // Package lifecycle + memory for Execution Package (when linked)
  try {
    const pkg = await db
      .prepare(
        "SELECT id, status FROM execution_packages WHERE proposal_id = ? AND tenant_id = ? LIMIT 1"
      )
      .bind(proposal.id, proposal.tenant_id)
      .first<any>();
    if (pkg && pkg.status !== "completed") {
      await db
        .prepare(
          "UPDATE execution_packages SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?"
        )
        .bind("completed", now, now, pkg.id)
        .run();
      // Outcome to memory (conversational or org) - closes continuity loop
      const memId = `mem-epkg-${pkg.id}`;
      const memContent = `Execution Package completed: ${outcomeSummary || "Action done"}. From proposal ${proposal.id}`;
      await db
        .prepare(
          `INSERT OR IGNORE INTO conversational_memory (id, tenant_id, role, content, created_at) VALUES (?, ?, 'system', ?, ?)`
        )
        .bind(memId, proposal.tenant_id, memContent, now)
        .run();
    }
  } catch (e) {
    console.warn("Package/memory update skipped", e);
  }

  try {
    let externalResultId: string | undefined = undefined;
    outcomeSummary = "Action executed successfully.";

    // Classify Action
    const actionType = proposal.action_type;
    const targetType = proposal.action_target?.entity_type || "task";
    const domain = getDomainForType(targetType);
    const tableName = `${domain}_data`;

    if (actionType === "create_task" || actionType === "create_record") {
      // Create Entity path
      const entityId = proposal.action_target?.entity_id || crypto.randomUUID();
      const name = proposal.action_description || `Generated ${targetType}`;
      const rawData = {
        id: entityId,
        type: targetType,
        name,
        status: "open",
        created_at: now,
        updated_at: now,
        ...proposal.action_parameters,
      };

      await db
        .prepare(
          `INSERT INTO ${tableName} (id, type, name, status, data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        )
        .bind(entityId, targetType, name, "open", JSON.stringify(rawData), now, now)
        .run();

      // Write to link_data
      const linkId = crypto.randomUUID();
      const sourceDomain = getDomainForType(proposal.originating_entity_type);
      await db
        .prepare(
          `INSERT INTO link_data (id, source_id, source_domain, target_id, target_domain, relationship_type, data, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(
          linkId,
          proposal.originating_entity_id,
          sourceDomain,
          entityId,
          domain,
          "generated_by_proposal",
          JSON.stringify({ proposal_id: proposal.id }),
          now
        )
        .run();

      outcomeSummary = `Created entity of type ${targetType} with ID ${entityId} and linked to origin.`;

      // Record Lineage
      await recordLineage(env, {
        entity_id: entityId,
        action: actionType,
        source: "operator",
        proposal_id: proposal.id,
        details: outcomeSummary,
      });

      // Push Evolutionary Memory for tasks
      if (typeof globalThis.fetch === "function" && targetType === "task") {
        fetch("http://internal/v1/memory/evolution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "task_event",
            topicKey: `task_${entityId}`,
            topicTitle: `Task Context: ${name}`,
            tenantId: proposal.tenant_id,
            eventTitle: `Task Created via Proposal ${proposal.id}`,
            content: JSON.stringify(rawData, null, 2),
            sessionSource: proposal.id,
          }),
        }).catch((e) =>
          console.warn(`Failed to push evolutionary memory for task ${entityId}:`, e.message)
        );
      }
    } else if (actionType === "update_entity") {
      // Update Entity path
      const targetId = proposal.action_target?.entity_id;
      if (targetId) {
        const existing = await db
          .prepare(`SELECT data FROM ${tableName} WHERE id = ?`)
          .bind(targetId)
          .first<{ data: string }>();

        let mergedData = {};
        if (existing) {
          try {
            mergedData = JSON.parse(existing.data);
          } catch {}
        }

        const updatedData = {
          ...mergedData,
          ...proposal.action_parameters,
          updated_at: now,
        };

        await db
          .prepare(
            `UPDATE ${tableName}
           SET data = ?, updated_at = ?
           WHERE id = ?`
          )
          .bind(JSON.stringify(updatedData), now, targetId)
          .run();

        // Invalidate KV
        if (env.CACHE) {
          await env.CACHE.delete(`entity:${targetId}`);
        }

        outcomeSummary = `Updated entity ${targetId} inside domain ${domain}.`;

        // Record Lineage
        await recordLineage(env, {
          entity_id: targetId,
          action: actionType,
          source: "operator",
          proposal_id: proposal.id,
          details: outcomeSummary,
        });

        // Push Evolutionary Memory for tasks
        if (typeof globalThis.fetch === "function" && targetType === "task") {
          fetch("http://internal/v1/memory/evolution", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "task_event",
              topicKey: `task_${targetId}`,
              topicTitle: `Task Context: ${targetId}`,
              tenantId: proposal.tenant_id,
              eventTitle: `Task Updated via Proposal ${proposal.id}`,
              content: JSON.stringify(updatedData, null, 2),
              sessionSource: proposal.id,
            }),
          }).catch((e) =>
            console.warn(`Failed to push evolutionary memory for task ${targetId}:`, e.message)
          );
        }
      } else {
        throw new Error("Missing action_target.entity_id for update_entity");
      }
    } else if (
      proposal.action_description.toLowerCase().includes("memory") ||
      actionType === "custom"
    ) {
      // Create Memory / learning path
      const memoryId = crypto.randomUUID();
      const category = (proposal.action_parameters?.category as string) || "decision";
      const rawData = {
        id: memoryId,
        type: "learning",
        name: proposal.action_description,
        status: "approved",
        category,
        data: JSON.stringify(proposal.action_parameters),
        created_at: now,
        updated_at: now,
      };

      await db
        .prepare(
          `INSERT INTO cross_data (id, type, name, status, category, data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(
          memoryId,
          "learning",
          proposal.action_description,
          "approved",
          category,
          JSON.stringify(rawData),
          now,
          now
        )
        .run();

      // Write to Supabase org_memory directly using REST endpoint
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        try {
          const res = await fetch(`${env.SUPABASE_URL}/rest/v1/org_memory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: env.SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              id: memoryId,
              tenant_id: proposal.tenant_id,
              category,
              content: proposal.action_description,
              governance_state: "published",
              metadata: proposal.action_parameters,
              created_at: now,
              updated_at: now,
            }),
          });
          if (!res.ok) {
            console.warn(
              `Supabase org_memory replication failed: ${res.status} - ${await res.text()}`
            );
          }
        } catch (supabaseErr: any) {
          console.warn(`Failed to replicate memory to Supabase: ${supabaseErr.message}`);
        }
      }

      outcomeSummary = `Successfully saved memory ${memoryId} in Book of Records.`;

      // Record Lineage
      await recordLineage(env, {
        entity_id: memoryId,
        action: actionType,
        source: "operator",
        proposal_id: proposal.id,
        details: outcomeSummary,
      });
    } else if (actionType === "schedule_call") {
      // Schedule QBR or Event path
      const eventId = crypto.randomUUID();
      const eventDate = (proposal.action_parameters?.event_date as string) || now.split("T")[0];
      const eventTime = (proposal.action_parameters?.event_time as string) || "10:00";
      const rawData = {
        id: eventId,
        type: "calendar_event",
        name: proposal.action_description,
        status: "scheduled",
        event_type: "qbr",
        event_date: eventDate,
        event_time: eventTime,
        created_at: now,
        updated_at: now,
        ...proposal.action_parameters,
      };

      await db
        .prepare(
          `INSERT INTO build_data (id, type, name, status, event_type, event_date, event_time, data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        )
        .bind(
          eventId,
          "calendar_event",
          proposal.action_description,
          "scheduled",
          "qbr",
          eventDate,
          eventTime,
          JSON.stringify(rawData),
          now,
          now
        )
        .run();

      const linkId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO link_data (id, source_id, source_domain, target_id, target_domain, relationship_type, data, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(
          linkId,
          proposal.originating_entity_id,
          getDomainForType(proposal.originating_entity_type),
          eventId,
          "build",
          "event_scheduled_by_proposal",
          JSON.stringify({ proposal_id: proposal.id }),
          now
        )
        .run();

      outcomeSummary = `Scheduled QBR event ${eventId} in build_data and linked to origin.`;

      // Record Lineage
      await recordLineage(env, {
        entity_id: eventId,
        action: actionType,
        source: "operator",
        proposal_id: proposal.id,
        details: outcomeSummary,
      });
    } else {
      // Live connector vs Simulated external writebacks pluggable adapter
      const extResult = await executeExternalAction(env, proposal);
      if (extResult.status === "failed") {
        throw new Error(extResult.error || "External writeback failed");
      }

      externalResultId =
        extResult.status === "simulated"
          ? `ext-${crypto.randomUUID().slice(0, 8)}`
          : extResult.result?.id ||
            extResult.result?.correlation_id ||
            `ext-${crypto.randomUUID().slice(0, 8)}`;
      outcomeSummary =
        extResult.status === "simulated"
          ? `Simulated writeback to external tool ${proposal.action_target?.tool || "third-party"}. Logged parameters.`
          : `Executed live writeback to external tool ${proposal.action_target?.tool || "third-party"}. Result ID registered.`;

      // Record Lineage
      await recordLineage(env, {
        entity_id: proposal.action_target?.entity_id || "external-entity",
        action: actionType,
        source: "operator",
        proposal_id: proposal.id,
        details: outcomeSummary,
      });
    }

    // Complete the proposal!
    await completeProposal(env, proposal.tenant_id, proposal.id, {
      executed_by: "operator",
      target_tool: proposal.action_target?.tool || "spine",
      external_result_id: externalResultId,
      outcome_summary: outcomeSummary,
    });
  } catch (error: any) {
    // Fail the proposal!
    await failProposal(
      env,
      proposal.tenant_id,
      proposal.id,
      error.message || "Execution error",
      "operator"
    );
    throw error;
  }
}

// ─── Mark Executing ───────────────────────────────────────────────────────────

export async function markProposalExecuting(
  env: Env,
  tenant_id: string,
  proposal_id: string,
  executed_by: string
): Promise<void> {
  const proposal = await getProposal(env, tenant_id, proposal_id);
  if (!proposal) throw new Error(`Proposal not found: ${proposal_id}`);
  if (!canTransition(proposal.status, "executing")) {
    throw new Error(`Cannot execute proposal in status: ${proposal.status}`);
  }

  const now = new Date().toISOString();
  const execution_result: ProposalExecutionResult = { started_at: now, executed_by };

  const updatedProposal = {
    ...proposal,
    status: "executing" as ProposalStatus,
    execution_result,
  };

  await saveProposal(env.D1, updatedProposal);
}

// ─── Complete Proposal ────────────────────────────────────────────────────────

export async function completeProposal(
  env: Env,
  tenant_id: string,
  proposal_id: string,
  result: Omit<ProposalExecutionResult, "started_at"> & { started_at?: string }
): Promise<void> {
  const proposal = await getProposal(env, tenant_id, proposal_id);
  if (!proposal) throw new Error(`Proposal not found: ${proposal_id}`);
  if (!canTransition(proposal.status, "completed")) {
    throw new Error(`Cannot complete proposal in status: ${proposal.status}`);
  }

  const now = new Date().toISOString();
  const execution_result: ProposalExecutionResult = {
    started_at: proposal.execution_result?.started_at ?? now,
    completed_at: now,
    executed_by: result.executed_by,
    target_tool: result.target_tool,
    external_result_id: result.external_result_id,
    outcome_summary: result.outcome_summary,
  };

  const continuity: ProposalContinuityWriteback = { written: false };

  const updatedProposal = {
    ...proposal,
    status: "completed" as ProposalStatus,
    execution_result,
    continuity_writeback: continuity,
  };

  await saveProposal(env.D1, updatedProposal);

  await writebackContinuity(env, updatedProposal, "completed");
}

// ─── Fail Proposal ────────────────────────────────────────────────────────────

export async function failProposal(
  env: Env,
  tenant_id: string,
  proposal_id: string,
  error: string,
  executed_by: string
): Promise<void> {
  const proposal = await getProposal(env, tenant_id, proposal_id);
  if (!proposal) throw new Error(`Proposal not found: ${proposal_id}`);
  if (!canTransition(proposal.status, "failed")) {
    throw new Error(`Cannot fail proposal in status: ${proposal.status}`);
  }

  const now = new Date().toISOString();
  const execution_result: ProposalExecutionResult = {
    started_at: proposal.execution_result?.started_at ?? now,
    completed_at: now,
    executed_by,
    error,
  };

  const updatedProposal = {
    ...proposal,
    status: "failed" as ProposalStatus,
    execution_result,
  };

  await saveProposal(env.D1, updatedProposal);

  await writebackContinuity(env, updatedProposal, "failed");
}

// ─── Supersede Proposal ───────────────────────────────────────────────────────

export async function supersedeProposal(
  env: Env,
  tenant_id: string,
  proposal_id: string,
  superseded_by: string
): Promise<void> {
  const proposal = await getProposal(env, tenant_id, proposal_id);
  if (!proposal) return;
  if (["completed", "rejected", "superseded"].includes(proposal.status)) return;

  const updatedProposal = {
    ...proposal,
    status: "superseded" as ProposalStatus,
    review_notes: `Superseded by proposal: ${superseded_by}`,
  };

  await saveProposal(env.D1, updatedProposal);
}

// ─── Get Lineage Chain ────────────────────────────────────────────────────────

export async function getProposalLineage(
  env: Env,
  _tenant_id: string,
  lineage_id: string
): Promise<Proposal[]> {
  const result = await env.D1.prepare(
    `SELECT proposal_data FROM governance_data
       WHERE type = 'approval' AND json_extract(proposal_data, '$.lineage_id') = ?
       ORDER BY created_at ASC`
  )
    .bind(lineage_id)
    .all();

  return (result.results || []).map((row: any) => {
    const record = JSON.parse(row.proposal_data);
    return deserializeProposal(record);
  });
}

// ─── Continuity Writeback ─────────────────────────────────────────────────────

async function writebackContinuity(
  env: Env,
  proposal: Proposal,
  outcome: "completed" | "rejected" | "failed"
): Promise<void> {
  try {
    const updated = {
      ...proposal,
      continuity_writeback: { written: false, outcome, pending_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    };

    await saveProposal(env.D1, updated);

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        service: "govern",
        event: "proposal_continuity_queued",
        proposal_id: proposal.id,
        lineage_id: proposal.lineage_id,
        outcome,
      })
    );
  } catch (err: any) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        service: "govern",
        event: "proposal_continuity_queue_failed",
        proposal_id: proposal.id,
        error: err.message,
      })
    );
  }
}
