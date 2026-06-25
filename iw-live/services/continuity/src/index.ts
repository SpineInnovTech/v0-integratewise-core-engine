/**
 * Continuity Service — Cloudflare D1 Memory Layer (DECISION 22)
 *
 * HTTP service (Cloudflare Worker) providing:
 * - Session event write (append-only)
 * - Session read (events + checkpoints)
 * - Session listing (by user, status, tags)
 * - Triage integration (promote to canonical layer)
 * - TTL cleanup (scheduled)
 *
 * Data store: Cloudflare D1 (reads) + Pipeline db-proxy (writes).
 * Edge cache: D1 for fast session lookups.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import type {
  SessionEvent,
  SessionContainer,
  ContinuityCheckpoint,
  WriteEventRequest,
  WriteEventResponse,
  SessionListResult,
  SessionEventsResult,
  TriageDecision,
} from "./types";
export type {
  SessionEvent,
  SessionContainer,
  ContinuityCheckpoint,
  WriteEventRequest,
  WriteEventResponse,
  SessionListResult,
  SessionEventsResult,
  TriageDecision,
  EventType,
  SessionStatus,
  TriageOutcome,
} from "./types";

import {
  insert,
  update,
  select,
  selectOne,
  deleteRows,
  generateId,
  nowIso,
  type DbConfig,
} from "./supabase";
import { assembleContinuity, type ContinuityScope } from "./continuity-assembler";

// ============================================================================
// Environment
// ============================================================================

interface Env {
  // DECISION 22: Cloudflare-only product plane. D1 for reads, Pipeline db-proxy for writes.
  DEFAULT_TTL_DAYS: string;
  MAX_EVENTS_PER_SESSION: string;
  CHECKPOINT_INTERVAL: string;
  KNOWLEDGE: Fetcher;
  TASKS_QUEUE?: Queue;
  MCP_CONNECTOR?: Fetcher;
  TRIAGE_BOT_API_KEY?: string;
  DB: D1Database;
  PIPELINE: Fetcher;
}

function getConfig(env: Env) {
  return {
    defaultTtlDays: parseInt(env.DEFAULT_TTL_DAYS || "7"),
    maxEventsPerSession: parseInt(env.MAX_EVENTS_PER_SESSION || "1000"),
    checkpointInterval: parseInt(env.CHECKPOINT_INTERVAL || "50"),
  };
}

function sb(env: Env): DbConfig {
  return {
    DB: env.DB,
    PIPELINE: env.PIPELINE,
  };
}

// ============================================================================
// App Setup
// ============================================================================

const app = new Hono<{ Bindings: Env; Variables: { requestId: string; tenantId?: string } }>();
app.use("*", cors());

app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  const tenantId = c.req.header("x-tenant-id");
  c.res.headers.set("x-correlation-id", requestId);
  c.set("requestId", requestId);
  if (tenantId) c.set("tenantId", tenantId);
  await next();
});

// ============================================================================
// Health
// ============================================================================

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "continuity",
    store: "cloudflare-d1",
    version: "2.0.0",
  });
});

// ============================================================================
// POST /v1/continuity/events — Write Event (Core)
// ============================================================================

const WriteEventSchema = z.object({
  session_id: z.string().optional(),
  type: z.enum([
    "cognition.event",
    "entity.event",
    "governance.event",
    "workflow.event",
    "communication.event",
    "continuity.event",
    "system.event",
    "decision.event",
  ]),
  user_id: z.string().min(1),
  account_id: z.string().optional(),
  content: z.unknown(),
  source: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  parent_event_id: z.string().optional(),
});

app.post("/v1/continuity/events", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const body = await c.req.json().catch(() => ({}));
  const parsed = WriteEventSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid event", details: parsed.error.flatten() }, 400);
  }

  const config = getConfig(c.env);
  const db = sb(c.env);
  const req = parsed.data as WriteEventRequest;
  const timestamp = nowIso();
  const sessionId = req.session_id || generateId("sess");
  const eventId = generateId("event:" + req.type.split(".")[0]);

  // 1. Fetch or create session container
  let session: SessionContainer | null = null;
  let isNewSession = false;

  if (req.session_id) {
    const { data } = await selectOne<SessionContainer>(db, "memory.session_containers", {
      id: req.session_id,
      tenant_id: tenantId,
    });
    session = data;
  }

  if (!session) {
    isNewSession = true;
    session = {
      id: sessionId,
      tenant_id: tenantId,
      user_id: req.user_id,
      account_id: req.account_id,
      started_at: timestamp,
      last_event_at: timestamp,
      event_count: 1,
      status: "active",
      tags: [],
      metadata: {},
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { error } = await insert(
      db,
      "memory.session_containers",
      session as unknown as Record<string, unknown>
    );
    if (error) return c.json({ error: "Session create failed", message: error }, 500);
  } else {
    // Update existing session
    const { error } = await update(
      db,
      "memory.session_containers",
      { id: session.id },
      {
        last_event_at: timestamp,
        event_count: session.event_count + 1,
        updated_at: timestamp,
      }
    );
    if (error) return c.json({ error: "Session update failed", message: error }, 500);
    session.last_event_at = timestamp;
    session.event_count += 1;
  }

  // 2. Build event row
  const event: SessionEvent = {
    id: eventId,
    tenant_id: tenantId,
    session_id: sessionId,
    user_id: req.user_id,
    account_id: req.account_id,
    event_type: req.type,
    source: req.source,
    content:
      typeof req.content === "object" && req.content !== null
        ? (req.content as Record<string, unknown>)
        : { value: req.content },
    metadata: req.metadata || {},
    lineage: req.parent_event_id
      ? { parent_event_id: req.parent_event_id, root_session_id: sessionId }
      : { root_session_id: sessionId },
    created_at: timestamp,
  };

  // 3. Persist event
  const { error: eventError } = await insert(
    db,
    "memory.session_events",
    event as unknown as Record<string, unknown>
  );
  if (eventError) return c.json({ error: "Event write failed", message: eventError }, 500);

  // 4. Checkpoint if threshold reached
  let checkpointCreated: string | undefined;
  if (!isNewSession && session.event_count % config.checkpointInterval === 0) {
    checkpointCreated = await createCheckpoint(db, c.env, session);
  }

  // 5. Auto-close session if max events reached
  if (session.event_count >= config.maxEventsPerSession) {
    await update(
      db,
      "memory.session_containers",
      { id: session.id },
      {
        status: "closed",
        triage_status: "pending",
        updated_at: nowIso(),
      }
    );

    if (c.env.TASKS_QUEUE) {
      c.executionCtx.waitUntil(
        c.env.TASKS_QUEUE.send({
          type: "session_ready_for_triage",
          tenant_id: tenantId,
          session_id: sessionId,
          event_count: session.event_count,
        })
      );
    }
  }

  const response: WriteEventResponse = {
    event_id: eventId,
    session_id: sessionId,
    checkpoint_created: checkpointCreated,
  };

  return c.json({ success: true, data: response }, 201);
});

// ============================================================================
// GET /v1/continuity/sessions — List Sessions
// ============================================================================

app.get("/v1/continuity/sessions", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = sb(c.env);
  const userId = c.req.query("user_id");
  const accountId = c.req.query("account_id");
  const status = c.req.query("status");
  const since = c.req.query("since");
  const until = c.req.query("until");
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  const params: Record<string, string | undefined> = {
    tenant_id: `eq.${tenantId}`,
    order: "last_event_at.desc",
    limit: String(limit),
    offset: String(offset),
  };

  if (userId) params.user_id = `eq.${userId}`;
  if (accountId) params.account_id = `eq.${accountId}`;
  if (status) params.status = `eq.${status}`;
  if (since) params.last_event_at = `gte.${since}`;
  if (until) params.last_event_at = `lte.${until}`;

  const { data, error, count } = await select<SessionContainer>(
    db,
    "memory.session_containers",
    params,
    { count: "exact" }
  );

  if (error) return c.json({ error: "Query failed", message: error }, 500);

  const response: SessionListResult = {
    sessions: data || [],
    total: count || 0,
    limit,
    offset,
  };

  return c.json({ success: true, data: response });
});

// ============================================================================
// GET /v1/continuity/sessions/:id — Read Session + Events
// ============================================================================

app.get("/v1/continuity/sessions/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const sessionId = c.req.param("id");
  const db = sb(c.env);

  // 1. Get session container
  const { data: session, error: sessionError } = await selectOne<SessionContainer>(
    db,
    "memory.session_containers",
    { id: sessionId, tenant_id: tenantId }
  );

  if (sessionError || !session) return c.json({ error: "Session not found" }, 404);

  // 2. Get events ordered by created_at
  const { data: events } = await select<SessionEvent>(db, "memory.session_events", {
    session_id: `eq.${sessionId}`,
    tenant_id: `eq.${tenantId}`,
    order: "created_at.desc",
    limit: "500",
  });

  // 3. Get latest checkpoint
  const { data: checkpoints } = await select<ContinuityCheckpoint>(
    db,
    "memory.continuity_checkpoints",
    {
      session_id: `eq.${sessionId}`,
      tenant_id: `eq.${tenantId}`,
      order: "checkpoint_at.desc",
      limit: "1",
    }
  );

  const result: SessionEventsResult = {
    session,
    events: events || [],
    checkpoints: checkpoints || [],
    event_count: events?.length || 0,
  };

  return c.json({ success: true, data: result });
});

// ============================================================================
// POST /v1/continuity/sessions/:id/resume — Resume Session
// ============================================================================

app.post("/v1/continuity/sessions/:id/resume", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const sessionId = c.req.param("id");
  const db = sb(c.env);

  const { data: session, error: sessionError } = await selectOne<SessionContainer>(
    db,
    "memory.session_containers",
    { id: sessionId, tenant_id: tenantId }
  );

  if (sessionError || !session) return c.json({ error: "Session not found" }, 404);

  if (session.status === "closed") {
    return c.json({ error: "Session is closed, create a new one" }, 409);
  }

  // Update status to active
  await update(
    db,
    "memory.session_containers",
    { id: sessionId },
    {
      status: "active",
      last_event_at: nowIso(),
      updated_at: nowIso(),
    }
  );

  // Get latest checkpoint
  const { data: checkpoints } = await select<ContinuityCheckpoint>(
    db,
    "memory.continuity_checkpoints",
    {
      session_id: `eq.${sessionId}`,
      tenant_id: `eq.${tenantId}`,
      order: "checkpoint_at.desc",
      limit: "1",
    }
  );

  const checkpoint = checkpoints?.[0];

  // Get recent events
  const { data: events } = await select<SessionEvent>(db, "memory.session_events", {
    session_id: `eq.${sessionId}`,
    tenant_id: `eq.${tenantId}`,
    order: "created_at.desc",
    limit: "100",
  });

  return c.json({
    success: true,
    data: {
      session,
      checkpoint: checkpoint
        ? {
            id: checkpoint.id,
            at: checkpoint.checkpoint_at,
            compressed_state: checkpoint.compressed_state,
          }
        : null,
      recent_events: (events || []).map((e) => ({
        id: e.id,
        type: e.event_type,
        timestamp: e.created_at,
        source: e.source,
        content: e.content,
      })),
      event_count: events?.length || 0,
    },
  });
});

// ============================================================================
// POST /v1/continuity/sessions/:id/close — Close Session
// ============================================================================

app.post("/v1/continuity/sessions/:id/close", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const sessionId = c.req.param("id");
  const db = sb(c.env);

  const { data: session, error: sessionError } = await selectOne<SessionContainer>(
    db,
    "memory.session_containers",
    { id: sessionId, tenant_id: tenantId }
  );

  if (sessionError || !session) return c.json({ error: "Session not found" }, 404);

  await update(
    db,
    "memory.session_containers",
    { id: sessionId },
    {
      status: "closed",
      triage_status: "pending",
      last_event_at: nowIso(),
      updated_at: nowIso(),
    }
  );

  if (c.env.TASKS_QUEUE) {
    c.executionCtx.waitUntil(
      c.env.TASKS_QUEUE.send({
        type: "session_ready_for_triage",
        tenant_id: tenantId,
        session_id: sessionId,
        event_count: session.event_count,
      })
    );
  }

  return c.json({ success: true, data: { session_id: sessionId, status: "closed" } });
});

// ============================================================================
// POST /v1/continuity/sessions/:id/triage — Triage Decision
// ============================================================================

const TriageDecisionSchema = z.object({
  outcome: z.enum([
    "retain_ephemeral",
    "summarize",
    "promote_to_knowledge",
    "attach_artifact",
    "update_doctrine",
    "generate_projection",
    "archive",
  ]),
  reason: z.string().optional(),
  approved_by: z.string().optional(),
  promoted_entities: z.array(z.object({ type: z.string(), id: z.string() })).optional(),
});

app.post("/v1/continuity/sessions/:id/triage", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const sessionId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parsed = TriageDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid triage decision", details: parsed.error.flatten() }, 400);
  }

  const db = sb(c.env);

  const { data: session, error: sessionError } = await selectOne<SessionContainer>(
    db,
    "memory.session_containers",
    { id: sessionId, tenant_id: tenantId }
  );

  if (sessionError || !session) return c.json({ error: "Session not found" }, 404);

  const decision: TriageDecision = {
    session_id: sessionId,
    outcome: parsed.data.outcome,
    reason: parsed.data.reason,
    approved_by: parsed.data.approved_by,
    promoted_entities: parsed.data.promoted_entities,
  };

  // Update session with triage outcome
  await update(
    db,
    "memory.session_containers",
    { id: sessionId },
    {
      triage_status: parsed.data.outcome === "promote_to_knowledge" ? "approved" : "rejected",
      triage_outcome: parsed.data.outcome,
      updated_at: nowIso(),
    }
  );

  // If promoting, send to Knowledge service
  if (parsed.data.outcome === "promote_to_knowledge" && c.env.KNOWLEDGE) {
    c.executionCtx.waitUntil(promoteSessionToKnowledge(c.env, tenantId, sessionId, decision));
  }

  return c.json({ success: true, data: decision });
});

// ============================================================================
// POST /v1/continuity/search — Search Events by Content
// ============================================================================

app.get("/v1/continuity/assemble", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const userId = c.req.query("user_id") || c.req.header("x-user-id") || undefined;
  const role = c.req.query("role") || undefined;
  const scopesParam = c.req.query("scopes");
  const scopes = scopesParam
    ? (scopesParam.split(",").map((s) => s.trim()) as ContinuityScope[])
    : undefined;
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit") as string, 10) : undefined;

  const bundle = await assembleContinuity(c.env.DB, { tenantId, userId, role, scopes, limit });
  return c.json(bundle);
});

app.post("/v1/continuity/search", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const body = await c.req.json().catch(() => ({}));
  const {
    q,
    type,
    user_id,
    limit = 20,
  } = body as {
    q?: string;
    type?: string;
    user_id?: string;
    limit?: number;
  };

  if (!q) return c.json({ error: "Query 'q' required" }, 400);

  const db = sb(c.env);

  // PostgREST text search on content JSONB
  const params: Record<string, string | undefined> = {
    tenant_id: `eq.${tenantId}`,
    content: `cs."${q}"`,
    order: "created_at.desc",
    limit: String(Math.min(limit, 100)),
    select: "id,event_type,session_id,created_at,source,user_id,content",
  };

  if (type) params.event_type = `eq.${type}`;
  if (user_id) params.user_id = `eq.${user_id}`;

  const { data, error } = await select<SessionEvent>(db, "memory.session_events", params);

  if (error) return c.json({ error: "Search failed", message: error }, 500);

  return c.json({
    success: true,
    data: { query: q, results: data || [], count: data?.length || 0 },
  });
});

// ============================================================================
// DELETE /v1/continuity/sessions/:id — Purge Session (GDPR)
// ============================================================================

app.delete("/v1/continuity/sessions/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const sessionId = c.req.param("id");
  const db = sb(c.env);

  // Delete events
  const { error: eventsError } = await deleteRows(db, "memory.session_events", {
    session_id: sessionId,
    tenant_id: tenantId,
  });

  // Delete checkpoints
  await deleteRows(db, "memory.continuity_checkpoints", {
    session_id: sessionId,
    tenant_id: tenantId,
  });

  // Delete container
  const { error: containerError } = await deleteRows(db, "memory.session_containers", {
    id: sessionId,
    tenant_id: tenantId,
  });

  if (eventsError || containerError) {
    return c.json({ error: "Purge failed", message: eventsError || containerError }, 500);
  }

  return c.json({ success: true, data: { session_id: sessionId } });
});

// ============================================================================
// Scheduled: L0.5 Operating Layer Cron Triggers
// ============================================================================

export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const cron = event.cron;
  console.log(`[Continuity Scheduled] Triggered: ${cron}`);

  // 7am Morning Brief
  if (cron === "0 7 * * *") {
    await handleMorningBrief(env);
    return;
  }

  // Midnight Reindex + Backup
  if (cron === "0 0 * * *") {
    await handleDailyBackup(env);
    return;
  }

  // 6-hour TTL Cleanup
  if (cron === "0 */6 * * *") {
    await handleTTLCleanup(env);
    return;
  }

  console.warn(`[Continuity Scheduled] Unknown cron pattern: ${cron}`);
}

