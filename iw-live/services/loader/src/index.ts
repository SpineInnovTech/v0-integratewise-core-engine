/**
 * Loader Service - Schema-Driven Extraction
 *
 * Handles:
 * - Creamy layer sync (Phase 1 — bounded, schema-driven extract for onboarding)
 * - Background sync (Phase 2 — needed/delta, schema-driven)
 * - Scheduled polling (cron safety net — discovers unsynced connectors)
 *
 * ARCHITECTURAL PRINCIPLE:
 *   The SCHEMA drives everything. Only entity types defined in tenant_spine_config
 *   get extracted. No placeholders, no guessing. The schema is the SSOT for what
 *   the user needs — this is what makes IntegrateWise a Knowledge Workspace,
 *   not an ETL tool.
 */

import { Hono } from "hono";
import { z } from "zod";
import type { Env as LoaderEnv, TenantSpineConfig } from "./types";
import { getValidAccessToken, TokenExpiredError } from "../../connector/src/token-refresh";
import {
  getConnectionToken,
  verifyNangoWebhook,
  toNangoIntegrationId,
} from "../../connector/src/lib/nango";
import { universalSync, createGitHubConnector } from "@integratewise/connectors";
import type { PipelineQueueMessage } from "@integratewise/types";
import type { SyncOptions } from "@integratewise/connectors";

// ───────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────

