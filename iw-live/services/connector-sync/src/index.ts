/**
 * Universal Connector Sync Service
 *
 * Scheduled + on-demand sync for ALL connector providers.
 * SCHEMA-DRIVEN: Entity types are resolved from tenant_spine_config.
 * The schema is the SSOT — if it doesn't define the entity type, we don't sync it.
 *
 * Data Flow: Schema Config → Provider API → Pipeline Queue → 8-stage pipeline → Spine
 *
 * Routes:
 *   GET  /health                     — Health check
 *   POST /api/sync/:tenantId         — Trigger sync for a tenant/provider
 *   GET  /api/status/:tenantId       — Connector sync status
 *   GET  /api/status/:tenantId/:provider — Provider-specific status
 *   Cron: every 6 hours              — Sync all active connectors
 *   Queue: connector-sync            — Process sync jobs
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { SyncQueueMessage } from "@integratewise/types";

// ───────────────────────────────────────────────────────────────────────
// Sync Checkpoints — Durable cursor tracking in Cloudflare D1
// ───────────────────────────────────────────────────────────────────────

/**
 * Write a new sync checkpoint to the sync_checkpoints table (D1).
 * Non-blocking — failures are logged but don't interrupt the sync.
 * Returns the checkpoint ID for later updates.
 */
