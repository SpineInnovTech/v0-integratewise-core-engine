import { neon } from "@neondatabase/serverless";
import { getTenantCanonicalEntityTypes } from "@integratewise/types";

export type ErrorClassification = "RETRY" | "MANUAL_REVIEW" | "PERMANENT_FAILURE";

export interface ConnectorError {
  tool_name: string;
  operation: string;
  tenant_id: string;
  error: any;
  payload?: any;
}

/**
 * Compute SHA-256 hash of payload for dedup/audit (hex string).
 */
export async function payloadHash(payload: unknown): Promise<string | null> {
  if (payload == null) return null;
  try {
    const str = typeof payload === "string" ? payload : JSON.stringify(payload);
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/**
 * Classifies an error and logs it to the connector_failures table.
 */
export async function handleConnectorError(
  dbUrl: string,
  errData: ConnectorError
): Promise<ErrorClassification> {
  const sql = neon(dbUrl);
  const { tool_name, operation, tenant_id, error, payload } = errData;

  let classification: ErrorClassification = "MANUAL_REVIEW";
  const msg = error.message || "Unknown error";
  const status = error.status || error.statusCode || 500;

  // Transient errors
  if ([429, 500, 502, 503, 504].includes(status)) {
    classification = "RETRY";
  } else if ([400, 401, 403, 404].includes(status)) {
    classification = "PERMANENT_FAILURE";
  }

  const payloadHashValue = payload ? await payloadHash(payload) : null;

  try {
    await sql`
            INSERT INTO connector_failures (
                tenant_id, tool_name, operation, error_code, error_message, error_details, payload_hash, status
            ) VALUES (
                ${tenant_id}::uuid, 
                ${tool_name}, 
                ${operation}, 
                ${status.toString()}, 
                ${msg}, 
                ${JSON.stringify(error)},
                ${payloadHashValue},
                ${classification === "RETRY" ? "retrying" : "needs_review"}
            )
        `;
  } catch (logErr) {
    console.error("Failed to log connector failure:", logErr);
  }

  return classification;
}

/**
 * Simple exponential backoff retry helper.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts: number; initialDelay: number } = { maxAttempts: 3, initialDelay: 1000 }
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt === options.maxAttempts) break;
      const delay = options.initialDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Lightweight per-tenant rate limiter (Sliding Window)
 * Note: In a distributed environment like CF Workers, this is per-isolate.
 */
const rateMap = new Map<string, number[]>();

export function checkRateLimit(
  tenant_id: string,
  tool_name: string,
  limitPerMin: number
): { allowed: boolean; current: number } {
  const key = `${tenant_id}:${tool_name}`;
  const now = Date.now();
  const windowMs = 60000;

  let timestamps = rateMap.get(key) || [];
  timestamps = timestamps.filter((t) => t > now - windowMs);

  if (timestamps.length >= limitPerMin) {
    return { allowed: false, current: timestamps.length };
  }

  timestamps.push(now);
  rateMap.set(key, timestamps);

  return { allowed: true, current: timestamps.length };
}

/**
 * Records a connector metric to a persistent store.
 */
export async function recordMetric(
  dbUrl: string,
  data: {
    tenant_id: string;
    tool_name: string;
    metric_name: string;
    value: number;
    tags?: Record<string, string>;
  }
) {
  const sql = neon(dbUrl);
  try {
    await sql`
            INSERT INTO events (tenant_id, event_type, source_system, payload)
            VALUES (
                ${data.tenant_id}::uuid,
                ${"metric." + data.metric_name},
                ${"connector:" + data.tool_name},
                ${JSON.stringify({ value: data.value, ...data.tags })}
            )
        `;
  } catch (err) {
    console.error("Failed to record metric:", err);
  }
}

/**
 * Wrapper for LLM calls with usage tracking and cost enforcement.
 * @param dailyLimitUsd - Optional daily cost limit per tenant (default 100). Pass from env or tenant plan.
 */
export async function callLLM(
  dbUrl: string,
  openaiApiKey: string,
  params: {
    tenant_id: string;
    model: string;
    messages: any[];
    tool_context?: string;
    dailyLimitUsd?: number;
  }
) {
  const sql = neon(dbUrl);
  const dailyLimitUsd = params.dailyLimitUsd ?? 100;

  // 1. Check if tenant has exceeded daily cost limit
  const [row] = await sql`
        SELECT COALESCE(SUM(estimated_cost_usd), 0)::float AS total
        FROM ai_usage
        WHERE tenant_id = ${params.tenant_id}::uuid
          AND created_at > NOW() - INTERVAL '1 day'
    `;
  const dailyTotal = Number(row?.total ?? 0);
  if (dailyTotal >= dailyLimitUsd) {
    throw new Error(
      `AI usage limit exceeded: ${dailyTotal.toFixed(2)} USD in the last 24h (limit ${dailyLimitUsd} USD)`
    );
  }

  // 2. Perform call
  const startTime = Date.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
    }),
  });

  const data: any = await response.json();
  const duration = Date.now() - startTime;

  if (response.ok) {
    const { usage } = data;
    // 3. Log usage
    await sql`
            INSERT INTO ai_usage (
                tenant_id, model_name, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, tool_context
            ) VALUES (
                ${params.tenant_id}::uuid,
                ${params.model},
                ${usage.prompt_tokens},
                ${usage.completion_tokens},
                ${usage.total_tokens},
                ${(usage.total_tokens / 1000) * 0.01}, -- Very rough cost estimate
                ${params.tool_context || "unknown"}
            )
        `;

    // 4. Record latency metric
    await recordMetric(dbUrl, {
      tenant_id: params.tenant_id,
      tool_name: "openai",
      metric_name: "llm_latency",
      value: duration,
      tags: { model: params.model },
    });
  }

  return data;
}