async function handleMorningBrief(env: Env): Promise<void> {
  console.log("[Continuity MorningBrief] Starting 7am brief generation");

  try {
    // TODO: Wire to MorningBriefWorkflow when ready
    // For now: trigger brief generation via Knowledge service
    if (env.KNOWLEDGE) {
      await env.KNOWLEDGE.fetch(
        new Request("http://knowledge/v1/brief/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "morning",
            timestamp: new Date().toISOString(),
          }),
        })
      );
      console.log("[Continuity MorningBrief] Triggered brief generation");
    }
  } catch (err: any) {
    console.error("[Continuity MorningBrief] Failed:", err.message);
  }
}

async function handleDailyBackup(env: Env): Promise<void> {
  console.log("[Continuity Backup] Starting daily reindex + backup");

  try {
    const db = sb(env);

    // 1. Count sessions for stats
    const { data: stats } = await select<{ count: number }>(db, "memory.session_containers", {
      select: "count(*)",
    });

    console.log(`[Continuity Backup] Total sessions: ${stats?.[0]?.count || 0}`);

    // TODO: Replace with AI Search when available (PRIORITY 4)
    // For now: basic backup complete message
    console.log("[Continuity Backup] D1 → R2 export pending AI Search migration");
  } catch (err: any) {
    console.error("[Continuity Backup] Failed:", err.message);
  }
}