async function writeSyncCheckpoint(
  env: Bindings,
  params: {
    tenantId: string;
    provider: string;
    entityType: string;
    phase: string;
    jobId: string;
    cursor?: string;
  }
): Promise<string | null> {
  if (!env.DB) return null;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO sync_checkpoints
         (id, tenant_id, provider, entity_type, phase, cursor_value,
          records_processed, records_written, records_quarantined, job_id,
          started_at, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, 'in_progress', ?, ?)`
    )
      .bind(
        id,
        params.tenantId,
        params.provider,
        params.entityType,
        params.phase,
        params.cursor || null,
        params.jobId,
        now,
        now,
        now
      )
      .run();
    return id;
  } catch (err) {
    console.warn(
      `[ConnectorSync] Checkpoint write failed (non-fatal):`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

function safeParseJson(value: string | null, fallback: unknown): unknown {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Update an existing sync checkpoint with progress or completion.
 * Non-blocking — failures are logged but don't interrupt the sync.
 */
async function updateSyncCheckpoint(
  env: Bindings,
  checkpointId: string,
  updates: {
    records_processed?: number;
    records_written?: number;
    cursor_value?: string | null;
    status?: "in_progress" | "completed" | "failed" | "partial";
    error?: string;
    completed_at?: string;
  }
): Promise<void> {
  if (!env.DB) return;

  // Known, fixed column names (no user input) — safe to interpolate into SET.
  const cols: string[] = [];
  const binds: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    cols.push(`${key} = ?`);
    binds.push(value);
  }
  cols.push("updated_at = ?");
  binds.push(new Date().toISOString());

  try {
    await env.DB.prepare(`UPDATE sync_checkpoints SET ${cols.join(", ")} WHERE id = ?`)
      .bind(...binds, checkpointId)
      .run();
  } catch (err) {
    console.warn(
      `[ConnectorSync] Checkpoint update failed (non-fatal):`,
      err instanceof Error ? err.message : err
    );
  }
}

type Bindings = {
  SYNC_QUEUE: Queue;
  CONNECTOR_STATUS: KVNamespace;
  CONNECTOR: Fetcher;
  ENVIRONMENT: string;
  FULL_SYNC_DELAY_HOURS?: string;
  // D1 (spine-cache) — schema-driven sync reads tenant_spine_config and writes
  // sync_checkpoints to the SAME D1 the gateway writes (Cloudflare-only, DECISION 22).
  DB: D1Database;
  // Durable Object that runs the Full/Delta scheduler on a self-rescheduling alarm
  // (replaces the account-wide cron — aligns with the per-tenant Continuity model).
  SYNC_SCHEDULER?: DurableObjectNamespace;
};

type ProviderType =
  | "hubspot"
  | "salesforce"
  | "stripe"
  | "quickbooks"
  | "chargebee"
  | "github"
  | "google-analytics"
  | "mixpanel"
  | "linear"
  | "jira"
  | "pipedrive"
  | "freshsales"
  | "close"
  | "gmail"
  | "outlook"
  | "intercom"
  | "slack"
  | "notion"
  | "zendesk"
  | "tableau"
  | "google-drive"
  // CS/Support connectors
  | "zoho-crm"
  | "freshdesk"
  | "front"
  | "helpscout"
  | "kustomer"
  | "whatsapp-business";

type SyncPhase = "creamy" | "full";

/**
 * Build a SyncQueueMessage conforming to the versioned contract.
 * All SYNC_QUEUE.send() calls must use this builder.
 */
function buildSyncMessage(params: {
  tenantId: string;
  provider: ProviderType;
  entityTypes: string[];
  phase?: SyncPhase;
  since?: string;
  cursor?: string;
  limit?: number;
  jobId?: string;
  attempt?: number;
}): SyncQueueMessage {
  return {
    message_version: 1,
    message_id: crypto.randomUUID(),
    tenant_id: params.tenantId,
    provider: params.provider,
    connector_instance_id: `${params.provider}-${params.tenantId}`,
    entity_types: params.entityTypes,
    phase: params.phase || "delta",
    since: params.since,
    cursor: params.cursor,
    limit: params.limit,
    job_id: params.jobId || crypto.randomUUID(),
    attempt: params.attempt || 0,
    enqueued_at: new Date().toISOString(),
    trace_id: `sync-${params.tenantId}-${crypto.randomUUID()}`,
  };
}

interface ConnectorStatus {
  provider: ProviderType;
  status: "healthy" | "syncing" | "error" | "not_configured" | "needs_reauth";
  lastSyncStarted?: string;
  lastSyncCompleted?: string;
  last_creamy_at?: string;
  last_full_sync_at?: string;
  entitiesSynced?: number;
  error?: string;
  nextSyncDue?: string;
  entity_cursors?: Record<string, string>;
  last_full_entity?: string;
  last_full_entity_cursor?: string;
}

const DEFAULT_FULL_SYNC_DELAY_HOURS = 36; // mid-point of the 24–48h Full-hydration window

/**
 * KV TTL for connector status entries.
 * Set to 30 days — entries must persist between 6-hour cron runs.
 * Previous value of 24h caused connectors to "disappear" from the cron's radar.
 */
const STATUS_KV_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function normalizeSyncPhase(value?: string): SyncPhase | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "creamy") return "creamy";
  if (normalized === "full" || normalized === "needed") return "full";
  return undefined;
}

function getFullSyncDelayMs(env: Bindings): number {
  const hours = Number(env.FULL_SYNC_DELAY_HOURS || DEFAULT_FULL_SYNC_DELAY_HOURS);
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_FULL_SYNC_DELAY_HOURS;
  return safeHours * 60 * 60 * 1000;
}

/**
 * PROVIDER_ENTITY_MAP — defines what entity types each provider CAN provide.
 * This is the CAPABILITY map, not the extraction list.
 * Actual extraction is the intersection of this map with tenant_spine_config.
 */
const PROVIDER_ENTITY_MAP: Record<ProviderType, string[]> = {
  hubspot: ["contact", "account", "deal"],
  salesforce: ["contact", "account", "opportunity", "renewal"],
  stripe: ["account", "subscription", "invoice"],
  quickbooks: ["account", "invoice"],
  chargebee: ["account", "subscription", "invoice"],
  github: ["project", "ticket"],
  "google-analytics": ["interaction_event"],
  mixpanel: ["interaction_event"],
  linear: ["ticket"],
  jira: ["ticket"],
  pipedrive: ["contact", "account", "deal"],
  freshsales: ["contact", "account", "deal"],
  close: ["contact", "account", "deal"],
  gmail: ["interaction_event"],
  outlook: ["interaction_event"],
  intercom: ["contact"],
  slack: ["audience"],
  notion: ["file"],
  zendesk: ["ticket"],
  tableau: ["platform_health_metric", "value_stream"],
  "google-drive": ["file"],
  "zoho-crm": ["account", "contact", "deal", "lead"],
  freshdesk: ["ticket", "contact", "account"],
  front: ["ticket", "interaction_event"],
  helpscout: ["ticket", "contact"],
  kustomer: ["ticket", "contact", "engagement"],
  "whatsapp-business": ["interaction_event", "contact"],
};

// ───────────────────────────────────────────────────────────────────────
// Schema-Driven Entity Resolution
// ───────────────────────────────────────────────────────────────────────

/**
 * Resolve entity types for a tenant+provider by reading tenant_spine_config.
 * Returns the intersection of what the schema allows and what the provider can supply.
 *
 * If no spine config exists (or no DB access), falls back to PROVIDER_ENTITY_MAP.
 * This fallback ensures the service works even before schema is configured,
 * but the schema is the authoritative source once configured.
 */
async function resolveSchemaEntityTypes(
  env: Bindings,
  tenantId: string,
  provider: ProviderType
): Promise<string[]> {
  const providerCapabilities = PROVIDER_ENTITY_MAP[provider] || [];

  if (!env.DB) {
    // No D1 binding — configuration error. Cloudflare-only: never fall back to a
    // non-CF store. Use provider capabilities so a sync can still run degraded.
    console.error(
      `[ConnectorSync] CONFIG ERROR: D1 (DB) binding missing — using provider capability map for ${provider}`
    );
    return providerCapabilities;
  }

  try {
    const row = await env.DB.prepare(
      `SELECT connector_configs, allowed_entity_types
         FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`
    )
      .bind(tenantId)
      .first<{ connector_configs: string | null; allowed_entity_types: string | null }>();

    if (!row) {
      // No spine config yet — fall back to provider capabilities
      return providerCapabilities;
    }

    // D1 stores these columns as JSON strings (written by the gateway).
    const connectorConfigs = safeParseJson(row.connector_configs, {}) as Record<
      string,
      { entityTypes?: string[]; flowType?: string; enabled?: boolean }
    >;
    const allowedEntityTypes = safeParseJson(row.allowed_entity_types, []) as string[];

    // Check connector-specific config first
    const connectorConfig = connectorConfigs[provider];
    if (connectorConfig?.entityTypes && connectorConfig.entityTypes.length > 0) {
      // Intersect with provider capabilities
      return connectorConfig.entityTypes.filter((t: string) => providerCapabilities.includes(t));
    }

    // Fallback to tenant-level allowed types, intersected with provider capabilities
    if (allowedEntityTypes.length > 0) {
      return allowedEntityTypes.filter((t: string) => providerCapabilities.includes(t));
    }

    // Schema exists but has no entity types configured
    return providerCapabilities;
  } catch (err) {
    console.error(`[ConnectorSync] Failed to read spine config for tenant ${tenantId}:`, err);
    // On error, fall back to provider capabilities
    return providerCapabilities;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Routes
// ───────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "connector-sync",
    schema_driven: true,
    supported_providers: Object.keys(PROVIDER_ENTITY_MAP),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Arm the scheduler Durable Object (idempotent). Call once after deploy; the DO
 * then self-reschedules hourly via its alarm. Replaces the account-wide cron.
 */
app.post("/scheduler/arm", async (c) => {
  if (!c.env.SYNC_SCHEDULER) {
    return c.json({ error: "SYNC_SCHEDULER binding not configured" }, 500);
  }
  const id = c.env.SYNC_SCHEDULER.idFromName("global");
  const stub = c.env.SYNC_SCHEDULER.get(id);
  const res = await stub.fetch("https://do/arm", { method: "POST" });
  return c.json({ armed: res.ok });
});

/**
 * POST /api/sync/:tenantId
 * Trigger sync for a specific tenant/provider.
 * Entity types are resolved from schema config (intersected with provider capabilities).
 */
app.post("/api/sync/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const provider = (body.provider || "hubspot") as ProviderType;
  const phase = normalizeSyncPhase(body.phase);
  const fullSync = body.fullSync || phase === "full";
  const cursor = body.cursor as string | undefined;
  const limit = body.limit as number | undefined;

  if (!PROVIDER_ENTITY_MAP[provider]) {
    return c.json({ error: `Unsupported provider: ${provider}` }, 400);
  }

  // Schema-driven entity resolution:
  // 1. If caller provides explicit entities, use those (they should be pre-filtered by schema)
  // 2. Otherwise, resolve from tenant_spine_config
  const entities =
    body.entities && body.entities.length > 0
      ? body.entities
      : await resolveSchemaEntityTypes(c.env, tenantId, provider);

  // Delta: use lastSyncCompleted as since when available
  let since: string | undefined;
  if (phase) {
    since = undefined; // initial load (creamy/full) does not use since
  } else if (fullSync) {
    since = undefined;
  } else {
    const statusRaw = await c.env.CONNECTOR_STATUS.get(`sync:${tenantId}:${provider}`);
    const status = statusRaw ? (JSON.parse(statusRaw) as ConnectorStatus) : null;
    since = status?.lastSyncCompleted ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }

  const syncMsg = buildSyncMessage({
    tenantId,
    provider,
    entityTypes: entities,
    phase: phase || (fullSync ? "full" : undefined),
    since,
    cursor,
    limit,
  });

  await c.env.SYNC_QUEUE.send(syncMsg);

  await updateStatus(c.env.CONNECTOR_STATUS, tenantId, provider, {
    provider,
    status: "syncing",
    lastSyncStarted: new Date().toISOString(),
  });

  return c.json({
    message: "Sync job queued",
    tenantId,
    provider,
    entities,
    phase: phase ?? "delta",
    since,
    fullSync,
    jobId: syncMsg.job_id,
  });
});

// Get sync status for all providers of a tenant
app.get("/api/status/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const statuses: Record<string, ConnectorStatus> = {};

  for (const provider of Object.keys(PROVIDER_ENTITY_MAP) as ProviderType[]) {
    const raw = await c.env.CONNECTOR_STATUS.get(`sync:${tenantId}:${provider}`);
    if (raw) {
      statuses[provider] = JSON.parse(raw);
    }
  }

  return c.json({ tenantId, connectors: statuses });
});

// Get status for a specific provider
app.get("/api/status/:tenantId/:provider", async (c) => {
  const tenantId = c.req.param("tenantId");
  const provider = c.req.param("provider") as ProviderType;
  const raw = await c.env.CONNECTOR_STATUS.get(`sync:${tenantId}:${provider}`);

  if (!raw) {
    return c.json({
      provider,
      status: "not_configured",
      message: `${provider} connector not configured for this tenant`,
    });
  }

  return c.json(JSON.parse(raw));
});

// ───────────────────────────────────────────────────────────────────────
// Queue consumer — processes sync jobs for any provider
// ───────────────────────────────────────────────────────────────────────

async function processSyncJob(job: SyncQueueMessage, env: Bindings): Promise<void> {
  const tenantId = job.tenant_id;
  const provider = job.provider as ProviderType;
  const existingStatus = await getStatus(env.CONNECTOR_STATUS, tenantId, provider);
  const entityCursors = { ...(existingStatus?.entity_cursors || {}) };

  // Schema-driven: resolve entity types if not already provided in the job
  const entities =
    job.entity_types && job.entity_types.length > 0
      ? job.entity_types
      : await resolveSchemaEntityTypes(env, tenantId, provider);

  if (entities.length === 0) {
    console.warn(
      `[ConnectorSync] No entity types for ${provider} (tenant ${tenantId}). ` +
        `Check tenant_spine_config.`
    );
    return;
  }

  const isFullSync = job.phase === "full";
  let totalSynced = 0;
  let lastFullEntity = existingStatus?.last_full_entity;
  let lastFullEntityCursor = existingStatus?.last_full_entity_cursor;

  for (const entityType of entities) {
    // Write a durable sync checkpoint before starting this entity type
    const checkpointId = await writeSyncCheckpoint(env, {
      tenantId,
      provider,
      entityType,
      phase: job.phase || "delta",
      jobId: job.job_id,
      cursor: job.cursor,
    });

    try {
      const entityCursor =
        job.cursor ||
        (Object.prototype.hasOwnProperty.call(entityCursors, entityType)
          ? entityCursors[entityType]
          : undefined);
      const res = await env.CONNECTOR.fetch(
        new Request(`http://connector/api/v1/connector/sync/${provider}/${entityType}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify({
            ...(job.phase === "creamy" ? { phase: "creamy" } : {}),
            since: job.since,
            full_sync: isFullSync,
            cursor: entityCursor,
            limit: job.limit,
          }),
        })
      );

      if (res.ok) {
        const data = (await res.json()) as {
          synced?: number;
          entities?: any[];
          next_cursor?: string;
        };
        const synced = data.synced || data.entities?.length || 0;
        totalSynced += synced;
        const nextCursor = data.next_cursor;
        if (nextCursor) {
          entityCursors[entityType] = nextCursor;
          lastFullEntity = entityType;
          lastFullEntityCursor = nextCursor;

          if (isFullSync) {
            await env.SYNC_QUEUE.send(
              buildSyncMessage({
                tenantId,
                provider,
                entityTypes: [entityType],
                phase: "full",
                cursor: nextCursor,
                jobId: job.job_id,
                attempt: job.attempt,
              })
            );
          }
        } else if (isFullSync) {
          delete entityCursors[entityType];
          if (lastFullEntity === entityType) {
            lastFullEntity = undefined;
            lastFullEntityCursor = undefined;
          }
        }
        // NOTE: The Connector service enqueues records into pipeline-process queue
        // as part of the sync contract. This worker handles orchestration + status only.

        console.log(
          `[ConnectorSync] ${provider}/${entityType}: ${synced} entities for tenant ${tenantId}`
        );

        // Update durable checkpoint with progress
        if (checkpointId) {
          await updateSyncCheckpoint(env, checkpointId, {
            records_processed: synced,
            records_written: synced,
            cursor_value: nextCursor || null,
            status: nextCursor ? "partial" : "completed",
            ...(nextCursor ? {} : { completed_at: new Date().toISOString() }),
          });
        }
      } else {
        const errText = await res.text().catch(() => "Unknown error");
        console.error(`[ConnectorSync] ${provider}/${entityType} failed: ${res.status} ${errText}`);

        // Mark checkpoint as failed
        if (checkpointId) {
          await updateSyncCheckpoint(env, checkpointId, {
            status: "failed",
            error: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
            completed_at: new Date().toISOString(),
          });
        }

        if (res.status === 401 || res.status === 403) {
          await updateStatus(env.CONNECTOR_STATUS, tenantId, provider, {
            provider,
            status: "needs_reauth",
            error: "Authentication expired or revoked",
            lastSyncCompleted: new Date().toISOString(),
          });
          return;
        }
      }
    } catch (err: any) {
      console.error(`[ConnectorSync] ${provider}/${entityType} error: ${err.message}`);

      // Mark checkpoint as failed on exception
      if (checkpointId) {
        await updateSyncCheckpoint(env, checkpointId, {
          status: "failed",
          error: err.message?.slice(0, 200),
          completed_at: new Date().toISOString(),
        });
      }
    }
  }

  const now = new Date().toISOString();
  const nextSyncDue = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  await updateStatus(env.CONNECTOR_STATUS, tenantId, provider, {
    provider,
    status: "healthy",
    lastSyncCompleted: now,
    ...(job.phase === "creamy" ? { last_creamy_at: now } : {}),
    ...(isFullSync ? { last_full_sync_at: now } : {}),
    entitiesSynced: totalSynced,
    nextSyncDue,
    entity_cursors: entityCursors,
    last_full_entity: lastFullEntity,
    last_full_entity_cursor: lastFullEntityCursor,
  });
}

