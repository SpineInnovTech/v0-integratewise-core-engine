/**
 * Governance Rules Engine
 * Applies data quality and compliance rules during extraction
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface EntityData {
  type: "account" | "contact" | "deal" | "task" | "event" | "note"
  data: Record<string, any>
}

export interface GovernanceResult {
  passed: boolean
  action: "allow" | "redact" | "mask" | "flag" | "reject" | "transform" | "notify"
  transformedData?: Record<string, any>
  flags: Array<{ rule: string; message: string; severity: "low" | "medium" | "high" }>
  redactedFields: string[]
}

/**
 * Apply governance rules to entity
 */
export async function applyGovernance(
  supabase: SupabaseClient,
  workspaceId: string,
  entity: EntityData
): Promise<GovernanceResult> {
  // Load applicable rules
  const { data: rules, error } = await supabase
    .from("governance_rules")
    .select("*")
    .eq("enabled", true)
    .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
    .order("priority", { ascending: true })

  if (error) {
    console.error("Failed to load governance rules:", error)
    return {
      passed: true,
      action: "allow",
      flags: [],
      redactedFields: [],
    }
  }

  let result: GovernanceResult = {
    passed: true,
    action: "allow",
    flags: [],
    redactedFields: [],
    transformedData: { ...entity.data },
  }

  // Apply rules in priority order
  for (const rule of rules || []) {
    const entityTypes = (rule.entity_types as string[]) || []
    if (entityTypes.length > 0 && !entityTypes.includes(entity.type)) {
      continue // Rule doesn't apply to this entity type
    }

    const ruleResult = await executeRule(rule, entity, result.transformedData || entity.data)

    if (ruleResult.matched) {
      // Update result based on rule action
      if (rule.action === "reject") {
        result.passed = false
        result.action = "reject"
        result.flags.push({
          rule: rule.rule_name,
          message: ruleResult.message || `Rejected by rule: ${rule.rule_name}`,
          severity: "high",
        })
        break // Stop processing if rejected
      } else if (rule.action === "redact") {
        result.redactedFields.push(...ruleResult.affectedFields)
        result.transformedData = applyRedaction(
          result.transformedData || entity.data,
          ruleResult.affectedFields
        )
        result.flags.push({
          rule: rule.rule_name,
          message: ruleResult.message || `Redacted by rule: ${rule.rule_name}`,
          severity: "high",
        })
      } else if (rule.action === "mask") {
        result.transformedData = applyMasking(
          result.transformedData || entity.data,
          ruleResult.affectedFields
        )
        result.flags.push({
          rule: rule.rule_name,
          message: ruleResult.message || `Masked by rule: ${rule.rule_name}`,
          severity: "medium",
        })
      } else if (rule.action === "flag") {
        result.flags.push({
          rule: rule.rule_name,
          message: ruleResult.message || `Flagged by rule: ${rule.rule_name}`,
          severity: "medium",
        })
      } else if (rule.action === "transform") {
        result.transformedData = ruleResult.transformedData || result.transformedData
        result.flags.push({
          rule: rule.rule_name,
          message: ruleResult.message || `Transformed by rule: ${rule.rule_name}`,
          severity: "low",
        })
      }
    }
  }

  return result
}

/**
 * Execute a single governance rule
 */
async function executeRule(
  rule: any,
  entity: EntityData,
  currentData: Record<string, any>
): Promise<{
  matched: boolean
  message?: string
  affectedFields: string[]
  transformedData?: Record<string, any>
}> {
  const ruleType = rule.rule_type
  const config = rule.rule_config

  switch (ruleType) {
    case "pii_detection":
      return executePIIDetection(config, currentData)

    case "data_quality":
      return executeDataQuality(config, currentData)

    case "field_validation":
      return executeFieldValidation(config, entity.type, currentData)

    case "entity_validation":
      return executeEntityValidation(config, entity.type, currentData)

    case "keyword_filter":
      return executeKeywordFilter(config, currentData)

    case "pattern_match":
      return executePatternMatch(config, currentData)

    default:
      return { matched: false, affectedFields: [] }
  }
}

/**
 * Execute PII detection
 */
function executePIIDetection(
  config: any,
  data: Record<string, any>
): { matched: boolean; message?: string; affectedFields: string[] } {
  const patterns = config.patterns || []
  const affectedFields: string[] = []

  for (const [field, value] of Object.entries(data)) {
    if (typeof value !== "string") continue

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex, "gi")
      if (regex.test(value)) {
        affectedFields.push(field)
        break
      }
    }
  }

  return {
    matched: affectedFields.length > 0,
    message: affectedFields.length > 0 ? `PII detected in fields: ${affectedFields.join(", ")}` : undefined,
    affectedFields,
  }
}

/**
 * Execute data quality check
 */