interface CreamyJob {
  jobId: string;
  tenantId: string;
  connector: string;
  entityTypes: string[];
  status: "pending" | "running" | "completed" | "failed";
  progress: {
    total: number;
    processed: number;
    percentage: number;
  };
  extractedCount: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Schema validation
const CreamyRequestSchema = z.object({
  connector: z.string(),
  entityTypes: z.array(z.string()),
  options: z
    .object({
      limit: z.number().default(100),
      since: z.string().optional(),
    })
    .optional(),
});

const BackgroundSyncSchema = z.object({
  jobId: z.string(),
  tenantId: z.string(),
  connector: z.string(),
  phase: z.enum(["needed", "delta"]),
});

// ───────────────────────────────────────────────────────────────────────
// KV-backed Job Store (replaces in-memory Map)
// ───────────────────────────────────────────────────────────────────────

const JOB_KV_PREFIX = "loader:job:";
const JOB_TTL_SECONDS = 86400; // 24 hours — jobs older than this are stale

async function getJob(env: LoaderEnv, jobId: string): Promise<CreamyJob | null> {
  if (!env.CONNECTOR_STATUS) return null;
  const raw = await env.CONNECTOR_STATUS.get(`${JOB_KV_PREFIX}${jobId}`);
  return raw ? (JSON.parse(raw) as CreamyJob) : null;
}

async function saveJob(env: LoaderEnv, job: CreamyJob): Promise<void> {
  if (!env.CONNECTOR_STATUS) return;
  await env.CONNECTOR_STATUS.put(`${JOB_KV_PREFIX}${job.jobId}`, JSON.stringify(job), {
    expirationTtl: JOB_TTL_SECONDS,
  });
}

/**
 * Write/merge the connector-sync status marker (`sync:{tenant}:{provider}`) so the
 * connector-sync Full/Delta scheduler sees that creamy started for this connector.
 * `last_creamy_at` anchors the 24–48h Full-hydration timer; the first creamy wins
 * (we never reset it on re-trigger). Shared status key with connector-sync.
 */
async function writeCreamyStatusMarker(
  env: LoaderEnv,
  tenantId: string,
  connector: string
): Promise<void> {
  if (!env.CONNECTOR_STATUS) return;
  try {
    const key = `sync:${tenantId}:${connector}`;
    const now = new Date().toISOString();
    const raw = await env.CONNECTOR_STATUS.get(key);
    const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const merged = {
      ...existing,
      provider: connector,
      status: "healthy",
      last_creamy_at: (existing.last_creamy_at as string) || now,
      lastSyncStarted: now,
    };
    // 30-day TTL — must persist between scheduler runs.
    await env.CONNECTOR_STATUS.put(key, JSON.stringify(merged), {
      expirationTtl: 30 * 24 * 60 * 60,
    });
  } catch (err) {
    console.warn(
      "[Loader] Failed to write creamy status marker (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }
}

// ───────────────────────────────────────────────────────────────────────
// Schema Resolution
// ───────────────────────────────────────────────────────────────────────

/**
 * Read the tenant's schema config to determine which entity types are allowed
 * for a given connector. The schema is the SSOT — if it doesn't define the
 * entity type, we don't extract it.
 *
 * Reads from `tenant_spine_config` (the unified table, post-migration 079).
 */
async function getSchemaEntityTypes(
  env: LoaderEnv,
  tenantId: string,
  connector: string
): Promise<string[]> {
  // Cloudflare D1 first (DECISION 22, single product plane). tenant_spine_config is the SSOT.
  if ((env as any).EDGE_DB) {
    try {
      const row = await (env as any).EDGE_DB.prepare(
        `SELECT connector_configs, allowed_entity_types FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`
      )
        .bind(tenantId)
        .first();

      if (row) {
        let connectorConfigs: Record<string, any> = {};
        let allowed: string[] = [];
        try {
          connectorConfigs = row.connector_configs ? JSON.parse(row.connector_configs) : {};
        } catch {}
        try {
          allowed = row.allowed_entity_types ? JSON.parse(row.allowed_entity_types) : [];
        } catch {}

        const cc = connectorConfigs?.[connector];
        if (cc?.entityTypes && cc.entityTypes.length > 0) {
          return cc.entityTypes;
        }
        if (allowed.length > 0) {
          return allowed;
        }
      }
    } catch (d1Err) {
      console.warn(
        `[Loader] D1 tenant_spine_config read failed for ${tenantId}, will try fallback:`,
        d1Err
      );
    }
  }

  // Legacy Neon fallback (during de-Supabase migration). Many tenants may still have config only here.
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(env.DATABASE_URL);

    const rows = await sql`
      SELECT connector_configs, allowed_entity_types
      FROM tenant_spine_config
      WHERE tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      console.warn(
        `[Loader] No spine config for tenant ${tenantId} — cannot determine entity types`
      );
      return [];
    }

    const config = rows[0] as TenantSpineConfig;

    // Check connector-specific config first
    const connectorConfig = config.connector_configs?.[connector];
    if (connectorConfig?.entityTypes && connectorConfig.entityTypes.length > 0) {
      return connectorConfig.entityTypes;
    }

    // Fallback to tenant-level allowed entity types
    if (config.allowed_entity_types && config.allowed_entity_types.length > 0) {
      return config.allowed_entity_types;
    }

    console.warn(
      `[Loader] Spine config for tenant ${tenantId} has no entity types for ${connector}`
    );
    return [];
  } catch (err) {
    console.error(`[Loader] Failed to read spine config for tenant ${tenantId}:`, err);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────
// Routes
// ───────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: LoaderEnv }>();

// ─── Nango Webhook ───────────────────────────────────────────────────────────
//
// Nango calls this URL after every OAuth event:
//   auth.created  → user connected a tool → write D1 status (tenant_spine_config + connectors)
//                   + resolve schema from D1 + inline trigger of processCreamyLayer (full 8-stage path to D1 Spine)
//   auth.revoked / deleted → mark in Supabase (compat) + future D1 mirror
//
// The inline creamy path + D1 schema read closes the connect→hydrate loop on the Cloudflare plane.

app.post("/nango/webhook", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-nango-signature") || "";
  const webhookSecret = (c.env as any).NANGO_WEBHOOK_SECRET as string | undefined;

  // Verify signature if secret is configured
  if (webhookSecret) {
    const valid = await verifyNangoWebhook(webhookSecret, rawBody, signature);
    if (!valid) {
      console.error("[Loader:Nango] Webhook signature mismatch");
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const eventType: string = event.type ?? "";
  const connectionId: string = event.connectionId ?? event.connection_id ?? "";
  const providerConfigKey: string = event.providerConfigKey ?? event.provider_config_key ?? "";

  // connectionId = our tenant_id (set at session creation)
  const tenantId = connectionId;

  if (!tenantId || !providerConfigKey) {
    return c.json({ received: true, skipped: "missing fields" });
  }

  if (eventType === "auth.created") {
    // Cloudflare-only (DECISION 22): no Supabase. D1 status + schema + inline creamy.
    const schemaEntityTypes = await getSchemaEntityTypes(c.env, tenantId, providerConfigKey);
    {
      // --- D1-native status (Cloudflare product plane) ---
      // Write to D1 tenant_spine_config.connected_connectors (what gateway/CZ/MCP projections read)
      // and the D1 connectors table (token/status plane per migration 0006).
      if ((c.env as any).EDGE_DB && schemaEntityTypes.length >= 0) {
        try {
          const db = (c.env as any).EDGE_DB as any;
          const now = new Date().toISOString();

          // connected_connectors array (used by spine config projections)
          const existing = await db
            .prepare(`SELECT connected_connectors FROM tenant_spine_config WHERE tenant_id = ?`)
            .bind(tenantId)
            .first();
          let connList: string[] = [];
          if (existing?.connected_connectors) {
            try {
              connList = JSON.parse(existing.connected_connectors);
            } catch {}
          }
          if (!connList.includes(providerConfigKey)) {
            connList.push(providerConfigKey);
            await db
              .prepare(
                `UPDATE tenant_spine_config SET connected_connectors = ?, updated_at = datetime('now') WHERE tenant_id = ?`
              )
              .bind(JSON.stringify(connList), tenantId)
              .run();
          }

          // Minimal status row in D1 connectors (the CF token store)
          await db
            .prepare(
              `INSERT OR REPLACE INTO connectors
               (id, user_id, tenant_id, provider, status, sync_enabled, created_at, updated_at, metadata)
               VALUES (?, ?, ?, ?, 'connected', 1, ?, ?, '{}')`
            )
            .bind(crypto.randomUUID(), tenantId, tenantId, providerConfigKey, now, now)
            .run();

          console.log(
            `[Loader:Nango] D1 status updated (connected_connectors + connectors table) for ${providerConfigKey}`
          );
        } catch (d1Err) {
          console.warn(`[Loader:Nango] D1 status write non-fatal:`, d1Err);
        }
      }

      // Trigger Creamy sync immediately — don't wait for cron.
      // 1) Legacy via CONNECTOR_SYNC (if bound)
      if (c.env.CONNECTOR_SYNC && schemaEntityTypes.length > 0) {
        c.executionCtx?.waitUntil?.(
          c.env.CONNECTOR_SYNC.fetch(
            new Request(`http://connector-sync/api/sync/${tenantId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-id": tenantId,
              },
              body: JSON.stringify({
                provider: providerConfigKey,
                phase: "creamy",
                entities: schemaEntityTypes,
              }),
            })
          ).catch((err: Error) =>
            console.error(
              `[Loader:Nango] Failed to trigger creamy via CONNECTOR_SYNC: ${err.message}`
            )
          )
        );
      }

      // 2) INLINE direct trigger using the exact same creamy handler (re-uses Nango token resolve + processCreamyLayer + PIPELINE_QUEUE enqueue).
      // This ensures the 8-stage normalizer runs and data lands in the live D1 domain partitions (build_data etc.)
      // even if CONNECTOR_SYNC path has timing/empty-schema issues.
      if (schemaEntityTypes.length > 0) {
        c.executionCtx?.waitUntil?.(
          (async () => {
            try {
              const creamyReq = new Request("http://internal/creamy", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-tenant-id": tenantId,
                },
                body: JSON.stringify({
                  connector: providerConfigKey,
                  entityTypes: schemaEntityTypes,
                  options: { limit: 100 },
                }),
              });
              const creamyResp = await app.fetch(creamyReq, c.env as any, c.executionCtx);
              const data: any = await creamyResp.json().catch(() => ({}));
              console.log(
                `[Loader:Nango] Inline creamy for ${providerConfigKey} → job ${data?.jobId || "started"}`
              );
            } catch (inlineErr) {
              console.error(
                `[Loader:Nango] Inline creamy trigger failed for ${providerConfigKey}:`,
                inlineErr
              );
            }
          })()
        );
      }
    }
  } else if (eventType === "auth.revoked" || eventType === "auth.deleted") {
    // Cloudflare-only (DECISION 22): disconnect handled on D1 only.
    if ((c.env as any).EDGE_DB) {
      try {
        const db = (c.env as any).EDGE_DB as any;
        const now = new Date().toISOString();
        await db
          .prepare(
            `UPDATE connectors SET status = 'disconnected', updated_at = ? WHERE tenant_id = ? AND provider = ?`
          )
          .bind(now, tenantId, providerConfigKey)
          .run();

        // Also prune from connected_connectors array
        const row = await db
          .prepare(`SELECT connected_connectors FROM tenant_spine_config WHERE tenant_id = ?`)
          .bind(tenantId)
          .first();
        if (row?.connected_connectors) {
          try {
            const list: string[] = JSON.parse(row.connected_connectors);
            const filtered = list.filter((p) => p !== providerConfigKey);
            await db
              .prepare(
                `UPDATE tenant_spine_config SET connected_connectors = ?, updated_at = datetime('now') WHERE tenant_id = ?`
              )
              .bind(JSON.stringify(filtered), tenantId)
              .run();
          } catch {}
        }
      } catch {}
    }

    console.log(
      `[Loader:Nango] Connector disconnected: ${providerConfigKey} for tenant ${tenantId}`
    );
  }

  return c.json({ received: true });
});

