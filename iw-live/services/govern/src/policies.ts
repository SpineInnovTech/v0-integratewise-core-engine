import { neon } from "@neondatabase/serverless";
import type { Policy, ActionCheck, CheckResult, CreatePolicy, UpdatePolicy } from "./types";
import { SEVERITY_RANK } from "./types";

// ============================================================================
// Policy CRUD Operations
// ============================================================================

/**
 * List all active policies for a tenant
 */
export async function listPolicies(dbUrl: string, tenant_id: string): Promise<Policy[]> {
  const sql = neon(dbUrl);

  const result = await sql`
    SELECT 
      id, tenant_id, name, description, action_type_pattern,
      min_severity, required_roles, auto_approve, require_evidence_count,
      is_active, created_at, updated_at
    FROM governance_policies
    WHERE tenant_id = ${tenant_id}
      AND is_active = true
    ORDER BY created_at DESC
  `;

  return result as Policy[];
}

/**
 * Get a single policy by ID
 */
export async function getPolicy(
  dbUrl: string,
  tenant_id: string,
  policy_id: string
): Promise<Policy | null> {
  const sql = neon(dbUrl);

  const result = await sql`
    SELECT 
      id, tenant_id, name, description, action_type_pattern,
      min_severity, required_roles, auto_approve, require_evidence_count,
      is_active, created_at, updated_at
    FROM governance_policies
    WHERE id = ${policy_id}
      AND tenant_id = ${tenant_id}
    LIMIT 1
  `;

  return (result[0] as Policy | undefined) ?? null;
}

/**
 * Create a new policy
 */
export async function createPolicy(
  dbUrl: string,
  policy: CreatePolicy,
  cache?: KVNamespace
): Promise<Policy> {
  const sql = neon(dbUrl);

  const result = await sql`
    INSERT INTO governance_policies (
      tenant_id, name, description, action_type_pattern,
      min_severity, required_roles, auto_approve, require_evidence_count,
      is_active
    ) VALUES (
      ${policy.tenant_id},
      ${policy.name},
      ${policy.description || null},
      ${policy.action_type_pattern},
      ${policy.min_severity},
      ${JSON.stringify(policy.required_roles)},
      ${policy.auto_approve},
      ${policy.require_evidence_count},
      ${policy.is_active}
    )
    RETURNING 
      id, tenant_id, name, description, action_type_pattern,
      min_severity, required_roles, auto_approve, require_evidence_count,
      is_active, created_at, updated_at
  `;

  // Invalidate cache
  if (cache) {
    await cache.delete(`policies:${policy.tenant_id}`);
  }

  return result[0] as Policy;
}

/**
 * Update an existing policy
 */
export async function updatePolicy(
  dbUrl: string,
  tenant_id: string,
  policy_id: string,
  updates: UpdatePolicy,
  cache?: KVNamespace
): Promise<Policy | null> {
  const sql = neon(dbUrl);

  // Build dynamic update query
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push("name = $" + (values.length + 1));
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push("description = $" + (values.length + 1));
    values.push(updates.description);
  }
  if (updates.action_type_pattern !== undefined) {
    setClauses.push("action_type_pattern = $" + (values.length + 1));
    values.push(updates.action_type_pattern);
  }
  if (updates.min_severity !== undefined) {
    setClauses.push("min_severity = $" + (values.length + 1));
    values.push(updates.min_severity);
  }
  if (updates.required_roles !== undefined) {
    setClauses.push("required_roles = $" + (values.length + 1));
    values.push(JSON.stringify(updates.required_roles));
  }
  if (updates.auto_approve !== undefined) {
    setClauses.push("auto_approve = $" + (values.length + 1));
    values.push(updates.auto_approve);
  }
  if (updates.require_evidence_count !== undefined) {
    setClauses.push("require_evidence_count = $" + (values.length + 1));
    values.push(updates.require_evidence_count);
  }
  if (updates.is_active !== undefined) {
    setClauses.push("is_active = $" + (values.length + 1));
    values.push(updates.is_active);
  }

  if (setClauses.length === 0) {
    return getPolicy(dbUrl, tenant_id, policy_id);
  }

  setClauses.push("updated_at = NOW()");

  const result = await sql`
    UPDATE governance_policies
    SET 
      name = COALESCE(${updates.name}, name),
      description = COALESCE(${updates.description}, description),
      action_type_pattern = COALESCE(${updates.action_type_pattern}, action_type_pattern),
      min_severity = COALESCE(${updates.min_severity}, min_severity),
      required_roles = COALESCE(${updates.required_roles ? JSON.stringify(updates.required_roles) : null}, required_roles),
      auto_approve = COALESCE(${updates.auto_approve}, auto_approve),
      require_evidence_count = COALESCE(${updates.require_evidence_count}, require_evidence_count),
      is_active = COALESCE(${updates.is_active}, is_active),
      updated_at = NOW()
    WHERE id = ${policy_id}
      AND tenant_id = ${tenant_id}
    RETURNING 
      id, tenant_id, name, description, action_type_pattern,
      min_severity, required_roles, auto_approve, require_evidence_count,
      is_active, created_at, updated_at
  `;

  // Invalidate cache
  if (cache) {
    await cache.delete(`policies:${tenant_id}`);
  }

  return result[0] as Policy | null;
}

