/**
 * Governance Layer
 * PII classification, redaction, and approval workflows
 */

import { crypto } from "crypto"

// Inline type definitions (previously from @integratewise/types)
interface Task {
  id: string
  workspace_id: string
  source_id: string
  source_type: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done" | "blocked"
  priority: "low" | "medium" | "high" | "critical"
  assignee_email?: string
  due_date?: string
  tags?: string[]
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Note {
  id: string
  workspace_id: string
  source_id: string
  source_type: string
  title: string
  content: string
  tags?: string[]
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Conversation {
  id: string
  workspace_id: string
  source_id: string
  source_type: string
  channel_name?: string
  participants: Array<{ user_id?: string; email?: string; name?: string }>
  messages: Array<{
    message_id: string
    sender_id?: string
    sender_email?: string
    content: string
    timestamp: string
    thread_id?: string
    reactions?: Array<{ emoji: string; count: number }>
  }>
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Plan {
  id: string
  workspace_id: string
  source_id: string
  source_type: string
  title: string
  description?: string
  goals?: string[]
  tasks?: string[]
  status: "planning" | "active" | "completed" | "cancelled"
  start_date?: string
  end_date?: string
  budget?: { amount: number; currency: string }
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Approval {
  id: string
  workspace_id: string
  action_type: "publish_notion" | "publish_linear" | "publish_jira" | "delete_data" | "redact_pii"
  entity_type: "task" | "note" | "conversation" | "plan"
  entity_id: string
  approver_id: string
  approver_email: string
  rationale: string
  approved: boolean
  created_at: string
  expires_at?: string
}

// PII patterns
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.]?)?$$?\d{3}$$?[-.]?\d{3}[-.]?\d{4}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
  credit_card: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  address:
    /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)[,\s]+[\w\s]+[,\s]+[A-Z]{2}\s+\d{5}/gi,
}

// Classify data based on content
export function classifyPII(content: string): "public" | "internal" | "confidential" | "pii" {
  // Check for PII patterns
  if (PII_PATTERNS.email.test(content)) return "pii"
  if (PII_PATTERNS.phone.test(content)) return "pii"
  if (PII_PATTERNS.ssn.test(content)) return "pii"
  if (PII_PATTERNS.credit_card.test(content)) return "pii"
  if (PII_PATTERNS.address.test(content)) return "pii"

  // Check for sensitive keywords
  const sensitive_keywords = [
    "password",
    "secret",
    "token",
    "api key",
    "private",
    "confidential",
    "ssn",
    "social security",
  ]

  const lower = content.toLowerCase()
  if (sensitive_keywords.some((kw) => lower.includes(kw))) {
    return "confidential"
  }

  // Default to internal
  return "internal"
}

// Redact PII from content (reversible with approval)
export function redactPII(
  content: string,
  fields: Array<"email" | "phone" | "ssn" | "credit_card" | "address"> = [
    "email",
    "phone",
    "ssn",
    "credit_card",
    "address",
  ],
): { redacted: string; redactions: Array<{ type: string; original: string; redacted: string }> } {
  let redacted = content
  const redactions: Array<{ type: string; original: string; redacted: string }> = []

  fields.forEach((field) => {
    const pattern = PII_PATTERNS[field]
    const matches = content.match(pattern) || []

    matches.forEach((match, idx) => {
      const redacted_value = `[${field.toUpperCase()}_${idx + 1}_REDACTED]`
      redacted = redacted.replace(match, redacted_value)
      redactions.push({
        type: field,
        original: match,
        redacted: redacted_value,
      })
    })
  })

  return { redacted, redactions }
}

// Pre-render check for template publishing
export interface PreRenderCheck {
  ok: boolean
  missing_fields: string[]
  pii_flags: Array<{
    entity_id: string
    entity_type: string
    fields: string[]
  }>
}

export function preRenderCheck(
  template_id: string,
  spine_links: Array<{ entity_type: string; entity_id: string; entity: any }>,
): PreRenderCheck {
  const missing_fields: string[] = []
  const pii_flags: PreRenderCheck["pii_flags"] = []

  spine_links.forEach((link) => {
    const { entity_type, entity_id, entity } = link

    // Check for required fields
    if (entity_type === "task") {
      if (!entity.title) missing_fields.push(`task.${entity_id}.title`)
      if (!entity.status) missing_fields.push(`task.${entity_id}.status`)
    }

    // Check for PII
    const pii_fields: string[] = []

    if (entity_type === "task") {
      if (entity.assignee_email && classifyPII(entity.assignee_email) === "pii") {
        pii_fields.push("assignee_email")
      }
      if (entity.description && classifyPII(entity.description) === "pii") {
        pii_fields.push("description")
      }
    }

    if (entity_type === "note") {
      if (entity.content && classifyPII(entity.content) === "pii") {
        pii_fields.push("content")
      }
    }

    if (entity_type === "conversation") {
      entity.messages?.forEach((msg: any, idx: number) => {
        if (msg.sender_email && classifyPII(msg.sender_email) === "pii") {
          pii_fields.push(`messages[${idx}].sender_email`)
        }
      })
    }

    if (pii_fields.length > 0) {
      pii_flags.push({
        entity_id,
        entity_type,
        fields: pii_fields,
      })
    }
  })

  return {
    ok: missing_fields.length === 0 && pii_flags.length === 0,
    missing_fields,
    pii_flags,
  }
}

// Post-render registry (audit trail)
export interface ArtifactRegistry {
  artifact_id: string
  template_id: string
  spine_links: Array<{ entity_type: string; entity_id: string }>
  checksum: string
  approver_id: string
  approver_email: string
  publish_targets: string[]
  created_at: string
}

export function postRenderRegistry(
  template_id: string,
  spine_links: Array<{ entity_type: string; entity_id: string }>,
  approver_id: string,
  approver_email: string,
  publish_targets: string[],
): ArtifactRegistry {
  const checksum = generateChecksum(JSON.stringify({ template_id, spine_links }))

  return {
    artifact_id: crypto.randomUUID(),
    template_id,
    spine_links,
    checksum,
    approver_id,
    approver_email,
    publish_targets,
    created_at: new Date().toISOString(),
  }
}

// Create approval record
export function createApproval(
  workspace_id: string,
  action_type: Approval["action_type"],
  entity_type: Approval["entity_type"],
  entity_id: string,
  approver_id: string,
  approver_email: string,
  rationale: string,
  approved: boolean,
  expires_at?: string,
): Approval {
  return {
    id: crypto.randomUUID(),
    workspace_id,
    action_type,
    entity_type,
    entity_id,
    approver_id,
    approver_email,
    rationale,
    approved,
    created_at: new Date().toISOString(),
    expires_at,
  }
}

// Check if action requires approval
export function requiresApproval(action_type: string, entity: { data_class?: string }): boolean {
  // Require approval for publishing PII or confidential data
  if (action_type.startsWith("publish_") && entity.data_class === "pii") {
    return true
  }

  if (action_type.startsWith("publish_") && entity.data_class === "confidential") {
    return true
  }

  // Always require approval for data deletion
  if (action_type === "delete_data") {
    return true
  }

  // Always require approval for PII redaction
  if (action_type === "redact_pii") {
    return true
  }

  return false
}

// Simple checksum generator (use crypto hash in production)
function generateChecksum(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}