// ───────────────────────────────────────────────────────────────────────
// Scheduled handler — sync all active connectors (every 6 hours)
// ───────────────────────────────────────────────────────────────────────

async function handleScheduled(env: Bindings): Promise<void> {
  console.log("[ConnectorSync] Cron triggered — syncing all active connectors");
  const fullSyncDelayMs = getFullSyncDelayMs(env);

  // List all connector status keys to find active tenants/providers
  const list = await env.CONNECTOR_STATUS.list({ prefix: "sync:" });

  for (const key of list.keys) {
    const raw = await env.CONNECTOR_STATUS.get(key.name);
    if (!raw) continue;

    const status: ConnectorStatus = JSON.parse(raw);
    if (status.status === "needs_reauth" || status.status === "not_configured") continue;

    // Extract tenantId and provider from key: "sync:{tenantId}:{provider}"
    const parts = key.name.split(":");
    if (parts.length < 3) continue;

    const tenantId = parts[1];
    const provider = parts[2] as ProviderType;

    // Schema-driven: resolve entity types from schema config
    const entities = await resolveSchemaEntityTypes(env, tenantId, provider);
    if (entities.length === 0) {
      console.log(
        `[ConnectorSync] Skipping ${provider} for tenant ${tenantId} — no schema-defined entity types`
      );
      continue;
    }

    const creamyAt = status.last_creamy_at ? Date.parse(status.last_creamy_at) : Number.NaN;
    const fullSyncDue =
      Number.isFinite(creamyAt) &&
      !status.last_full_sync_at &&
      Date.now() - creamyAt >= fullSyncDelayMs;

    if (fullSyncDue) {
      const syncMsg = buildSyncMessage({
        tenantId,
        provider,
        entityTypes: entities,
        phase: "full",
      });

      await env.SYNC_QUEUE.send(syncMsg);
      console.log(`[ConnectorSync] Queued delayed full sync: ${provider} for tenant ${tenantId}`);
      continue;
    }

    // Delta only: use lastSyncCompleted so we only fetch changes since last run
    const since =
      status.lastSyncCompleted ?? new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const syncMsg = buildSyncMessage({
      tenantId,
      provider,
      entityTypes: entities,
      since,
    });

    await env.SYNC_QUEUE.send(syncMsg);
    console.log(`[ConnectorSync] Queued delta sync: ${provider} for tenant ${tenantId}`);
  }
}

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

