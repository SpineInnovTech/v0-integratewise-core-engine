/**
 * Flow C Configuration System
 * Configuration-driven rules for AI content approval and routing
 *
 * D1 Schema:
 * CREATE TABLE flow_c_config (
 *   id INTEGER PRIMARY KEY,
 *   tenant_id TEXT NOT NULL,
 *   config JSON NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

import { z } from "zod";

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Flow C Rule Action Types
 */
export const FlowCActionSchema = z.enum(["auto_approve", "triage", "discard"]);
export type FlowCAction = z.infer<typeof FlowCActionSchema>;

/**
 * Flow C Configuration Rule
 */
export const FlowCRuleSchema = z.object({
  /** Rule name for identification */
  name: z.string().min(1).max(100),

  /** Source provider (claude, openai, mcp, moonshot, or * for any) */
  source: z.string().min(1),

  /** Minimum confidence threshold (0.0 to 1.0) */
  min_confidence: z.number().min(0).max(1).optional(),

  /** Maximum confidence threshold (0.0 to 1.0) */
  max_confidence: z.number().min(0).max(1).optional(),

  /** Maximum content length in characters */
  max_content_length: z.number().int().positive().optional(),

  /** Minimum content length in characters */
  min_content_length: z.number().int().positive().optional(),

  /** Required keywords in content (all must match) */
  required_keywords: z.array(z.string()).optional(),

  /** Excluded keywords in content (any match blocks) */
  excluded_keywords: z.array(z.string()).optional(),

  /** Allowed entity types for entity linking */
  allowed_entity_types: z.array(z.string()).optional(),

  /** Action to take when rule matches */
  action: FlowCActionSchema,

  /** Rule priority (higher = evaluated first) */
  priority: z.number().int().default(0),

  /** Whether rule is active */
  active: z.boolean().default(true),
});
export type FlowCRule = z.infer<typeof FlowCRuleSchema>;

/**
 * Flow C Notifications Configuration
 */
export const FlowCNotificationsSchema = z.object({
  /** Confidence threshold for urgent notifications */
  urgent_threshold: z.number().min(0).max(1).default(0.95),

  /** Slack webhook URL for notifications */
  slack_webhook: z.string().url().optional(),

  /** Email for notifications */
  email: z.string().email().optional(),

  /** Send notifications for auto-approved items */
  notify_on_auto_approve: z.boolean().default(false),

  /** Send notifications for discarded items */
  notify_on_discard: z.boolean().default(true),
});
export type FlowCNotifications = z.infer<typeof FlowCNotificationsSchema>;

/**
 * Flow C Main Configuration
 */
export const FlowCConfigSchema = z.object({
  /** Auto-approve sources without rules checking */
  auto_approve_sources: z.array(z.enum(["mcp", "openai", "claude", "moonshot"])).default([]),

  /** Minimum confidence for auto-approval (global) */
  min_confidence: z.number().min(0).max(1).default(0.85),

  /** Maximum daily auto-approvals (rate limit) */
  max_daily_auto_approve: z.number().int().positive().default(1000),

  /** Processing rules (evaluated in priority order) */
  rules: z.array(FlowCRuleSchema).default([]),

  /** Notification settings */
  notifications: FlowCNotificationsSchema.default({}),

  /** Allowed entity types for entity linking */
  allowed_entity_types: z.array(z.string()).default(["account", "contact", "opportunity"]),

  /** Auto-embedding enabled */
  auto_embedding_enabled: z.boolean().default(true),

  /** Days to keep in D1 buffer before archive */
  d1_retention_days: z.number().int().positive().default(7),
});
export type FlowCConfig = z.infer<typeof FlowCConfigSchema>;

/**
 * Flow C Configuration with metadata
 */
