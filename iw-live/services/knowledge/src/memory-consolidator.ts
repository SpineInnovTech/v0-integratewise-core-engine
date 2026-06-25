/**
 * IntegrateWise - Memory Consolidator Workflow
 *
 * Scheduled worker that aggregates session memories by:
 * - Topic/subtopic clustering
 * - User/account patterns
 * - Time-based cohorts
 *
 * Cron Schedules:
 * - Hourly: Consolidate recent sessions into short-term memory
 * - Daily: Deep consolidation into long-term memory
 * - Weekly: Cross-account pattern extraction
 */

import { Hono } from "hono";
import { DurableObject } from "cloudflare:workers";

// =============================================================================
// TYPES
// =============================================================================

interface Env {
  DB: D1Database;
  // DECISION 22: Cloudflare-only product plane. D1 is canonical store.
  STATE: KVNamespace;
  CONSOLIDATOR: DurableObjectNamespace;
  IQ_HUB: Fetcher;
  KNOWLEDGE: Fetcher;
  TENANTS: Fetcher;
  THINK: Fetcher;
  TASKS_QUEUE: Queue;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CONSOLIDATION_BATCH_SIZE: string;
  MIN_SESSIONS_FOR_CONSOLIDATION: string;
  MEMORY_RETENTION_DAYS: string;
}

interface ConsolidationTask {
  type: "hourly" | "daily" | "weekly";
  tenant_id?: string;
  topic_id?: string;
  user_id?: string;
  account_id?: string;
  start_time: string;
  end_time: string;
}

interface SessionMemory {
  id: string;
  tenant_id: string;
  user_id: string;
  account_id?: string;
  topic: string;
  subtopic?: string;
  content: string;
  insights: string[];
  entities_mentioned: string[];
  sentiment: number;
  created_at: string;
}

interface ConsolidatedMemory {
  id: string;
  tenant_id: string;
  consolidation_type: "topic" | "user" | "account" | "pattern";
  topic?: string;
  user_id?: string;
  account_id?: string;
  summary: string;
  key_insights: string[];
  recurring_themes: string[];
  action_patterns: string[];
  session_count: number;
  time_range_start: string;
  time_range_end: string;
  created_at: string;
}

// =============================================================================
// DURABLE OBJECT: Memory Consolidator Coordinator
// =============================================================================

export class MemoryConsolidator extends DurableObject {
  private state: DurableObjectState;
  protected env: Env;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/acquire-lock":
        return this.acquireLock(request);
      case "/release-lock":
        return this.releaseLock(request);
      case "/status":
        return this.getStatus();
      default:
        return new Response("Not Found", { status: 404 });
    }
  }

  private async acquireLock(request: Request): Promise<Response> {
    const { lock_key, ttl_seconds } = (await request.json()) as {
      lock_key: string;
      ttl_seconds: number;
    };

    const existingLock = await this.state.storage.get<number>(`lock:${lock_key}`);
    const now = Date.now();

    if (existingLock && existingLock > now) {
      return Response.json({ acquired: false, expires_at: existingLock });
    }

    const expiresAt = now + ttl_seconds * 1000;
    await this.state.storage.put(`lock:${lock_key}`, expiresAt);

    return Response.json({ acquired: true, expires_at: expiresAt });
  }

  private async releaseLock(request: Request): Promise<Response> {
    const { lock_key } = (await request.json()) as { lock_key: string };
    await this.state.storage.delete(`lock:${lock_key}`);
    return Response.json({ released: true });
  }

  private async getStatus(): Promise<Response> {
    const storage = await this.state.storage.list();
    const locks: Record<string, number> = {};

    for (const [key, value] of storage) {
      if (key.startsWith("lock:")) {
        locks[key.replace("lock:", "")] = value as number;
      }
    }

    return Response.json({ locks, timestamp: Date.now() });
  }
}

// =============================================================================
// D1 Helpers (DECISION 22 — Cloudflare-only product plane)
// =============================================================================

// =============================================================================
// APP SETUP
// =============================================================================

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "integratewise-memory-consolidator",
    description: "Memory Consolidator Workflow - Scheduled aggregation of session memories",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Manual trigger endpoint (for testing)
