/**
 * SPINE Contracts v1.0
 * Unified data model for IntegrateWise
 * All entities must conform to these schemas with versioning
 */

import { z } from "zod";

// Version constant
export const SPINE_SCHEMA_VERSION = "1.0.0";

// Common fields schema
const SpineBaseSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  hub_id: z.string().uuid().optional(),
  source_id: z.string().describe("Original ID from source system"),
  source_type: z.enum([
    "slack",
    "discord",
    "hubspot",
    "notion",
    "gmail",
    "sheets",
    "asana",
    "attio",
    "github",
    "salesforce",
    "pipedrive",
    "custom",
  ]),
  spine_schema_version: z.string().default(SPINE_SCHEMA_VERSION),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  metadata: z.object({
    raw: z.record(z.unknown()).describe("Original provider payload"),
  }),
});

// Task Schema
export const SpineTaskSchema = SpineBaseSchema.extend({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  due_date: z.string().datetime().optional(),
  assignee_id: z.string().uuid().optional(),
  assignee_email: z.string().email().optional(),
  tags: z.array(z.string()).default([]),
  estimated_hours: z.number().positive().optional(),
  actual_hours: z.number().positive().optional(),
  dependencies: z.array(z.string().uuid()).default([]),
  data_class: z
    .enum(["public", "internal", "confidential", "pii"])
    .default("internal")
    .describe("PII classification"),
});

export type SpineTask = z.infer<typeof SpineTaskSchema>;

/** @deprecated Use SpineTask instead */
export type Task = SpineTask;
/** @deprecated Use SpineTaskSchema instead */
export const TaskSchema = SpineTaskSchema;

// Note Schema
export const SpineNoteSchema = SpineBaseSchema.extend({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  linked_to: z
    .array(
      z.object({
        entity_type: z.enum(["task", "note", "conversation", "plan", "integration"]),
        entity_id: z.string().uuid(),
      })
    )
    .default([]),
  format: z.enum(["plain", "markdown", "html"]).default("plain"),
  data_class: z.enum(["public", "internal", "confidential", "pii"]).default("internal"),
});

export type SpineNote = z.infer<typeof SpineNoteSchema>;

/** @deprecated Use SpineNote instead */
export type Note = SpineNote;
/** @deprecated Use SpineNoteSchema instead */
export const NoteSchema = SpineNoteSchema;

// Conversation Schema
export const ConversationSchema = SpineBaseSchema.extend({
  channel_name: z.string().optional(),
  participants: z.array(
    z.object({
      user_id: z.string().optional(),
      email: z.string().email().optional(),
      name: z.string().optional(),
    })
  ),
  messages: z.array(
    z.object({
      message_id: z.string(),
      sender_id: z.string().optional(),
      sender_email: z.string().email().optional(),
      content: z.string(),
      timestamp: z.string().datetime(),
      thread_id: z.string().optional(),
      reactions: z.array(z.object({ emoji: z.string(), count: z.number() })).optional(),
    })
  ),
  summary: z.string().optional().describe("AI-generated summary"),
  decisions: z.array(z.string()).default([]).describe("Extracted decisions"),
  action_items: z.array(z.string().uuid()).default([]).describe("Linked task IDs"),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  data_class: z.enum(["public", "internal", "confidential", "pii"]).default("confidential"),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// Plan Schema
export const PlanSchema = SpineBaseSchema.extend({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  goals: z.array(
    z.object({
      goal_id: z.string().uuid(),
      description: z.string(),
      target_date: z.string().datetime().optional(),
      completed: z.boolean().default(false),
    })
  ),
  tasks: z.array(z.string().uuid()).default([]).describe("Linked task IDs"),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  owner_id: z.string().uuid().optional(),
  budget: z
    .object({
      amount: z.number(),
      currency: z.string().length(3),
    })
    .optional(),
  data_class: z.enum(["public", "internal", "confidential", "pii"]).default("internal"),
});

export type Plan = z.infer<typeof PlanSchema>;

// Integration Schema
export const IntegrationSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  type: z.enum([
    "slack",
    "discord",
    "hubspot",
    "notion",
    "gmail",
    "sheets",
    "asana",
    "attio",
    "github",
    "salesforce",
    "pipedrive",
    "custom",
  ]),
  name: z.string().min(1).max(100),
  credentials_ref: z.string().optional().describe("Reference to encrypted credentials"),
  config: z.record(z.unknown()).default({}),
  status: z.enum(["active", "paused", "error", "disconnected"]).default("active"),
  last_sync: z.string().datetime().optional(),
  sync_frequency: z.enum(["realtime", "hourly", "daily", "weekly", "manual"]).default("hourly"),
  error_count: z.number().int().min(0).default(0),
  last_error: z.string().optional(),
  spine_schema_version: z.string().default(SPINE_SCHEMA_VERSION),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Integration = z.infer<typeof IntegrationSchema>;

// Loader Audit Schema
export const LoaderAuditSchema = z.object({
  pages_fetched: z.number().int().min(0),
  items_transformed: z.number().int().min(0),
  items_deduped: z.number().int().min(0),
  items_written: z.number().int().min(0),
  next_cursor: z.string().optional(),
  warnings: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      entity_id: z.string().optional(),
    })
  ),
  duration_ms: z.number().int().min(0),
});