/**
 * Enforces tenant limits and tracks daily usage.
 */
export async function enforceTenantLimits(
  dbUrl: string,
  tenant_id: string,
  metric_name: "docs_ingested" | "chunks_embedded" | "api_calls",
  increment: number = 1
): Promise<{ allowed: boolean; reason?: string }> {
  const sql = neon(dbUrl);

  // 1. Fetch Limits and Usage in parallel (or single query)
  const [limits] = await sql`SELECT * FROM tenant_limits WHERE tenant_id = ${tenant_id}::uuid`;
  const [usage] = await sql`
        SELECT * FROM tenant_usage_daily 
        WHERE tenant_id = ${tenant_id}::uuid AND usage_date = CURRENT_DATE
    `;

  if (!limits) return { allowed: true }; // Default allowed if no limit set

  const currentUsage = (usage?.[metric_name] || 0) + increment;
  let limitValue = 100; // default

  if (metric_name === "docs_ingested") limitValue = limits.max_docs_per_day;
  if (metric_name === "chunks_embedded") limitValue = limits.max_embeddings_per_day;

  if (currentUsage >= limitValue * 0.8 && currentUsage < limitValue) {
    // Trigger alert only once per day (idempotent at insert level usually, or here)
    await triggerSystemAlert(dbUrl, {
      tenant_id,
      service_name: "quota-enforcer",
      alert_type: "limit_near_threshold",
      severity: "warning",
      message: `Tenant has reached 80% of ${metric_name} limit (${currentUsage}/${limitValue})`,
    });
  }

  if (currentUsage > limitValue) {
    return {
      allowed: false,
      reason: `Limit exceeded for ${metric_name}. Max allowed: ${limitValue}, Current: ${currentUsage}`,
    };
  }

  // 2. Update Usage
  await sql`
        INSERT INTO tenant_usage_daily (tenant_id, ${sql(metric_name)})
        VALUES (${tenant_id}::uuid, ${increment})
        ON CONFLICT (tenant_id, usage_date) 
        DO UPDATE SET ${sql(metric_name)} = tenant_usage_daily.${sql(metric_name)} + ${increment}
    `;

  return { allowed: true };
}

/**
 * Resolve tenant_id → allowed entity types from tenant_spine_config (Adaptive Spine).
 * Used for context ingestion tenant scoping: only link/store context for entities allowed for the tenant.
 * Returns null when no config or missing Supabase (allow-all behaviour).
 *
 * IMPORTANT: Entity type lists derive from DOMAIN_SPINE_CONFIG in packages/types/src/schema.ts
 * — the SINGLE SOURCE OF TRUTH. Do NOT maintain a separate entity type list here.
 * See HARDENING_AND_WIRING.md §7: Context ingestion tenant scoping.
 */
export async function getTenantAllowedEntityTypes(
  supabaseUrl: string,
  serviceRoleKey: string,
  tenantId: string
): Promise<Set<string> | null> {
  if (!tenantId || !supabaseUrl || !serviceRoleKey) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenant_spine_config?tenant_id=eq.${encodeURIComponent(tenantId)}&select=domains,industry`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { domains: string[]; industry?: string | null }[];
    const row = rows?.[0];
    const domains = row?.domains;
    if (!Array.isArray(domains) || domains.length === 0) return null;
    // Derive from canonical DOMAIN_SPINE_CONFIG — single source of truth
    const allowed = getTenantCanonicalEntityTypes(domains, row?.industry ?? null);
    return allowed.size > 0 ? allowed : null;
  } catch {
    return null;
  }
}

/**
 * Trigger a system-level alert.
 */
export async function triggerSystemAlert(
  dbUrl: string,
  data: {
    tenant_id: string;
    service_name: string;
    alert_type: string;
    severity: "warning" | "critical";
    message: string;
  }
) {
  const sql = neon(dbUrl);
  try {
    await sql`
            INSERT INTO system_alerts (tenant_id, service_name, alert_type, severity, message)
            VALUES (${data.tenant_id}::uuid, ${data.service_name}, ${data.alert_type}, ${data.severity}, ${data.message})
        `;
  } catch (err) {
    console.error("Failed to trigger system alert:", err);
  }
}