/**
 * POST /internal/creamy
 *
 * Start Creamy layer sync — bounded, schema-driven initial extract for onboarding.
 * This is Phase 1 — user-facing, fast, proves the connector works.
 */
app.post("/internal/creamy", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();

  if (!tenantId) {
    return c.json({ error: "Missing tenant ID" }, 400);
  }

  try {
    const body = await c.req.json();
    const data = CreamyRequestSchema.parse(body);
    const limit = data.options?.limit || 100;

    // SCHEMA-DRIVEN: Resolve entity types from schema config.
    // The request's entityTypes are intersected with what the schema allows.
    const schemaEntityTypes = await getSchemaEntityTypes(c.env, tenantId, data.connector);
    const requestedTypes = data.entityTypes;

    // Intersect: only extract types that both the request AND schema allow.
    // If schema is empty (no config yet), use the request types as-is (onboarding flow
    // may call creamy before schema is fully configured, since initialize-spine writes
    // the schema config first).
    const effectiveEntityTypes =
      schemaEntityTypes.length > 0
        ? requestedTypes.filter((t) => schemaEntityTypes.includes(t))
        : requestedTypes;

    if (effectiveEntityTypes.length === 0) {
      return c.json(
        {
          error: "No entity types match the tenant schema configuration",
          requested: requestedTypes,
          allowed: schemaEntityTypes,
          correlation_id: correlationId,
        },
        422
      );
    }

    // Create job record
    const jobId = crypto.randomUUID();
    const job: CreamyJob = {
      jobId,
      tenantId,
      connector: data.connector,
      entityTypes: effectiveEntityTypes,
      status: "running",
      progress: {
        total: limit,
        processed: 0,
        percentage: 0,
      },
      extractedCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Persist job in KV (survives worker eviction)
    await saveJob(c.env, job);

    // Mark the connector-sync status so the Full/Delta scheduler (connector-sync cron)
    // sees that creamy started for this connector and schedules Full hydration ~24–48h
    // later, then Delta. Creamy is triggered via the loader on onboarding; the scheduler
    // reads this marker (single status key shared with connector-sync).
    await writeCreamyStatusMarker(c.env, tenantId, data.connector);

    // Update onboarding state with job ID (best-effort — never block creamy on it).
    // NOTE: legacy external-DB write; tracked for migration to D1. The authoritative
    // creamy job id is returned to the caller below and tracked in KV.
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(c.env.DATABASE_URL);
      await sql`
        UPDATE tenant_onboarding_state
        SET creamy_job_id = ${jobId}
        WHERE tenant_id = ${tenantId}
      `;
    } catch (err) {
      console.warn(
        "[Loader] onboarding-state creamy_job_id update skipped (non-fatal):",
        err instanceof Error ? err.message : err
      );
    }

    // Start async processing
    const creamyTask = processCreamyLayer(c.env, job, {
      ...data,
      entityTypes: effectiveEntityTypes,
    }).catch((err) => {
      console.error(`[Loader] Creamy job ${jobId} failed:`, err);
      job.status = "failed";
      job.error = err instanceof Error ? err.message : String(err);
      saveJob(c.env, job).catch(() => {});
    });
    c.executionCtx?.waitUntil?.(creamyTask);

    return c.json({
      jobId,
      status: job.status,
      progress: job.progress,
      entityTypes: effectiveEntityTypes,
      correlation_id: correlationId,
    });
  } catch (error) {
    console.error("[Loader] Creamy layer error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to start creamy layer",
        correlation_id: correlationId,
      },
      500
    );
  }
});