export const FlowCConfigWithMetadataSchema = z.object({
  id: z.number().int().positive(),
  tenant_id: z.string().uuid(),
  config: FlowCConfigSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type FlowCConfigRow = z.infer<typeof FlowCConfigWithMetadataSchema>;

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default Flow C configuration (conservative - all to HITL)
 */
export const DEFAULT_FLOW_C_CONFIG: FlowCConfig = {
  auto_approve_sources: [],
  min_confidence: 1.0,
  max_daily_auto_approve: 1000,
  rules: [
    {
      name: "Default to Triage",
      source: "*",
      action: "triage",
      priority: 0,
      active: true,
    },
  ],
  notifications: {
    urgent_threshold: 0.95,
    notify_on_auto_approve: false,
    notify_on_discard: true,
  },
  allowed_entity_types: ["account", "contact", "opportunity"],
  auto_embedding_enabled: true,
  d1_retention_days: 7,
};

/**
 * Aggressive Flow C configuration (auto-approve high confidence)
 */
export const AGGRESSIVE_FLOW_C_CONFIG: FlowCConfig = {
  auto_approve_sources: ["claude", "openai"],
  min_confidence: 0.85,
  max_daily_auto_approve: 500,
  rules: [
    {
      name: "High Confidence Auto-Approve",
      source: "*",
      min_confidence: 0.9,
      action: "auto_approve",
      priority: 100,
      active: true,
    },
    {
      name: "Medium Confidence Triage",
      source: "*",
      min_confidence: 0.7,
      max_confidence: 0.9,
      action: "triage",
      priority: 50,
      active: true,
    },
    {
      name: "Low Confidence Discard",
      source: "*",
      max_confidence: 0.7,
      action: "discard",
      priority: 10,
      active: true,
    },
  ],
  notifications: {
    urgent_threshold: 0.95,
    notify_on_auto_approve: false,
    notify_on_discard: false,
  },
  allowed_entity_types: ["account", "contact", "opportunity", "project"],
  auto_embedding_enabled: true,
  d1_retention_days: 7,
};

// ============================================================================
// CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Get Flow C configuration for a tenant
 */
export async function getFlowCConfig(db: D1Database, tenantId: string): Promise<FlowCConfig> {
  const query = `
    SELECT config FROM flow_c_config
    WHERE tenant_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  try {
    const result = await db.prepare(query).bind(tenantId).first();

    if (!result || !result.config) {
      // Return default config if not found
      return DEFAULT_FLOW_C_CONFIG;
    }

    // Validate and parse config
    const parsed = FlowCConfigSchema.safeParse(JSON.parse(result.config as string));

    if (!parsed.success) {
      console.warn(`Invalid Flow C config for tenant ${tenantId}, using default`);
      return DEFAULT_FLOW_C_CONFIG;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Error fetching Flow C config for tenant ${tenantId}:`, error);
    return DEFAULT_FLOW_C_CONFIG;
  }
}

/**
 * Set Flow C configuration for a tenant
 */