app.post("/trigger/:type", async (c) => {
  const type = c.req.param("type") as "hourly" | "daily" | "weekly";

  if (!["hourly", "daily", "weekly"].includes(type)) {
    return c.json({ error: "Invalid consolidation type" }, 400);
  }

  const now = new Date();
  const task: ConsolidationTask = {
    type,
    start_time: getStartTime(type, now).toISOString(),
    end_time: now.toISOString(),
  };

  await c.env.TASKS_QUEUE.send(task);

  return c.json({ status: "queued", task });
});

// Status endpoint
app.get("/status", async (c) => {
  const consolidatorId = c.env.CONSOLIDATOR.idFromName("global");
  const consolidator = c.env.CONSOLIDATOR.get(consolidatorId);

  const response = await consolidator.fetch(new Request("http://internal/status"));
  const status = await response.json();

  // Get last run times from KV
  const lastHourly = await c.env.STATE.get("last_hourly_run");
  const lastDaily = await c.env.STATE.get("last_daily_run");
  const lastWeekly = await c.env.STATE.get("last_weekly_run");

  return c.json({
    ...(status as Record<string, unknown>),
    last_runs: {
      hourly: lastHourly,
      daily: lastDaily,
      weekly: lastWeekly,
    },
  });
});

// =============================================================================
// SCHEDULED HANDLER
// =============================================================================

async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  void event;
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  console.log(`[Memory Consolidator] Scheduled event triggered at ${now.toISOString()}`);

  // Determine consolidation type based on cron pattern
  let type: "hourly" | "daily" | "weekly";

  if (hour === 0 && dayOfWeek === 0) {
    // Weekly (Sunday at midnight)
    type = "weekly";
  } else if (hour === 0) {
    // Daily (midnight)
    type = "daily";
  } else {
    // Hourly
    type = "hourly";
  }

  // Acquire lock to prevent duplicate processing
  const consolidatorId = env.CONSOLIDATOR.idFromName("global");
  const consolidator = env.CONSOLIDATOR.get(consolidatorId);

  const lockResponse = await consolidator.fetch(
    new Request("http://internal/acquire-lock", {
      method: "POST",
      body: JSON.stringify({ lock_key: `consolidation_${type}`, ttl_seconds: 3600 }),
    })
  );

  const lockResult = (await lockResponse.json()) as { acquired: boolean };

  if (!lockResult.acquired) {
    console.log(`[Memory Consolidator] Lock not acquired for ${type}, skipping`);
    return;
  }

  try {
    // Get all active tenants
    const tenants = await getActiveTenants(env);

    for (const tenantId of tenants) {
      const task: ConsolidationTask = {
        type,
        tenant_id: tenantId,
        start_time: getStartTime(type, now).toISOString(),
        end_time: now.toISOString(),
      };

      await env.TASKS_QUEUE.send(task);
    }

    // Update last run time
    await env.STATE.put(`last_${type}_run`, now.toISOString());

    console.log(`[Memory Consolidator] Queued ${tenants.length} ${type} consolidation tasks`);
  } finally {
    // Release lock
    await consolidator.fetch(
      new Request("http://internal/release-lock", {
        method: "POST",
        body: JSON.stringify({ lock_key: `consolidation_${type}` }),
      })
    );
  }
}

// =============================================================================
// QUEUE HANDLER
// =============================================================================

async function handleQueue(batch: MessageBatch<ConsolidationTask>, env: Env): Promise<void> {
  for (const message of batch.messages) {
    const task = message.body;

    console.log(`[Memory Consolidator] Processing ${task.type} task for tenant ${task.tenant_id}`);

    try {
      switch (task.type) {
        case "hourly":
          await processHourlyConsolidation(env, task);
          break;
        case "daily":
          await processDailyConsolidation(env, task);
          break;
        case "weekly":
          await processWeeklyConsolidation(env, task);
          break;
      }

      message.ack();
    } catch (error) {
      console.error(`[Memory Consolidator] Error processing task:`, error);
      message.retry();
    }
  }
}

// =============================================================================
// CONSOLIDATION PROCESSORS
// =============================================================================

/**
 * Hourly Consolidation
 * - Aggregate recent sessions (last hour) into topic-based short-term memory
 * - Fast, lightweight processing
 */
