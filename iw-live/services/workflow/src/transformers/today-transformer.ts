/**
 * Today View Transformer
 *
 * Transforms Spine entities (with schema) to organic Today view (schema-free).
 * This is the BFF (Backend-for-Frontend) layer that enforces separation.
 */

import type {
  TodayViewResponse,
  TodaySummary,
  HealthSummary,
  PipelineSummary,
  TaskSummary,
  ActivitySummary,
  ActionItem,
  Alert,
  TodayStats,
} from "@integratewise/types";

import type { SpineEntity, Signal, Task } from "@integratewise/types";

export interface TransformContext {
  tenantId: string;
  userId: string;
  userName: string;
  timezone: string;
  date: Date;
}

/**
 * Transform Spine entities to organic Today view
 *
 * RULE: Frontend NEVER sees entity_type or field names
 * RULE: All values are formatted for display
 * RULE: Natural language descriptions only
 */
export function transformToTodayView(
  entities: SpineEntity[],
  signals: Signal[],
  tasks: Task[],
  context: TransformContext
): TodayViewResponse {
  // Backend knows schema - filter by entity_type
  const accounts = entities.filter((e) => e.entity_type === "account");
  const risks = entities.filter((e) => e.entity_type === "risk");
  const engagements = entities.filter((e) => e.entity_type === "engagement");

  return {
    date: context.date.toISOString().split("T")[0],
    summary: buildTodaySummary(accounts, risks, tasks, engagements, context),
    actions: buildActionItems(accounts, risks, tasks, signals, context),
    alerts: buildAlerts(signals, accounts, context),
    stats: buildTodayStats(accounts, engagements, context),
  };
}

/**
 * Build summary cards
 */
function buildTodaySummary(
  accounts: SpineEntity[],
  risks: SpineEntity[],
  tasks: Task[],
  engagements: SpineEntity[],
  context: TransformContext
): TodaySummary {
  return {
    health: buildHealthSummary(accounts),
    pipeline: buildPipelineSummary(accounts),
    tasks: buildTaskSummary(tasks),
    activity: buildActivitySummary(accounts, engagements, context),
  };
}

/**
 * Build health summary
 * Backend knows 'health_score' field - frontend sees '85% Healthy'
 */
function buildHealthSummary(accounts: SpineEntity[]): HealthSummary {
  // Extract health scores (backend knows field name)
  const scores = accounts
    .map((a) => a.data.health_score as number | undefined)
    .filter((s): s is number => s !== undefined);

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Count by category (backend knows ranges)
  const healthy = scores.filter((s) => s >= 80).length;
  const atRisk = scores.filter((s) => s >= 60 && s < 80).length;
  const critical = scores.filter((s) => s < 60).length;

  // Format for display (frontend receives strings)
  return {
    score: `${Math.round(avgScore)}%`,
    label: healthLabel(avgScore),
    trend: computeTrend(accounts, "health_score"),
    change: formatChange(scores),
    details: `${critical} critical, ${atRisk} at risk`,
    segments: [
      { name: "Healthy", health: "Good", count: healthy },
      { name: "At Risk", health: "Warning", count: atRisk },
      { name: "Critical", health: "Alert", count: critical },
    ].filter((s) => s.count > 0),
  };
}

/**
 * Convert numeric score to label
 */
function healthLabel(score: number): HealthSummary["label"] {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At Risk";
  return "Critical";
}

/**
 * Build pipeline summary
 * Backend knows 'arr' field - frontend sees '$2.4M at risk'
 */
