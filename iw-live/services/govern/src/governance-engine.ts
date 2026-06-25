/**
 * Governance Engine
 *
 * Data quality rules, validation, and transformation.
 * Enforces policies on data before storage.
 *
 * @integratewise/govern
 */

export type RuleAction = "allow" | "redact" | "mask" | "flag" | "reject" | "transform" | "encrypt";

export interface GovernanceRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: RuleCondition[];
  action: RuleAction;
  actionConfig?: Record<string, unknown>;
  tenantId?: string; // null = global rule
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  caseSensitive?: boolean;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "matches_regex"
  | "in"
  | "not_in"
  | "exists"
  | "not_exists"
  | "greater_than"
  | "less_than"
  | "is_pii"
  | "is_email"
  | "is_phone"
  | "is_ssn"
  | "is_credit_card";

export interface GovernanceResult {
  allowed: boolean;
  modified: boolean;
  data: Record<string, unknown>;
  appliedRules: string[];
  flags: string[];
  redactedFields: string[];
  errors: string[];
}

// PII detection patterns
const PII_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  ssn: /\d{3}[-\s]?\d{2}[-\s]?\d{4}/,
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
};

/**
 * Check if a condition is satisfied
 */
export function evaluateCondition(
  data: Record<string, unknown>,
  condition: RuleCondition
): boolean {
  const value = getNestedValue(data, condition.field);
  const conditionValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return condition.caseSensitive
        ? value === conditionValue
        : String(value).toLowerCase() === String(conditionValue).toLowerCase();

    case "not_equals":
      return condition.caseSensitive
        ? value !== conditionValue
        : String(value).toLowerCase() !== String(conditionValue).toLowerCase();

    case "contains":
      return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());

    case "not_contains":
      return !String(value).toLowerCase().includes(String(conditionValue).toLowerCase());

    case "starts_with":
      return String(value).toLowerCase().startsWith(String(conditionValue).toLowerCase());

    case "ends_with":
      return String(value).toLowerCase().endsWith(String(conditionValue).toLowerCase());

    case "matches_regex":
      try {
        const regex = new RegExp(String(conditionValue), condition.caseSensitive ? "" : "i");
        return regex.test(String(value));
      } catch {
        return false;
      }

    case "in":
      return Array.isArray(conditionValue) && conditionValue.includes(value);

    case "not_in":
      return Array.isArray(conditionValue) && !conditionValue.includes(value);

    case "exists":
      return value !== undefined && value !== null;

    case "not_exists":
      return value === undefined || value === null;

    case "greater_than":
      return Number(value) > Number(conditionValue);

    case "less_than":
      return Number(value) < Number(conditionValue);

    case "is_email":
      return PII_PATTERNS.email.test(String(value));

    case "is_phone":
      return PII_PATTERNS.phone.test(String(value));

    case "is_ssn":
      return PII_PATTERNS.ssn.test(String(value));

    case "is_credit_card":
      return PII_PATTERNS.creditCard.test(String(value));

    case "is_pii":
      return isPII(String(value));

    default:
      return false;
  }
}

/**
 * Check if value contains PII
 */
export function isPII(value: string): boolean {
  return Object.values(PII_PATTERNS).some((pattern) => pattern.test(value));
}

/**
 * Detect PII type
 */
export function detectPIIType(value: string): string | null {
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(value)) {
      return type;
    }
  }
  return null;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
}

/**
 * Mask sensitive data
 */
export function maskValue(value: string, maskChar = "*", visibleStart = 2, visibleEnd = 2): string {
  if (value.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(value.length);
  }
  const start = value.slice(0, visibleStart);
  const end = value.slice(-visibleEnd);
  const middle = maskChar.repeat(value.length - visibleStart - visibleEnd);
  return `${start}${middle}${end}`;
}

/**
 * Redact sensitive data (complete removal)
 */
export function redactValue(): string {
  return "[REDACTED]";
}

/**
 * Apply a governance rule to data
 */
