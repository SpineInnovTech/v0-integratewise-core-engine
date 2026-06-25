/**
 * Twin Trigger Engine
 *
 * Evaluates Entity 360 data against a set of triggers to produce
 * constrained, evidence-backed insights.
 *
 * CONSTRAINTS:
 * - Max 3 insights per entity per day
 * - Max 10 trigger types (hardcoded initially)
 * - Every insight MUST have evidence
 * - Every insight MUST answer: what happened, why, what to do
 *
 * PRINCIPLE: Twin reads ONLY from Entity360. Never from scattered sources.
 */

import type { Entity360 } from "@integratewise/types";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TwinInsight {
  id: string;
  trigger_id: string;
  entity_id: string;
  entity_type: string;
  tenant_id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  /** What happened */
  what: string;
  /** Why it matters */
  why: string;
  /** What to do about it */
  action: string;
  /** What happens if ignored */
  risk_if_ignored: string;
  /** Evidence chain */
  evidence: TwinEvidence[];
  /** Confidence score 0-1 */
  confidence: number;
  /** Source layers that contributed */
  source_layers: string[];
  created_at: string;
}

export interface TwinEvidence {
  layer: "truth" | "context" | "signals" | "memory" | "goals";
  description: string;
  value?: unknown;
  source?: string;
}

export interface TriggerResult {
  triggered: boolean;
  insight?: TwinInsight;
}

type TriggerFn = (entity: Entity360) => TriggerResult;

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER DEFINITIONS (10 hardcoded triggers)
// ═══════════════════════════════════════════════════════════════════════════════

