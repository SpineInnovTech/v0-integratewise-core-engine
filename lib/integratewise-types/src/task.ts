import { z } from "zod";

// ============================================================================
// Orchestration Task Runtime Validation Schema (Zod)
// ============================================================================

export const OrchestrationTaskSchema = z.object({
  id: z.string().uuid("Task ID must be a valid UUID"),
  title: z.string().min(1, "Task title is required"),
  status: z.enum(["created", "active", "blocked", "completed", "failed", "cancelled"]),
  owner: z.string().min(1, "Owner reference is required"), // 'twin' | string (agent_id) | 'human'
  created_at: z.string(),
  updated_at: z.string(),
  checkpoint_at: z.string(), // ISO Timestamp for durability checks
  dependencies: z.array(z.string().uuid()), // Array of dependent Task UUIDs
  subtasks: z.array(z.string().uuid()), // Array of subtask Task UUIDs
  lineage_ref: z.string(), // session_id + event_id
  retry_count: z.number().int().nonnegative().default(0),
  max_retries: z.number().int().nonnegative().default(3),
  execution_log: z.array(z.string()), // Chronological log of events
  verification_status: z.enum(["unverified", "verified", "failed"]),
  spine_write_required: z.boolean(),
  approval_required: z.boolean(),
  approval_status: z.enum(["pending", "approved", "rejected"]),
});

// ============================================================================
// Orchestration Task Static Type Contract
// ============================================================================

export type OrchestrationTask = z.infer<typeof OrchestrationTaskSchema>;