async function handleTTLCleanup(env: Env): Promise<void> {
  const config = getConfig(env);
  const db = sb(env);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.defaultTtlDays);
  const cutoffIso = cutoffDate.toISOString();

  console.log(`[Continuity Cleanup] Starting. Cutoff: ${cutoffIso}`);

  // Find expired sessions
  const { data: expiredSessions } = await select<SessionContainer>(
    db,
    "memory.session_containers",
    {
      last_event_at: `lt.${cutoffIso}`,
      status: "eq.closed",
      limit: "100",
    }
  );

  if (!expiredSessions || expiredSessions.length === 0) {
    console.log("[Continuity Cleanup] No expired sessions found.");
    return;
  }

  let totalDeleted = 0;

  for (const session of expiredSessions) {
    // Delete events for this session
    await deleteRows(db, "memory.session_events", { session_id: session.id });

    // Delete checkpoints
    await deleteRows(db, "memory.continuity_checkpoints", { session_id: session.id });

    // Delete container
    await deleteRows(db, "memory.session_containers", { id: session.id });

    totalDeleted++;
    console.log(`[Continuity Cleanup] Purged session ${session.id}`);
  }

  console.log(`[Continuity Cleanup] Done. Purged ${totalDeleted} sessions.`);
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function createCheckpoint(
  db: DbConfig,
  env: Env,
  session: SessionContainer
): Promise<string> {
  const checkpointId = `checkpoint:${session.id}:${Date.now()}`;
  const timestamp = nowIso();

  // Get first and last events for range
  const { data: firstEvents } = await select<SessionEvent>(db, "memory.session_events", {
    session_id: `eq.${session.id}`,
    tenant_id: `eq.${session.tenant_id}`,
    order: "created_at.asc",
    limit: "1",
    select: "id",
  });

  const { data: lastEvents } = await select<SessionEvent>(db, "memory.session_events", {
    session_id: `eq.${session.id}`,
    tenant_id: `eq.${session.tenant_id}`,
    order: "created_at.desc",
    limit: "1",
    select: "id",
  });

  const checkpoint = {
    id: checkpointId,
    tenant_id: session.tenant_id,
    session_id: session.id,
    user_id: session.user_id,
    checkpoint_at: timestamp,
    event_range: {
      from: firstEvents?.[0]?.id || session.id,
      to: lastEvents?.[0]?.id || session.id,
    },
    compressed_state: JSON.stringify({
      event_count: session.event_count,
      summary: session.summary,
      tags: session.tags,
      last_event_at: session.last_event_at,
    }),
  };

  await insert(db, "memory.continuity_checkpoints", checkpoint);
  return checkpointId;
}