export type LoaderAudit = z.infer<typeof LoaderAuditSchema>;

// Loader Result Schema
export const LoaderResultSchema = z.object({
  workspace_id: z.string().uuid(),
  source: z.string(),
  time_window: z.object({
    since: z.string().datetime(),
    until: z.string().datetime(),
  }),
  spine: z.object({
    tasks: z.array(SpineTaskSchema).default([]),
    notes: z.array(SpineNoteSchema).default([]),
    conversations: z.array(ConversationSchema).default([]),
    plans: z.array(PlanSchema).default([]),
    integrations: z.array(IntegrationSchema).default([]),
  }),
  audit: LoaderAuditSchema,
});

export type LoaderResult = z.infer<typeof LoaderResultSchema>;

// Approval Schema
export const ApprovalSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  action_type: z.enum([
    "publish_task",
    "publish_note",
    "publish_plan",
    "redact_pii",
    "export_data",
    "delete_data",
  ]),
  entity_type: z.enum(["task", "note", "conversation", "plan", "integration"]),
  entity_id: z.string().uuid(),
  approver_id: z.string().uuid(),
  approver_email: z.string().email(),
  rationale: z.string(),
  approved: z.boolean(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
});

export type Approval = z.infer<typeof ApprovalSchema>;

// Validation utilities
export function validateTask(data: unknown): SpineTask {
  return SpineTaskSchema.parse(data);
}

export function validateNote(data: unknown): SpineNote {
  return SpineNoteSchema.parse(data);
}

export function validateConversation(data: unknown): Conversation {
  return ConversationSchema.parse(data);
}

export function validatePlan(data: unknown): Plan {
  return PlanSchema.parse(data);
}

export function validateIntegration(data: unknown): Integration {
  return IntegrationSchema.parse(data);
}

export function validateLoaderResult(data: unknown): LoaderResult {
  return LoaderResultSchema.parse(data);
}

export function validateApproval(data: unknown): Approval {
  return ApprovalSchema.parse(data);
}

// Safe validation (returns errors instead of throwing)
export function safeValidateTask(data: unknown) {
  return SpineTaskSchema.safeParse(data);
}

export function safeValidateNote(data: unknown) {
  return SpineNoteSchema.safeParse(data);
}

export function safeValidateConversation(data: unknown) {
  return ConversationSchema.safeParse(data);
}

export function safeValidatePlan(data: unknown) {
  return PlanSchema.safeParse(data);
}

export function safeValidateLoaderResult(data: unknown) {
  return LoaderResultSchema.safeParse(data);
}
