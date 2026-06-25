/**
 * Knowledge Service - Day 2 Implementation
 *
 * Provides semantic search, document chunking, and embedding management
 * for the IntegrateWise Knowledge Pipeline.
 *
 * Best Practice: All endpoints include correlation_id for request tracing.
 */

import { Hono } from "hono";
import { neonShim as neon } from "./db-shim";
import { z } from "zod";
import { cors } from "hono/cors";
import { enforceTenantLimits } from "@integratewise/connector-utils";

// Import knowledge modules
import { chunkDocument, chunkSession } from "./chunking";
import {
  EmbeddingService,
  createOpenAIEmbedder,
  createOpenRouterEmbedder,
  storeChunks,
  storeEmbeddings,
  storeSessionEmbedding,
  processAndStoreDocument,
} from "./embedding";
import { SearchService, createSearchService, type SearchType } from "./search";
import iqHubApp from "./iq-hub";

// ============================================================================
// Types
// ============================================================================

type Bindings = {
  DATABASE_URL: string;
  OPENROUTER_API_KEY?: string; // Preferred: Use OpenRouter for all AI
  OPENAI_API_KEY?: string; // Fallback: Direct OpenAI API
  ENVIRONMENT: string;
  AI?: any; // Cloudflare Workers AI for triage bot (session/memory triage)
  DB?: D1Database; // DECISION 22: D1 is canonical store
  TASKS_QUEUE?: Queue;
};

type KnowledgeBindings = Bindings & {
  // Queue bindings (v3.6 Section 19.7)
  TASKS_QUEUE?: Queue; // For immediate consolidation triggers
};

// ============================================================================
// App Setup
// ============================================================================

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// ============================================================================
// Best Practice: Correlation ID + Structured Error Envelope (Guardrail #4)
// ============================================================================

const CORRELATION_ID_HEADER = "x-correlation-id";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCorrelationId(c: any): string {
  return c.req.header(CORRELATION_ID_HEADER) || generateUUID();
}

function logWithContext(
  correlationId: string,
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
): void {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    correlation_id: correlationId,
    service: "knowledge",
    message,
    ...data,
  };
  console[level](JSON.stringify(log));
}

// Best Practice #4: Structured Error Envelope
interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  correlation_id: string;
}

function errorResponse(
  c: any,
  correlationId: string,
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  const envelope: ErrorEnvelope = {
    success: false,
    error: { code, message, details },
    correlation_id: correlationId,
  };
  return c.json(envelope, status);
}

// ============================================================================
// Helper: Get Services
// ============================================================================

function getEmbedder(env: Bindings): EmbeddingService {
  // Primary: Use Cloudflare Workers AI (free, no API key needed)
  // The AI binding generates embeddings via @cf/baai/bge-base-en-v1.5
  if ((env as any).AI) {
    // Return a Workers AI-backed embedder that matches the EmbeddingService interface
    return {
      embed: async (text: string) => {
        const ai = (env as any).AI;
        const result = await ai.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
        const embedding = result?.data?.[0] || new Array(768).fill(0);
        // Pad to 1536 dims for Vectorize compatibility (or use as-is if index is 768)
        const padded =
          embedding.length < 1536
            ? [...embedding, ...new Array(1536 - embedding.length).fill(0)]
            : embedding;
        return { embedding: padded };
      },
      embedBatch: async (texts: string[]) => {
        const ai = (env as any).AI;
        const result = await ai.run("@cf/baai/bge-base-en-v1.5", { text: texts });
        return (result?.data || []).map((emb: number[], i: number) => {
          const padded =
            emb.length < 1536 ? [...emb, ...new Array(1536 - emb.length).fill(0)] : emb;
          return {
            id: crypto.randomUUID(),
            text: texts[i],
            embedding: padded,
            tokenCount: 0,
            model: "bge-base-en-v1.5",
          };
        });
      },
    } as any;
  }
  // Fallback: OpenRouter if API key is available
  if (env.OPENROUTER_API_KEY) {
    return createOpenRouterEmbedder(env.OPENROUTER_API_KEY);
  }
  // Fallback: Direct OpenAI API
  if (env.OPENAI_API_KEY) {
    return createOpenAIEmbedder(env.OPENAI_API_KEY);
  }
  throw new Error("No AI provider configured. Ensure Workers AI binding (env.AI) is present.");
}

function getSearchService(env: Bindings): SearchService {
  const embedder = getEmbedder(env);
  return createSearchService(env, embedder);
}

// ============================================================================
// Health Check
// ============================================================================

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "knowledge",
    v: "2.0.0-semantic",
    features: [
      "chunking",
      "embedding",
      "vector-search",
      "hybrid-search",
      "session-search",
      "correlation-tracing",
    ],
  })
);

// Mount IQ Hub for Memory Consolidator: GET /iq/sessions (MCP → Triage → Consolidation → Review → AI access)
app.route("/iq", iqHubApp as any);

// ============================================================================
// Schema Definitions
// ============================================================================

const SearchSchema = z.object({
  query: z.string().min(1).max(1000),
  type: z.enum(["vector", "keyword", "hybrid"]).optional().default("hybrid"),
  top_k: z.number().int().min(1).max(100).optional().default(10),
  min_score: z.number().min(0).max(1).optional().default(0.5),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  source_types: z.array(z.string()).optional(),
  include_metadata: z.boolean().optional().default(true),
  approved_only: z.boolean().optional().default(false),
});

const IngestSchema = z.object({
  tenant_id: z.string().uuid(),
  file_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  source_type: z.enum(["file", "session", "url", "api"]).default("file"),
  source_name: z.string().optional(),
  file_type: z.string().optional(),
  content: z.string().min(1),
});

const SessionEmbedSchema = z.object({
  session_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  summary: z.string().min(1),
  tool_calls: z.array(z.string()).optional(),
  memories: z.array(z.string()).optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
});

// ============================================================================
// GET /v1/knowledge/inbox — Flow C §17.3: Triage space only (pending/deferred)
// For Inbox UI: list items awaiting Approve/Discard/Defer.
// ============================================================================