const TRIGGERS: Array<{ id: string; name: string; entity_types: string[]; fn: TriggerFn }> = [
  // 1. Health Score Drop
  {
    id: "health_drop",
    name: "Health Score Decline",
    entity_types: ["account"],
    fn: (e) => {
      const health = num(e.truth.data.health_score);
      const prev = num(e.truth.data.prev_health_score);
      if (health > 0 && prev > 0 && prev - health >= 15) {
        return hit(e, "health_drop", "critical", {
          title: `Health score dropped ${prev - health} points`,
          what: `${e.display_name} health score fell from ${prev} to ${health}.`,
          why: "A 15+ point drop indicates significant deterioration in account engagement or satisfaction.",
          action: "Schedule an urgent check-in with the primary stakeholder within 48 hours.",
          risk_if_ignored:
            "Churn risk increases significantly. Renewal probability drops below 50%.",
          evidence: [
            { layer: "truth", description: `Health: ${prev} → ${health}`, value: health },
            ...signalEvidence(e, ["health_decline", "churn_risk"]),
          ],
          confidence: 0.9,
        });
      }
      return { triggered: false };
    },
  },

  // 2. Renewal Risk
  {
    id: "renewal_approaching",
    name: "Renewal Approaching",
    entity_types: ["account"],
    fn: (e) => {
      const renewalDate = e.truth.data.renewal_date as string;
      if (!renewalDate) return { triggered: false };
      const daysUntil = daysBetween(new Date(), new Date(renewalDate));
      if (daysUntil > 0 && daysUntil <= 90) {
        const health = num(e.truth.data.health_score);
        const severity =
          daysUntil <= 30
            ? ("critical" as const)
            : daysUntil <= 60
              ? ("high" as const)
              : ("medium" as const);
        return hit(e, "renewal_approaching", severity, {
          title: `Renewal in ${daysUntil} days${health < 70 ? " — at risk" : ""}`,
          what: `${e.display_name} renews on ${renewalDate}. ${daysUntil} days remaining.`,
          why:
            health < 70
              ? `Health score is ${health}/100 — below the safe threshold for renewal confidence.`
              : `Proactive renewal prep ensures smooth process and expansion opportunity.`,
          action:
            daysUntil <= 30
              ? "Initiate renewal conversation immediately. Prepare value summary."
              : "Begin renewal prep: gather usage data, success metrics, and expansion opportunities.",
          risk_if_ignored: `Late renewal engagement is the #1 cause of churn. ${health < 70 ? "Combined with low health, this is high risk." : ""}`,
          evidence: [
            { layer: "truth", description: `Renewal date: ${renewalDate}`, value: daysUntil },
            ...(health > 0
              ? [{ layer: "truth" as const, description: `Health: ${health}/100` }]
              : []),
            ...goalEvidence(e),
          ],
          confidence: 0.95,
        });
      }
      return { triggered: false };
    },
  },

  // 3. Engagement Drop
  {
    id: "engagement_drop",
    name: "Engagement Decline",
    entity_types: ["account", "contact"],
    fn: (e) => {
      const lastActivity = e.truth.data.last_activity_date as string;
      if (!lastActivity) return { triggered: false };
      const daysSince = daysBetween(new Date(lastActivity), new Date());
      if (daysSince >= 30) {
        return hit(e, "engagement_drop", daysSince >= 60 ? "high" : "medium", {
          title: `No activity for ${daysSince} days`,
          what: `${e.display_name} has had no recorded activity since ${lastActivity}.`,
          why: "Prolonged silence often precedes churn. Disengaged accounts rarely renew.",
          action:
            "Send a personalized check-in. Share a relevant success story or new feature update.",
          risk_if_ignored: "Silent accounts churn at 3x the rate of engaged accounts.",
          evidence: [
            {
              layer: "truth",
              description: `Last activity: ${lastActivity} (${daysSince} days ago)`,
            },
            ...contextEvidence(e),
          ],
          confidence: 0.8,
        });
      }
      return { triggered: false };
    },
  },

  // 4. ARR Change Detection
  {
    id: "arr_change",
    name: "Revenue Change",
    entity_types: ["account"],
    fn: (e) => {
      const arr = num(e.truth.data.arr);
      const prevArr = num(e.truth.data.prev_arr);
      if (arr > 0 && prevArr > 0 && arr !== prevArr) {
        const change = arr - prevArr;
        const pct = Math.round((change / prevArr) * 100);
        const isGrowth = change > 0;
        if (Math.abs(pct) < 10) return { triggered: false };
        return hit(e, "arr_change", isGrowth ? "info" : "high", {
          title: `ARR ${isGrowth ? "grew" : "dropped"} ${Math.abs(pct)}%`,
          what: `${e.display_name} ARR changed from $${prevArr.toLocaleString()} to $${arr.toLocaleString()} (${pct > 0 ? "+" : ""}${pct}%).`,
          why: isGrowth
            ? "Revenue growth signals successful expansion. Document what drove it."
            : "Revenue contraction may indicate downsizing, dissatisfaction, or competitive pressure.",
          action: isGrowth
            ? "Celebrate with the customer. Identify what drove growth for replication."
            : "Investigate root cause. Schedule executive alignment meeting.",
          risk_if_ignored: isGrowth
            ? "Missing the chance to replicate success across similar accounts."
            : "Continued contraction leads to full churn.",
          evidence: [
            {
              layer: "truth",
              description: `ARR: $${prevArr.toLocaleString()} → $${arr.toLocaleString()}`,
              value: change,
            },
          ],
          confidence: 0.95,
        });
      }
      return { triggered: false };
    },
  },

  // 5. Goal At Risk
  {
    id: "goal_at_risk",
    name: "Goal At Risk",
    entity_types: ["account", "contact"],
    fn: (e) => {
      const atRiskGoals = e.goals.active.filter((g) => g.status === "at_risk");
      if (atRiskGoals.length === 0) return { triggered: false };
      const goal = atRiskGoals[0];
      return hit(e, "goal_at_risk", "high", {
        title: `Goal "${goal.title}" is at risk`,
        what: `${e.display_name} has ${atRiskGoals.length} goal(s) at risk. Primary: "${goal.title}" at ${goal.progress}% progress.`,
        why: "At-risk goals indicate the customer isn't achieving expected outcomes, which directly impacts renewal likelihood.",
        action: `Review blockers for "${goal.title}". Propose adjusted timeline or additional support.`,
        risk_if_ignored: "Unmet goals are the strongest predictor of churn in enterprise accounts.",
        evidence: [
          {
            layer: "goals",
            description: `${atRiskGoals.length} goal(s) at risk`,
            value: atRiskGoals.map((g) => g.title),
          },
          ...signalEvidence(e, ["goal"]),
        ],
        confidence: 0.85,
      });
    },
  },

  // 6. Support Escalation
  {
    id: "support_escalation",
    name: "Support Escalation",
    entity_types: ["account"],
    fn: (e) => {
      const ticketCount = num(e.truth.data.support_ticket_count) || num(e.truth.data.open_tickets);
      if (ticketCount >= 5) {
        return hit(e, "support_escalation", ticketCount >= 10 ? "critical" : "high", {
          title: `${ticketCount} open support tickets`,
          what: `${e.display_name} has ${ticketCount} open support tickets.`,
          why: "High ticket volume indicates product friction or unresolved issues that erode trust.",
          action:
            "Coordinate with support team for priority resolution. Consider executive escalation.",
          risk_if_ignored: "Unresolved support issues are cited in 60% of churn exit interviews.",
          evidence: [
            { layer: "truth", description: `Open tickets: ${ticketCount}`, value: ticketCount },
            ...signalEvidence(e, ["support", "escalation"]),
          ],
          confidence: 0.85,
        });
      }
      return { triggered: false };
    },
  },

  // 7. Stale Data Warning
  {
    id: "stale_data",
    name: "Stale Data Warning",
    entity_types: ["account", "contact"],
    fn: (e) => {
      if (e.truth.freshness === "stale") {
        return hit(e, "stale_data", "medium", {
          title: "Entity data is stale",
          what: `${e.display_name} data hasn't been updated since ${e.truth.updated_at}.`,
          why: "Stale data means connectors may be disconnected or sync has failed.",
          action: "Check connector status and trigger a manual sync.",
          risk_if_ignored: "Decisions based on stale data lead to wrong actions.",
          evidence: [
            {
              layer: "truth",
              description: `Last updated: ${e.truth.updated_at}`,
              value: e.truth.freshness,
            },
          ],
          confidence: 0.7,
        });
      }
      return { triggered: false };
    },
  },

  // 8. Memory Conflict
  {
    id: "memory_conflict",
    name: "Conflicting Memories",
    entity_types: ["account", "contact"],
    fn: (e) => {
      const decisions = e.memory.recent.filter((m) => m.type === "decision");
      if (decisions.length >= 2) {
        // Simple conflict detection: multiple decisions with low confidence
        const lowConf = decisions.filter((d) => d.confidence < 0.6);
        if (lowConf.length >= 2) {
          return hit(e, "memory_conflict", "medium", {
            title: "Conflicting AI memories detected",
            what: `${lowConf.length} low-confidence decisions recorded for ${e.display_name}.`,
            why: "Conflicting memories mean the AI may give inconsistent recommendations.",
            action: "Review and confirm/reject memories in the Knowledge UI.",
            risk_if_ignored: "Twin reasoning becomes unreliable for this entity.",
            evidence: lowConf.map((m) => ({
              layer: "memory" as const,
              description: `${m.type}: "${m.content.slice(0, 80)}..." (confidence: ${m.confidence})`,
            })),
            confidence: 0.6,
          });
        }
      }
      return { triggered: false };
    },
  },

  // 9. Context Gap
  {
    id: "context_gap",
    name: "Missing Context",
    entity_types: ["account"],
    fn: (e) => {
      const arr = num(e.truth.data.arr);
      if (arr >= 50000 && e.context.total_count === 0) {
        return hit(e, "context_gap", "medium", {
          title: "High-value account with no context",
          what: `${e.display_name} ($${arr.toLocaleString()} ARR) has no linked documents, emails, or meeting notes.`,
          why: "Without context, Twin cannot provide meaningful insights for this account.",
          action: "Connect email/calendar integrations or manually link key documents.",
          risk_if_ignored:
            "AI insights will be shallow and data-only, missing relationship context.",
          evidence: [
            { layer: "truth", description: `ARR: $${arr.toLocaleString()}` },
            { layer: "context", description: "0 context items linked" },
          ],
          confidence: 0.75,
        });
      }
      return { triggered: false };
    },
  },

  // 10. Signal Cluster
  {
    id: "signal_cluster",
    name: "Multiple Signals Firing",
    entity_types: ["account"],
    fn: (e) => {
      const { critical, high } = e.signals.summary;
      const total = critical + high;
      if (total >= 3) {
        return hit(e, "signal_cluster", "critical", {
          title: `${total} critical/high signals active`,
          what: `${e.display_name} has ${critical} critical and ${high} high-severity signals firing simultaneously.`,
          why: "Multiple concurrent signals indicate a systemic issue, not isolated incidents.",
          action: "Treat as a situation. Escalate to account team lead for coordinated response.",
          risk_if_ignored: "Signal clusters precede churn events 80% of the time when unaddressed.",
          evidence: e.signals.active
            .filter((s) => s.severity === "critical" || s.severity === "high")
            .slice(0, 5)
            .map((s) => ({
              layer: "signals" as const,
              description: `[${s.severity}] ${s.title}`,
              source: s.generated_by,
            })),
          confidence: 0.9,
        });
      }
      return { triggered: false };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_INSIGHTS_PER_ENTITY_PER_DAY = 3;

/**
 * Evaluate all triggers against an Entity 360.
 * Returns at most MAX_INSIGHTS_PER_ENTITY_PER_DAY insights, prioritized by severity.
 */
export function evaluateTriggers(entity: Entity360): TwinInsight[] {
  const applicable = TRIGGERS.filter(
    (t) => t.entity_types.includes(entity.entity_type) || t.entity_types.includes("*")
  );

  const insights: TwinInsight[] = [];

  for (const trigger of applicable) {
    try {
      const result = trigger.fn(entity);
      if (result.triggered && result.insight) {
        insights.push(result.insight);
      }
    } catch (err) {
      console.warn(`[TwinTrigger] ${trigger.id} failed for ${entity.spine_id}:`, err);
    }
  }

  // Sort by severity priority, then confidence
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  insights.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });

  // Cap at max per day
  return insights.slice(0, MAX_INSIGHTS_PER_ENTITY_PER_DAY);
}

/**
 * Get all registered trigger IDs
 */
export function getTriggerIds(): string[] {
  return TRIGGERS.map((t) => t.id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function hit(
  entity: Entity360,
  triggerId: string,
  severity: TwinInsight["severity"],
  data: Omit<
    TwinInsight,
    | "id"
    | "trigger_id"
    | "entity_id"
    | "entity_type"
    | "tenant_id"
    | "severity"
    | "source_layers"
    | "created_at"
  >
): TriggerResult {
  const sourceLayers: string[] = [];
  for (const ev of data.evidence) {
    if (!sourceLayers.includes(ev.layer)) sourceLayers.push(ev.layer);
  }

  return {
    triggered: true,
    insight: {
      id: `twin_${triggerId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      trigger_id: triggerId,
      entity_id: entity.spine_id,
      entity_type: entity.entity_type,
      tenant_id: entity.tenant_id,
      severity,
      source_layers: sourceLayers,
      created_at: new Date().toISOString(),
      ...data,
    },
  };
}

function signalEvidence(entity: Entity360, keywords: string[]): TwinEvidence[] {
  return entity.signals.active
    .filter((s) => keywords.some((k) => s.type.includes(k) || s.title.toLowerCase().includes(k)))
    .slice(0, 3)
    .map((s) => ({
      layer: "signals" as const,
      description: `[${s.severity}] ${s.title}`,
      source: s.generated_by,
    }));
}

function contextEvidence(entity: Entity360): TwinEvidence[] {
  return entity.context.recent.slice(0, 2).map((c) => ({
    layer: "context" as const,
    description: `${c.type}: ${c.title}`,
    source: c.source,
  }));
}

function goalEvidence(entity: Entity360): TwinEvidence[] {
  return entity.goals.active.slice(0, 2).map((g) => ({
    layer: "goals" as const,
    description: `${g.title} (${g.status}, ${g.progress}%)`,
  }));
}