async function promoteSessionToKnowledge(
  env: Env,
  tenantId: string,
  sessionId: string,
  decision: TriageDecision
): Promise<void> {
  const db = sb(env);

  try {
    const { data: session } = await selectOne<SessionContainer>(db, "memory.session_containers", {
      id: sessionId,
      tenant_id: tenantId,
    });

    const { data: events } = await select<SessionEvent>(db, "memory.session_events", {
      session_id: `eq.${sessionId}`,
      tenant_id: `eq.${tenantId}`,
      order: "created_at.asc",
      limit: "10000",
    });

    const payload = {
      source: "continuity",
      session_id: sessionId,
      tenant_id: tenantId,
      summary: session?.summary || `Session ${sessionId}`,
      events: (events || []).map((e) => ({
        type: e.event_type,
        timestamp: e.created_at,
        source: e.source,
        content: typeof e.content === "string" ? e.content : JSON.stringify(e.content),
      })),
      metadata: {
        event_count: events?.length || 0,
        triage_outcome: decision.outcome,
        approved_by: decision.approved_by,
        reason: decision.reason,
        promoted_entities: decision.promoted_entities,
      },
    };

    await env.KNOWLEDGE.fetch(
      new Request("http://internal/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify(payload),
      })
    );

    // Mark session as promoted
    if (session) {
      await update(
        db,
        "memory.session_containers",
        { id: session.id },
        {
          triage_status: "approved",
          updated_at: nowIso(),
        }
      );
    }

    console.log(`[Continuity] Promoted session ${sessionId} to knowledge`);
  } catch (err) {
    console.error(`[Continuity] Promotion failed for ${sessionId}:`, err);
  }
}

