/**
 * TypeScript-Native Signal Analyzer
 *
 * Replaces python-client.ts with a TypeScript-native implementation.
 * Uses rule-based trigger evaluation derived from twin-triggers.ts.
 * Zero external Python dependencies.
 *
 * Policy: ZERO PYTHON — all runtime intelligence must be TypeScript-native.
 */

export interface SignalAnalyzeRequest {
  signal_id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  hydration_bucket: string;
  entity_data: Record<string, unknown>;
  context?: {
    signals?: unknown[];
    activities?: unknown[];
  };
}

export interface SignalAnalyzeResponse {
  signal_id: string;
  analysis: {
    category:
      | "churn_risk"
      | "expansion_opportunity"
      | "health_decline"
      | "engagement_spike"
      | "other";
    confidence: number;
    severity: "low" | "medium" | "high" | "critical";
    reasoning: string;
    key_indicators: Array<{
      name: string;
      value: number;
      trend: "up" | "down" | "stable";
    }>;
  };
  recommended_action?: {
    type: string;
    description: string;
    priority: number;
    estimated_impact: string;
  };
  requires_approval: boolean;
  auto_execute: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Trigger Evaluation Engine
// ═══════════════════════════════════════════════════════════════════════════════

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function daysUntil(dateStr: unknown): number {
  if (!dateStr) return Infinity;
  const d = new Date(String(dateStr));
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr: unknown): number {
  if (!dateStr) return Infinity;
  const d = new Date(String(dateStr));
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.ceil((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

interface TriggerResult {
  triggered: boolean;
  category: SignalAnalyzeResponse["analysis"]["category"];
  severity: SignalAnalyzeResponse["analysis"]["severity"];
  confidence: number;
  reasoning: string;
  key_indicators: SignalAnalyzeResponse["analysis"]["key_indicators"];
  action_type?: string;
  action_description?: string;
  action_priority?: number;
  requires_approval: boolean;
  auto_execute: boolean;
}

function evaluateHealthDrop(data: Record<string, unknown>): TriggerResult {
  const health = num(data.health_score);
  const prev = num(data.prev_health_score || data.previous_health_score);
  const drop = prev > 0 ? prev - health : 0;

  if (health > 0 && drop >= 15) {
    return {
      triggered: true,
      category: "health_decline",
      severity: "critical",
      confidence: 0.9,
      reasoning: `Health score dropped ${drop} points from ${prev} to ${health}. This is a strong predictor of churn risk.`,
      key_indicators: [
        { name: "health_score", value: health, trend: "down" },
        { name: "health_drop", value: drop, trend: "up" },
      ],
      action_type: "schedule_health_call",
      action_description: `Schedule immediate health call with ${data.name || "account"} to understand drop drivers.`,
      action_priority: 1,
      requires_approval: true,
      auto_execute: false,
    };
  }

  if (health > 0 && health < 50) {
    return {
      triggered: true,
      category: "health_decline",
      severity: "high",
      confidence: 0.85,
      reasoning: `Health score is critically low at ${health}/100. Account is at elevated churn risk even without a recent drop.`,
      key_indicators: [{ name: "health_score", value: health, trend: "down" }],
      action_type: "escalate_to_leadership",
      action_description: `Escalate ${data.name || "account"} to leadership for intervention planning.`,
      action_priority: 2,
      requires_approval: true,
      auto_execute: false,
    };
  }

  return {
    triggered: false,
    category: "other",
    severity: "low",
    confidence: 0,
    reasoning: "",
    key_indicators: [],
    requires_approval: false,
    auto_execute: false,
  };
}

function evaluateRenewalRisk(data: Record<string, unknown>): TriggerResult {
  const renewalDate = data.renewal_date || data.contract_end_date || data.subscription_end;
  const days = daysUntil(renewalDate);
  const health = num(data.health_score);
  const mrr = num(data.mrr || data.monthly_recurring_revenue);

  if (days <= 30 && days >= 0) {
    const severity: TriggerResult["severity"] =
      health < 70 ? "critical" : health < 85 ? "high" : "medium";
    const confidence = health < 70 ? 0.95 : health < 85 ? 0.85 : 0.75;

    return {
      triggered: true,
      category: "churn_risk",
      severity,
      confidence,
      reasoning: `Renewal in ${days} days. ${health > 0 ? `Health score is ${health}/100 — ${health < 70 ? "below safe threshold" : "moderate"}.` : "No health data available."} Renewal without engagement is the #1 cause of churn.`,
      key_indicators: [
        { name: "days_to_renewal", value: days, trend: "down" },
        ...(health > 0
          ? [{ name: "health_score", value: health, trend: health < 70 ? "down" : "stable" }]
          : []),
        ...(mrr > 0 ? [{ name: "mrr", value: mrr, trend: "stable" }] : []),
      ] as SignalAnalyzeResponse["analysis"]["key_indicators"],
      action_type: "schedule_retention_call",
      action_description: `Schedule retention call with ${data.name || "account"} before renewal date (${renewalDate}).`,
      action_priority: severity === "critical" ? 1 : 2,
      requires_approval: true,
      auto_execute: false,
    };
  }

  return {
    triggered: false,
    category: "other",
    severity: "low",
    confidence: 0,
    reasoning: "",
    key_indicators: [],
    requires_approval: false,
    auto_execute: false,
  };
}

function evaluateEngagementDrop(data: Record<string, unknown>): TriggerResult {
  const lastActivity =
    data.last_activity_date || data.last_engagement_date || data.last_contact_date;
  const days = daysSince(lastActivity);
  const health = num(data.health_score);

  if (days > 30 && days < 90) {
    return {
      triggered: true,
      category: "engagement_spike",
      severity: "medium",
      confidence: 0.8,
      reasoning: `No engagement for ${days} days. Prolonged silence often precedes churn. Disengaged accounts rarely renew.`,
      key_indicators: [
        { name: "days_since_last_activity", value: days, trend: "up" },
        ...(health > 0 ? [{ name: "health_score", value: health, trend: "down" as const }] : []),
      ],
      action_type: "draft_retention_email",
      action_description: `Draft personalized re-engagement email for ${data.name || "account"}.`,
      action_priority: 3,
      requires_approval: false,
      auto_execute: true,
    };
  }

  if (days >= 90) {
    return {
      triggered: true,
      category: "churn_risk",
      severity: "high",
      confidence: 0.85,
      reasoning: `No engagement for ${days} days. Silent accounts churn at 3x the rate of engaged accounts. Immediate intervention required.`,
      key_indicators: [
        { name: "days_since_last_activity", value: days, trend: "up" },
        ...(health > 0 ? [{ name: "health_score", value: health, trend: "down" as const }] : []),
      ],
      action_type: "escalate_to_leadership",
      action_description: `Escalate ${data.name || "account"} to leadership — 90+ days without engagement.`,
      action_priority: 1,
      requires_approval: true,
      auto_execute: false,
    };
  }

  return {
    triggered: false,
    category: "other",
    severity: "low",
    confidence: 0,
    reasoning: "",
    key_indicators: [],
    requires_approval: false,
    auto_execute: false,
  };
}

function evaluateARRChange(data: Record<string, unknown>): TriggerResult {
  const currentArr = num(data.arr || data.annual_recurring_revenue);
  const prevArr = num(data.previous_arr || data.arr_last_quarter);
  const change = currentArr - prevArr;
  const pctChange = prevArr > 0 ? (change / prevArr) * 100 : 0;

  if (prevArr > 0 && pctChange <= -10) {
    return {
      triggered: true,
      category: "churn_risk",
      severity: pctChange <= -25 ? "critical" : "high",
      confidence: 0.95,
      reasoning: `ARR contracted by ${Math.abs(pctChange).toFixed(1)}% ($${Math.abs(change).toLocaleString()}). ${pctChange <= -25 ? "Severe contraction — immediate executive attention required." : "Significant contraction — understand root cause."}`,
      key_indicators: [
        { name: "arr_change_pct", value: pctChange, trend: "down" },
        { name: "arr_current", value: currentArr, trend: "down" },
      ],
      action_type: "create_task",
      action_description: `Create executive review task for ${data.name || "account"} ARR contraction.`,
      action_priority: 1,
      requires_approval: true,
      auto_execute: false,
    };
  }

  if (prevArr > 0 && pctChange >= 20) {
    return {
      triggered: true,
      category: "expansion_opportunity",
      severity: "low",
      confidence: 0.85,
      reasoning: `ARR grew by ${pctChange.toFixed(1)}% ($${change.toLocaleString()}). Strong expansion signal — opportunity for upsell or case study.`,
      key_indicators: [
        { name: "arr_change_pct", value: pctChange, trend: "up" },
        { name: "arr_current", value: currentArr, trend: "up" },
      ],
      action_type: "trigger_workflow",
      action_description: `Trigger expansion workflow for ${data.name || "account"} — case study + upsell opportunity.`,
      action_priority: 4,
      requires_approval: false,
      auto_execute: true,
    };
  }

  return {
    triggered: false,
    category: "other",
    severity: "low",
    confidence: 0,
    reasoning: "",
    key_indicators: [],
    requires_approval: false,
    auto_execute: false,
  };
}

function evaluateGoalAtRisk(data: Record<string, unknown>): TriggerResult {
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const atRiskGoals = goals.filter((g: any) => g?.status === "at_risk" || g?.health === "at_risk");

  if (atRiskGoals.length > 0) {
    const goal = atRiskGoals[0];
    return {
      triggered: true,
      category: "health_decline",
      severity: "high",
      confidence: 0.85,
      reasoning: `${atRiskGoals.length} goal(s) at risk. Primary: "${goal.title || "Unnamed goal"}" at ${goal.progress || 0}% progress. Unmet goals are the strongest predictor of churn in enterprise accounts.`,
      key_indicators: [
        { name: "at_risk_goals", value: atRiskGoals.length, trend: "up" },
        { name: "goal_progress", value: num(goal.progress), trend: "down" },
      ],
      action_type: "create_task",
      action_description: `Create CSM intervention task for at-risk goal: ${goal.title || "Unnamed goal"}.`,
      action_priority: 2,
      requires_approval: true,
      auto_execute: false,
    };
  }

  return {
    triggered: false,
    category: "other",
    severity: "low",
    confidence: 0,
    reasoning: "",
    key_indicators: [],
    requires_approval: false,
    auto_execute: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Analyzer
// ═══════════════════════════════════════════════════════════════════════════════

export class SignalAnalyzer {
  analyze(request: SignalAnalyzeRequest): SignalAnalyzeResponse {
    const data = request.entity_data;
    const results: TriggerResult[] = [
      evaluateHealthDrop(data),
      evaluateRenewalRisk(data),
      evaluateEngagementDrop(data),
      evaluateARRChange(data),
      evaluateGoalAtRisk(data),
    ];

    const triggered = results.filter((r) => r.triggered);

    if (triggered.length === 0) {
      return {
        signal_id: request.signal_id,
        analysis: {
          category: "other",
          confidence: 0,
          severity: "low",
          reasoning: "No significant risk or opportunity signals detected in current entity data.",
          key_indicators: [],
        },
        requires_approval: false,
        auto_execute: false,
      };
    }

    // Pick highest severity + confidence
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const best = triggered.sort((a, b) => {
      const sevDiff = (priorityOrder[b.severity] || 0) - (priorityOrder[a.severity] || 0);
      if (sevDiff !== 0) return sevDiff;
      return b.confidence - a.confidence;
    })[0];

    return {
      signal_id: request.signal_id,
      analysis: {
        category: best.category,
        confidence: best.confidence,
        severity: best.severity,
        reasoning: best.reasoning,
        key_indicators: best.key_indicators,
      },
      recommended_action: best.action_type
        ? {
            type: best.action_type,
            description: best.action_description || best.action_type,
            priority: best.action_priority || 3,
            estimated_impact:
              best.severity === "critical"
                ? "High — prevents churn"
                : best.severity === "high"
                  ? "Medium — reduces risk"
                  : "Low — monitors trend",
          }
        : undefined,
      requires_approval: best.requires_approval,
      auto_execute: best.auto_execute,
    };
  }
}

// Factory function for drop-in replacement
export function createSignalAnalyzer(): SignalAnalyzer {
  return new SignalAnalyzer();
}