/**
 * GET /internal/creamy/:jobId
 *
 * Get Creamy job status and progress.
 */
app.get("/internal/creamy/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();

  const job = await getJob(c.env, jobId);

  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    extractedCount: job.extractedCount,
    entityTypes: job.entityTypes,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
    correlation_id: correlationId,
  });
});

/**
 * POST /internal/background-sync
 *
 * Start Stage 2 background sync (Needed/Delta phases).
 * Called after onboarding completes.
 */
app.post("/internal/background-sync", async (c) => {
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();

  try {
    const body = await c.req.json();
    const data = BackgroundSyncSchema.parse(body);

    // Update job status in database
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(c.env.DATABASE_URL);

    await sql`
      UPDATE sync_jobs
      SET status = 'running',
          started_at = NOW()
      WHERE id = ${data.jobId}
    `;

    // Start async processing
    const bgTask = processBackgroundSync(c.env, data).catch(async (err) => {
      console.error(`[Loader] Background sync ${data.jobId} failed:`, err);
      try {
        await sql`UPDATE sync_jobs SET status = 'failed' WHERE id = ${data.jobId}`;
      } catch {
        /* ignore */
      }
    });
    c.executionCtx?.waitUntil?.(bgTask);

    return c.json({
      jobId: data.jobId,
      status: "running",
      correlation_id: correlationId,
    });
  } catch (error) {
    console.error("[Loader] Background sync error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to start background sync",
        correlation_id: correlationId,
      },
      500
    );
  }
});

// ───────────────────────────────────────────────────────────────────────
// Creamy Layer Processing (Phase 1)
// ───────────────────────────────────────────────────────────────────────

/**
 * Process Creamy layer — Phase 1 schema-driven extraction.
 * Only extracts entity types the schema defines. No placeholders.
 */
