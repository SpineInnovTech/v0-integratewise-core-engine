import type { FusedSources } from "./fusion";
import type { Situation } from "./actions";

// ============================================================================
// TYPES
// ============================================================================

export interface Narrative {
  summary: string;
  why_it_matters: string;
  key_evidence: string[];
  recommended_focus: string;
  urgency_indicator: "low" | "medium" | "high" | "critical";
}

// ============================================================================
// NARRATIVE TEMPLATES
// ============================================================================

interface NarrativeTemplate {
  summary_pattern: string;
  why_pattern: string;
  focus_pattern: string;
}

const NARRATIVE_TEMPLATES: Record<string, NarrativeTemplate> = {
  "churn.risk": {
    summary_pattern:
      "Customer {entity_id} is showing signs of potential churn based on {signal_count} warning signals.",
    why_pattern:
      "Losing this customer could impact revenue and increase churn rate. Early intervention has shown 60% success in retention.",
    focus_pattern: "Review recent engagement patterns and schedule a proactive health check call.",
  },
  "expansion.opportunity": {
    summary_pattern:
      "Account {entity_id} demonstrates strong expansion potential with {evidence_count} positive indicators.",
    why_pattern:
      "This account shows high product adoption and engagement, making them ideal for upsell or cross-sell opportunities.",
    focus_pattern:
      "Identify specific features or tiers that align with their usage patterns and growth trajectory.",
  },
  "billing.payment_failed": {
    summary_pattern:
      "Payment failure detected for {entity_id} with {event_count} related billing events.",
    why_pattern:
      "Unresolved payment issues can lead to involuntary churn and revenue leakage. Quick resolution maintains customer relationship.",
    focus_pattern:
      "Verify payment method validity and consider grace period based on customer history.",
  },
  "deal.stalled": {
    summary_pattern:
      "Deal for {entity_id} has stalled with no significant activity in the pipeline.",
    why_pattern:
      "Stalled deals represent potential lost revenue and sales efficiency issues. Re-engagement can revive 30% of stalled opportunities.",
    focus_pattern:
      "Analyze last touchpoints and identify potential blockers or objections to address.",
  },
  "health.drop": {
    summary_pattern:
      "Health score for {entity_id} has dropped significantly based on {metric_count} declining metrics.",
    why_pattern:
      "Declining health often precedes churn by 30-60 days. Early detection enables preventive measures.",
    focus_pattern:
      "Investigate product usage changes and recent support interactions to identify root cause.",
  },
  "task.overdue": {
    summary_pattern:
      "Task related to {entity_id} is overdue with {signal_count} escalation signals.",
    why_pattern:
      "Overdue tasks can impact customer satisfaction and operational efficiency. Timely completion maintains trust.",
    focus_pattern:
      "Prioritize task completion and evaluate workload distribution if pattern repeats.",
  },
};

const DEFAULT_TEMPLATE: NarrativeTemplate = {
  summary_pattern: "Situation detected for {entity_type} {entity_id} requiring attention.",
  why_pattern:
    "This situation may impact business operations and customer relationships if not addressed promptly.",
  focus_pattern: "Review the evidence and take appropriate action based on the specific context.",
};

// ============================================================================
// URGENCY CALCULATION
// ============================================================================

function calculateUrgency(
  sources: FusedSources,
  situationKey: string
): "low" | "medium" | "high" | "critical" {
  const criticalSignals = sources.spine.signals.filter((s) => s.band === "critical");
  const warningSignals = sources.spine.signals.filter((s) => s.band === "warning");

  // Check for critical situation keys
  const criticalKeys = ["billing.payment_failed", "churn.risk", "health.drop"];
  const isCriticalType = criticalKeys.some((key) => situationKey.includes(key.split(".")[0]));

  if (criticalSignals.length >= 2 || (criticalSignals.length >= 1 && isCriticalType)) {
    return "critical";
  }

  if (criticalSignals.length >= 1 || warningSignals.length >= 3) {
    return "high";
  }

  if (warningSignals.length >= 1 || sources.ai.insights.length >= 2) {
    return "medium";
  }

  return "low";
}

// ============================================================================
// EVIDENCE SUMMARIZATION
// ============================================================================