function executeDataQuality(
  config: any,
  data: Record<string, any>
): { matched: boolean; message?: string; affectedFields: string[] } {
  const field = config.field
  const checks = config.checks || []
  const value = data[field]

  if (value === undefined || value === null) {
    if (checks.some((c: any) => c.type === "required")) {
      return {
        matched: true,
        message: `Required field '${field}' is missing`,
        affectedFields: [field],
      }
    }
    return { matched: false, affectedFields: [] }
  }

  for (const check of checks) {
    if (check.type === "format" && check.regex) {
      const regex = new RegExp(check.regex)
      if (!regex.test(String(value))) {
        return {
          matched: true,
          message: `Field '${field}' does not match required format`,
          affectedFields: [field],
        }
      }
    }
  }

  return { matched: false, affectedFields: [] }
}

/**
 * Execute field validation
 */
function executeFieldValidation(
  config: any,
  entityType: string,
  data: Record<string, any>
): { matched: boolean; message?: string; affectedFields: string[] } {
  if (config.entity !== entityType) {
    return { matched: false, affectedFields: [] }
  }

  const field = config.field
  const validation = config.validation || {}
  const value = data[field]

  if (validation.type === "required" && (value === undefined || value === null || value === "")) {
    return {
      matched: true,
      message: `Required field '${field}' is missing`,
      affectedFields: [field],
    }
  }

  if (validation.min_length && String(value).length < validation.min_length) {
    return {
      matched: true,
      message: `Field '${field}' is too short (min: ${validation.min_length})`,
      affectedFields: [field],
    }
  }

  if (validation.max_length && String(value).length > validation.max_length) {
    return {
      matched: true,
      message: `Field '${field}' is too long (max: ${validation.max_length})`,
      affectedFields: [field],
    }
  }

  return { matched: false, affectedFields: [] }
}

/**
 * Execute entity validation
 */
function executeEntityValidation(
  config: any,
  entityType: string,
  data: Record<string, any>
): { matched: boolean; message?: string; affectedFields: string[] } {
  // Entity-level validation logic
  // For example: "contact must have email OR phone"
  if (entityType === "contact") {
    const hasEmail = data.email && data.email.trim() !== ""
    const hasPhone = data.phone && data.phone.trim() !== ""

    if (!hasEmail && !hasPhone) {
      return {
        matched: true,
        message: "Contact must have at least email or phone",
        affectedFields: ["email", "phone"],
      }
    }
  }

  return { matched: false, affectedFields: [] }
}

/**
 * Execute keyword filter
 */
function executeKeywordFilter(
  config: any,
  data: Record<string, any>
): { matched: boolean; message?: string; affectedFields: string[] } {
  const keywords = config.keywords || []
  const affectedFields: string[] = []

  for (const [field, value] of Object.entries(data)) {
    if (typeof value !== "string") continue

    const lowerValue = value.toLowerCase()
    for (const keyword of keywords) {
      if (lowerValue.includes(keyword.toLowerCase())) {
        affectedFields.push(field)
        break
      }
    }
  }

  return {
    matched: affectedFields.length > 0,
    message: affectedFields.length > 0 ? `Sensitive keywords found in: ${affectedFields.join(", ")}` : undefined,
    affectedFields,
  }
}

/**
 * Execute pattern match
 */
function executePatternMatch(
  config: any,
  data: Record<string, any>
): { matched: boolean; message?: string; affectedFields: string[] } {
  const pattern = config.pattern
  const affectedFields: string[] = []

  if (!pattern) return { matched: false, affectedFields: [] }

  const regex = new RegExp(pattern, "gi")

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "string" && regex.test(value)) {
      affectedFields.push(field)
    }
  }

  return {
    matched: affectedFields.length > 0,
    message: affectedFields.length > 0 ? `Pattern matched in: ${affectedFields.join(", ")}` : undefined,
    affectedFields,
  }
}

/**
 * Apply redaction to data
 */
function applyRedaction(data: Record<string, any>, fields: string[]): Record<string, any> {
  const result = { ...data }
  for (const field of fields) {
    if (result[field]) {
      result[field] = "[REDACTED]"
    }
  }
  return result
}

/**
 * Apply masking to data
 */
function applyMasking(data: Record<string, any>, fields: string[]): Record<string, any> {
  const result = { ...data }
  for (const field of fields) {
    const value = String(result[field] || "")
    if (value.includes("@")) {
      // Email masking: john@example.com -> j***@***.com
      const [local, domain] = value.split("@")
      const maskedLocal = local.charAt(0) + "***"
      const [domainName, tld] = domain.split(".")
      const maskedDomain = "***." + tld
      result[field] = `${maskedLocal}@${maskedDomain}`
    } else if (value.length > 4) {
      // Phone masking: +1234567890 -> +1***7890
      result[field] = value.slice(0, 2) + "***" + value.slice(-4)
    } else {
      result[field] = "***"
    }
  }
  return result
}