async function processCreamyLayer(
  env: LoaderEnv,
  job: CreamyJob,
  request: z.infer<typeof CreamyRequestSchema>
): Promise<void> {
  const { connector, entityTypes } = request;
  const limit = request.options?.limit || 100;

  console.log(
    `[Loader] Starting Creamy layer for ${connector}, job ${job.jobId}, ` +
      `entity types: [${entityTypes.join(", ")}], limit: ${limit}`
  );

  // --- Token Resolution (Nango-first, fallback to legacy) ---
  let accessToken: string | null = null;
  const nangoKey = (env as any).NANGO_SECRET_KEY as string | undefined;

  if (nangoKey) {
    // Primary path: Nango manages token lifecycle (auto-refresh included)
    try {
      accessToken = await getConnectionToken(
        {
          NANGO_SECRET_KEY: nangoKey,
          NANGO_BASE_URL: (env as any).NANGO_BASE_URL as string | undefined,
        },
        toNangoIntegrationId(connector),
        job.tenantId
      );
      console.log(`[Loader] Nango token obtained for ${connector} (tenant ${job.tenantId})`);
    } catch (err) {
      console.warn(
        `[Loader] Nango token failed for ${connector}, falling back to legacy:`,
        (err as Error).message
      );
    }
  }

  // Legacy fallback: reads from the D1 connectors token store (DECISION 22)
  if (!accessToken) {
    try {
      accessToken = await getValidAccessToken(
        {
          EDGE_DB: (env as any).EDGE_DB,
          TOKEN_ENCRYPTION_KEY: (env as any).TOKEN_ENCRYPTION_KEY,
          CONNECTOR_STATUS: env.CONNECTOR_STATUS,
        },
        job.tenantId,
        connector
      );
      console.log(`[Loader] Legacy token obtained for ${connector} (tenant ${job.tenantId})`);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        console.error(
          `[Loader] Token refresh failed for ${connector} — user must re-authenticate:`,
          (err as Error).message
        );
        job.status = "failed";
        job.error = "Token expired — user must re-authenticate";
        await saveJob(env, job);
        return;
      }
      console.warn(`[Loader] Token resolution skipped for ${connector}:`, (err as Error).message);
    }
  }

  // Build connector instance for sync adapter
  const connectorInstance = buildConnectorInstance(connector, accessToken);

  const syncOpts: SyncOptions = {
    phase: "creamy",
    limit,
  };

  let extracted: Array<Record<string, any>> = [];

  try {
    const syncResult = await universalSync(connector, connectorInstance, syncOpts);

    if (syncResult.entities.length > 0) {
      // Schema-driven: only keep entities whose type is in the allowed list
      extracted = syncResult.entities
        .filter((e) => entityTypes.includes(e.entity_type))
        .map((e) => ({
          id: e.source_id,
          entity_type: e.entity_type,
          type: e.entity_type,
          name: e.name,
          source: e.source,
          source_id: e.source_id,
          data: e.data,
        }));
      console.log(
        `[Loader] Sync returned ${syncResult.entities.length} raw, ` +
          `${extracted.length} after schema filter for ${connector}`
      );

      // Materialize creamy snapshot to the flat spine_entities table.
      // This makes `spine.entity.list` (MCP / OpenAI clients) immediately see the data
      // from real Nango connects, matching the surface used by ChatGPT-style tools/call.
      // The full pipeline enqueues the same records for 8-stage enrichment + domain partitions.
      if ((env as any).EDGE_DB && extracted.length > 0) {
        const db = (env as any).EDGE_DB as any;
        const stmts = extracted.map((rec: any) => {
          const sid = rec.source_id || rec.id || crypto.randomUUID();
          return db
            .prepare(
              `INSERT OR REPLACE INTO spine_entities
               (id, tenant_id, entity_type, name, source, source_id, status, data, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))`
            )
            .bind(
              sid,
              job.tenantId,
              rec.entity_type || rec.type || "unknown",
              rec.name || rec.source_id,
              rec.source || connector,
              rec.source_id || rec.id,
              JSON.stringify(rec.data || {})
            );
        });
        try {
          await db.batch(stmts);
          console.log(
            `[Loader] Wrote ${extracted.length} entities to D1 spine_entities for tenant ${job.tenantId}`
          );
        } catch (spineErr) {
          console.warn(`[Loader] spine_entities write (non-fatal):`, spineErr);
        }
      }
    } else {
      // No data from provider — this is legitimate (empty account, new setup).
      // Do NOT generate placeholder records. The workspace shows "no data yet."
      console.log(
        `[Loader] No data returned from ${connector} for tenant ${job.tenantId}. ` +
          `This is normal for new or empty accounts.`
      );
    }
  } catch (syncErr) {
    // Sync adapter error — log it, don't generate fake records.
    // The job will be marked as completed with 0 records.
    console.error(`[Loader] Sync adapter error for ${connector}:`, syncErr);
    job.error = syncErr instanceof Error ? syncErr.message : String(syncErr);
  }

  // Update progress
  job.progress.processed = extracted.length;
  job.progress.percentage = 100;
  await saveJob(env, job);

  // Send extracted data to Pipeline queue for 8-stage processing
  if (env.MCP && extracted.length > 0) {
    for (const record of extracted) {
      const pipelineMsg: PipelineQueueMessage = {
        message_version: 1,
        stage: "analyze", // Start at Stage 1 (S1)
        source: connector,
        source_type: "loader_creamy",
        tenant_id: job.tenantId,
        payload: {
          ...record,
          _entity_type: record.entity_type || entityTypes[0] || "unknown",
          _source_id: record.id || record.source_id || crypto.randomUUID(),
          _tenant_id: job.tenantId,
        },
        metadata: {
          trace_id: `loader-${job.jobId}-${crypto.randomUUID()}`,
          attempt: 0,
          received_at: new Date().toISOString(),
          extracted_at: new Date().toISOString(),
          loader_job_id: job.jobId,
          phase: "creamy",
        },
      };

      await (env as any).MCP.fetch("http://internal/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "pipeline.ingest",
          arguments: {
            tenant_id: pipelineMsg.tenant_id,
            source: pipelineMsg.source,
            source_type: pipelineMsg.source_type,
            payload: pipelineMsg,
          },
        }),
      });
    }

    console.log(`[Loader] Sent ${extracted.length} records to pipeline for processing`);
  }

  // Mark job complete
  job.status = "completed";
  job.extractedCount = extracted.length;
  job.completedAt = new Date().toISOString();
  await saveJob(env, job);

  console.log(`[Loader] Creamy layer complete for job ${job.jobId}: ${extracted.length} records`);
}

