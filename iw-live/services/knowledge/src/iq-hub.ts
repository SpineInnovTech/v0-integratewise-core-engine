import { Hono } from "hono";
import { z } from "zod";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
  KNOWLEDGE_SERVICE_URL?: string;
  ENVIRONMENT?: string;
};

type Variables = {
  correlationId: string;
  tenantId: string;
};

// ============================================================================
// D1 Helpers (DECISION 22 — Cloudflare-only product plane)
// ============================================================================

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

// Middleware for Correlation ID and Tenant ID
app.use("*", async (c, next) => {
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();
  const tenantId = c.req.header("x-tenant-id") || "";
  c.set("correlationId", correlationId);
  c.set("tenantId", tenantId);
  await next();
});

// ============================================================================
// Schemas
// ============================================================================

const SessionSearchSchema = z.object({
  query: z.string().min(1),
  top_k: z.number().optional().default(10),
  include_memories: z.boolean().optional().default(true),
});

const MemoryRetrievalSchema = z.object({
  session_ids: z.array(z.string()).optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  min_confidence: z.number().optional().default(0.7),
  limit: z.number().optional().default(20),
});

// AI Conversations Schemas
const CreateConversationSchema = z.object({
  title: z.string().optional(),
  context_type: z.enum(["account", "contact", "deal", "general"]).optional(),
  context_id: z.string().optional(),
  model: z.string().optional().default("gpt-4o-mini"),
  metadata: z.record(z.any()).optional(),
});

const AddMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  tool_calls: z.any().optional(),
  tool_call_id: z.string().optional(),
  tokens: z.number().optional(),
  latency_ms: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const CreateMemorySchema = z.object({
  conversation_id: z.string().optional(),
  memory_type: z.enum(["insight", "preference", "fact", "decision", "action_item", "relationship"]),
  content: z.string(),
  context_type: z.string().optional(),
  context_id: z.string().optional(),
  importance: z.number().min(0).max(1).optional().default(0.5),
  source: z
    .enum(["auto_extracted", "user_created", "user_confirmed", "system"])
    .optional()
    .default("auto_extracted"),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Endpoints
// ============================================================================

app.get("/", (c) => c.json({ service: "IQ Hub (Cognitive Intel)", status: "operational" }));

/**
 * List sessions for Memory Consolidator (GET).
 * Query params: start_time, end_time, limit.
 * Header: x-tenant-id (required).
 * Returns { items: SessionMemory[] } for consolidator fetchRecentSessions().
 */
app.get("/sessions", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const startTime = c.req.query("start_time") || "";
  const endTime = c.req.query("end_time") || "";
  const limit = Math.min(parseInt(c.req.query("limit") || "100", 10), 500);

  try {
    let queryStr = `SELECT * FROM ai_sessions WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (startTime) {
      queryStr += ` AND created_at >= ?`;
      params.push(startTime);
    }
    if (endTime) {
      queryStr += ` AND created_at <= ?`;
      params.push(endTime);
    }
    queryStr += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const { results: rows } = await c.env.DB.prepare(queryStr)
      .bind(...params)
      .all();

    const items = (rows || []).map((row: any) => ({
      id: row.session_id ?? row.id ?? row.tenant_id + "_" + row.session_id,
      tenant_id: row.tenant_id,
      user_id: row.user_label ?? row.user_id ?? "",
      account_id: row.account_id ?? undefined,
      topic: row.topic ?? "general",
      subtopic: row.subtopic ?? undefined,
      content: row.summary ?? "",
      insights: row.insights ?? [],
      entities_mentioned: row.entities_mentioned ?? [],
      sentiment: typeof row.sentiment === "number" ? row.sentiment : 0,
      created_at: row.created_at ?? new Date().toISOString(),
    }));

    return c.json({ items });
  } catch (err: any) {
    return c.json({ error: "Sessions fetch failed", message: err.message }, 500);
  }
});

/**
 * Semantic Session Search
 */
app.post("/iq/sessions/search", async (c) => {
  const correlationId = c.get("correlationId");
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const body = await c.req.json();
  const parsed = SessionSearchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid parameters" }, 400);

  const { query, top_k, include_memories } = parsed.data;

  try {
    // Call Knowledge service (Placeholder/Simulation for now)
    const knowledgeUrl = c.env.KNOWLEDGE_SERVICE_URL || "http://localhost:8787";
    // In a real scenario, this would call the vector index
    void knowledgeUrl;

    return c.json({
      success: true,
      data: {
        results: [], // Should return results from Vectorize/Supabase
        query,
        top_k,
        include_memories,
      },
      correlation_id: correlationId,
    });
  } catch (err: any) {
    return c.json({ error: "Search failed", message: err.message }, 500);
  }
});

/**
 * Retrieve Memories from the Spine (D1)
 */
app.post("/iq/memories/retrieve", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const body = await c.req.json();
  const parsed = MemoryRetrievalSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid parameters" }, 400);

  const { session_ids, entity_type, entity_id, min_confidence, limit } = parsed.data;

  try {
    // v3.6: Query D1 (DECISION 22 — Cloudflare-only product plane)
    let queryStr = `SELECT * FROM ai_session_memories WHERE confidence >= ?`;
    const params: any[] = [min_confidence];

    if (session_ids && session_ids.length > 0) {
      const placeholders = session_ids.map(() => "?").join(",");
      queryStr += ` AND session_id IN (${placeholders})`;
      params.push(...session_ids);
    } else if (entity_type && entity_id) {
      queryStr += ` AND entity_type = ? AND entity_id = ?`;
      params.push(entity_type, entity_id);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const { results: memories } = await c.env.DB.prepare(queryStr)
      .bind(...params)
      .all();

    return c.json({ success: true, data: { memories } });
  } catch (err: any) {
    return c.json({ error: "Retrieval failed", message: err.message }, 500);
  }
});

/**
 * Decision Engine Endpoint
 */
app.post("/decide", async (c) => {
  const { target_system, action_type, confidence } = await c.req.json();

  // Basic policy logic
  const requires_approval = confidence < 0.9;

  return c.json({
    decision: {
      mode: requires_approval ? "assisted" : "autonomous",
      target_system,
      action_type,
      timestamp: new Date().toISOString(),
    },
    requires_human_approval: requires_approval,
  });
});

// ============================================================================
// AI Conversations Endpoints
// ============================================================================

/**
 * List conversations for a user
 */
app.get("/conversations", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const status = c.req.query("status") || "active";
  const context_type = c.req.query("context_type");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    // v3.6: Query D1 (DECISION 22 — Cloudflare-only product plane)
    let queryStr = `SELECT * FROM ai_conversations WHERE tenant_id = ? AND user_id = ? AND status = ?`;
    const params: any[] = [tenantId, userId, status];

    if (context_type) {
      queryStr += ` AND context_type = ?`;
      params.push(context_type);
    }

    queryStr += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results: conversations } = await c.env.DB.prepare(queryStr)
      .bind(...params)
      .all();

    return c.json({ success: true, data: conversations });
  } catch (err: any) {
    return c.json({ error: "Failed to list conversations", message: err.message }, 500);
  }
});

/**
 * Create a new conversation
 */
app.post("/conversations", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const body = await c.req.json();
  const parsed = CreateConversationSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid parameters", details: parsed.error }, 400);

  const { title, context_type, context_id, model, metadata } = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // v3.6: Insert to D1 (DECISION 22 — Cloudflare-only product plane)
    await c.env.DB.prepare(
      `INSERT INTO ai_conversations (id, tenant_id, user_id, title, context_type, context_id, model, metadata, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        tenantId,
        userId,
        title || null,
        context_type || null,
        context_id || null,
        model,
        JSON.stringify(metadata || {}),
        "active",
        expiresAt,
        now,
        now
      )
      .run();

    return c.json(
      {
        success: true,
        data: {
          id,
          tenant_id: tenantId,
          user_id: userId,
          title,
          context_type,
          context_id,
          model,
          status: "active",
          message_count: 0,
          created_at: now,
        },
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Failed to create conversation", message: err.message }, 500);
  }
});

/**
 * Get a single conversation
 */
app.get("/conversations/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    // v3.6: Query D1 (DECISION 22 — Cloudflare-only product plane)
    const { results: conversations } = await c.env.DB.prepare(
      `SELECT * FROM ai_conversations WHERE id = ? AND tenant_id = ? AND user_id = ? LIMIT 1`
    )
      .bind(conversationId, tenantId, userId)
      .all();

    if (!conversations || conversations.length === 0)
      return c.json({ error: "Conversation not found" }, 404);

    return c.json({ success: true, data: conversations[0] });
  } catch (err: any) {
    return c.json({ error: "Failed to get conversation", message: err.message }, 500);
  }
});

/**
 * Update a conversation
 */
app.patch("/conversations/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const body = await c.req.json();
  const { title, status, metadata } = body;
  const now = new Date().toISOString();

  try {
    // DECISION 22 — Cloudflare-only product plane: update D1 directly.
    const sets: string[] = [];
    const binds: any[] = [];
    if (title !== undefined) { sets.push("title = ?"); binds.push(title); }
    if (status !== undefined) { sets.push("status = ?"); binds.push(status); }
    if (metadata !== undefined) { sets.push("metadata = ?"); binds.push(JSON.stringify(metadata)); }
    sets.push("updated_at = ?");
    binds.push(now);

    await c.env.DB.prepare(
      `UPDATE ai_conversations SET ${sets.join(", ")} WHERE id = ? AND tenant_id = ? AND user_id = ?`
    )
      .bind(...binds, conversationId, tenantId, userId)
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Failed to update conversation", message: err.message }, 500);
  }
});

