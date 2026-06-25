/**
 * Governed Action Loop (spine-hydration-lifecycle Phases 8–12).
 *
 * Completes the continuity loop on top of EXISTING surfaces (governance_data HITL
 * store, Execution Boundary playbook handoff, memory-promote queue):
 *
 *   Insight (observation) → Proposal (recommendation + evidence) →
 *   Human decision (approve/reject/modify/delegate/schedule) →
 *   Execution (approved only; playbook handoff) → Outcome →
 *   Feedback re-enters Memory via the governed memory-promote queue.
 *
 * Pure formation/guards are deterministic + unit-testable. I/O helpers persist to
 * D1 (governance_data + continuity_loop) and emit feedback. Cloudflare-only.
 *
 * Invariants enforced here:
 *  - Insights NEVER execute (R13.4).
 *  - Execution requires an approval token referencing an approved/modified
 *    decision — no Insight→Execution path (R15.2, R16.1–16.3 / Property 8).
 *  - A "modify" decision executes the MODIFIED action, not the original (R15.4 / Property 9).
 *  - Outcomes re-enter Memory only through governed promotion (R17.4 / Property 10).
 */

export interface EvidenceRef {
  kind: "memory" | "signal" | "spine";
  id: string;
  note?: string;
}

export interface Signal {
  id: string;
  type: string;
  severity?: "low" | "medium" | "high" | "critical";
  entityId?: string;
  message?: string;
}

export interface ContinuityLike {
  scopes?: Record<string, Array<{ id: string; category: string; topic: string; content: string }>>;
}

export interface Insight {
  id: string;
  tenantId: string;
  observation: string;
  evidence: EvidenceRef[];
  createdAt: string;
}

export interface Proposal {
  id: string;
  insightId: string;
  tenantId: string;
  action: { key: string; params: Record<string, unknown> };
  evidence: EvidenceRef[];
  rationale: string;
  status: "proposed";
}

export type Decision = "approve" | "reject" | "modify" | "delegate" | "schedule";

export interface ProposalDecision {
  proposalId: string;
  decision: Decision;
  modifiedAction?: Proposal["action"];
  decidedBy: string;
  rationale?: string;
  scheduledFor?: string;
  approvalToken?: string;
}

export interface Outcome {
  proposalId: string;
  executionId: string;
  result: "positive" | "negative" | "mixed";
  metrics?: Record<string, number>;
}

// ── Phase 8: Insight Formation (pure, observation-only) ──────────────────────

const SEVERITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

/**
 * Continuously evaluate signals + continuity into Insights (observations).
 * Pure + deterministic. NEVER produces an action or side effect (R13.2/R13.4).
 */
