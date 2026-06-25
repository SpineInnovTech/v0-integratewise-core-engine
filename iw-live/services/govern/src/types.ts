import { z } from "zod";

// ============================================================================
// Environment Bindings
// ============================================================================
export interface Env {
  // v3.6: D1 is the edge-local governance queue (proposals, audit log).
  // Supabase PostgreSQL remains SINGLE SOURCE OF TRUTH for canonical memory.
  D1: D1Database;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  SIGNATURE_KEY: string; // Trust Layer Secret
  SERVICE_SECRET?: string; // Best Practice: Service-to-service auth

  // DEPRECATED: Only policies.ts and workflow.ts still use DATABASE_URL.
  // These will migrate to D1 in a follow-up. Do not use for new code.
  DATABASE_URL?: string;

  // Service bindings (v3.6 Section 19.3-19.4)
  ACT?: Fetcher;
  BFF?: Fetcher;
}

// ============================================================================
// Policy Types
// ============================================================================
export const PolicySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  action_type_pattern: z.string().min(1), // Supports wildcards like 'billing.*'
  min_severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
  required_roles: z.array(z.string()).default([]),
  auto_approve: z.boolean().default(false),
  require_evidence_count: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Policy = z.infer<typeof PolicySchema>;

export const CreatePolicySchema = PolicySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreatePolicy = z.infer<typeof CreatePolicySchema>;

export const UpdatePolicySchema = PolicySchema.partial().omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});

export type UpdatePolicy = z.infer<typeof UpdatePolicySchema>;

// ============================================================================
// Action Check Types
// ============================================================================
export const ActionCheckSchema = z.object({
  action_type: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]),
  parameters: z.record(z.any()).default({}),
  evidence_ref_count: z.number().int().min(0).default(0),
});

export type ActionCheck = z.infer<typeof ActionCheckSchema>;

export interface CheckResult {
  allowed: boolean;
  policy_id?: string;
  reason?: string;
  auto_approved?: boolean;
}

// ============================================================================
// Approval/Rejection Types
// ============================================================================
export const ApproveActionSchema = z.object({
  action_id: z.string().uuid(),
  reason: z.string().optional(),
});

export type ApproveAction = z.infer<typeof ApproveActionSchema>;

export const RejectActionSchema = z.object({
  action_id: z.string().uuid(),
  reason: z.string().min(1, "Rejection reason is required"),
});

export type RejectAction = z.infer<typeof RejectActionSchema>;

// ============================================================================
// Audit Types
// ============================================================================
export const AuditEntrySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  action_id: z.string().uuid().optional(),
  policy_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  decision: z.enum(["allowed", "denied", "approved", "rejected", "auto_approved"]),
  reason: z.string().optional(),
  action_type: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime().optional(),
  signature: z.string().optional(), // Trust Layer: Digital signature
  correlation_id: z.string().optional(), // Best Practice: End-to-end tracing
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AuditFiltersSchema = z.object({
  action_id: z.string().uuid().optional(),
  policy_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  decision: z.enum(["allowed", "denied", "approved", "rejected", "auto_approved"]).optional(),
  action_type: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export type AuditFilters = z.infer<typeof AuditFiltersSchema>;

// ============================================================================
// Severity Ranking
// ============================================================================
export const SEVERITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
