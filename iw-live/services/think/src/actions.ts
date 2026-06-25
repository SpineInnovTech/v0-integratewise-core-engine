import type { FusedSources } from "./fusion";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposedAction {
  id?: string;
  situation_id: string;
  proposal_rank: number;
  action_type: string;
  action_key: string;
  title: string;
  description: string;
  autonomy_level: "autonomous" | "supervised" | "manual";
  confidence_score: number;
  parameters: Record<string, any>;
  evidence_ref_ids: string[];
  requires_approval: boolean;
  expires_at?: string; // Standardized to string for DB
}

export interface Situation {
  id: string;
  situation_key: string;
  entity_type: string;
  entity_id: string;
  tenant_id?: string;
  severity?: string;
}

// ============================================================================
// ACTION TEMPLATES (Omitted for brevity, assumed same as previously viewed)
// ============================================================================
// [Keeping original template logic...]

const ACTION_TEMPLATES: Record<string, any[]> = {
  "churn.risk": [
    {
      action_key: "schedule_health_call",
      title: "Schedule Customer Health Call",
      description:
        "Proactively reach out to the customer to understand their concerns and prevent churn.",
      autonomy_level: "supervised",
      base_confidence: 0.75,
      requires_approval: true,
      parameters_template: { call_type: "health_check", priority: "high" },
      evidence_boost_rules: [
        { ref_type: "ai_insight", boost: 0.1 },
        { ref_type: "context_email", signal_pattern: "negative", boost: 0.05 },
      ],
    },
    {
      action_key: "draft_retention_email",
      title: "Draft Retention Email",
      description:
        "AI-drafted email tailored to this account's risk signals, addressing specific concerns and reinforcing value.",
      autonomy_level: "supervised",
      base_confidence: 0.7,
      requires_approval: true,
      parameters_template: { channel: "email", tone: "empathetic", priority: "high" },
      evidence_boost_rules: [
        { ref_type: "ai_insight", boost: 0.08 },
        { ref_type: "engagement_log", boost: 0.05 },
      ],
    },
  ],
  "escalation.required": [
    {
      action_key: "escalate_to_leadership",
      title: "Escalate to Leadership",
      description:
        "Flag this account for executive attention with a summarized evidence brief and recommended next steps.",
      autonomy_level: "manual",
      base_confidence: 0.65,
      requires_approval: true,
      parameters_template: { escalation_level: "executive", priority: "critical" },
      evidence_boost_rules: [
        { ref_type: "ai_insight", boost: 0.1 },
        { ref_type: "signal", boost: 0.08 },
      ],
    },
  ],
  "billing.payment_failed": [
    {
      action_key: "send_payment_reminder",
      title: "Send Payment Reminder",
      description: "Notify customer of failed payment and provide update options.",
      autonomy_level: "autonomous",
      base_confidence: 0.95,
      requires_approval: false,
      parameters_template: { channel: "email", urgency: "medium" },
      evidence_boost_rules: [],
    },
  ],
  "task.requested": [
    {
      action_key: "create_task",
      title: "Create Task",
      description:
        "Turn this insight or signal into an actionable task, assigned to the appropriate team member.",
      autonomy_level: "supervised",
      base_confidence: 0.8,
      requires_approval: true,
      parameters_template: { priority: "medium", assignee: "auto" },
      evidence_boost_rules: [{ ref_type: "ai_insight", boost: 0.05 }],
    },
  ],
  "workflow.trigger": [
    {
      action_key: "trigger_workflow",
      title: "Trigger Workflow",
      description:
        "Start an automated workflow based on the current analysis — routes through configured steps and connectors.",
      autonomy_level: "supervised",
      base_confidence: 0.75,
      requires_approval: true,
      parameters_template: { workflow_type: "auto_detect" },
      evidence_boost_rules: [
        { ref_type: "ai_insight", boost: 0.08 },
        { ref_type: "signal", boost: 0.05 },
      ],
    },
  ],
};

export function getActionTemplates(situationKey: string): any[] {
  return ACTION_TEMPLATES[situationKey] || [];
}

// ============================================================================
// ACTION METADATA — used by twin/act for richer draft responses
// ============================================================================

export interface ActionMetadata {
  title: string;
  description: string;
  suggested_summary_template: string;
  suggested_next_steps: string[];
  requires_approval: boolean;
}