async function processHourlyConsolidation(env: Env, task: ConsolidationTask): Promise<void> {
  if (!task.tenant_id) return;

  // Fetch recent sessions from IQ Hub
  const sessions = await fetchRecentSessions(env, task.tenant_id, task.start_time, task.end_time);

  if (sessions.length < parseInt(env.MIN_SESSIONS_FOR_CONSOLIDATION)) {
    console.log(
      `[Hourly] Skipping tenant ${task.tenant_id}: insufficient sessions (${sessions.length})`
    );
    return;
  }

  // Group by topic
  const topicGroups = groupSessionsByTopic(sessions);

  for (const [topic, topicSessions] of Object.entries(topicGroups)) {
    if (topicSessions.length < 2) continue;

    // Generate summary using Think service
    const summary = await generateTopicSummary(env, task.tenant_id, topic, topicSessions);

    // Store consolidated memory
    await storeConsolidatedMemory(env, {
      id: crypto.randomUUID(),
      tenant_id: task.tenant_id,
      consolidation_type: "topic",
      topic,
      summary: summary.summary,
      key_insights: summary.insights,
      recurring_themes: summary.themes,
      action_patterns: summary.actions,
      session_count: topicSessions.length,
      time_range_start: task.start_time,
      time_range_end: task.end_time,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Daily Consolidation
 * - Deep consolidation of all day's sessions
 * - User-level patterns
 * - Account health signals
 */
async function processDailyConsolidation(env: Env, task: ConsolidationTask): Promise<void> {
  if (!task.tenant_id) return;

  const sessions = await fetchRecentSessions(env, task.tenant_id, task.start_time, task.end_time);

  if (sessions.length === 0) {
    console.log(`[Daily] Skipping tenant ${task.tenant_id}: no sessions`);
    return;
  }

  // 1. User-level consolidation
  const userGroups = groupSessionsByUser(sessions);

  for (const [userId, userSessions] of Object.entries(userGroups)) {
    if (userSessions.length < 2) continue;

    const summary = await generateUserSummary(env, task.tenant_id, userId, userSessions);

    await storeConsolidatedMemory(env, {
      id: crypto.randomUUID(),
      tenant_id: task.tenant_id,
      consolidation_type: "user",
      user_id: userId,
      summary: summary.summary,
      key_insights: summary.insights,
      recurring_themes: summary.themes,
      action_patterns: summary.actions,
      session_count: userSessions.length,
      time_range_start: task.start_time,
      time_range_end: task.end_time,
      created_at: new Date().toISOString(),
    });
  }

  // 2. Account-level consolidation
  const accountGroups = groupSessionsByAccount(sessions);

  for (const [accountId, accountSessions] of Object.entries(accountGroups)) {
    if (accountSessions.length < 2) continue;

    const summary = await generateAccountSummary(env, task.tenant_id, accountId, accountSessions);

    await storeConsolidatedMemory(env, {
      id: crypto.randomUUID(),
      tenant_id: task.tenant_id,
      consolidation_type: "account",
      account_id: accountId,
      summary: summary.summary,
      key_insights: summary.insights,
      recurring_themes: summary.themes,
      action_patterns: summary.actions,
      session_count: accountSessions.length,
      time_range_start: task.start_time,
      time_range_end: task.end_time,
      created_at: new Date().toISOString(),
    });

    // Send account health signal to Think service
    if (summary.risk_level && summary.risk_level !== "normal") {
      await sendAccountHealthSignal(env, task.tenant_id, accountId, summary);
    }
  }

  // 3. Cleanup old memories (beyond retention)
  await cleanupOldMemories(env, task.tenant_id);
}

/**
 * Weekly Consolidation
 * - Cross-account pattern extraction
 * - Trend analysis
 * - Best practice identification
 */
async function processWeeklyConsolidation(env: Env, task: ConsolidationTask): Promise<void> {
  if (!task.tenant_id) return;

  // Fetch consolidated memories from the past week
  const memories = await fetchWeeklyConsolidatedMemories(
    env,
    task.tenant_id,
    task.start_time,
    task.end_time
  );

  if (memories.length < 5) {
    console.log(`[Weekly] Skipping tenant ${task.tenant_id}: insufficient memories`);
    return;
  }

  // Extract cross-cutting patterns
  const patterns = await extractCrossAccountPatterns(env, task.tenant_id, memories);

  await storeConsolidatedMemory(env, {
    id: crypto.randomUUID(),
    tenant_id: task.tenant_id,
    consolidation_type: "pattern",
    summary: patterns.summary,
    key_insights: patterns.insights,
    recurring_themes: patterns.themes,
    action_patterns: patterns.best_practices,
    session_count: memories.length,
    time_range_start: task.start_time,
    time_range_end: task.end_time,
    created_at: new Date().toISOString(),
  });

  // Update knowledge base with extracted patterns
  await updateKnowledgeBase(env, task.tenant_id, patterns);
}

// =============================================================================
// DATA FETCHERS
// =============================================================================

async function getActiveTenants(env: Env): Promise<string[]> {
  try {
    const response = await env.TENANTS.fetch("http://internal/v1/tenants/active", {
      headers: { "x-internal-service": "memory-consolidator" },
    });

    if (!response.ok) {
      console.error("Failed to fetch active tenants");
      return [];
    }

    const data = (await response.json()) as { tenants: string[] };
    return data.tenants || [];
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }
}

/**
 * §17.2: Fetch approved triage items (primary source for consolidation).
 * Only approved items are promoted to compounding. Replaces IQ Hub sessions as input.
 */
async function fetchApprovedTriageItems(
  env: Env,
  tenantId: string,
  startTime: string,
  endTime: string
): Promise<SessionMemory[]> {
  try {
    const url = new URL("http://internal/v1/triage/approved");
    url.searchParams.set("tenant_id", tenantId);
    url.searchParams.set("start_time", startTime);
    url.searchParams.set("end_time", endTime);
    url.searchParams.set("limit", env.CONSOLIDATION_BATCH_SIZE);

    const response = await env.IQ_HUB.fetch(url.toString(), {
      headers: {
        "x-tenant-id": tenantId,
        "x-internal-service": "memory-consolidator",
      },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { success?: boolean; data?: { items: any[] } };
    const items = data.data?.items ?? (data as any).items ?? [];
    return items.map((row: any) => ({
      id: row.id ?? row.message_id ?? crypto.randomUUID(),
      tenant_id: row.metadata?.tenant_id ?? tenantId,
      user_id: row.metadata?.user_id ?? row.user_id ?? "",
      account_id: row.metadata?.account_id ?? row.account_id,
      topic: row.category ?? "general",
      subtopic: undefined,
      content: row.content ?? "",
      insights: row.metadata?.insights ?? [],
      entities_mentioned: row.metadata?.entities_mentioned ?? [],
      sentiment: typeof row.sentiment === "number" ? row.sentiment : 0,
      created_at: row.created_at ?? new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching approved triage items:", error);
    return [];
  }
}

/**
 * Fetch recent sessions for consolidation. §17.2: Uses approved triage items only.
 * Fallback to IQ Hub sessions when no approved triage (backward compat during migration).
 */
async function fetchRecentSessions(
  env: Env,
  tenantId: string,
  startTime: string,
  endTime: string
): Promise<SessionMemory[]> {
  const approved = await fetchApprovedTriageItems(env, tenantId, startTime, endTime);
  if (approved.length > 0) return approved;

  try {
    const url = new URL("http://internal/iq/sessions");
    url.searchParams.set("start_time", startTime);
    url.searchParams.set("end_time", endTime);
    url.searchParams.set("limit", env.CONSOLIDATION_BATCH_SIZE);

    const response = await env.IQ_HUB.fetch(url.toString(), {
      headers: {
        "x-tenant-id": tenantId,
        "x-internal-service": "memory-consolidator",
      },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { items: SessionMemory[] };
    return data.items || [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

async function fetchWeeklyConsolidatedMemories(
  env: Env,
  tenantId: string,
  startTime: string,
  endTime: string
): Promise<ConsolidatedMemory[]> {
  try {
    // DECISION 22: D1 is canonical store
    const { results } = await env.DB.prepare(
      `SELECT * FROM consolidated_memories
       WHERE tenant_id = ? AND created_at >= ? AND created_at <= ?
         AND consolidation_type IN ('topic', 'user', 'account')
       ORDER BY created_at DESC`
    )
      .bind(tenantId, startTime, endTime)
      .all();

    return (results || []).map((row: any) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      consolidation_type: row.consolidation_type,
      topic: row.topic,
      user_id: row.user_id,
      account_id: row.account_id,
      summary: row.summary,
      key_insights:
        typeof row.key_insights === "string"
          ? JSON.parse(row.key_insights)
          : row.key_insights || [],
      recurring_themes:
        typeof row.recurring_themes === "string"
          ? JSON.parse(row.recurring_themes)
          : row.recurring_themes || [],
      action_patterns:
        typeof row.action_patterns === "string"
          ? JSON.parse(row.action_patterns)
          : row.action_patterns || [],
      session_count: row.session_count,
      time_range_start: row.time_range_start,
      time_range_end: row.time_range_end,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error("Error fetching weekly memories:", error);
    return [];
  }
}

// =============================================================================
// GROUPING HELPERS
// =============================================================================

function groupSessionsByTopic(sessions: SessionMemory[]): Record<string, SessionMemory[]> {
  return sessions.reduce(
    (acc, session) => {
      const topic = session.topic || "general";
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(session);
      return acc;
    },
    {} as Record<string, SessionMemory[]>
  );
}

function groupSessionsByUser(sessions: SessionMemory[]): Record<string, SessionMemory[]> {
  return sessions.reduce(
    (acc, session) => {
      if (!acc[session.user_id]) acc[session.user_id] = [];
      acc[session.user_id].push(session);
      return acc;
    },
    {} as Record<string, SessionMemory[]>
  );
}

function groupSessionsByAccount(sessions: SessionMemory[]): Record<string, SessionMemory[]> {
  return sessions.reduce(
    (acc, session) => {
      if (!session.account_id) return acc;
      if (!acc[session.account_id]) acc[session.account_id] = [];
      acc[session.account_id].push(session);
      return acc;
    },
    {} as Record<string, SessionMemory[]>
  );
}

// =============================================================================
// SUMMARY GENERATORS (using Think service)
// =============================================================================

interface SummaryResult {
  summary: string;
  insights: string[];
  themes: string[];
  actions: string[];
  risk_level?: "normal" | "elevated" | "high" | "critical";
}

async function generateTopicSummary(
  env: Env,
  tenantId: string,
  topic: string,
  sessions: SessionMemory[]
): Promise<SummaryResult> {
  try {
    const response = await env.THINK.fetch("http://internal/v1/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        type: "topic_consolidation",
        topic,
        sessions: sessions.map((s) => ({
          content: s.content,
          insights: s.insights,
          entities: s.entities_mentioned,
        })),
      }),
    });

    if (!response.ok) {
      return createFallbackSummary(sessions);
    }

    return (await response.json()) as SummaryResult;
  } catch (error) {
    console.error("Error generating topic summary:", error);
    return createFallbackSummary(sessions);
  }
}

async function generateUserSummary(
  env: Env,
  tenantId: string,
  userId: string,
  sessions: SessionMemory[]
): Promise<SummaryResult> {
  try {
    const response = await env.THINK.fetch("http://internal/v1/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        type: "user_consolidation",
        user_id: userId,
        sessions: sessions.map((s) => ({
          topic: s.topic,
          content: s.content,
          insights: s.insights,
          sentiment: s.sentiment,
        })),
      }),
    });

    if (!response.ok) {
      return createFallbackSummary(sessions);
    }

    return (await response.json()) as SummaryResult;
  } catch (error) {
    console.error("Error generating user summary:", error);
    return createFallbackSummary(sessions);
  }
}

async function generateAccountSummary(
  env: Env,
  tenantId: string,
  accountId: string,
  sessions: SessionMemory[]
): Promise<SummaryResult> {
  try {
    const response = await env.THINK.fetch("http://internal/v1/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        type: "account_consolidation",
        account_id: accountId,
        sessions: sessions.map((s) => ({
          user_id: s.user_id,
          topic: s.topic,
          content: s.content,
          insights: s.insights,
          sentiment: s.sentiment,
        })),
      }),
    });

    if (!response.ok) {
      return createFallbackSummary(sessions);
    }

    return (await response.json()) as SummaryResult;
  } catch (error) {
    console.error("Error generating account summary:", error);
    return createFallbackSummary(sessions);
  }
}

async function extractCrossAccountPatterns(
  env: Env,
  tenantId: string,
  memories: ConsolidatedMemory[]
): Promise<SummaryResult & { best_practices: string[] }> {
  try {
    const response = await env.THINK.fetch("http://internal/v1/extract-patterns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        memories: memories.map((m) => ({
          type: m.consolidation_type,
          summary: m.summary,
          insights: m.key_insights,
          themes: m.recurring_themes,
          actions: m.action_patterns,
        })),
      }),
    });

    if (!response.ok) {
      return {
        summary: "Weekly pattern extraction incomplete",
        insights: [],
        themes: [],
        actions: [],
        best_practices: [],
      };
    }

    return (await response.json()) as SummaryResult & { best_practices: string[] };
  } catch (error) {
    console.error("Error extracting patterns:", error);
    return {
      summary: "Weekly pattern extraction failed",
      insights: [],
      themes: [],
      actions: [],
      best_practices: [],
    };
  }
}

