/**
 * Field Policy Renderer
 *
 * Reads field_policies, required_fields, allowed_fields, ai_readable, searchable
 * per entity type and decides, per user and per view:
 *   - Which fields are visible
 *   - Which are editable
 *   - Which are required
 *   - Which can be read by the Twin for reasoning
 *
 * Doctrine: Policy logic lives in the Projection Layer, not in ad-hoc JSX.
 */

import type { RoleName } from "@/lib/rbac/roles";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FieldPolicy {
  required_fields: string[];
  allowed_fields: string[];
  canonical_mapping?: Record<string, string>;
  sensitivity?: Record<string, "public" | "internal" | "pii">;
  searchable?: string[];
  ai_readable?: string[];
}

export interface ResolvedFieldPolicy {
  field: string;
  label: string;
  visible: boolean;
  editable: boolean;
  required: boolean;
  searchable: boolean;
  aiReadable: boolean;
  sensitivity: "public" | "internal" | "pii";
}

export interface FieldPolicyContext {
  role: RoleName;
  department: string;
  industry: string;
  twinTier: string;
}

// ─── Role-Based Field Permissions ──────────────────────────────────────────────

const ROLE_FIELD_PERMISSIONS: Record<string, { editable: boolean; seesPii: boolean }> = {
  owner: { editable: true, seesPii: true },
  admin: { editable: true, seesPii: true },
  manager: { editable: true, seesPii: false },
  member: { editable: true, seesPii: false },
  viewer: { editable: false, seesPii: false },
};

// ─── Apply Field Policy ────────────────────────────────────────────────────────

export function applyFieldPolicy(
  entityType: string,
  policy: FieldPolicy | null | undefined,
  context: FieldPolicyContext
): ResolvedFieldPolicy[] {
  if (!policy) return [];

  const rolePerms = ROLE_FIELD_PERMISSIONS[context.role] || { editable: false, seesPii: false };
  const allFields = policy.allowed_fields || [];
  const requiredSet = new Set(policy.required_fields || []);
  const searchableSet = new Set(policy.searchable || []);
  const aiReadableSet = new Set(policy.ai_readable || []);
  const sensitivityMap = policy.sensitivity || {};

  const resolved: ResolvedFieldPolicy[] = [];

  for (const field of allFields) {
    const sensitivity = sensitivityMap[field] || "public";

    // PII fields hidden from non-owner/admin
    const visible = sensitivity !== "pii" || rolePerms.seesPii;

    // Editable only if role permits and field is in allowed list
    const editable = visible && rolePerms.editable;

    resolved.push({
      field,
      label: formatFieldLabel(field),
      visible,
      editable,
      required: requiredSet.has(field),
      searchable: searchableSet.has(field),
      aiReadable: aiReadableSet.has(field) && visible,
      sensitivity,
    });
  }

  return resolved;
}

// ─── Filter Visible Fields Only ────────────────────────────────────────────────

export function getVisibleFields(policies: ResolvedFieldPolicy[]): string[] {
  return policies.filter((p) => p.visible).map((p) => p.field);
}

export function getEditableFields(policies: ResolvedFieldPolicy[]): string[] {
  return policies.filter((p) => p.editable).map((p) => p.field);
}

export function getRequiredFields(policies: ResolvedFieldPolicy[]): string[] {
  return policies.filter((p) => p.required).map((p) => p.field);
}

export function getAiReadableFields(policies: ResolvedFieldPolicy[]): string[] {
  return policies.filter((p) => p.aiReadable).map((p) => p.field);
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function formatFieldLabel(field: string): string {
  return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Merge Multiple Policies ───────────────────────────────────────────────────

export function mergeFieldPolicies(policies: (FieldPolicy | null | undefined)[]): FieldPolicy {
  const merged: FieldPolicy = {
    required_fields: [],
    allowed_fields: [],
    canonical_mapping: {},
    sensitivity: {},
    searchable: [],
    ai_readable: [],
  };

  const seen = new Set<string>();

  for (const policy of policies) {
    if (!policy) continue;

    for (const field of policy.allowed_fields || []) {
      if (!seen.has(field)) {
        seen.add(field);
        merged.allowed_fields.push(field);
      }
    }

    for (const field of policy.required_fields || []) {
      if (!merged.required_fields.includes(field)) {
        merged.required_fields.push(field);
      }
    }

    for (const field of policy.searchable || []) {
      if (!merged.searchable!.includes(field)) {
        merged.searchable!.push(field);
      }
    }

    for (const field of policy.ai_readable || []) {
      if (!merged.ai_readable!.includes(field)) {
        merged.ai_readable!.push(field);
      }
    }

    Object.assign(merged.canonical_mapping || {}, policy.canonical_mapping || {});
    Object.assign(merged.sensitivity || {}, policy.sensitivity || {});
  }

  return merged;
}