export const ACTION_METADATA: Record<string, ActionMetadata> = {
  schedule_health_call: {
    title: "Schedule Customer Health Call",
    description:
      "Proactively reach out to the customer to understand their concerns and prevent churn.",
    suggested_summary_template:
      "Schedule a health check call with {entity_type} {entity_id} to assess current status and address any concerns before they escalate.",
    suggested_next_steps: [
      "Review recent engagement history and support tickets",
      "Prepare talking points based on risk signals",
      "Confirm availability with the account owner",
      "Approve to schedule via connected calendar",
    ],
    requires_approval: true,
  },
  draft_retention_email: {
    title: "Draft Retention Email",
    description: "AI-drafted email tailored to this account's risk signals.",
    suggested_summary_template:
      "Draft a personalized retention email for {entity_type} {entity_id}, addressing specific risk signals and reinforcing the value they're getting.",
    suggested_next_steps: [
      "Review the AI-generated draft for tone and accuracy",
      "Personalize with specific customer details",
      "Approve to send via connected email",
    ],
    requires_approval: true,
  },
  escalate_to_leadership: {
    title: "Escalate to Leadership",
    description: "Flag for executive attention with evidence summary.",
    suggested_summary_template:
      "Escalate {entity_type} {entity_id} to leadership attention. An evidence brief with risk signals, engagement history, and recommended next steps will be attached.",
    suggested_next_steps: [
      "Review the compiled evidence brief",
      "Add any additional context or urgency notes",
      "Approve to notify leadership team",
    ],
    requires_approval: true,
  },
  create_task: {
    title: "Create Task",
    description: "Turn this insight into an actionable task.",
    suggested_summary_template:
      "Create a new task based on the current analysis. The task will be assigned to the appropriate team member with full context attached.",
    suggested_next_steps: [
      "Review the task description and priority",
      "Confirm or change the assignee",
      "Approve to create in the task queue",
    ],
    requires_approval: true,
  },
  trigger_workflow: {
    title: "Trigger Workflow",
    description: "Start an automated workflow based on this analysis.",
    suggested_summary_template:
      "Trigger an automated workflow based on the current analysis. The workflow will route through configured steps and execute connected actions.",
    suggested_next_steps: [
      "Review the workflow steps that will execute",
      "Confirm parameters and target entities",
      "Approve to start the workflow",
    ],
    requires_approval: true,
  },
  send_payment_reminder: {
    title: "Send Payment Reminder",
    description: "Notify customer of failed payment and provide update options.",
    suggested_summary_template:
      "Send a payment reminder to {entity_type} {entity_id} regarding the failed payment. The message will include payment update options.",
    suggested_next_steps: [
      "Review the payment details",
      "Confirm the reminder channel (email)",
      "Approve to send (or auto-approved if policy allows)",
    ],
    requires_approval: false,
  },
};

export function getActionMetadata(actionKey: string): ActionMetadata | null {
  return ACTION_METADATA[actionKey] || null;
}

function calculateConfidence(template: any, sources: FusedSources): number {
  let confidence = template.base_confidence;
  for (const rule of template.evidence_boost_rules || []) {
    const matchingRefs = sources.evidence_refs.filter((ref) => ref.ref_type === rule.ref_type);
    if (matchingRefs.length > 0) {
      const boost = Math.min(rule.boost * matchingRefs.length, rule.boost * 2);
      confidence = Math.min(confidence + boost, 0.99);
    }
  }
  return Math.round(confidence * 100) / 100;
}

/**
 * Create proposed actions (D1).
 * When allowedEntityTypes is provided, proposals are created only if situation.entity_type is in the set (tenant config check).
 */
export async function createProposedActions(
  db: D1Database,
  situation: Situation,
  sources: FusedSources,
  evidenceRefIds: string[] = [],
  allowedEntityTypes?: Set<string> | null
): Promise<ProposedAction[]> {
  if (
    allowedEntityTypes != null &&
    allowedEntityTypes.size > 0 &&
    !allowedEntityTypes.has(situation.entity_type)
  ) {
    return [];
  }
  const proposals: ProposedAction[] = [];
  const templates = ACTION_TEMPLATES[situation.situation_key] || [];

  if (templates.length === 0) {
    templates.push({
      action_key: "review_situation",
      title: "Review Situation Manually",
      description: `Review the ${situation.situation_key} situation.`,
      autonomy_level: "manual",
      base_confidence: 0.5,
      requires_approval: true,
      parameters_template: {},
      evidence_boost_rules: [],
    });
  }

  const statements = [];
  for (let rank = 0; rank < templates.length; rank++) {
    const template = templates[rank];
    const confidence = calculateConfidence(template, sources);
    const id = crypto.randomUUID();

    const p: ProposedAction = {
      id,
      situation_id: situation.id,
      proposal_rank: rank + 1,
      action_type: template.action_key.split("_")[0],
      action_key: template.action_key,
      title: template.title,
      description: template.description,
      autonomy_level: template.autonomy_level,
      confidence_score: confidence,
      parameters: {
        ...template.parameters_template,
        entity_type: situation.entity_type,
        entity_id: situation.entity_id,
      },
      evidence_ref_ids: evidenceRefIds.slice(0, 10),
      requires_approval: template.requires_approval,
    };
    proposals.push(p);

    statements.push(
      db
        .prepare(
          `
            INSERT INTO action_proposals (
                id, tenant_id, situation_id, proposal_rank, action_type,
                autonomy_level, confidence_score, parameters, evidence_ref_ids
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .bind(
          id,
          situation.tenant_id,
          situation.id,
          p.proposal_rank,
          p.action_key,
          p.autonomy_level,
          p.confidence_score,
          JSON.stringify({ ...p.parameters, title: p.title, description: p.description }),
          JSON.stringify(p.evidence_ref_ids)
        )
    );
  }

  if (statements.length > 0) await db.batch(statements);
  return proposals;
}