function createFallbackSummary(sessions: SessionMemory[]): SummaryResult {
  const allInsights = sessions.flatMap((s) => s.insights || []);
  const allEntities = [...new Set(sessions.flatMap((s) => s.entities_mentioned || []))];
  const avgSentiment = sessions.reduce((sum, s) => sum + (s.sentiment || 0), 0) / sessions.length;

  return {
    summary: `Consolidated ${sessions.length} sessions`,
    insights: allInsights.slice(0, 5),
    themes: allEntities.slice(0, 5),
    actions: [],
    risk_level: avgSentiment < -0.3 ? "elevated" : "normal",
  };
}

// =============================================================================
// STORAGE & SIGNALS
// =============================================================================

async function storeConsolidatedMemory(env: Env, memory: ConsolidatedMemory): Promise<void> {
  try {
    // DECISION 22: D1 is canonical store
    await env.DB.prepare(
      `INSERT INTO consolidated_memories
         (id, tenant_id, consolidation_type, topic, user_id, account_id, summary,
          key_insights, recurring_themes, action_patterns, session_count,
          time_range_start, time_range_end, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        memory.id,
        memory.tenant_id,
        memory.consolidation_type,
        memory.topic || null,
        memory.user_id || null,
        memory.account_id || null,
        memory.summary,
        JSON.stringify(memory.key_insights),
        JSON.stringify(memory.recurring_themes),
        JSON.stringify(memory.action_patterns),
        memory.session_count,
        memory.time_range_start,
        memory.time_range_end,
        memory.created_at
      )
      .run();
  } catch (error) {
    console.error("Error storing consolidated memory:", error);
  }
}

async function sendAccountHealthSignal(
  env: Env,
  tenantId: string,
  accountId: string,
  summary: SummaryResult
): Promise<void> {
  try {
    await env.THINK.fetch("http://internal/v1/signals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        type: "account_health",
        account_id: accountId,
        severity: summary.risk_level,
        title: "Account health signal from memory consolidation",
        description: summary.summary,
        insights: summary.insights,
        source: "memory-consolidator",
      }),
    });
  } catch (error) {
    console.error("Error sending health signal:", error);
  }
}

async function updateKnowledgeBase(
  env: Env,
  tenantId: string,
  patterns: SummaryResult & { best_practices: string[] }
): Promise<void> {
  try {
    await env.KNOWLEDGE.fetch("http://internal/knowledge/patterns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        source: "memory-consolidation",
        patterns: patterns.best_practices,
        themes: patterns.themes,
        insights: patterns.insights,
      }),
    });
  } catch (error) {
    console.error("Error updating knowledge base:", error);
  }
}

async function cleanupOldMemories(env: Env, tenantId: string): Promise<void> {
  const retentionDays = parseInt(env.MEMORY_RETENTION_DAYS);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    // DECISION 22: D1 is canonical store
    await env.DB.prepare(`DELETE FROM consolidated_memories WHERE tenant_id = ? AND created_at < ?`)
      .bind(tenantId, cutoffDate.toISOString())
      .run();
  } catch (error) {
    console.error("Error cleaning up old memories:", error);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getStartTime(type: "hourly" | "daily" | "weekly", now: Date): Date {
  const start = new Date(now);

  switch (type) {
    case "hourly":
      start.setHours(start.getHours() - 1);
      break;
    case "daily":
      start.setDate(start.getDate() - 1);
      break;
    case "weekly":
      start.setDate(start.getDate() - 7);
      break;
  }

  return start;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
  queue: handleQueue,
};