/**
 * Delete a conversation
 */
app.delete("/conversations/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    await c.env.DB.prepare(
      `
            DELETE FROM ai_conversations WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(conversationId, tenantId, userId)
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Failed to delete conversation", message: err.message }, 500);
  }
});

/**
 * Get messages for a conversation
 */
app.get("/conversations/:id/messages", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    // Verify conversation ownership
    const { results: convResults } = await c.env.DB.prepare(
      `
            SELECT id FROM ai_conversations WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(conversationId, tenantId, userId)
      .all();

    if (convResults.length === 0) return c.json({ error: "Conversation not found" }, 404);

    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC
        `
    )
      .bind(conversationId)
      .all();

    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ error: "Failed to get messages", message: err.message }, 500);
  }
});

/**
 * Add a message to a conversation
 */
app.post("/conversations/:id/messages", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const body = await c.req.json();
  const parsed = AddMessageSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid parameters", details: parsed.error }, 400);

  const { role, content, tool_calls, tool_call_id, tokens, latency_ms, metadata } = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    // Verify conversation ownership
    const { results: convResults } = await c.env.DB.prepare(
      `
            SELECT id FROM ai_conversations WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(conversationId, tenantId, userId)
      .all();

    if (convResults.length === 0) return c.json({ error: "Conversation not found" }, 404);

    await c.env.DB.prepare(
      `
            INSERT INTO ai_messages (id, conversation_id, role, content, tool_calls, tool_call_id, tokens, latency_ms, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        id,
        conversationId,
        role,
        content,
        tool_calls ? JSON.stringify(tool_calls) : null,
        tool_call_id || null,
        tokens || 0,
        latency_ms || null,
        JSON.stringify(metadata || {}),
        now
      )
      .run();

    // Update conversation message count and tokens
    await c.env.DB.prepare(
      `
            UPDATE ai_conversations SET message_count = message_count + 1, total_tokens = total_tokens + ?, updated_at = ? WHERE id = ?
        `
    )
      .bind(tokens || 0, now, conversationId)
      .run();

    return c.json(
      {
        success: true,
        data: { id, conversation_id: conversationId, role, content, created_at: now },
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Failed to add message", message: err.message }, 500);
  }
});

/**
 * Archive a conversation (triggers memory extraction)
 */
app.post("/conversations/:id/archive", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  const extractMemories = c.req.query("extract_memories") !== "false"; // Default true
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    // Archive the conversation
    await c.env.DB.prepare(
      `
            UPDATE ai_conversations SET status = 'archived', updated_at = ? WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(new Date().toISOString(), conversationId, tenantId, userId)
      .run();

    // Extract memories if enabled
    let memoryResult = { extracted: 0, saved: [] as string[] };
    if (extractMemories) {
      try {
        const { triageConversation } = await import("./triage-bot");
        const triageResult = await triageConversation(conversationId, tenantId, userId, {
          DB: c.env.DB,
          DATABASE_URL: "",
          AI: (c.env as any).AI,
          OPENROUTER_API_KEY: (c.env as any).OPENROUTER_API_KEY,
          SLACK_BOT_TOKEN: (c.env as any).SLACK_BOT_TOKEN,
          SLACK_TRIAGE_CHANNEL: (c.env as any).SLACK_TRIAGE_CHANNEL,
        });
        memoryResult = { extracted: triageResult.extracted, saved: triageResult.triageIds };
        console.log(
          `[TriageBot] Extracted ${triageResult.extracted} items from conversation ${conversationId}`
        );
      } catch (memErr: any) {
        console.error("Memory extraction failed (non-blocking):", memErr.message);
      }
    }

    return c.json({
      success: true,
      memories_extracted: memoryResult.extracted,
      memory_ids: memoryResult.saved,
    });
  } catch (err: any) {
    return c.json({ error: "Failed to archive conversation", message: err.message }, 500);
  }
});

// ============================================================================
// AI Memories Endpoints
// ============================================================================

/**
 * List memories for a user
 */