export function applyRule(
  data: Record<string, unknown>,
  rule: GovernanceRule
): { modified: boolean; data: Record<string, unknown>; flags: string[] } {
  // Check if all conditions match
  const allConditionsMatch = rule.conditions.every((condition) =>
    evaluateCondition(data, condition)
  );

  if (!allConditionsMatch) {
    return { modified: false, data, flags: [] };
  }

  const result = { ...data };
  const flags: string[] = [];
  let modified = false;

  switch (rule.action) {
    case "flag":
      flags.push(rule.name);
      break;

    case "reject":
      throw new GovernanceError(rule.name, "Data rejected by governance rule");

    case "redact":
      for (const condition of rule.conditions) {
        setNestedValue(result, condition.field, redactValue());
        modified = true;
      }
      break;

    case "mask":
      for (const condition of rule.conditions) {
        const value = getNestedValue(data, condition.field);
        if (value) {
          setNestedValue(result, condition.field, maskValue(String(value)));
          modified = true;
        }
      }
      break;

    case "transform":
      if (rule.actionConfig?.transformer) {
        const transformer = rule.actionConfig.transformer as (v: unknown) => unknown;
        for (const condition of rule.conditions) {
          const value = getNestedValue(data, condition.field);
          if (value !== undefined) {
            setNestedValue(result, condition.field, transformer(value));
            modified = true;
          }
        }
      }
      break;

    case "encrypt":
      // Encryption would be implemented with actual crypto
      for (const condition of rule.conditions) {
        const value = getNestedValue(data, condition.field);
        if (value) {
          setNestedValue(result, condition.field, `[ENCRYPTED:${rule.id}]`);
          modified = true;
        }
      }
      break;

    case "allow":
    default:
      break;
  }

  return { modified, data: result, flags };
}

export class GovernanceError extends Error {
  constructor(
    public readonly ruleName: string,
    message: string
  ) {
    super(message);
    this.name = "GovernanceError";
  }
}

/**
 * Governance Engine class
 */
export class GovernanceEngine {
  private rules: GovernanceRule[] = [];

  constructor(rules: GovernanceRule[] = []) {
    this.rules = rules.sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  addRule(rule: GovernanceRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  getRules(tenantId?: string): GovernanceRule[] {
    return this.rules.filter((r) => r.enabled && (r.tenantId === null || r.tenantId === tenantId));
  }

  /**
   * Process data through all governance rules
   */
  process(data: Record<string, unknown>, tenantId?: string): GovernanceResult {
    const result: GovernanceResult = {
      allowed: true,
      modified: false,
      data: { ...data },
      appliedRules: [],
      flags: [],
      redactedFields: [],
      errors: [],
    };

    const applicableRules = this.getRules(tenantId);

    for (const rule of applicableRules) {
      try {
        const ruleResult = applyRule(result.data, rule);

        if (ruleResult.modified) {
          result.modified = true;
          result.data = ruleResult.data;
          result.appliedRules.push(rule.name);
        }

        if (ruleResult.flags.length > 0) {
          result.flags.push(...ruleResult.flags);
          result.appliedRules.push(rule.name);
        }
      } catch (error) {
        if (error instanceof GovernanceError) {
          result.allowed = false;
          result.errors.push(`${error.ruleName}: ${error.message}`);
          break;
        }
        throw error;
      }
    }

    return result;
  }

  /**
   * Scan data for PII
   */
  scanForPII(data: Record<string, unknown>): Array<{ field: string; type: string }> {
    const findings: Array<{ field: string; type: string }> = [];

    function scan(obj: Record<string, unknown>, prefix = ""): void {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "string") {
          const piiType = detectPIIType(value);
          if (piiType) {
            findings.push({ field: fieldPath, type: piiType });
          }
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          scan(value as Record<string, unknown>, fieldPath);
        }
      }
    }

    scan(data);
    return findings;
  }
}

/**
 * Default governance rules
 */
export const defaultRules: GovernanceRule[] = [
  {
    id: "pii-ssn-redact",
    name: "Redact SSN",
    description: "Automatically redact Social Security Numbers",
    priority: 100,
    enabled: true,
    conditions: [{ field: "*", operator: "is_ssn", value: null }],
    action: "redact",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "pii-credit-card-mask",
    name: "Mask Credit Cards",
    description: "Mask credit card numbers showing only last 4 digits",
    priority: 99,
    enabled: true,
    conditions: [{ field: "*", operator: "is_credit_card", value: null }],
    action: "mask",
    actionConfig: { visibleEnd: 4 },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "flag-pii",
    name: "Flag PII",
    description: "Flag records containing any PII for review",
    priority: 50,
    enabled: true,
    conditions: [{ field: "*", operator: "is_pii", value: null }],
    action: "flag",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * SQL migration for governance tables
 */
export const GOVERNANCE_MIGRATIONS = `
-- Governance Rules Table
CREATE TABLE IF NOT EXISTS governance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '[]',
  action TEXT NOT NULL CHECK (action IN ('allow', 'redact', 'mask', 'flag', 'reject', 'transform', 'encrypt')),
  action_config JSONB,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance Audit Log
CREATE TABLE IF NOT EXISTS governance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES governance_rules(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  original_data JSONB,
  processed_data JSONB,
  flags TEXT[],
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_rules_tenant ON governance_rules(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_governance_audit_entity ON governance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_tenant ON governance_audit_log(tenant_id, created_at);
`;

/**
 * Create a governance engine with default rules
 */
export function createGovernanceEngine(additionalRules: GovernanceRule[] = []): GovernanceEngine {
  return new GovernanceEngine([...defaultRules, ...additionalRules]);
}