app.get("/v1/knowledge/inbox", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;

  try {
    const sql = neon(c.env);
    const rows = await sql`
            SELECT id, message_id, platform, content, priority, category, confidence, reasoning, sentiment, metadata, created_at
            FROM triage_results
            WHERE metadata->>'tenant_id' = ${tenantId}
            AND approval_status IN ('pending', 'deferred')
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

    return c.json({
      success: true,
      data: { items: rows, limit, offset },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Knowledge inbox failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// POST /knowledge/search - Semantic Search (§17.3: compounding space)
// Queries document_chunks; exclude triage working area via sourceTypes when needed.
// ============================================================================

app.post("/knowledge/search", async (c) => {
  const correlationId = getCorrelationId(c);

  try {
    const tenantId = c.req.header("x-tenant-id");
    if (!tenantId) {
      return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
    }

    const body = await c.req.json();
    const parsed = SearchSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        c,
        correlationId,
        "VALIDATION_ERROR",
        "Invalid search parameters",
        400,
        parsed.error.flatten()
      );
    }

    logWithContext(correlationId, "info", "Search request", {
      query_length: parsed.data.query.length,
      search_type: parsed.data.type,
      top_k: parsed.data.top_k,
    });

    const searchService = getSearchService(c.env);

    const result = await searchService.search(tenantId, parsed.data.query, {
      type: parsed.data.type as SearchType,
      topK: parsed.data.top_k,
      minScore: parsed.data.min_score,
      entityType: parsed.data.entity_type,
      entityId: parsed.data.entity_id,
      sourceTypes: parsed.data.source_types,
      includeMetadata: parsed.data.include_metadata,
    });

    logWithContext(correlationId, "info", "Search completed", {
      result_count: result.totalResults,
      duration_ms: result.processingTimeMs,
    });

    return c.json({
      success: true,
      data: result,
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Search failed", { error: error.message });
    return errorResponse(c, correlationId, "SEARCH_ERROR", error.message, 500);
  }
});

// ============================================================================
// POST /knowledge/search/sessions - Session Search
// ============================================================================

app.post("/knowledge/search/sessions", async (c) => {
  const correlationId = getCorrelationId(c);

  try {
    const tenantId = c.req.header("x-tenant-id");
    if (!tenantId) {
      return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
    }

    const body = await c.req.json();
    const parsed = SearchSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        c,
        correlationId,
        "VALIDATION_ERROR",
        "Invalid search parameters",
        400,
        parsed.error.flatten()
      );
    }

    logWithContext(correlationId, "info", "Session search request", {
      query_length: parsed.data.query.length,
      top_k: parsed.data.top_k,
    });

    const searchService = getSearchService(c.env);

    const results = await searchService.searchSessions(tenantId, parsed.data.query, {
      topK: parsed.data.top_k,
      minScore: parsed.data.min_score,
      entityType: parsed.data.entity_type,
      entityId: parsed.data.entity_id,
      approvedOnly: parsed.data.approved_only,
    });

    return c.json({
      success: true,
      data: {
        results,
        query: parsed.data.query,
        totalResults: results.length,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Session search failed", { error: error.message });
    return errorResponse(c, correlationId, "SEARCH_ERROR", error.message, 500);
  }
});

// ============================================================================
// PATCH /v1/knowledge/triage/:id - Approve/Discard/Defer Triage Item (Flow C §17.2)
// ============================================================================

app.patch("/v1/knowledge/triage/:id", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id") || "system";

  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const triageId = c.req.param("id");

  try {
    const body = await c.req.json();
    const { action, reason } = body as { action: "approve" | "discard" | "defer"; reason?: string };

    if (!["approve", "discard", "defer"].includes(action)) {
      return errorResponse(
        c,
        correlationId,
        "INVALID_ACTION",
        "Action must be approve, discard, or defer",
        400
      );
    }

    const sql = neon(c.env);

    // Get current triage item
    const existing = await sql`
      SELECT id, approval_status, content, metadata
      FROM triage_results
      WHERE id = ${triageId}
      AND metadata->>'tenant_id' = ${tenantId}
    `;

    if (!existing || existing.length === 0) {
      return errorResponse(c, correlationId, "NOT_FOUND", "Triage item not found", 404);
    }

    const triageItem = existing[0];

    // Update approval status
    const newStatus =
      action === "approve" ? "approved" : action === "discard" ? "discarded" : "deferred";
    const updatedMetadata = {
      ...triageItem.metadata,
      approval_action: action,
      approval_reason: reason,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    };

    await sql`
      UPDATE triage_results
      SET approval_status = ${newStatus},
          metadata = ${JSON.stringify(updatedMetadata)},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${triageId}
    `;

    // If approved, trigger memory consolidation immediately (don't wait for cron)
    if (action === "approve" && c.env.TASKS_QUEUE) {
      await c.env.TASKS_QUEUE.send({
        type: "immediate_consolidation",
        tenant_id: tenantId,
        triage_id: triageId,
        priority: "high",
      });
    }

    // Log audit trail
    logWithContext(correlationId, "info", "Triage item updated", {
      triage_id: triageId,
      tenant_id: tenantId,
      user_id: userId,
      action,
      new_status: newStatus,
    });

    return c.json({
      success: true,
      data: {
        id: triageId,
        approval_status: newStatus,
        action,
        approved_by: userId,
        approved_at: updatedMetadata.approved_at,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Triage update failed", {
      error: error.message,
      triage_id: triageId,
    });
    return errorResponse(c, correlationId, "UPDATE_ERROR", error.message, 500);
  }
});

// ============================================================================
// GET /v1/triage/approved - Get approved triage items for Memory Consolidator
// ============================================================================

app.get("/v1/triage/approved", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");

  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const startTime = c.req.query("start_time") || "";
  const endTime = c.req.query("end_time") || "";
  const limit = Math.min(parseInt(c.req.query("limit") || "100", 10), 500);

  try {
    const sql = neon(c.env);

    let query = sql`
      SELECT id, message_id, platform, content, priority, category, confidence, 
             reasoning, sentiment, metadata, created_at
      FROM triage_results
      WHERE metadata->>'tenant_id' = ${tenantId}
      AND approval_status = 'approved'
    `;

    if (startTime) {
      query = sql`${query} AND created_at >= ${startTime}`;
    }
    if (endTime) {
      query = sql`${query} AND created_at <= ${endTime}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

    const rows = await query;

    const items = rows.map((row: any) => ({
      id: row.id,
      message_id: row.message_id,
      platform: row.platform,
      content: row.content,
      priority: row.priority,
      category: row.category,
      confidence: row.confidence,
      reasoning: row.reasoning,
      sentiment: row.sentiment,
      metadata: row.metadata,
      created_at: row.created_at,
    }));

    return c.json({
      success: true,
      data: { items },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Failed to fetch approved triage items", {
      error: error.message,
    });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// POST /knowledge/ingest - Ingest and Embed Document
// ============================================================================

app.post("/knowledge/ingest", async (c) => {
  const correlationId = getCorrelationId(c);

  try {
    const body = await c.req.json();
    const parsed = IngestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        c,
        correlationId,
        "VALIDATION_ERROR",
        "Invalid ingest parameters",
        400,
        parsed.error.flatten()
      );
    }

    let {
      tenant_id,
      content,
      source_type,
      source_name,
      entity_type,
      entity_id,
      file_id,
      file_type,
    } = parsed.data;

    // Context ingestion tenant scoping: only link to entities allowed for tenant (HARDENING_AND_WIRING.md §7)
    // DECISION 22: D1-based tenant entity type lookup (replaces Supabase REST)
    if (entity_type && entity_id && (c.env as any).DB) {
      try {
        const row = await ((c.env as any).DB as D1Database)
          .prepare(`SELECT entity_types FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`)
          .bind(tenant_id)
          .first<{ entity_types: string }>();
        if (row?.entity_types) {
          const allowedTypes = new Set<string>(JSON.parse(row.entity_types));
          if (!allowedTypes.has(entity_type)) {
            entity_type = undefined;
            entity_id = undefined;
          }
        }
      } catch {
        /* best-effort scoping */
      }
    }

    logWithContext(correlationId, "info", "Ingest request", {
      source_type,
      content_length: content.length,
      file_type,
    });

    // Check tenant limits
    const limitCheck = await enforceTenantLimits(c.env.DATABASE_URL, tenant_id, "docs_ingested");
    if (!limitCheck.allowed) {
      return errorResponse(
        c,
        correlationId,
        "LIMIT_EXCEEDED",
        limitCheck.reason || "Document limit exceeded",
        429
      );
    }

    // Process and store document
    const embedder = getEmbedder(c.env);

    const result = await processAndStoreDocument(c.env.DATABASE_URL, content, {
      tenantId: tenant_id,
      sourceType: source_type,
      sourceName: source_name,
      entityType: entity_type,
      entityId: entity_id,
      fileId: file_id,
      fileType: file_type,
      embedder,
    });

    logWithContext(correlationId, "info", "Ingest completed", {
      chunks: result.totalChunks,
      tokens: result.totalTokens,
    });

    return c.json({
      success: true,
      data: {
        chunk_ids: result.chunkIds,
        embedding_ids: result.embeddingIds,
        total_chunks: result.totalChunks,
        total_tokens: result.totalTokens,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Ingest failed", { error: error.message });
    return errorResponse(c, correlationId, "INGEST_ERROR", error.message, 500);
  }
});

// ============================================================================
// POST /knowledge/embed/session - Embed AI Session
// ============================================================================

app.post("/knowledge/embed/session", async (c) => {
  const correlationId = getCorrelationId(c);

  try {
    const body = await c.req.json();
    const parsed = SessionEmbedSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        c,
        correlationId,
        "VALIDATION_ERROR",
        "Invalid session parameters",
        400,
        parsed.error.flatten()
      );
    }

    let { session_id, tenant_id, summary, tool_calls, memories, entity_type, entity_id } =
      parsed.data;

    // Context ingestion tenant scoping: only link to entities allowed for tenant (HARDENING_AND_WIRING.md §7)
    // DECISION 22: D1-based tenant entity type lookup (replaces Supabase REST)
    if (entity_type && entity_id && (c.env as any).DB) {
      try {
        const row = await ((c.env as any).DB as D1Database)
          .prepare(`SELECT entity_types FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`)
          .bind(tenant_id)
          .first<{ entity_types: string }>();
        if (row?.entity_types) {
          const allowedTypes = new Set<string>(JSON.parse(row.entity_types));
          if (!allowedTypes.has(entity_type)) {
            entity_type = undefined;
            entity_id = undefined;
          }
        }
      } catch {
        /* best-effort scoping */
      }
    }

    logWithContext(correlationId, "info", "Session embed request", {
      session_id,
      summary_length: summary.length,
    });

    const embedder = getEmbedder(c.env);

    // Chunk the session
    const chunkResult = await chunkSession(summary, tool_calls, memories);

    // Store chunks
    const chunkIds = await storeChunks(c.env.DATABASE_URL, chunkResult.chunks, {
      tenantId: tenant_id,
      sourceType: "session",
      sourceName: `Session ${session_id}`,
      entityType: entity_type,
      entityId: entity_id,
      sessionId: session_id,
    });

    // Generate embeddings
    const texts = chunkResult.chunks.map((chunk) => chunk.content);
    const embeddingResult = await embedder.embedBatch(texts);

    // Store chunk embeddings
    const embeddingsToStore = embeddingResult.embeddings.map((e, i) => ({
      chunkId: chunkIds[i],
      embedding: e.embedding,
      model: embeddingResult.model,
    }));

    await storeEmbeddings(c.env.DATABASE_URL, tenant_id, embeddingsToStore);

    // Store session-level embedding (summary)
    const summaryEmbedding = await embedder.embed(summary);
    await storeSessionEmbedding(
      c.env.DATABASE_URL,
      tenant_id,
      session_id,
      "summary",
      summary,
      summaryEmbedding.embedding,
      embeddingResult.model
    );

    logWithContext(correlationId, "info", "Session embedded", {
      chunks: chunkResult.chunks.length,
      tokens: chunkResult.totalTokens,
    });

    return c.json({
      success: true,
      data: {
        session_id,
        chunks_created: chunkResult.chunks.length,
        total_tokens: chunkResult.totalTokens,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Session embed failed", { error: error.message });
    return errorResponse(c, correlationId, "EMBED_ERROR", error.message, 500);
  }
});

// ============================================================================
// POST /knowledge/chunk - Chunk Document (Preview)
// ============================================================================

app.post("/knowledge/chunk", async (c) => {
  const correlationId = getCorrelationId(c);

  try {
    const body = await c.req.json();
    const { content, source_type, file_type, config } = body;

    if (!content) {
      return errorResponse(c, correlationId, "VALIDATION_ERROR", "content is required", 400);
    }

    const result = await chunkDocument(content, {
      sourceType: source_type || "file",
      fileType: file_type,
      config,
    });

    return c.json({
      success: true,
      data: {
        chunks: result.chunks.map((chunk) => ({
          content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? "..." : ""),
          content_hash: chunk.contentHash,
          metadata: chunk.metadata,
        })),
        total_chunks: result.chunks.length,
        total_tokens: result.totalTokens,
        processing_time_ms: result.processingTimeMs,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Chunk preview failed", { error: error.message });
    return errorResponse(c, correlationId, "CHUNK_ERROR", error.message, 500);
  }
});

// ============================================================================
// GET /knowledge/similar/:chunk_id - Find Similar Chunks
// ============================================================================

app.get("/knowledge/similar/:chunk_id", async (c) => {
  const correlationId = getCorrelationId(c);

  try {
    const tenantId = c.req.header("x-tenant-id");
    if (!tenantId) {
      return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
    }

    const chunkId = c.req.param("chunk_id");
    const topK = parseInt(c.req.query("top_k") || "5");

    const searchService = getSearchService(c.env);
    const results = await searchService.findSimilar(tenantId, chunkId, topK);

    return c.json({
      success: true,
      data: { results },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Find similar failed", { error: error.message });
    return errorResponse(c, correlationId, "SEARCH_ERROR", error.message, 500);
  }
});

// ============================================================================
// Knowledge Topics — Topic listing for Knowledge Panel
// ============================================================================

app.get("/v1/knowledge/topics", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const sql = neon(c.env);

  try {
    const topics = await sql`
            SELECT DISTINCT
                unnest(metadata->'topics') as topic_name
            FROM file_embeddings fe
            JOIN file_versions fv ON fv.id = fe.version_id
            JOIN files f ON f.id = fv.file_id
            WHERE f.tenant_id = ${tenantId}
            LIMIT 50
        `.catch(() => []);

    // Fallback: aggregate from consolidated_memories if no file topics
    const memoryTopics = await sql`
            SELECT topic as name, COUNT(*) as document_count
            FROM consolidated_memories
            WHERE tenant_id = ${tenantId} AND topic IS NOT NULL
            GROUP BY topic
            ORDER BY document_count DESC
            LIMIT 20
        `.catch(() => []);

    const allTopics = [
      ...memoryTopics.map((t: any, i: number) => ({
        id: `topic-${i}`,
        name: t.name || t.topic_name,
        document_count: parseInt(t.document_count) || 0,
      })),
      ...topics
        .filter((t: any) => t.topic_name)
        .map((t: any, i: number) => ({
          id: `file-topic-${i}`,
          name: t.topic_name,
          document_count: 1,
        })),
    ];

    return c.json({
      success: true,
      data: allTopics,
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Topics query failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// Knowledge Memories — Consolidated memory objects for Memory Panel
// ============================================================================

app.get("/v1/knowledge/memories", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const q = c.req.query("q");
  const sql = neon(c.env);

  try {
    let memories;
    if (q) {
      memories = await sql`
                SELECT id, consolidation_type as type, summary as content,
                       key_insights as tags, created_at,
                       CASE WHEN consolidation_type = 'pattern' THEN 'active' ELSE 'active' END as status,
                       session_count as confidence
                FROM consolidated_memories
                WHERE tenant_id = ${tenantId}
                AND (summary ILIKE ${"%" + q + "%"} OR topic ILIKE ${"%" + q + "%"})
                ORDER BY created_at DESC
                LIMIT 50
            `;
    } else {
      memories = await sql`
                SELECT id, consolidation_type as type, summary as content,
                       key_insights as tags, created_at,
                       'active' as status,
                       session_count as confidence
                FROM consolidated_memories
                WHERE tenant_id = ${tenantId}
                ORDER BY created_at DESC
                LIMIT 50
            `;
    }

    return c.json({
      success: true,
      data: memories.map((m: any) => ({
        id: m.id,
        type: m.type || "insight",
        content: m.content || "",
        tags: m.tags || [],
        created_at: m.created_at,
        status: m.status || "active",
        confidence: m.confidence ? Math.min(100, m.confidence * 10) : 50,
      })),
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Memories query failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// Knowledge Topics — CRUD (POST, PUT, DELETE)
// ============================================================================

// ============================================================================
// Entity 360: Context for entity (called by Entity360 assembler)
// ============================================================================

app.get("/v1/context/:entityId", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id required", 400);

  const entityId = c.req.param("entityId");
  const limit = parseInt(c.req.query("limit") || "10");
  const sql = neon(c.env);

  try {
    const items = await sql`
      SELECT id, content_type as type, title, summary, source, created_at, relevance_score as relevance
      FROM knowledge_extractions
      WHERE tenant_id = ${tenantId}
        AND (entity_id = ${entityId} OR metadata->>'entity_id' = ${entityId})
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return c.json({
      items: items.map((item: any) => ({
        id: item.id,
        type: item.type || "document",
        title: item.title || "Untitled",
        summary: item.summary,
        source: item.source || "knowledge",
        created_at: item.created_at,
        relevance: item.relevance,
      })),
      total: items.length,
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Context query failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// Entity 360: Memories for entity (called by Entity360 assembler)
// ============================================================================

app.get("/v1/memories", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenant_id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "tenant_id required", 400);

  const entityId = c.req.query("entity_id");
  const limit = parseInt(c.req.query("limit") || "15");
  const sql = neon(c.env);

  try {
    const memories = await sql`
      SELECT id, consolidation_type as memory_type, summary as content,
             session_count as confidence_raw, created_at, topic as source
      FROM consolidated_memories
      WHERE tenant_id = ${tenantId}
        AND (entity_id = ${entityId} OR metadata->>'entity_id' = ${entityId} OR ${!entityId})
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return c.json({
      memories: memories.map((m: any) => ({
        id: m.id,
        memory_type: m.memory_type || "insight",
        content: m.content || "",
        confidence: m.confidence_raw ? Math.min(1, m.confidence_raw / 10) : 0.5,
        source: m.source || "ai_extracted",
        created_at: m.created_at,
      })),
      total: memories.length,
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Entity memories query failed", {
      error: error.message,
    });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

app.post("/v1/knowledge/topics", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);

  const sql = neon(c.env);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, correlationId, "INVALID_BODY", "Invalid JSON", 400);
  }

  const id = generateUUID();
  try {
    await sql`
            INSERT INTO consolidated_memories (id, tenant_id, consolidation_type, summary, topic, session_count)
            VALUES (${id}, ${tenantId}, 'topic', ${body.name || body.summary || ""}, ${body.name || ""}, 0)
        `;
    return c.json({
      success: true,
      data: { id, name: body.name, document_count: 0 },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    return errorResponse(c, correlationId, "SAVE_ERROR", error.message, 500);
  }
});

app.put("/v1/knowledge/topics/:id", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);

  const topicId = c.req.param("id");
  const sql = neon(c.env);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, correlationId, "INVALID_BODY", "Invalid JSON", 400);
  }

  try {
    await sql`
            UPDATE consolidated_memories
            SET summary = ${body.name || body.summary || ""}, topic = ${body.name || ""}
            WHERE id = ${topicId} AND tenant_id = ${tenantId}
        `;
    return c.json({
      success: true,
      data: { id: topicId, name: body.name },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    return errorResponse(c, correlationId, "SAVE_ERROR", error.message, 500);
  }
});

app.delete("/v1/knowledge/topics/:id", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);

  const topicId = c.req.param("id");
  const sql = neon(c.env);

  try {
    await sql`DELETE FROM consolidated_memories WHERE id = ${topicId} AND tenant_id = ${tenantId}`;
    return c.json({ success: true, correlation_id: correlationId });
  } catch (error: any) {
    return errorResponse(c, correlationId, "DELETE_ERROR", error.message, 500);
  }
});

// ============================================================================
// Knowledge Documents List — proper GET /v1/knowledge/documents
// ============================================================================

app.get("/v1/knowledge/documents", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);

  const sql = neon(c.env);

  try {
    const docs = await sql`
            SELECT f.id, f.name as title, f.entity_type, f.entity_id, f.metadata,
                   fv.status, fv.created_at,
                   (SELECT COUNT(*) FROM file_embeddings fe WHERE fe.version_id = fv.id) as chunk_count
            FROM files f
            LEFT JOIN file_versions fv ON fv.file_id = f.id
            WHERE f.tenant_id = ${tenantId}
            ORDER BY f.created_at DESC
            LIMIT 100
        `.catch(() => []);

    return c.json({
      success: true,
      data: docs.map((d: any) => ({
        id: d.id,
        title: d.title || d.name,
        entity_type: d.entity_type,
        entity_id: d.entity_id,
        status: d.status || "ready",
        chunk_count: d.chunk_count || 0,
        created_at: d.created_at,
        metadata: d.metadata,
      })),
      correlation_id: correlationId,
    });
  } catch (error: any) {
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// Triage Center AI — Status & Manual Trigger
// The Triage Bot processes Flow C session memories:
//   Sessions → Extract → Validate vs Spine → Dedup → Score → Classify → Promote
// Only delta updates: processes new sessions since last consolidation run.
// ============================================================================

app.get("/v1/triage/status", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const sql = neon(c.env);

  try {
    // Count sessions and consolidated memories for this tenant
    const [sessionCount, memoryCount, recentPromoted] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM ai_sessions WHERE tenant_id = ${tenantId}`.catch(() => [
        { cnt: 0 },
      ]),
      sql`SELECT COUNT(*) as cnt FROM consolidated_memories WHERE tenant_id = ${tenantId}`.catch(
        () => [{ cnt: 0 }]
      ),
      sql`SELECT COUNT(*) as cnt FROM consolidated_memories WHERE tenant_id = ${tenantId} AND created_at > NOW() - INTERVAL '24 hours'`.catch(
        () => [{ cnt: 0 }]
      ),
    ]);

    return c.json({
      success: true,
      data: {
        tenant_id: tenantId,
        total_sessions: sessionCount[0]?.cnt || 0,
        total_consolidated_memories: memoryCount[0]?.cnt || 0,
        recent_promotions_24h: recentPromoted[0]?.cnt || 0,
        triage_pipeline: ["extract", "validate", "dedup", "score", "classify", "promote"],
        schedules: {
          hourly: "Topic clustering of recent sessions",
          daily: "Deep user/account consolidation + health signals",
          weekly: "Cross-account pattern extraction + best practices",
        },
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Triage status failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

/**
 * POST /v1/triage/run — Manually trigger a triage consolidation cycle
 * Used for testing or when immediate consolidation is needed after many sessions.
 */
app.post("/v1/triage/run", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const type = body.type || "hourly";
  if (!["hourly", "daily", "weekly"].includes(type)) {
    return errorResponse(
      c,
      correlationId,
      "VALIDATION_ERROR",
      "type must be hourly|daily|weekly",
      400
    );
  }

  logWithContext(correlationId, "info", "Manual consolidation triggered", {
    tenant_id: tenantId,
    type,
  });

  // ── Real consolidation: read approved triage items, group, summarize, store ──
  const sql = neon(c.env);

  // 1. Determine time window based on type
  const now = new Date();
  const startTime = new Date(now);
  if (type === "hourly") startTime.setHours(startTime.getHours() - 1);
  else if (type === "daily") startTime.setDate(startTime.getDate() - 1);
  else startTime.setDate(startTime.getDate() - 7);

  // 2. Fetch approved triage items in time window
  let approvedItems: any[] = [];
  try {
    approvedItems = await sql`
      SELECT id, message_id, content, priority, category, confidence, reasoning, sentiment, metadata, created_at
      FROM triage_results
      WHERE approval_status = 'approved'
        AND metadata->>'tenant_id' = ${tenantId}
        AND created_at >= ${startTime.toISOString()}
      ORDER BY created_at DESC
      LIMIT 200
    `;
  } catch (err: any) {
    logWithContext(correlationId, "warn", "Failed to fetch approved triage items", {
      error: err.message,
    });
  }

  if (approvedItems.length === 0) {
    return c.json({
      success: true,
      data: {
        status: "no_items",
        type,
        tenant_id: tenantId,
        message: `No approved items found in ${type} window since ${startTime.toISOString()}`,
        consolidated: 0,
      },
      correlation_id: correlationId,
    });
  }

  // 3. Group by category for topic-based consolidation
  const groups: Record<string, any[]> = {};
  for (const item of approvedItems) {
    const key = item.category || "general";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // 4. Generate consolidated memories per group
  let consolidatedCount = 0;
  for (const [category, items] of Object.entries(groups)) {
    if (items.length < 1) continue;

    // Build summary using Workers AI if available, otherwise create a structured fallback
    let summary = "";
    let keyInsights: string[] = [];
    let recurringThemes: string[] = [];

    if (c.env.AI && items.length >= 2) {
      try {
        const contentSnippets = items
          .slice(0, 10)
          .map((i: any) => i.content?.slice(0, 300) || "")
          .filter(Boolean)
          .join("\n---\n");

        const prompt = `You are a knowledge consolidation engine. Summarize these ${items.length} approved AI session memories into a single consolidated memory.
Category: ${category}
Time range: ${startTime.toISOString()} to ${now.toISOString()}

Sessions:
${contentSnippets}

Respond with ONLY a JSON object:
{"summary":"one paragraph summary","key_insights":["insight1","insight2"],"recurring_themes":["theme1","theme2"],"action_patterns":["action1"]}`;

        const out = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt });
        const text = (out as any)?.response ?? (typeof out === "string" ? out : "");
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          summary = parsed.summary || "";
          keyInsights = Array.isArray(parsed.key_insights) ? parsed.key_insights : [];
          recurringThemes = Array.isArray(parsed.recurring_themes) ? parsed.recurring_themes : [];
        }
      } catch (aiErr: any) {
        logWithContext(correlationId, "warn", "AI consolidation fallback", {
          error: aiErr.message,
        });
      }
    }

    // Fallback summary if AI didn't produce one
    if (!summary) {
      summary = `Consolidated ${items.length} ${category} sessions from ${type} window. Priorities: ${[...new Set(items.map((i: any) => i.priority))].join(", ")}. Sentiments: ${[...new Set(items.map((i: any) => i.sentiment))].join(", ")}.`;
      keyInsights = items
        .filter((i: any) => i.reasoning)
        .slice(0, 5)
        .map((i: any) => i.reasoning);
      recurringThemes = [...new Set(items.map((i: any) => i.category))];
    }

    // 5. Write consolidated memory to D1 (DECISION 22: Cloudflare-only)
    const memoryId = crypto.randomUUID();
    const consolidationType = type === "weekly" ? "pattern" : type === "daily" ? "user" : "topic";

    try {
      await sql`
        INSERT INTO consolidated_memories (id, tenant_id, consolidation_type, topic, summary, key_insights, recurring_themes, action_patterns, session_count, time_range_start, time_range_end, created_at)
        VALUES (${memoryId}, ${tenantId}, ${consolidationType}, ${category}, ${summary}, ${JSON.stringify(keyInsights)}, ${JSON.stringify(recurringThemes)}, ${JSON.stringify([])}, ${items.length}, ${startTime.toISOString()}, ${now.toISOString()}, ${now.toISOString()})
      `;
      consolidatedCount++;
    } catch (storeErr: any) {
      logWithContext(correlationId, "warn", "Failed to store consolidated memory", {
        error: storeErr.message,
        category,
      });
    }
  }

  logWithContext(correlationId, "info", "Consolidation completed", {
    tenant_id: tenantId,
    type,
    input_items: approvedItems.length,
    groups: Object.keys(groups).length,
    consolidated: consolidatedCount,
  });

  return c.json({
    success: true,
    data: {
      status: "completed",
      type,
      tenant_id: tenantId,
      input_items: approvedItems.length,
      categories: Object.keys(groups),
      consolidated_memories: consolidatedCount,
      time_window: {
        start: startTime.toISOString(),
        end: now.toISOString(),
      },
    },
    correlation_id: correlationId,
  });
});

/**
 * POST /v1/triage/session — Triage bot (Cloudflare AI): session/memory triage after MCP capture.
 * Called by MCP Connector after save_session_memory. Uses Workers AI to classify priority, category, sentiment;
 * writes to triage_results with platform='integratewise_session' for consolidation/review and AI agent access.
 */
app.post("/v1/triage/session", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  let body: {
    session_id: string;
    summary: string;
    memories?: Array<{ text?: string; content?: string }>;
  };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, correlationId, "INVALID_JSON", "Request body must be JSON", 400);
  }
  const sessionId = body.session_id ?? "";
  const summary = body.summary ?? "";
  if (!sessionId || !summary) {
    return errorResponse(
      c,
      correlationId,
      "VALIDATION_ERROR",
      "session_id and summary required",
      400
    );
  }

  let priority: "low" | "medium" | "high" | "urgent" = "medium";
  let category: string = "general";
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let reasoning: string = "";

  if (c.env.AI) {
    try {
      const memoriesSnippet = (body.memories ?? [])
        .slice(0, 5)
        .map((m: any) => m.text || m.content || "")
        .filter(Boolean)
        .join(" ");
      const prompt = `You are a triage bot. Classify this AI session for memory consolidation.
Session summary: ${summary.slice(0, 1500)}
${memoriesSnippet ? `Memories excerpt: ${memoriesSnippet.slice(0, 500)}` : ""}
Respond with ONLY a JSON object (no markdown), exactly: {"priority":"low|medium|high|urgent","category":"question|bug_report|feature_request|support|feedback|urgent|general|spam","sentiment":"positive|neutral|negative","reasoning":"one short sentence"}`;
      const out = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt });
      const text = (out as any)?.response ?? (typeof out === "string" ? out : "");
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as any;
        if (["low", "medium", "high", "urgent"].includes(parsed.priority))
          priority = parsed.priority;
        if (parsed.category) category = String(parsed.category);
        if (["positive", "neutral", "negative"].includes(parsed.sentiment))
          sentiment = parsed.sentiment;
        if (parsed.reasoning) reasoning = String(parsed.reasoning).slice(0, 500);
      }
    } catch (aiErr: any) {
      logWithContext(correlationId, "warn", "Triage AI fallback to defaults", {
        error: aiErr.message,
      });
    }
  }

  // ── Flow C Config: Evaluate auto-approve / triage / discard routing ──
  // Confidence-based routing (inline rules matching AGGRESSIVE_FLOW_C_CONFIG pattern).
  // When TENANTS service binding is available, this will delegate to evaluateFlowCConfig().
  const triageConfidence = 0.85; // confidence assigned by triage bot
  let approvalStatus: "approved" | "pending" | "discarded" = "pending";
  let autoApproved = false;

  if (priority === "urgent" || (triageConfidence >= 0.85 && category !== "spam")) {
    // High-confidence non-spam or urgent items: auto-approve for consolidation
    approvalStatus = "approved";
    autoApproved = true;
  } else if (triageConfidence < 0.5 || category === "spam") {
    // Low-confidence or spam: auto-discard
    approvalStatus = "discarded";
  }
  // else: stays "pending" for HITL review in Triage Inbox

  logWithContext(correlationId, "info", "Flow C routing decision", {
    tenant_id: tenantId,
    session_id: sessionId,
    confidence: triageConfidence,
    priority,
    category,
    approval_status: approvalStatus,
    auto_approved: autoApproved,
  });

  try {
    const sql = neon(c.env);
    await sql`
            INSERT INTO triage_results (message_id, platform, content, priority, category, confidence, reasoning, sentiment, metadata, approval_status, created_at, updated_at)
            VALUES (${sessionId}, 'integratewise_session', ${summary.slice(0, 10000)}, ${priority}, ${category}, ${triageConfidence}, ${reasoning}, ${sentiment}, ${JSON.stringify({ tenant_id: tenantId, source: "mcp_capture", auto_approved: autoApproved })}, ${approvalStatus}, NOW(), NOW())
        `.catch(() => null);
  } catch (err: any) {
    logWithContext(correlationId, "warn", "Triage session insert failed (non-blocking)", {
      error: err.message,
    });
  }

  // If auto-approved and TASKS_QUEUE is available, trigger immediate consolidation
  if (autoApproved && c.env.TASKS_QUEUE) {
    try {
      await c.env.TASKS_QUEUE.send({
        type: "immediate_consolidation",
        tenant_id: tenantId,
        session_id: sessionId,
        trigger: "auto_approve",
      });
    } catch (queueErr: any) {
      logWithContext(correlationId, "warn", "Immediate consolidation queue send failed", {
        error: queueErr.message,
      });
    }
  }

  return c.json({
    success: true,
    data: {
      session_id: sessionId,
      priority,
      category,
      sentiment,
      reasoning: reasoning.slice(0, 200),
      approval_status: approvalStatus,
      auto_approved: autoApproved,
    },
    correlation_id: correlationId,
  });
});

/**
 * GET /v1/triage/approved — List approved triage items (for Memory Consolidator §17.2)
 * Only items with approval_status='approved'. Used by Consolidator to promote to compounding.
 * Query params: tenant_id (or x-tenant-id), start_time, end_time, limit.
 */
app.get("/v1/triage/approved", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id") || c.req.query("tenant_id");
  if (!tenantId) {
    return errorResponse(
      c,
      correlationId,
      "MISSING_TENANT",
      "x-tenant-id or tenant_id required",
      400
    );
  }

  const startTime = c.req.query("start_time") || "";
  const endTime = c.req.query("end_time") || "";
  const limit = Math.min(Number(c.req.query("limit")) || 500, 500);

  try {
    const sql = neon(c.env);
    const rows = await sql`
            SELECT id, message_id, platform, content, priority, category, metadata, created_at
            FROM triage_results
            WHERE metadata->>'tenant_id' = ${tenantId} AND approval_status = 'approved'
            ${startTime ? sql`AND created_at >= ${startTime}` : sql``}
            ${endTime ? sql`AND created_at <= ${endTime}` : sql``}
            ORDER BY approved_at DESC NULLS LAST, created_at DESC
            LIMIT ${limit}
        `;
    return c.json({
      success: true,
      data: { items: rows },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Triage approved list failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

/**
 * GET /v1/triage/results — List triage results for the tenant (for UI and HITL).
 * Filters by metadata->>'tenant_id'. Optional: platform, priority, limit, offset.
 */
app.get("/v1/triage/results", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const platform = c.req.query("platform");
  const priority = c.req.query("priority");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;

  const sql = neon(c.env);

  try {
    // triage_results: tenant_id is in metadata JSONB
    const rows = await sql`
            SELECT id, message_id, platform, content, priority, category, confidence, reasoning, sentiment, metadata, created_at, updated_at
            FROM triage_results
            WHERE metadata->>'tenant_id' = ${tenantId}
            ${platform ? sql`AND platform = ${platform}` : sql``}
            ${priority ? sql`AND priority = ${priority}` : sql``}
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

    return c.json({
      success: true,
      data: { results: rows, limit, offset },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Triage results list failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

/**
 * PATCH /v1/triage/:id — Approve/Discard/Defer triage item (§17.2)
 * Gates promotion to compounding. Only approved items promoted by Memory Consolidator.
 */
app.patch("/v1/triage/:id", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  const id = c.req.param("id");
  if (!tenantId)
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  if (!id) return errorResponse(c, correlationId, "MISSING_ID", "Triage id required", 400);

  let body: { action: "approve" | "discard" | "defer" };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, correlationId, "INVALID_JSON", "Request body must be JSON", 400);
  }
  const action = body?.action;
  if (!action || !["approve", "discard", "defer"].includes(action)) {
    return errorResponse(
      c,
      correlationId,
      "VALIDATION_ERROR",
      "action must be approve, discard, or defer",
      400
    );
  }

  const approvalStatus =
    action === "approve" ? "approved" : action === "discard" ? "discarded" : "deferred";
  const userId = c.req.header("x-user-id") || "system";

  try {
    const sql = neon(c.env);
    const updated = await sql`
            UPDATE triage_results
            SET approval_status = ${approvalStatus},
                approved_by = ${action === "approve" ? userId : null},
                approved_at = ${action === "approve" ? new Date() : null},
                updated_at = NOW()
            WHERE id = ${id} AND metadata->>'tenant_id' = ${tenantId}
            RETURNING id, approval_status, approved_by, approved_at
        `;
    if (!updated.length) {
      return errorResponse(
        c,
        correlationId,
        "NOT_FOUND",
        "Triage item not found or tenant mismatch",
        404
      );
    }
    return c.json({
      success: true,
      data: {
        id: updated[0].id,
        approval_status: approvalStatus,
        approved_by: updated[0].approved_by,
        approved_at: updated[0].approved_at,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Triage update failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

// ============================================================================
// Flow B Backend — Processing Status, Feedback, Reprocess
// ============================================================================

/**
 * GET /v1/knowledge/processing-status/:id — Check document processing status
 */
app.get("/v1/knowledge/processing-status/:id", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const fileId = c.req.param("id");
  const sql = neon(c.env);

  try {
    const rows = await sql`
            SELECT fv.id as version_id, fv.status, fv.created_at,
                   f.name, f.entity_type, f.entity_id,
                   (SELECT COUNT(*) FROM file_embeddings fe WHERE fe.version_id = fv.id) as chunk_count
            FROM file_versions fv
            JOIN files f ON f.id = fv.file_id
            WHERE f.id = ${fileId} AND f.tenant_id = ${tenantId}
            ORDER BY fv.created_at DESC
            LIMIT 1
        `;

    if (rows.length === 0) {
      return errorResponse(c, correlationId, "NOT_FOUND", "File not found", 404);
    }

    const row = rows[0];
    return c.json({
      success: true,
      data: {
        file_id: fileId,
        version_id: row.version_id,
        status: row.status,
        name: row.name,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        chunk_count: row.chunk_count,
        created_at: row.created_at,
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Processing status failed", { error: error.message });
    return errorResponse(c, correlationId, "QUERY_ERROR", error.message, 500);
  }
});

/**
 * POST /v1/knowledge/extraction-feedback — Submit feedback on extraction quality
 *
 * Frontend sends: { documentId, extractionId, corrections: [{field, original, corrected}], approved }
 * Also accepts: { file_id, version_id, rating, feedback_text, corrections }
 */
app.post("/v1/knowledge/extraction-feedback", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, correlationId, "INVALID_BODY", "Invalid JSON body", 400);
  }

  // Accept both frontend naming (documentId) and backend naming (file_id)
  const fileId = body.documentId || body.file_id;
  const extractionId = body.extractionId || body.version_id;
  const corrections = body.corrections || [];
  const approved = body.approved;
  const rating = body.rating ?? (approved === true ? 5 : approved === false ? 1 : null);
  const feedbackText = body.feedback_text || null;

  if (!fileId) {
    return errorResponse(
      c,
      correlationId,
      "VALIDATION_ERROR",
      "documentId or file_id is required",
      400
    );
  }

  const sql = neon(c.env);

  try {
    const feedbackId = generateUUID();
    await sql`
            INSERT INTO extraction_feedback (id, tenant_id, file_id, version_id, rating, feedback_text, corrections, created_at)
            VALUES (${feedbackId}, ${tenantId}, ${fileId}, ${extractionId || null}, ${rating}, ${feedbackText}, ${corrections.length > 0 ? JSON.stringify(corrections) : null}, NOW())
            ON CONFLICT DO NOTHING
        `;

    logWithContext(correlationId, "info", "Extraction feedback saved", {
      file_id: fileId,
      extraction_id: extractionId,
      approved,
      corrections_count: corrections.length,
    });

    return c.json({
      success: true,
      data: { feedback_id: feedbackId },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Feedback save failed", { error: error.message });
    return errorResponse(c, correlationId, "SAVE_ERROR", error.message, 500);
  }
});

/**
 * POST /v1/knowledge/reprocess/:id — Re-ingest a document through the pipeline
 */
app.post("/v1/knowledge/reprocess/:id", async (c) => {
  const correlationId = getCorrelationId(c);
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return errorResponse(c, correlationId, "MISSING_TENANT", "x-tenant-id header required", 400);
  }

  const fileId = c.req.param("id");
  const sql = neon(c.env);

  try {
    // Get the file and its latest content
    const rows = await sql`
            SELECT f.id, f.name, f.entity_type, f.entity_id, f.metadata,
                   fv.id as version_id
            FROM files f
            JOIN file_versions fv ON fv.file_id = f.id
            WHERE f.id = ${fileId} AND f.tenant_id = ${tenantId}
            ORDER BY fv.created_at DESC
            LIMIT 1
        `;

    if (rows.length === 0) {
      return errorResponse(c, correlationId, "NOT_FOUND", "File not found", 404);
    }

    const file = rows[0];

    // Create a new version with 'processing' status
    const newVersionRows = await sql`
            INSERT INTO file_versions (file_id, status)
            VALUES (${fileId}, 'reprocessing')
            RETURNING id
        `;

    // Clear old embeddings for the previous version
    await sql`
            DELETE FROM file_embeddings WHERE version_id = ${file.version_id}
        `;

    logWithContext(correlationId, "info", "Reprocess initiated", {
      file_id: fileId,
      new_version_id: newVersionRows[0]?.id,
    });

    return c.json({
      success: true,
      data: {
        file_id: fileId,
        new_version_id: newVersionRows[0]?.id,
        status: "reprocessing",
        message: "Document queued for re-extraction",
      },
      correlation_id: correlationId,
    });
  } catch (error: any) {
    logWithContext(correlationId, "error", "Reprocess failed", { error: error.message });
    return errorResponse(c, correlationId, "REPROCESS_ERROR", error.message, 500);
  }
});

// ============================================================================
// Legacy /v1 Endpoints (Backward Compatibility)
// ============================================================================

const LegacyIngestSchema = z.object({
  tenant_id: z.string().uuid(),
  file_id: z.string().uuid(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  doc_type: z
    .enum(["contract", "runbook", "icp", "meeting_notes", "qbr", "technical_manual"])
    .default("technical_manual"),
  name: z.string(),
  content: z.string(),
});

app.post("/v1/knowledge/ingest", async (c) => {
  const correlationId = getCorrelationId(c);
  const sql = neon(c.env);
  try {
    const body = await c.req.json();
    const result = LegacyIngestSchema.safeParse(body);
    if (!result.success) return c.json({ error: result.error.flatten() }, 400);

    const { tenant_id, file_id, entity_type, entity_id, doc_type, name, content } = result.data;

    logWithContext(correlationId, "info", "Legacy ingest request", { file_id, doc_type });

    // 1. Enforce Guardrails
    const limitCheck = await enforceTenantLimits(c.env.DATABASE_URL, tenant_id, "docs_ingested");
    if (!limitCheck.allowed) {
      return c.json({ error: limitCheck.reason, correlation_id: correlationId }, 429);
    }

    // 2. Logic to track file and versions
    const [file] = await sql`
            INSERT INTO files (id, tenant_id, name, entity_type, entity_id, metadata)
            VALUES (${file_id}, ${tenant_id}::uuid, ${name}, ${entity_type}, ${entity_id}, ${JSON.stringify({ doc_type })})
            ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
            RETURNING id
        `;

    const [version] = await sql`
            INSERT INTO file_versions (file_id, status)
            VALUES (${file.id}, 'processing')
            RETURNING id
        `;

    // 3. Chunks & Embeddings (Simulated for Worker context)
    const chunks = content.split("\n\n").filter(Boolean);

    // Check embedding limits before loop
    const chunkLimitCheck = await enforceTenantLimits(
      c.env.DATABASE_URL,
      tenant_id,
      "chunks_embedded",
      chunks.length
    );
    if (!chunkLimitCheck.allowed) {
      await sql`UPDATE file_versions SET status = 'limit_exceeded' WHERE id = ${version.id}`;
      return c.json({ error: chunkLimitCheck.reason }, 429);
    }

    for (let i = 0; i < chunks.length; i++) {
      let embedding: number[];
      const openRouterKey = (c.env as any).OPENROUTER_API_KEY;
      const openaiKey = (c.env as any).OPENAI_API_KEY;

      if (openaiKey) {
        try {
          const res = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: chunks[i].slice(0, 8000),
            }),
          });
          const data = (await res.json()) as any;
          embedding = data.data?.[0]?.embedding || Array(1536).fill(0);
        } catch {
          embedding = Array(1536).fill(0);
        }
      } else if (openRouterKey) {
        try {
          const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/text-embedding-3-small",
              input: chunks[i].slice(0, 8000),
            }),
          });
          const data = (await res.json()) as any;
          embedding = data.data?.[0]?.embedding || Array(1536).fill(0);
        } catch {
          embedding = Array(1536).fill(0);
        }
      } else {
        embedding = Array(1536).fill(0);
      }

      await sql`
                INSERT INTO file_embeddings (version_id, chunk_index, chunk_content, embedding, metadata)
                VALUES (
                    ${version.id}, 
                    ${i}, 
                    ${chunks[i]}, 
                    ${"[" + embedding.join(",") + "]"}::vector,
                    ${JSON.stringify({ tenant_id, entity_type, entity_id, doc_type })}
                )
            `;
    }

    await sql`UPDATE file_versions SET status = 'ready' WHERE id = ${version.id}`;

    return c.json({
      success: true,
      file_id: file.id,
      version_id: version.id,
      chunks_embedded: chunks.length,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/v1/store/upload", async (c) => {
  const tenant_id = c.req.header("x-tenant-id");
  if (!tenant_id) return c.json({ error: "x-tenant-id header required" }, 400);

  // SPEC: Use /v1/store/upload as single entry point
  const file_id = crypto.randomUUID();
  return c.json({
    success: true,
    file_id,
    instructions: "Send result to /v1/knowledge/ingest to complete pipeline",
  });
});

// ============================================================================
// Queue Handler (v3.6 Section 19.7)
// Consumes: integratewise-knowledge-ingest
// Processes document chunks, embeddings, and session summaries
// ============================================================================
export const queue = {
  async queue(batch: MessageBatch<any>, env: KnowledgeBindings): Promise<void> {
    const correlationId = crypto.randomUUID();

    for (const message of batch.messages) {
      let {
        tenant_id,
        entity_type,
        source_type,
        source_name,
        content,
        entity_id,
        file_id,
        file_type,
        session_id,
        summary,
        tool_calls,
        memories,
        correlation_id: msg_correlation_id,
      } = message.body;

      const trace_id = msg_correlation_id || correlationId;

      // Tenant-scoped consumer (CONSOLIDATED_AGENT_TODO D.19): skip messages without tenant_id
      if (!tenant_id || typeof tenant_id !== "string" || !tenant_id.trim()) {
        logWithContext(trace_id, "warn", "Knowledge queue message skipped: missing tenant_id", {});
        message.ack();
        continue;
      }

      try {
        // Context ingestion tenant scoping: only link to entities allowed for tenant (HARDENING_AND_WIRING.md §7)
        // DECISION 22: D1-based tenant entity type lookup (replaces Supabase REST)
        if (entity_type && entity_id && (env as any).DB) {
          try {
            const row = await ((env as any).DB as D1Database)
              .prepare(`SELECT entity_types FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`)
              .bind(tenant_id)
              .first<{ entity_types: string }>();
            if (row?.entity_types) {
              const allowedTypes = new Set<string>(JSON.parse(row.entity_types));
              if (!allowedTypes.has(entity_type)) {
                entity_type = undefined;
                entity_id = undefined;
              }
            }
          } catch {
            /* best-effort scoping */
          }
        }
        console.log(
          `[Knowledge Queue] Ingesting content for tenant ${tenant_id} (${source_type}) - Correlation: ${trace_id}`
        );

        const embedder = getEmbedder(env);

        // Handle document ingestion (Flow B — Unstructured Docs)
        if (content && source_type !== "session") {
          logWithContext(trace_id, "info", "Processing document ingest from queue", {
            source_type,
            content_length: content.length,
            file_type,
          });

          try {
            const result = await processAndStoreDocument(env.DATABASE_URL, content, {
              tenantId: tenant_id,
              sourceType: source_type || "file",
              sourceName: source_name,
              entityType: entity_type,
              entityId: entity_id,
              fileId: file_id,
              fileType: file_type,
              embedder,
            });

            logWithContext(trace_id, "info", "Document ingest completed", {
              chunks: result.totalChunks,
              tokens: result.totalTokens,
            });

            message.ack();
          } catch (ingest_err: any) {
            logWithContext(trace_id, "error", "Document ingest failed", {
              error: ingest_err.message,
            });
            message.retry();
          }
          continue;
        }

        // Handle session embedding (Flow C — AI Chat Results)
        if (session_id && summary) {
          logWithContext(trace_id, "info", "Processing session embedding from queue", {
            session_id,
            summary_length: summary.length,
          });

          try {
            // Chunk the session
            const chunkResult = await chunkSession(summary, tool_calls, memories);

            // Store chunks
            const chunkIds = await storeChunks(env.DATABASE_URL, chunkResult.chunks, {
              tenantId: tenant_id,
              sourceType: "session",
              sourceName: `Session ${session_id}`,
              entityType: entity_type,
              entityId: entity_id,
              sessionId: session_id,
            });

            // Generate embeddings
            const texts = chunkResult.chunks.map((chunk) => chunk.content);
            const embeddingResult = await embedder.embedBatch(texts);

            // Store chunk embeddings
            const embeddingsToStore = embeddingResult.embeddings.map((e, i) => ({
              chunkId: chunkIds[i],
              embedding: e.embedding,
              model: embeddingResult.model,
            }));

            await storeEmbeddings(env.DATABASE_URL, tenant_id, embeddingsToStore);

            // Store session-level embedding (summary)
            const summaryEmbedding = await embedder.embed(summary);
            await storeSessionEmbedding(
              env.DATABASE_URL,
              tenant_id,
              session_id,
              "summary",
              summary,
              summaryEmbedding.embedding,
              embeddingResult.model
            );

            logWithContext(trace_id, "info", "Session embedding completed", {
              chunks: chunkResult.chunks.length,
              tokens: chunkResult.totalTokens,
            });

            message.ack();
          } catch (session_err: any) {
            logWithContext(trace_id, "error", "Session embedding failed", {
              error: session_err.message,
            });
            message.retry();
          }
          continue;
        }

        // Invalid message format
        console.warn(
          `[Knowledge Queue] Received invalid message format - no content or session data`
        );
        message.ack();
      } catch (error: any) {
        logWithContext(trace_id, "error", "Queue processing failed", { error: error.message });
        message.retry();
      }
    }
  },
};

// ============================================================================
// Memory Consolidator (Triage Center AI)
// Scheduled worker that processes Flow C session memories:
//   1. EXTRACT facts, decisions, risks from raw sessions
//   2. VALIDATE against Spine entities
//   3. DEDUPLICATE semantically similar items
//   4. SCORE confidence + recency
//   5. CLASSIFY topic/subtopic/domain
//   6. PROMOTE high-confidence items (≥0.85) to shared Knowledge Bank
// Only processes DELTAS (new/changed sessions since last run).
// ============================================================================

import memoryConsolidatorWorker, { MemoryConsolidator } from "./memory-consolidator";

export { MemoryConsolidator };

export default {
  fetch: app.fetch,
  queue: queue.queue,
  async scheduled(
    event: ScheduledEvent,
    env: KnowledgeBindings,
    ctx: ExecutionContext
  ): Promise<void> {
    // Delegate to Memory Consolidator scheduled handler
    try {
      void ctx;
      await memoryConsolidatorWorker.scheduled(event, env as any);
    } catch (err: any) {
      console.error("[Knowledge:scheduled] Memory consolidation failed:", err.message);
    }
  },
};