function buildPipelineSummary(accounts: SpineEntity[]): PipelineSummary {
  // Calculate at-risk revenue (backend knows field names)
  const atRiskAccounts = accounts.filter((a) => {
    const score = a.data.health_score as number | undefined;
    return score !== undefined && score < 70;
  });

  const atRiskAmount = atRiskAccounts.reduce((sum, a) => {
    const arr = a.data.arr as number | undefined;
    return sum + (arr || 0);
  }, 0);

  // Calculate renewing this quarter
  const now = new Date();
  const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

  const renewingAccounts = accounts.filter((a) => {
    const renewalDate = a.data.renewal_date as string | undefined;
    if (!renewalDate) return false;
    return new Date(renewalDate) <= quarterEnd;
  });

  const renewingAmount = renewingAccounts.reduce((sum, a) => {
    const arr = a.data.arr as number | undefined;
    return sum + (arr || 0);
  }, 0);

  // Format currency
  return {
    atRisk: formatCurrency(atRiskAmount),
    renewingThisQuarter: formatCurrency(renewingAmount),
    expansionOpps: formatCurrency(atRiskAmount * 0.2), // Estimated
    trend: computePortfolioTrend(accounts),
  };
}

/**
 * Build task summary
 */
function buildTaskSummary(tasks: Task[]): TaskSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueToday = tasks.filter((t) => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && due.toDateString() === today.toDateString();
  }).length;

  const overdue = tasks.filter((t) => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && due < today && t.status !== "completed";
  }).length;

  const completedToday = tasks.filter((t) => {
    const completed = t.completed_at ? new Date(t.completed_at) : null;
    return completed && completed.toDateString() === today.toDateString();
  }).length;

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const upcomingThisWeek = tasks.filter((t) => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && due > today && due <= weekEnd && t.status !== "completed";
  }).length;

  return {
    dueToday,
    overdue,
    completedToday,
    upcomingThisWeek,
  };
}

/**
 * Build activity summary
 */
function buildActivitySummary(
  accounts: SpineEntity[],
  engagements: SpineEntity[],
  context: TransformContext
): ActivitySummary {
  const thirtyDaysAgo = new Date(context.date);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Recent touchpoints
  const recentTouches = engagements.filter((e) => {
    const date = e.data.date as string | undefined;
    return date && new Date(date) >= thirtyDaysAgo;
  }).length;

  // Stale accounts (no activity in 30 days)
  const staleAccounts = accounts.filter((a) => {
    const lastActivity = a.data.last_activity_date as string | undefined;
    return !lastActivity || new Date(lastActivity) < thirtyDaysAgo;
  }).length;

  // Meetings today (would come from calendar integration)
  const meetingsToday = 0; // Placeholder

  return {
    recentTouches,
    staleAccounts,
    meetingsToday,
  };
}

/**
 * Build action items
 * Backend analyzes entities/signals - frontend receives actionable items
 */