// ───────────────────────────────────────────────────────────────────────
// Background Sync Processing (Phase 2 — Needed/Delta)
// ───────────────────────────────────────────────────────────────────────

/**
 * Process background sync — Stage 2 (Needed/Delta).
 * Schema-driven: reads tenant_spine_config to determine entity types.
 */
async function processBackgroundSync(
  env: LoaderEnv,
  data: z.infer<typeof BackgroundSyncSchema>
): Promise<void> {
  const { jobId, tenantId, connector, phase } = data;

  console.log(`[Loader] Starting background sync ${phase} for ${connector}, job ${jobId}`);

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(env.DATABASE_URL);

  // Schema-driven: resolve entity types from schema config
  const entityTypes = await getSchemaEntityTypes(env, tenantId, connector);
  if (entityTypes.length === 0) {
    console.warn(
      `[Loader] No schema-defined entity types for ${connector} (tenant ${tenantId}). Skipping.`
    );
    await sql`
      UPDATE sync_jobs
      SET status = 'completed',
          completed_at = NOW(),
          progress = ${JSON.stringify({ phase, percentage: 100, note: "No schema-defined entity types" })}
      WHERE id = ${jobId}
    `;
    return;
  }

  // Update progress
  await sql`
    UPDATE sync_jobs
    SET progress = ${JSON.stringify({ phase, percentage: 0 })}
    WHERE id = ${jobId}
  `;

  // Retrieve token (Nango-first, legacy fallback)
  let accessToken: string | null = null;
  const nangoKeyBg = (env as any).NANGO_SECRET_KEY as string | undefined;

  if (nangoKeyBg) {
    try {
      accessToken = await getConnectionToken(
        {
          NANGO_SECRET_KEY: nangoKeyBg,
          NANGO_BASE_URL: (env as any).NANGO_BASE_URL as string | undefined,
        },
        toNangoIntegrationId(connector),
        tenantId
      );
    } catch {
      // fall through to legacy
    }
  }

  if (!accessToken) {
    try {
      accessToken = await getValidAccessToken(
        {
          EDGE_DB: (env as any).EDGE_DB,
          TOKEN_ENCRYPTION_KEY: (env as any).TOKEN_ENCRYPTION_KEY,
          CONNECTOR_STATUS: env.CONNECTOR_STATUS,
        },
        tenantId,
        connector
      );
    } catch {
      // Non-fatal for api_key providers
    }
  }

  const connectorInstance = buildConnectorInstance(connector, accessToken);

  const syncOpts: SyncOptions = {
    phase: phase as "needed" | "delta",
    since: phase === "delta" ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : undefined,
  };

  let records: Array<Record<string, any>> = [];
  try {
    const syncResult = await universalSync(connector, connectorInstance, syncOpts);
    // Schema-driven filter
    records = syncResult.entities
      .filter((e) => entityTypes.includes(e.entity_type))
      .map((e) => ({
        id: e.source_id,
        entity_type: e.entity_type,
        name: e.name,
        source: e.source,
        source_id: e.source_id,
        data: e.data,
      }));
    console.log(
      `[Loader] Background sync ${phase} returned ${syncResult.entities.length} raw, ` +
        `${records.length} after schema filter for ${connector}`
    );
  } catch (syncErr) {
    console.error(`[Loader] Background sync adapter error for ${connector}:`, syncErr);
  }

  // Send to pipeline
  if (env.MCP && records.length > 0) {
    // Normalize phase for contract: "needed" → "full" (they're semantically equivalent)
    const normalizedPhase: "creamy" | "delta" | "full" =
      phase === "needed" ? "full" : phase === "delta" ? "delta" : "full";
    const sourceType: PipelineQueueMessage["source_type"] =
      normalizedPhase === "delta" ? "loader_delta" : "loader_full";

    for (const record of records) {
      const pipelineMsg: PipelineQueueMessage = {
        message_version: 1,
        stage: "analyze",
        source: connector,
        source_type: sourceType,
        tenant_id: tenantId,
        payload: {
          ...record,
          _entity_type: record.entity_type || "unknown",
          _source_id: record.id || record.source_id || crypto.randomUUID(),
          _tenant_id: tenantId,
        },
        metadata: {
          trace_id: `loader-${jobId}-${crypto.randomUUID()}`,
          attempt: 0,
          received_at: new Date().toISOString(),
          extracted_at: new Date().toISOString(),
          loader_job_id: jobId,
          phase: normalizedPhase,
          synced_at: new Date().toISOString(),
        },
      };
      await (env as any).MCP.fetch("http://internal/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "pipeline.ingest",
          arguments: {
            tenant_id: pipelineMsg.tenant_id,
            source: pipelineMsg.source,
            source_type: pipelineMsg.source_type,
            payload: pipelineMsg,
          },
        }),
      });
    }
    console.log(`[Loader] Sent ${records.length} records to pipeline from background sync`);
  }

  // Mark complete
  await sql`
    UPDATE sync_jobs
    SET status = 'completed',
        completed_at = NOW(),
        progress = ${JSON.stringify({ phase, percentage: 100 })}
    WHERE id = ${jobId}
  `;

  console.log(
    `[Loader] Background sync ${phase} complete for job ${jobId}: ${records.length} records`
  );
}