app.get("/memories", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const memory_type = c.req.query("memory_type");
  const context_type = c.req.query("context_type");
  const context_id = c.req.query("context_id");
  const conversation_id = c.req.query("conversation_id");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    let query = `SELECT * FROM ai_memories WHERE tenant_id = ? AND user_id = ?`;
    const params: any[] = [tenantId, userId];

    if (memory_type) {
      query += ` AND memory_type = ?`;
      params.push(memory_type);
    }
    if (context_type) {
      query += ` AND context_type = ?`;
      params.push(context_type);
    }
    if (context_id) {
      query += ` AND context_id = ?`;
      params.push(context_id);
    }
    if (conversation_id) {
      query += ` AND conversation_id = ?`;
      params.push(conversation_id);
    }

    query += ` ORDER BY importance DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query)
      .bind(...params)
      .all();

    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ error: "Failed to list memories", message: err.message }, 500);
  }
});

/**
 * Create a memory
 */
app.post("/memories", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const body = await c.req.json();
  const parsed = CreateMemorySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid parameters", details: parsed.error }, 400);

  const {
    conversation_id,
    memory_type,
    content,
    context_type,
    context_id,
    importance,
    source,
    metadata,
  } = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    await c.env.DB.prepare(
      `
            INSERT INTO ai_memories (id, tenant_id, user_id, conversation_id, memory_type, content, context_type, context_id, importance, source, metadata, expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        id,
        tenantId,
        userId,
        conversation_id || null,
        memory_type,
        content,
        context_type || null,
        context_id || null,
        importance,
        source,
        JSON.stringify(metadata || {}),
        expiresAt,
        now,
        now
      )
      .run();

    return c.json(
      {
        success: true,
        data: {
          id,
          tenant_id: tenantId,
          user_id: userId,
          memory_type,
          content,
          importance,
          created_at: now,
        },
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Failed to create memory", message: err.message }, 500);
  }
});

/**
 * Get a single memory
 */
app.get("/memories/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const memoryId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM ai_memories WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(memoryId, tenantId, userId)
      .all();

    if (results.length === 0) return c.json({ error: "Memory not found" }, 404);

    return c.json({ success: true, data: results[0] });
  } catch (err: any) {
    return c.json({ error: "Failed to get memory", message: err.message }, 500);
  }
});

/**
 * Delete a memory
 */
app.delete("/memories/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const memoryId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    await c.env.DB.prepare(
      `
            DELETE FROM ai_memories WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(memoryId, tenantId, userId)
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Failed to delete memory", message: err.message }, 500);
  }
});

/**
 * Confirm a memory
 */
app.post("/memories/:id/confirm", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const memoryId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  const now = new Date().toISOString();

  try {
    await c.env.DB.prepare(
      `
            UPDATE ai_memories SET is_confirmed = 1, confirmed_by = ?, confirmed_at = ?, source = 'user_confirmed', updated_at = ? 
            WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(userId, now, now, memoryId, tenantId, userId)
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Failed to confirm memory", message: err.message }, 500);
  }
});

/**
 * Cleanup expired records (called by cron)
 */
app.post("/maintenance/cleanup-expired", async (c) => {
  try {
    const now = new Date().toISOString();

    // Delete expired conversations (cascades to messages)
    await c.env.DB.prepare(`DELETE FROM ai_conversations WHERE expires_at < ?`).bind(now).run();

    // Delete expired memories
    await c.env.DB.prepare(`DELETE FROM ai_memories WHERE expires_at < ?`).bind(now).run();

    // Delete expired session summaries
    await c.env.DB.prepare(`DELETE FROM ai_session_summaries WHERE expires_at < ?`).bind(now).run();

    return c.json({ success: true, message: "Cleanup completed" });
  } catch (err: any) {
    return c.json({ error: "Cleanup failed", message: err.message }, 500);
  }
});

/**
 * Extract memories from a conversation (manual trigger)
 */
app.post("/conversations/:id/extract-memories", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.header("x-user-id");
  const conversationId = c.req.param("id");
  if (!tenantId || !userId) return c.json({ error: "x-tenant-id and x-user-id required" }, 400);

  try {
    // Verify conversation ownership
    const { results: convResults } = await c.env.DB.prepare(
      `
            SELECT id FROM ai_conversations WHERE id = ? AND tenant_id = ? AND user_id = ?
        `
    )
      .bind(conversationId, tenantId, userId)
      .all();

    if (convResults.length === 0) return c.json({ error: "Conversation not found" }, 404);

    const { triageConversation } = await import("./triage-bot");
    const triageResult = await triageConversation(conversationId, tenantId, userId, {
      DB: c.env.DB,
      DATABASE_URL: "",
      AI: (c.env as any).AI,
      OPENROUTER_API_KEY: (c.env as any).OPENROUTER_API_KEY,
      SLACK_BOT_TOKEN: (c.env as any).SLACK_BOT_TOKEN,
      SLACK_TRIAGE_CHANNEL: (c.env as any).SLACK_TRIAGE_CHANNEL,
    });

    return c.json({
      success: true,
      extracted: triageResult.extracted,
      memory_ids: triageResult.triageIds,
    });
  } catch (err: any) {
    return c.json({ error: "Failed to extract memories", message: err.message }, 500);
  }
});

export default app;