export async function setFlowCConfig(
  db: D1Database,
  tenantId: string,
  config: FlowCConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate config
    const validation = FlowCConfigSchema.safeParse(config);

    if (!validation.success) {
      return {
        success: false,
        error: `Invalid config: ${JSON.stringify(validation.error.flatten())}`,
      };
    }

    const now = new Date().toISOString();
    const configJson = JSON.stringify(validation.data);

    // Insert or replace configuration
    const query = `
      INSERT INTO flow_c_config (tenant_id, config, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        config = excluded.config,
        updated_at = excluded.updated_at
    `;

    await db.prepare(query).bind(tenantId, configJson, now, now).run();

    return { success: true };
  } catch (error) {
    console.error(`Error setting Flow C config for tenant ${tenantId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Evaluate triage result against configuration
 */
export async function evaluateFlowCConfig(
  config: FlowCConfig,
  triageResult: {
    platform: string;
    content: string;
    confidence: number;
    category?: string;
    keywords?: string[];
  }
): Promise<{
  action: FlowCAction;
  matchedRule?: FlowCRule;
  reason: string;
}> {
  const { platform, content, confidence, keywords = [] } = triageResult;

  // 1. Check auto-approve sources
  if (config.auto_approve_sources.includes(platform as any)) {
    if (confidence >= config.min_confidence) {
      return {
        action: "auto_approve",
        reason: `Auto-approve source '${platform}' with confidence ${confidence}`,
      };
    }
  }

  // 2. Evaluate rules in priority order (highest first)
  const sortedRules = [...config.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    if (!rule.active) continue;

    // Check source match
    if (rule.source !== "*" && rule.source !== platform) continue;

    // Check confidence thresholds
    if (rule.min_confidence !== undefined && confidence < rule.min_confidence) continue;
    if (rule.max_confidence !== undefined && confidence > rule.max_confidence) continue;

    // Check content length
    const contentLength = content.length;
    if (rule.min_content_length !== undefined && contentLength < rule.min_content_length) continue;
    if (rule.max_content_length !== undefined && contentLength > rule.max_content_length) continue;

    // Check required keywords
    if (rule.required_keywords && rule.required_keywords.length > 0) {
      const hasAllKeywords = rule.required_keywords.every(
        (kw) => content.includes(kw) || keywords.includes(kw)
      );
      if (!hasAllKeywords) continue;
    }

    // Check excluded keywords
    if (rule.excluded_keywords && rule.excluded_keywords.length > 0) {
      const hasExcludedKeyword = rule.excluded_keywords.some(
        (kw) => content.includes(kw) || keywords.includes(kw)
      );
      if (hasExcludedKeyword) continue;
    }

    // Rule matched!
    return {
      action: rule.action,
      matchedRule: rule,
      reason: `Matched rule '${rule.name}'`,
    };
  }

  // 3. Default action - send to triage
  return {
    action: "triage",
    reason: "No matching rules, defaulting to triage",
  };
}

/**
 * Check if auto-approval limit has been reached
 */
export async function checkAutoApproveLimit(
  db: D1Database,
  tenantId: string,
  config: FlowCConfig
): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const query = `
      SELECT COUNT(*) as count
      FROM triage_results
      WHERE tenant_id = ?
        AND DATE(created_at) = ?
        AND approval_status = 'approved'
        AND auto_approved = true
    `;

    const result = await db.prepare(query).bind(tenantId, today).first();
    const currentCount = Number(result?.count || 0);

    return {
      allowed: currentCount < config.max_daily_auto_approve,
      currentCount,
      limit: config.max_daily_auto_approve,
    };
  } catch (error) {
    console.error(`Error checking auto-approve limit for tenant ${tenantId}:`, error);
    return {
      allowed: false,
      currentCount: 0,
      limit: config.max_daily_auto_approve,
    };
  }
}

/**
 * Get configuration with applied defaults
 */
export function applyConfigDefaults(partialConfig: Partial<FlowCConfig>): FlowCConfig {
  return FlowCConfigSchema.parse({
    ...DEFAULT_FLOW_C_CONFIG,
    ...partialConfig,
    notifications: {
      ...DEFAULT_FLOW_C_CONFIG.notifications,
      ...(partialConfig.notifications || {}),
    },
  });
}

// ============================================================================
// CONFIGURATION MIGRATIONS
// ============================================================================

/**
 * Initialize Flow C configuration table
 */
export async function initializeFlowCConfig(db: D1Database): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS flow_c_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `;

  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_flow_c_config_tenant
    ON flow_c_config(tenant_id)
  `;

  // Create trigger for updated_at
  const createTriggerQuery = `
    CREATE TRIGGER IF NOT EXISTS update_flow_c_config_updated_at
    AFTER UPDATE ON flow_c_config
    FOR EACH ROW
    BEGIN
      UPDATE flow_c_config SET updated_at = datetime('now')
      WHERE id = OLD.id;
    END
  `;

  try {
    await db.prepare(createTableQuery).run();
    await db.prepare(createIndexQuery).run();
    await db.prepare(createTriggerQuery).run();
    console.log("Flow C config table initialized");
  } catch (error) {
    console.error("Error initializing Flow C config table:", error);
    throw error;
  }
}

/**
 * Seed default configuration for a tenant
 */
export async function seedDefaultConfig(
  db: D1Database,
  tenantId: string
): Promise<{ success: boolean; config: FlowCConfig }> {
  try {
    await setFlowCConfig(db, tenantId, DEFAULT_FLOW_C_CONFIG);
    return { success: true, config: DEFAULT_FLOW_C_CONFIG };
  } catch (error) {
    console.error(`Error seeding default config for tenant ${tenantId}:`, error);
    return { success: false, config: DEFAULT_FLOW_C_CONFIG };
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Initialize and configure Flow C for a tenant
 */
export async function exampleUsage(db: D1Database, tenantId: string) {
  // 1. Initialize table (run once)
  await initializeFlowCConfig(db);

  // 2. Seed default config
  await seedDefaultConfig(db, tenantId);

  // 3. Get current config
  const config = await getFlowCConfig(db, tenantId);
  console.log("Current config:", config);

  // 4. Update to aggressive config
  await setFlowCConfig(db, tenantId, AGGRESSIVE_FLOW_C_CONFIG);

  // 5. Evaluate a triage result
  const triageResult = {
    platform: "claude",
    content: "This is a high confidence insight about customer Acme Corp.",
    confidence: 0.92,
    keywords: ["customer", "insight"],
  };

  const evaluation = await evaluateFlowCConfig(await getFlowCConfig(db, tenantId), triageResult);

  console.log("Evaluation:", evaluation);
  // Output: { action: "auto_approve", reason: "Auto-approve source 'claude' with confidence 0.92" }
}