async function updateStatus(
  kv: KVNamespace,
  tenantId: string,
  provider: ProviderType,
  status: ConnectorStatus
): Promise<void> {
  const existing = await getStatus(kv, tenantId, provider);
  const merged = {
    ...(existing || {}),
    ...status,
    entity_cursors: status.entity_cursors ?? existing?.entity_cursors,
    last_full_entity: status.last_full_entity ?? existing?.last_full_entity,
    last_full_entity_cursor: status.last_full_entity_cursor ?? existing?.last_full_entity_cursor,
  } as ConnectorStatus;

  if (merged.entity_cursors && Object.keys(merged.entity_cursors).length === 0) {
    delete merged.entity_cursors;
  }
  if (!merged.last_full_entity) {
    delete merged.last_full_entity;
  }
  if (!merged.last_full_entity_cursor) {
    delete merged.last_full_entity_cursor;
  }

  await kv.put(`sync:${tenantId}:${provider}`, JSON.stringify(merged), {
    expirationTtl: STATUS_KV_TTL_SECONDS,
  });
}

async function getStatus(
  kv: KVNamespace,
  tenantId: string,
  provider: ProviderType
): Promise<ConnectorStatus | null> {
  const raw = await kv.get(`sync:${tenantId}:${provider}`);
  return raw ? (JSON.parse(raw) as ConnectorStatus) : null;
}