// ───────────────────────────────────────────────────────────────────────
// Scheduled Handler (Cron — Safety Net)
// ───────────────────────────────────────────────────────────────────────

/**
 * Cron handler (every 5 minutes via Connector worker).
 *
 * Safety net: discovers connectors that were connected via OAuth but never
 * had their creamy sync triggered (e.g., if the initial trigger failed).
 *
 * Flow:
 * 1. Query `connectors` table for all active connectors
 * 2. For each, check CONNECTOR_STATUS KV for existing sync entry
 * 3. If no entry → trigger creamy sync via CONNECTOR_SYNC service binding
 *
 * This does NOT replace the 6-hour delta sync in connector-sync.
 * This is a fast check to catch newly connected connectors.
 */
async function handleScheduled(env: LoaderEnv): Promise<void> {
  console.log("[Loader] Cron triggered — checking for unsynced connectors");

  if (!env.CONNECTOR_STATUS || !env.CONNECTOR_SYNC) {
    console.warn("[Loader] Missing CONNECTOR_STATUS or CONNECTOR_SYNC binding — skipping cron");
    return;
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(env.DATABASE_URL);

    // Query connectors table for active connectors.
    // Schema A (production): status = 'connected', has both tenant_id and user_id.
    // We only care about tenant-level — one sync per tenant+provider pair.
    const activeConnectors = await sql`
      SELECT DISTINCT tenant_id, provider
      FROM connectors
      WHERE status = 'connected'
        AND tenant_id IS NOT NULL
        AND sync_enabled = true
    `;

    if (!activeConnectors || activeConnectors.length === 0) {
      console.log("[Loader] No active connectors found");
      return;
    }

    let triggeredCount = 0;

    for (const row of activeConnectors) {
      const tenantId = row.tenant_id;
      const provider = row.provider;

      // Check if this connector already has a status entry (means it's been synced)
      const existingStatus = await env.CONNECTOR_STATUS.get(`sync:${tenantId}:${provider}`);
      if (existingStatus) {
        // Already known to connector-sync — skip
        continue;
      }

      // No status entry — this connector was connected but never synced.
      // Read schema to determine entity types before triggering.
      const schemaEntityTypes = await getSchemaEntityTypes(env, tenantId, provider);
      if (schemaEntityTypes.length === 0) {
        console.log(
          `[Loader] Skipping ${provider} for tenant ${tenantId} — no schema-defined entity types`
        );
        continue;
      }

      // Trigger creamy sync via CONNECTOR_SYNC
      try {
        const response = await env.CONNECTOR_SYNC.fetch(
          new Request(`http://connector-sync/api/sync/${tenantId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id": tenantId,
            },
            body: JSON.stringify({
              provider,
              phase: "creamy",
              entities: schemaEntityTypes,
            }),
          })
        );

        if (response.ok) {
          triggeredCount++;
          console.log(`[Loader] Triggered creamy sync for ${provider} (tenant ${tenantId})`);
        } else {
          const errText = await response.text().catch(() => "Unknown");
          console.error(
            `[Loader] Failed to trigger sync for ${provider} (tenant ${tenantId}): ${response.status} ${errText}`
          );
        }
      } catch (err) {
        console.error(`[Loader] Error triggering sync for ${provider} (tenant ${tenantId}):`, err);
      }
    }

    if (triggeredCount > 0) {
      console.log(`[Loader] Cron complete — triggered ${triggeredCount} new creamy syncs`);
    } else {
      console.log("[Loader] Cron complete — all connectors already synced");
    }
  } catch (err) {
    console.error("[Loader] Cron error:", err);
  }
}

// ───────────────────────────────────────────────────────────────────────
// Connector Instance Builder
// ───────────────────────────────────────────────────────────────────────

/**
 * Build a connector instance object for the universal sync adapter.
 * Provides authenticated API methods for various providers.
 */
function buildConnectorInstance(provider: string, accessToken: string | null): Record<string, any> {
  const base: Record<string, any> = {
    accessToken,
    config: { accessToken },
    // Other provider methods are handled via optional chaining in sync adapters
  };

  if (provider === "github" && accessToken) {
    // Return a thin wrapper + the real GitHubConnector for syncGitHub to use directly.
    // This enables real creamy + delta fetches for GitHub (Nango token path).
    try {
      const gh = createGitHubConnector({ token: accessToken });
      return {
        ...base,
        // High-level names expected by sync adapters (and direct)
        listRepos: (p?: any) => gh.listRepos(p),
        getRepos: (p?: any) => gh.listRepos(p),
        listIssues: (owner?: string, repo?: string, p?: any) => {
          if (owner && repo) return gh.listIssues(owner, repo, p);
          // Fallback for no-arg callers: sample top repos
          return (async () => {
            const rs = await gh.listRepos({ per_page: 5 });
            const out: any[] = [];
            for (const r of (rs || []).slice(0, 3)) {
              const full = r.full_name;
              if (!full) continue;
              const [o, n] = full.split("/");
              if (o && n) {
                try {
                  out.push(...(await gh.listIssues(o, n, { per_page: 5, state: "all" })));
                } catch {}
              }
            }
            return out;
          })();
        },
        getIssues: (o?: string, r?: string, p?: any) => (base as any).listIssues(o, r, p),
        listPullRequests: (owner?: string, repo?: string, p?: any) => {
          if (owner && repo) return gh.listPullRequests(owner, repo, p);
          return (async () => {
            const rs = await gh.listRepos({ per_page: 5 });
            const out: any[] = [];
            for (const r of (rs || []).slice(0, 3)) {
              const full = r.full_name;
              if (!full) continue;
              const [o, n] = full.split("/");
              if (o && n) {
                try {
                  out.push(...(await gh.listPullRequests(o, n, { per_page: 5, state: "all" })));
                } catch {}
              }
            }
            return out;
          })();
        },
        getPullRequests: (o?: string, r?: string, p?: any) =>
          (base as any).listPullRequests(o, r, p),
        listCommits: (owner?: string, repo?: string, p?: any) => {
          if (owner && repo) return gh.listCommits(owner, repo, p);
          return (async () => {
            const rs = await gh.listRepos({ per_page: 3 });
            const out: any[] = [];
            for (const r of (rs || []).slice(0, 2)) {
              const full = r.full_name;
              if (!full) continue;
              const [o, n] = full.split("/");
              if (o && n) {
                try {
                  out.push(...(await gh.listCommits(o, n, { per_page: 5 })));
                } catch {}
              }
            }
            return out;
          })();
        },
        getCommits: () => (base as any).listCommits(),
      };
    } catch (e) {
      // fallthrough to base token; syncGitHub will also try to construct
    }
  }

  // Google Sheets methods (existing)
  base.listSpreadsheets = accessToken
    ? async (params: any) => {
        const url = new URL("https://www.googleapis.com/drive/v3/files");
        url.searchParams.set("q", "mimeType = 'application/vnd.google-apps.spreadsheet'");
        url.searchParams.set("pageSize", String(params?.pageSize || 50));
        if (params?.pageToken) url.searchParams.set("pageToken", params.pageToken);
        url.searchParams.set("orderBy", "modifiedTime desc");
        url.searchParams.set(
          "fields",
          "nextPageToken,files(id,name,createdTime,modifiedTime,owners,webViewLink,shared)"
        );
        url.searchParams.set("supportsAllDrives", "true");
        url.searchParams.set("includeItemsFromAllDrives", "true");
        const resp = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!resp.ok) throw new Error(`Drive API ${resp.status}: ${await resp.text()}`);
        const data: any = await resp.json();
        return { files: data.files || [], nextPageToken: data.nextPageToken };
      }
    : undefined;
  base.getSpreadsheet = accessToken
    ? async (spreadsheetId: string) => {
        const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
        url.searchParams.set("fields", "spreadsheetId,properties,sheets.properties,spreadsheetUrl");
        const resp = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!resp.ok) throw new Error(`Sheets API ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
    : undefined;
  // Google Drive methods
  base.getFiles = accessToken
    ? async (params: any) => {
        const url = new URL("https://www.googleapis.com/drive/v3/files");
        url.searchParams.set("pageSize", String(params?.pageSize || 100));
        url.searchParams.set(
          "fields",
          "nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,shared,owners)"
        );
        url.searchParams.set("supportsAllDrives", "true");
        url.searchParams.set("includeItemsFromAllDrives", "true");
        const resp = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!resp.ok) throw new Error(`Drive API ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
    : undefined;

  return base;
}

// ───────────────────────────────────────────────────────────────────────
// Worker Export
// ───────────────────────────────────────────────────────────────────────

const worker = {
  async fetch(request: Request, env: LoaderEnv, ctx?: ExecutionContext): Promise<Response> {
    return await app.fetch(request, env, ctx);
  },

  async scheduled(_event: ScheduledEvent, env: LoaderEnv, _ctx: ExecutionContext): Promise<void> {
    await handleScheduled(env);
  },
};

export default worker;
