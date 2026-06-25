import { z } from "zod";

// --- Shared Types ---

export const SourceToolSchema = z.enum([
  "Jira",
  "Asana",
  "Trello",
  "GitHub",
  "Linear",
  "Slack",
  "Gmail",
  "Outlook",
  "Notion",
  "HubSpot",
  "Salesforce",
  "Internal",
  "Other",
]);
export type SourceTool = z.infer<typeof SourceToolSchema>;

export const PrioritySchema = z.enum(["Low", "Medium", "High", "Urgent"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const StatusSchema = z.enum([
  "Todo",
  "In_Progress",
  "In_Review",
  "Done",
  "Canceled",
  "Backlog",
]);
export type Status = z.infer<typeof StatusSchema>;

// --- Task Schema ---

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: StatusSchema,
  priority: PrioritySchema,
  due_date: z.string().datetime().optional(), // ISO 8601
  assignee_id: z.string().optional(),
  source_tool: SourceToolSchema,
  external_ref: z.string().optional(), // ID in the source system
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

// --- Note Schema ---

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  body_md: z.string(), // Markdown content
  tags: z.array(z.string()),
  source_tool: SourceToolSchema,
  external_ref: z.string().optional(),
  linked_entity_ids: z.array(z.string().uuid()),
  created_at: z.string().datetime(),
});
export type Note = z.infer<typeof NoteSchema>;

// --- Conversation Schema ---

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  role: z.string().optional(),
});

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  source: SourceToolSchema, // e.g., Slack, Gmail
  message_count: z.number().int().nonnegative(),
  topic: z.string().optional(),
  participants: z.array(ParticipantSchema),
  created_at: z.string().datetime(),
  linkage_score: z.number().min(0).max(1), // AI-computed relevance score
  external_thread_id: z.string().optional(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

// --- Plan Schema ---

export const MilestoneSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  due_date: z.string().datetime().optional(),
  completed: z.boolean(),
});

export const PlanSchema = z.object({
  id: z.string().uuid(),
  objective: z.string().min(1),
  milestones: z.array(MilestoneSchema),
  owner_id: z.string(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  status: z.enum(["Draft", "Active", "Completed", "On_Hold", "At_Risk"]),
});
export type Plan = z.infer<typeof PlanSchema>;

// --- HealthMetric Schema (CS) ---

export const MetricTypeSchema = z.enum([
  "Usage",
  "NPS",
  "Ticket_Severity",
  "Renewal_Proximity",
  "Engagement",
  "Custom",
]);

export const HealthMetricSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string(),
  metric_type: MetricTypeSchema,
  value: z.number(), // Normalized 0-100 or raw value depending on context, usually normalized for health score
  weight: z.number().min(0).max(1),
  period: z.string(), // e.g., "2023-Q4", "2024-01"
  computed_at: z.string().datetime(),
});
export type HealthMetric = z.infer<typeof HealthMetricSchema>;

// --- Export All ---
export const Schemas = {
  Task: TaskSchema,
  Note: NoteSchema,
  Conversation: ConversationSchema,
  Plan: PlanSchema,
  HealthMetric: HealthMetricSchema,
};