// ───────────────────────────────────────────────────────────────────────
// Export
// ───────────────────────────────────────────────────────────────────────

/**
 * Clean up sync checkpoints older than 90 days.
 * Fires alongside the scheduled sync trigger.
 */
async function cleanupOldCheckpoints(env: Bindings): Promise<void> {
  if (!env.DB) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffIso = cutoff.toISOString();

  try {
    await env.DB.prepare(`DELETE FROM sync_checkpoints WHERE created_at < ?`).bind(cutoffIso).run();
    console.log(`[ConnectorSync] Cleaned checkpoints older than ${cutoffIso}`);
  } catch (err) {
    console.error("[ConnectorSync] Checkpoint cleanup error:", err);
  }
}

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Bindings): Promise<void> {
    await handleScheduled(env);
    await cleanupOldCheckpoints(env);
  },
  async queue(batch: MessageBatch<SyncQueueMessage>, env: Bindings): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processSyncJob(message.body, env);
        message.ack();
      } catch (error: any) {
        console.error(`[ConnectorSync] Job failed:`, error.message);
        const job = message.body;
        await updateStatus(env.CONNECTOR_STATUS, job.tenant_id, job.provider as ProviderType, {
          provider: job.provider as ProviderType,
          status: "error",
          lastSyncCompleted: new Date().toISOString(),
          error: error.message,
          entitiesSynced: 0,
        });
        message.retry();
      }
    }
  },
};