function buildActionItems(
  accounts: SpineEntity[],
  risks: SpineEntity[],
  tasks: Task[],
  signals: Signal[],
  context: TransformContext
): ActionItem[] {
  const actions: ActionItem[] = [];

  // 1. Critical risks
  const criticalRisks = risks.filter((r) => r.data.severity === "critical");
  for (const risk of criticalRisks.slice(0, 2)) {
    const account = accounts.find((a) => a.id === risk.data.account_id);
    actions.push({
      id: `risk:${risk.id}`,
      title: `Address ${risk.data.type} risk`,
      priority: "urgent",
      due: "Today",
      context: account ? `For ${account.data.name}` : "Unknown account",
      suggestedAction: {
        type: "review",
        label: "Review Risk",
        href: `/risks/${risk.id}`,
      },
      relatedTo: account?.data.name as string | undefined,
    });
  }

  // 2. Overdue tasks
  const overdueTasks = tasks.filter((t) => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && due < context.date && t.status !== "completed";
  });

  for (const task of overdueTasks.slice(0, 3)) {
    actions.push({
      id: `task:${task.id}`,
      title: task.title,
      priority: task.priority === "urgent" ? "urgent" : "high",
      due: "Overdue",
      context: "Task is past due",
      suggestedAction: {
        type: task.type === "call" ? "call" : "review",
        label: "Complete Task",
        href: `/tasks/${task.id}`,
      },
    });
  }

  // 3. Renewal signals
  const renewalSignals = signals.filter(
    (s) => s.type === "renewal_risk" || s.type === "renewal_upcoming"
  );

  for (const signal of renewalSignals.slice(0, 2)) {
    const account = accounts.find((a) => a.id === signal.entity_id);
    if (account) {
      actions.push({
        id: `signal:${signal.id}`,
        title: `Prepare for ${account.data.name} renewal`,
        priority: "high",
        due: "This week",
        context: `Renewal in ${daysUntil(account.data.renewal_date as string)} days`,
        suggestedAction: {
          type: "prepare",
          label: "Prepare QBR",
          href: `/accounts/${account.id}/renewal`,
        },
        relatedTo: account.data.name as string,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Build alerts
 */
function buildAlerts(
  signals: Signal[],
  accounts: SpineEntity[],
  context: TransformContext
): Alert[] {
  return signals
    .filter((s) => s.severity !== "low")
    .map((signal) => {
      const account = accounts.find((a) => a.id === signal.entity_id);

      return {
        id: signal.id,
        severity: signal.severity as Alert["severity"],
        message: formatSignalMessage(signal, account),
        suggestion: signal.suggested_action,
        dismissable: signal.severity !== "critical",
        timestamp: signal.created_at,
        actions: signal.actions?.map((a) => ({
          label: a.label,
          href: a.href,
        })),
      };
    });
}

/**
 * Build today stats
 */
function buildTodayStats(
  accounts: SpineEntity[],
  engagements: SpineEntity[],
  context: TransformContext
): TodayStats {
  const weekAgo = new Date(context.date);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const touchedThisWeek = accounts.filter((a) => {
    const lastActivity = a.data.last_activity_date as string | undefined;
    return lastActivity && new Date(lastActivity) >= weekAgo;
  }).length;

  // Mock response rate calculation
  const responseRate = "68%";
  const avgResponseTime = "4.2 hours";

  return {
    totalAccounts: accounts.length,
    touchedThisWeek,
    responseRate,
    avgResponseTime,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Compute trend from historical data
 */
function computeTrend(accounts: SpineEntity[], field: string): "up" | "down" | "stable" {
  // Simplified - would analyze history
  const values = accounts
    .map((a) => a.data[field] as number | undefined)
    .filter((v): v is number => v !== undefined);

  if (values.length < 2) return "stable";

  const recent = values.slice(-5);
  const older = values.slice(0, 5);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const change = (recentAvg - olderAvg) / olderAvg;

  if (change > 0.05) return "up";
  if (change < -0.05) return "down";
  return "stable";
}

/**
 * Format change description
 */
function formatChange(scores: number[]): string {
  if (scores.length < 2) return "No change";

  const recent = scores.slice(-3);
  const older = scores.slice(0, 3);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = recentAvg - olderAvg;
  const direction = diff >= 0 ? "+" : "";

  return `${direction}${Math.round(diff)}% from last week`;
}

/**
 * Compute portfolio trend
 */
function computePortfolioTrend(accounts: SpineEntity[]): PipelineSummary["trend"] {
  // Simplified logic
  const scores = accounts
    .map((a) => a.data.health_score as number | undefined)
    .filter((s): s is number => s !== undefined);

  if (scores.length === 0) return "stable";

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg > 75) return "improving";
  if (avg < 50) return "declining";
  return "stable";
}

/**
 * Format signal message
 */
function formatSignalMessage(signal: Signal, account?: SpineEntity): string {
  const accountName = account?.data.name || "An account";

  switch (signal.type) {
    case "health_drop":
      return `${accountName} health has declined`;
    case "renewal_risk":
      return `${accountName} renewal is at risk`;
    case "usage_decline":
      return `${accountName} product usage is declining`;
    case "support_escalation":
      return `${accountName} escalated a support ticket`;
    default:
      return signal.message || `${accountName} needs attention`;
  }
}

/**
 * Calculate days until date
 */
function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