/**
 * Deactivate a policy (soft delete)
 */
export async function deactivatePolicy(
  dbUrl: string,
  tenant_id: string,
  policy_id: string,
  cache?: KVNamespace
): Promise<boolean> {
  const sql = neon(dbUrl);

  const result = await sql`
    UPDATE governance_policies
    SET is_active = false, updated_at = NOW()
    WHERE id = ${policy_id}
      AND tenant_id = ${tenant_id}
    RETURNING id
  `;

  // Invalidate cache
  if (cache && result.length > 0) {
    await cache.delete(`policies:${tenant_id}`);
  }

  return result.length > 0;
}

// ============================================================================
// Policy Matching Utilities
// ============================================================================

/**
 * Check if an action type matches a pattern (supports wildcards)
 * Examples:
 *   'billing.invoice' matches 'billing.*'
 *   'billing.invoice.create' matches 'billing.*' and 'billing.**'
 *   'billing.invoice' matches 'billing.invoice'
 */
function matchesActionPattern(actionType: string, pattern: string): boolean {
  // Exact match
  if (actionType === pattern) return true;

  // Handle ** (matches any depth)
  if (pattern.endsWith(".**")) {
    const prefix = pattern.slice(0, -3);
    return actionType.startsWith(prefix + ".") || actionType === prefix;
  }

  // Handle * (matches single level)
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return actionType.startsWith(prefix + ".");
  }

  // Handle wildcards in the middle
  const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^.]+");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(actionType);
}

/**
 * Check if user has any of the required roles
 */
function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Compare severity levels
 */
function meetsMinSeverity(actionPriority: string, minSeverity: string): boolean {
  return SEVERITY_RANK[actionPriority] >= SEVERITY_RANK[minSeverity];
}

// ============================================================================
// Main Policy Check
// ============================================================================

/**
 * Check if an action can be executed based on governance policies
 */
export async function canExecute(
  dbUrl: string,
  tenant_id: string,
  user_id: string,
  user_roles: string[],
  action: ActionCheck,
  cache?: KVNamespace
): Promise<CheckResult> {
  // Reserved for policy/audit enrichment (kept in signature for future use).
  void user_id;
  const sql = neon(dbUrl);
  const cacheKey = `policies:${tenant_id}`;
  let policies: Policy[] | null = null;

  // 1. Try Cache First
  if (cache) {
    const cached = await cache.get(cacheKey, { type: "json" });
    if (cached) {
      policies = cached as Policy[];
    }
  }

  // 2. Fetch from DB if not in cache
  if (!policies) {
    policies = (await sql`
      SELECT 
        id, tenant_id, name, description, action_type_pattern,
        min_severity, required_roles, auto_approve, require_evidence_count,
        is_active
      FROM governance_policies
      WHERE tenant_id = ${tenant_id}
        AND is_active = true
      ORDER BY 
        CASE min_severity 
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
        END DESC
    `) as Policy[];

    // 3. Populate Cache
    if (cache && policies.length > 0) {
      await cache.put(cacheKey, JSON.stringify(policies), { expirationTtl: 3600 }); // 1 hour TTL
    }
  }

  // Find matching policies
  const matchingPolicies = policies.filter((policy) =>
    matchesActionPattern(action.action_type, policy.action_type_pattern)
  );

  // If no policies match, allow by default
  if (matchingPolicies.length === 0) {
    return {
      allowed: true,
      reason: "No matching policies found - allowed by default",
    };
  }

  // Check each matching policy (most restrictive first)
  for (const policy of matchingPolicies) {
    // Check severity requirement
    if (!meetsMinSeverity(action.priority, policy.min_severity)) {
      continue; // This policy doesn't apply to this severity level
    }

    // Check role requirements
    if (!hasRequiredRole(user_roles, policy.required_roles)) {
      return {
        allowed: false,
        policy_id: policy.id,
        reason: `Missing required role. Required: ${policy.required_roles.join(", ")}`,
      };
    }

    // Check evidence requirements
    if (
      policy.require_evidence_count > 0 &&
      action.evidence_ref_count < policy.require_evidence_count
    ) {
      return {
        allowed: false,
        policy_id: policy.id,
        reason: `Insufficient evidence. Required: ${policy.require_evidence_count}, Provided: ${action.evidence_ref_count}`,
      };
    }

    // Check auto-approve
    if (policy.auto_approve) {
      return {
        allowed: true,
        policy_id: policy.id,
        auto_approved: true,
        reason: `Auto-approved by policy: ${policy.name}`,
      };
    }

    // Policy matched but requires manual approval
    return {
      allowed: true,
      policy_id: policy.id,
      reason: `Allowed by policy: ${policy.name}`,
    };
  }

  // Default allow if no policy explicitly denied
  return {
    allowed: true,
    reason: "Allowed - no restrictive policies matched",
  };
}