function summarizeKeyEvidence(sources: FusedSources, maxItems: number = 5): string[] {
  const evidence: string[] = [];

  // Add critical signals first
  for (const signal of sources.spine.signals.filter((s) => s.band === "critical").slice(0, 2)) {
    evidence.push(`🔴 Critical signal: ${signal.signal_key} (value: ${signal.metric_value})`);
  }

  // Add warning signals
  for (const signal of sources.spine.signals.filter((s) => s.band === "warning").slice(0, 2)) {
    evidence.push(`🟠 Warning signal: ${signal.signal_key} (value: ${signal.metric_value})`);
  }

  // Add recent events
  for (const event of sources.spine.events.slice(0, 2)) {
    evidence.push(`📊 Event: ${event.event_type} from ${event.source_system}`);
  }

  // Add AI insights if available
  for (const insight of sources.ai.insights.slice(0, 2)) {
    evidence.push(
      `💡 AI Insight: ${insight.insight_type} (confidence: ${Math.round((insight.confidence || 0.7) * 100)}%)`
    );
  }

  // Add context artifacts
  for (const artifact of sources.context.artifacts.slice(0, 2)) {
    evidence.push(`📄 ${artifact.artifact_type}: ${artifact.title}`);
  }

  return evidence.slice(0, maxItems);
}

// ============================================================================
// TEMPLATE INTERPOLATION
// ============================================================================

function interpolate(template: string, variables: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

// ============================================================================
// MAIN NARRATIVE GENERATION
// ============================================================================

/**
 * Generate a human-readable narrative for a situation using template-based approach.
 * No LLM required - uses pattern matching and evidence summarization.
 */
export function generateNarrative(situation: Situation, sources: FusedSources): Narrative {
  // Get template (fallback to default)
  const template = NARRATIVE_TEMPLATES[situation.situation_key] || DEFAULT_TEMPLATE;

  // Calculate counts for template variables
  const variables = {
    entity_id: situation.entity_id,
    entity_type: situation.entity_type,
    signal_count: sources.spine.signals.length,
    event_count: sources.spine.events.length,
    metric_count: sources.spine.metrics.length,
    evidence_count: sources.evidence_refs.length,
    artifact_count: sources.context.artifacts.length,
    insight_count: sources.ai.insights.length,
  };

  // Generate narrative components
  const summary = interpolate(template.summary_pattern, variables);
  const why_it_matters = interpolate(template.why_pattern, variables);
  const recommended_focus = interpolate(template.focus_pattern, variables);

  // Build evidence list
  const key_evidence = summarizeKeyEvidence(sources);

  // Calculate urgency
  const urgency_indicator = calculateUrgency(sources, situation.situation_key);

  return {
    summary,
    why_it_matters,
    key_evidence,
    recommended_focus,
    urgency_indicator,
  };
}

/**
 * Generate a short one-liner narrative for notifications/alerts.
 */
export function generateShortNarrative(situation: Situation, sources: FusedSources): string {
  const urgency = calculateUrgency(sources, situation.situation_key);
  const signalCount = sources.spine.signals.length;
  const topSignal = sources.spine.signals[0];

  const urgencyEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "📋",
    low: "ℹ️",
  }[urgency];

  if (topSignal) {
    return `${urgencyEmoji} ${situation.situation_key}: ${signalCount} signal(s) detected for ${situation.entity_type} ${situation.entity_id}. Top: ${topSignal.signal_key} (${topSignal.band})`;
  }

  return `${urgencyEmoji} ${situation.situation_key} detected for ${situation.entity_type} ${situation.entity_id}`;
}

/**
 * Generate markdown-formatted narrative for detailed views.
 */
export function generateMarkdownNarrative(situation: Situation, sources: FusedSources): string {
  const narrative = generateNarrative(situation, sources);

  const urgencyBadge = {
    critical: "🚨 **CRITICAL**",
    high: "⚠️ **HIGH**",
    medium: "📋 **MEDIUM**",
    low: "ℹ️ **LOW**",
  }[narrative.urgency_indicator];

  const lines = [
    `## ${situation.situation_key}`,
    "",
    `**Urgency:** ${urgencyBadge}`,
    "",
    `### Summary`,
    narrative.summary,
    "",
    `### Why It Matters`,
    narrative.why_it_matters,
    "",
    `### Key Evidence`,
    ...narrative.key_evidence.map((e) => `- ${e}`),
    "",
    `### Recommended Focus`,
    narrative.recommended_focus,
  ];

  return lines.join("\n");
}