// ───────────────────────────────────────────────────────────────────────
// Sync Scheduler Durable Object — self-rescheduling Full/Delta scheduler.
// Replaces the account-wide cron (which hit a trigger-slot limit). Aligns with
// the per-tenant Continuity model: a DO alarm, not a scarce global cron slot.
// Armed once via POST /scheduler/arm; thereafter it re-arms hourly in alarm().
// ───────────────────────────────────────────────────────────────────────
const SCHEDULER_INTERVAL_MS = 60 * 60 * 1000; // hourly

export class SyncSchedulerDO {
  private state: DurableObjectState;
  private env: Bindings;

  constructor(state: DurableObjectState, env: Bindings) {
    this.state = state;
    this.env = env;
  }

  async fetch(_request: Request): Promise<Response> {
    // Idempotent arm: only set the first alarm if none is pending.
    const existing = await this.state.storage.getAlarm();
    if (existing === null) {
      await this.state.storage.setAlarm(Date.now() + 60_000); // first sweep in ~1 min
    }
    return new Response(JSON.stringify({ armed: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async alarm(): Promise<void> {
    try {
      await handleScheduled(this.env);
      await cleanupOldCheckpoints(this.env);
    } catch (err) {
      console.error("[SyncSchedulerDO] sweep error:", err instanceof Error ? err.message : err);
    }
    // Always re-arm so the scheduler keeps running.
    await this.state.storage.setAlarm(Date.now() + SCHEDULER_INTERVAL_MS);
  }
}