// ============================================================================
// Queue Handler: continuity-triage
// ============================================================================

export async function queue(
  batch: MessageBatch<{
    type: string;
    tenant_id: string;
    session_id: string;
    event_count?: number;
  }>,
  env: Env
): Promise<void> {
  console.log(`[Continuity Queue] Processing ${batch.messages.length} messages`);

  for (const message of batch.messages) {
    try {
      const { type, tenant_id, session_id, event_count } = message.body;

      if (type === "session_ready_for_triage") {
        await handleTriageRequest(env, tenant_id, session_id, event_count);
        message.ack();
      } else {
        console.warn(`[Continuity Queue] Unknown message type: ${type}`);
        message.ack(); // Ack unknown types to prevent retry
      }
    } catch (err: any) {
      console.error(`[Continuity Queue] Message processing failed:`, err.message);
      message.retry();
    }
  }
}

async function handleTriageRequest(
  env: Env,
  tenantId: string,
  sessionId: string,
  eventCount?: number
): Promise<void> {
  console.log(`[Continuity Triage] Processing session ${sessionId} (${eventCount} events)`);

  try {
    const db = sb(env);

    // Fetch session
    const { data: session } = await selectOne<SessionContainer>(db, "memory.session_containers", {
      id: sessionId,
      tenant_id: tenantId,
    });

    if (!session) {
      console.error(`[Continuity Triage] Session ${sessionId} not found`);
      return;
    }

    // Fetch events
    const { data: events } = await select<SessionEvent>(db, "memory.session_events", {
      session_id: `eq.${sessionId}`,
      tenant_id: `eq.${tenantId}`,
      order: "created_at.asc",
      limit: "1000",
    });

    if (!events || events.length === 0) {
      console.warn(`[Continuity Triage] No events found for session ${sessionId}`);
      return;
    }

    // Auto-triage logic (placeholder — replace with AI analysis)
    const shouldPromote = events.length > 50; // Simple rule for now

    if (shouldPromote) {
      // Promote to knowledge
      const decision: TriageDecision = {
        session_id: sessionId,
        outcome: "promote_to_knowledge",
        reason: "Auto-promoted: high-value session with significant event count",
        approved_by: "triage-bot",
      };

      await promoteSessionToKnowledge(env, tenantId, sessionId, decision);

      // Update session status
      await update(
        db,
        "memory.session_containers",
        { id: sessionId },
        {
          triage_status: "approved",
          triage_outcome: "promote_to_knowledge",
          updated_at: nowIso(),
        }
      );

      console.log(`[Continuity Triage] Session ${sessionId} promoted to knowledge`);
    } else {
      // Retain as ephemeral
      await update(
        db,
        "memory.session_containers",
        { id: sessionId },
        {
          triage_status: "approved",
          triage_outcome: "retain_ephemeral",
          updated_at: nowIso(),
        }
      );

      console.log(`[Continuity Triage] Session ${sessionId} retained as ephemeral`);
    }
  } catch (err: any) {
    console.error(`[Continuity Triage] Failed for session ${sessionId}:`, err.message);
    throw err; // Retry on failure
  }
}

export default app;

// Export scheduled handler for Cloudflare Workers cron triggers
export { handleScheduled as scheduled };