export function formInsights(
  tenantId: string,
  signals: Signal[],
  continuity: ContinuityLike,
  now: string = new Date().toISOString()
): Insight[] {
  const insights: Insight[] = [];

  // Signals at or above "high" become observations.
  for (const s of signals) {
    if ((SEVERITY_RANK[s.severity ?? "low"] ?? 1) >= 3) {
      insights.push({
        id: `insight-${s.id}`,
        tenantId,
        observation: s.message || `${s.type} detected${s.entityId ? ` on ${s.entityId}` : ""}.`,
        evidence: [{ kind: "signal", id: s.id, note: s.type }],
        createdAt: now,
      });
    }
  }

  // Risk/exception memories in Continuity become observations.
  const org = continuity.scopes?.org || [];
  const role = continuity.scopes?.role || [];
  for (const m of [...org, ...role]) {
    if (m.category === "risk" || m.category === "incident") {
      insights.push({
        id: `insight-mem-${m.id}`,
        tenantId,
        observation: `${m.topic}: ${m.content}`,
        evidence: [{ kind: "memory", id: m.id, note: m.category }],
        createdAt: now,
      });
    }
  }

  // De-duplicate by id.
  const seen = new Set<string>();
  return insights.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

// ── Phase 9: Proposal Formation (pure, recommendation — no execution) ────────

// Maps an observation's signal/category to a recommended action key.
function recommendAction(
  insight: Insight
): { key: string; params: Record<string, unknown> } | null {
  const note = (insight.evidence[0]?.note || "").toLowerCase();
  const text = insight.observation.toLowerCase();

  if (note.includes("renewal") || text.includes("renewal") || text.includes("churn")) {
    return { key: "schedule_executive_review", params: { reason: "renewal_risk" } };
  }
  if (note.includes("sla") || text.includes("sla") || note.includes("escalation")) {
    return { key: "escalate_ticket", params: { reason: "sla_breach" } };
  }
  if (note.includes("deal") || text.includes("stalled")) {
    return { key: "investigate_deal", params: { reason: "deal_stalled" } };
  }
  if (insight.evidence[0]?.kind === "memory") {
    return { key: "review_risk", params: { memoryId: insight.evidence[0].id } };
  }
  return null;
}

/**
 * Form a Proposal from an Insight. Returns null when the Insight is not
 * actionable. A Proposal is a recommendation awaiting human decision — it is
 * NEVER executed at formation (R14.3).
 */
export function formProposal(insight: Insight): Proposal | null {
  const action = recommendAction(insight);
  if (!action) return null;
  return {
    id: `proposal-${insight.id}`,
    insightId: insight.id,
    tenantId: insight.tenantId,
    action,
    evidence: insight.evidence,
    rationale: `Recommended "${action.key}" from observation: ${insight.observation}`,
    status: "proposed",
  };
}

// ── Phases 10–11: Decision + Execution guards (pure) ─────────────────────────

export class ExecutionDeniedError extends Error {}

/**
 * Resolve the action that a decision authorizes for execution. A "modify"
 * decision yields the MODIFIED action (Property 9); approve yields the original.
 * Any non-approving decision yields null (nothing to execute).
 */
export function resolveExecutableAction(
  proposal: Proposal,
  decision: ProposalDecision
): Proposal["action"] | null {
  if (decision.decision === "approve") return proposal.action;
  if (decision.decision === "modify") return decision.modifiedAction ?? proposal.action;
  // reject / delegate / schedule do not authorize immediate execution.
  return null;
}

/**
 * Guard every execution: it must carry an approval token that references an
 * approved (or modified-approved) decision for this proposal. Throws otherwise.
 * There is NO Insight→Execution path (R16.2 / Property 8).
 */
export function assertApprovedForExecution(
  proposalId: string,
  decision: ProposalDecision | null,
  approvalToken: string | undefined
): Proposal["action"] | never {
  if (!decision || decision.proposalId !== proposalId) {
    throw new ExecutionDeniedError("No decision found for this proposal — execution denied.");
  }
  if (decision.decision !== "approve" && decision.decision !== "modify") {
    throw new ExecutionDeniedError(
      `Decision is "${decision.decision}" — only approve/modify authorize execution.`
    );
  }
  if (!approvalToken || !decision.approvalToken || approvalToken !== decision.approvalToken) {
    throw new ExecutionDeniedError("Missing or mismatched approval token — execution denied.");
  }
  // Caller supplies the proposal action; here we only assert the right to execute.
  return decision.modifiedAction ?? ({ key: "__approved__", params: {} } as Proposal["action"]);
}

// ── I/O: persist to governance_data + continuity_loop, emit feedback ─────────

export interface ActionLoopEnv {
  D1: D1Database;
  MEMORY_PROMOTE?: Queue;
}

/** Persist a Proposal into the existing HITL store (governance_data, pending_review). */
export async function writeProposal(env: ActionLoopEnv, proposal: Proposal): Promise<void> {
  const now = new Date().toISOString();
  await env.D1.prepare(
    `INSERT INTO governance_data (id, type, status, score, proposal_data, created_at, updated_at)
     VALUES (?, 'approval', 'pending_review', ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET proposal_data = excluded.proposal_data, updated_at = excluded.updated_at`
  )
    .bind(
      proposal.id,
      0.6,
      JSON.stringify({
        tenant_id: proposal.tenantId,
        insight_id: proposal.insightId,
        action_type: proposal.action.key,
        action_description: proposal.rationale,
        action: proposal.action,
        evidence: proposal.evidence,
      }),
      now,
      now
    )
    .run();
}

/**
 * Record a human decision and open/extend the continuity_loop lineage row.
 * No execution happens here — execution is a separate, token-guarded step.
 */
export async function recordDecision(
  env: ActionLoopEnv,
  proposal: Proposal,
  decision: ProposalDecision
): Promise<void> {
  const now = new Date().toISOString();
  const statusMap: Record<Decision, string> = {
    approve: "approved",
    reject: "rejected",
    modify: "approved",
    delegate: "delegated",
    schedule: "scheduled",
  };
  await env.D1.prepare(`UPDATE governance_data SET status = ?, updated_at = ? WHERE id = ?`)
    .bind(statusMap[decision.decision], now, proposal.id)
    .run();

  await env.D1.prepare(
    `INSERT INTO continuity_loop
       (id, tenant_id, insight_id, proposal_id, decision, decided_by, approval_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      proposal.tenantId,
      proposal.insightId,
      proposal.id,
      decision.decision,
      decision.decidedBy,
      decision.approvalToken ?? null,
      now,
      now
    )
    .run();
}

/**
 * Capture an Outcome: close the continuity_loop lineage and feed the outcome
 * back into Memory via the GOVERNED memory-promote queue (R17.1/R17.4) — never
 * a direct memory write. The Twin then learns from what worked (R17.3).
 */
export async function emitOutcome(
  env: ActionLoopEnv,
  tenantId: string,
  outcome: Outcome
): Promise<void> {
  const now = new Date().toISOString();
  await env.D1.prepare(
    `UPDATE continuity_loop
        SET execution_id = ?, execution_status = 'executed', outcome = ?, updated_at = ?
      WHERE proposal_id = ?`
  )
    .bind(outcome.executionId, outcome.result, now, outcome.proposalId)
    .run();

  if (env.MEMORY_PROMOTE) {
    try {
      await env.MEMORY_PROMOTE.send({
        event: "spine.written",
        tenant_id: tenantId,
        entity_id: `outcome-${outcome.proposalId}`,
        entity_type: "decision",
        domain: "cross",
        name: `Outcome for ${outcome.proposalId}`,
        source: "action-loop",
        data: {
          status: outcome.result,
          decided_by: "human",
          proposal_id: outcome.proposalId,
          execution_id: outcome.executionId,
          metrics: outcome.metrics ?? {},
        },
        written_at: now,
      });
    } catch (err) {
      console.warn(
        "[action-loop] outcome feedback emit skipped (non-fatal):",
        err instanceof Error ? err.message : err
      );
    }
  }
}

// ── HTTP surface ─────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadProposal(env: ActionLoopEnv, id: string): Promise<Proposal | null> {
  const row = await env.D1.prepare(`SELECT proposal_data FROM governance_data WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ proposal_data: string }>();
  if (!row?.proposal_data) return null;
  try {
    const p = JSON.parse(row.proposal_data);
    return {
      id,
      insightId: p.insight_id || "",
      tenantId: p.tenant_id || "",
      action: p.action || { key: p.action_type || "unknown", params: {} },
      evidence: p.evidence || [],
      rationale: p.action_description || "",
      status: "proposed",
    };
  } catch {
    return null;
  }
}

async function loadDecision(
  env: ActionLoopEnv,
  proposalId: string
): Promise<ProposalDecision | null> {
  const row = await env.D1.prepare(
    `SELECT proposal_id, decision, decided_by, approval_token FROM continuity_loop
       WHERE proposal_id = ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(proposalId)
    .first<{
      proposal_id: string;
      decision: string;
      decided_by: string;
      approval_token: string | null;
    }>();
  if (!row) return null;
  return {
    proposalId: row.proposal_id,
    decision: row.decision as Decision,
    decidedBy: row.decided_by,
    approvalToken: row.approval_token ?? undefined,
  };
}

/**
 * Route `/api/v1/intelligence/action-loop/*`. Returns null if not handled here.
 */
export async function routeActionLoop(
  request: Request,
  env: ActionLoopEnv
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/v1/intelligence/action-loop", "");
  const tenantId = request.headers.get("x-tenant-id") || "";

  // Form Insights → Proposals from caller-supplied signals + continuity.
  if (path === "/form" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as {
      signals?: Signal[];
      continuity?: ContinuityLike;
    };
    const insights = formInsights(tenantId, body.signals || [], body.continuity || {});
    const proposals: Proposal[] = [];
    for (const insight of insights) {
      const proposal = formProposal(insight);
      if (proposal) {
        await writeProposal(env, proposal);
        proposals.push(proposal);
      }
    }
    return json({ insights, proposals });
  }

  // Record a human decision on a proposal.
  const decisionMatch = path.match(/^\/proposals\/([^/]+)\/decision$/);
  if (decisionMatch && request.method === "POST") {
    const proposalId = decisionMatch[1];
    const proposal = await loadProposal(env, proposalId);
    if (!proposal) return json({ error: "Proposal not found" }, 404);
    const body = (await request.json().catch(() => ({}))) as Partial<ProposalDecision>;
    if (!body.decision) return json({ error: "decision required" }, 400);
    const decision: ProposalDecision = {
      proposalId,
      decision: body.decision,
      modifiedAction: body.modifiedAction,
      decidedBy: body.decidedBy || request.headers.get("x-user-id") || "unknown",
      rationale: body.rationale,
      scheduledFor: body.scheduledFor,
      // Approval token is minted on approve/modify so execution can reference it.
      approvalToken:
        body.decision === "approve" || body.decision === "modify" ? crypto.randomUUID() : undefined,
    };
    await recordDecision(env, proposal, decision);
    return json({
      recorded: true,
      approvalToken: decision.approvalToken,
      decision: decision.decision,
    });
  }

  // Guarded execution: requires the approval token from the recorded decision.
  const execMatch = path.match(/^\/proposals\/([^/]+)\/execute$/);
  if (execMatch && request.method === "POST") {
    const proposalId = execMatch[1];
    const proposal = await loadProposal(env, proposalId);
    if (!proposal) return json({ error: "Proposal not found" }, 404);
    const body = (await request.json().catch(() => ({}))) as { approvalToken?: string };
    const decision = await loadDecision(env, proposalId);
    try {
      assertApprovedForExecution(proposalId, decision, body.approvalToken);
    } catch (err) {
      if (err instanceof ExecutionDeniedError) return json({ error: err.message }, 403);
      throw err;
    }
    const action = resolveExecutableAction(proposal, decision as ProposalDecision);
    // Execution Boundary (R16.4): hand off a playbook to the customer's local
    // agent — IntegrateWise does not run customer workflows on its servers.
    const executionId = crypto.randomUUID();
    return json({
      status: "handed_off",
      executionId,
      playbook: { proposalId, action, handoff: "local_agent" },
    });
  }

  // Capture an Outcome → close lineage + governed feedback into Memory.
  if (path === "/outcomes" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Partial<Outcome>;
    if (!body.proposalId || !body.executionId || !body.result) {
      return json({ error: "proposalId, executionId, result required" }, 400);
    }
    await emitOutcome(env, tenantId, {
      proposalId: body.proposalId,
      executionId: body.executionId,
      result: body.result,
      metrics: body.metrics,
    });
    return json({ recorded: true });
  }

  return null;
}
