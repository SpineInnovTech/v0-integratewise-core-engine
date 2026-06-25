/**
 * IntegrateWise MCP Tool Server
 *
 * Standalone Cloudflare Worker for MCP-style tool discovery and invocation.
 * Provides Knowledge Bank operations via 7 tools.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getTenantAllowedEntityTypes } from "@integratewise/connector-utils";
import { structuredLog, getRequestId } from "./lib/logging";
import { toolsHandler, invokeHandler } from "./handlers/tools";
// Coda proxy removed — Coda is a connector, not an MCP tool. See D2026-05-27-001.
import { createMcpServer, type McpActor } from "./mcp-server";
import { handleMcpRequest } from "./mcp-transport";
import {
  authorizationServerMetadata,
  protectedResourceMetadata,
  jwksDocument,
  renderAuthorizeConsentHtml,
  handleAuthorizeConfirm,
  handleTokenExchange,
  type OAuthAuthServerEnv,
} from "./lib/oauth-auth-server";
import { oauthResourceMiddleware } from "./lib/oauth-middleware";
import { resolveOAuthResource, wwwAuthenticateChallenge } from "./lib/oauth-constants";

type Bindings = OAuthAuthServerEnv & {
  KB_BUCKET?: string;
  GCS_PROJECT_ID?: string;
  FIRESTORE_PROJECT_ID?: string;
  VERTEX_AI_SEARCH_ENGINE_ID?: string;
  VERTEX_AI_LOCATION?: string;
  DATABASE_URL?: string; // Legacy
  DB?: D1Database; // Day 2: D1 Database (required when run in connector; optional for standalone)
  KNOWLEDGE_SERVICE_URL?: string; // Day 2: Knowledge service for embedding
  KNOWLEDGE: Fetcher; // Service binding to integratewise-knowledge
  CONTINUITY?: Fetcher; // Service binding to integratewise-continuity
  PIPELINE?: Fetcher; // Service binding to integratewise-pipeline
  PIPELINE_QUEUE?: Queue; // Queue producer binding
  ENVIRONMENT: string;
  TRIAGE_BOT_API_KEY?: string; // Write-protected tools require this key
  MCP_CONNECTOR_API_KEY?: string;
  MCP_IDEMPOTENCY?: KVNamespace;
  // Optional: tenant Spine config for context ingestion scoping (HARDENING_AND_WIRING.md §7)
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  // Spine-native routing
  INTELLIGENCE_URL?: string;
  SERVICE_SECRET?: string;
  // Cloudflare Access OAuth
  CF_ACCESS_TEAM_DOMAIN?: string; // e.g., "integratewise.cloudflareaccess.com" (Cloudflare Zero Trust team domain)
  CF_ACCESS_AUD?: string; // Application Audience (AUD) tag from Access
  MCP_OAUTH_REQUIRED?: string; // "true" | "false" — require Bearer on protected MCP paths
};

type Variables = {
  requestId: string;
  log: ReturnType<typeof structuredLog>;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS for preflight
app.use("*", cors());

// Request ID and logging middleware
app.use("*", async (c, next) => {
  const requestId = getRequestId(c.req.header("x-request-id"));
  c.set("requestId", requestId);
  c.set("log", structuredLog(requestId, c.env.ENVIRONMENT));

  const log = c.get("log");
  const start = Date.now();

  log.info("Request started", {
    method: c.req.method,
    path: c.req.path,
  });

  await next();

  log.info("Request completed", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - start,
  });

  c.res.headers.set("x-request-id", requestId);
});

// OAuth resource-server gate (401 + WWW-Authenticate on protected MCP paths)
app.use("*", oauthResourceMiddleware);

// Rate limiting middleware for /invoke endpoint
app.use("/invoke", async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rateLimitKey = `rate_limit:${ip}`;

  // Simple rate limiting using KV (if available)
  if (c.env.MCP_IDEMPOTENCY) {
    const current = await c.env.MCP_IDEMPOTENCY.get(rateLimitKey);
    const count = current ? parseInt(current) : 0;

    if (count >= 100) {
      // 100 requests per minute
      return c.json(
        {
          status: "error",
          error: {
            code: "RATE_LIMITED",
            message: "Rate limit exceeded. Try again later.",
          },
        },
        429
      );
    }

    // Increment counter
    await c.env.MCP_IDEMPOTENCY.put(
      rateLimitKey,
      String(count + 1),
      { expirationTtl: 60 } // 1 minute TTL
    );
  }

  await next();
});

// ============================================================================
// OAUTH DISCOVERY & AUTHORIZATION SERVER
// ============================================================================

app.get("/.well-known/oauth-protected-resource", (c) => {
  const url = new URL(c.req.url);
  return c.json(protectedResourceMetadata(url, c.env), 200, {
    "Access-Control-Allow-Origin": "*",
  });
});

app.get("/.well-known/oauth-authorization-server", (c) => {
  const url = new URL(c.req.url);
  return c.json(authorizationServerMetadata(url, c.env), 200, {
    "Access-Control-Allow-Origin": "*",
  });
});

app.get("/.well-known/openid-configuration", (c) => {
  const url = new URL(c.req.url);
  return c.json(authorizationServerMetadata(url, c.env), 200, {
    "Access-Control-Allow-Origin": "*",
  });
});

app.get("/.well-known/jwks.json", (c) => {
  return c.json(jwksDocument(), 200, {
    "Access-Control-Allow-Origin": "*",
  });
});

app.get("/oauth/authorize", (c) => {
  const url = new URL(c.req.url);
  const redirect_uri = url.searchParams.get("redirect_uri");
  if (!redirect_uri) {
    return c.text("Missing redirect_uri parameter", 400);
  }

  return c.html(
    renderAuthorizeConsentHtml({
      client_id: url.searchParams.get("client_id"),
      redirect_uri,
      state: url.searchParams.get("state"),
      scope: url.searchParams.get("scope") || "",
    })
  );
});

app.post("/oauth/authorize/confirm", (c) => handleAuthorizeConfirm(c.req.raw, c.env));
app.post("/oauth/token", (c) => handleTokenExchange(c.req.raw, c.env));

// OAuth 2.0 Dynamic Client Registration (RFC 7591)
// Required by MCP spec for clients like Kiro, Claude Desktop, Cursor to auto-register
app.post("/oauth/register", async (c) => {
  try {
    const body = (await c.req.json()) as {
      client_name?: string;
      redirect_uris?: string[];
      grant_types?: string[];
      response_types?: string[];
      token_endpoint_auth_method?: string;
      scope?: string;
    };

    const clientId = `dyn_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const clientSecret = crypto.randomUUID();

    // Hash the secret for storage (same as existing clients)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(clientSecret));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const clientSecretHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const scopes = body.scope ? body.scope.split(" ") : ["mcp:tools", "mcp:resources"];

    // Store in D1 oauth_clients table (matching existing schema)
    const db = c.env.DB as D1Database;
    await db
      .prepare(
        `INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris, allowed_scopes, tenant_id, grant_types, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
      )
      .bind(
        clientId,
        clientSecretHash,
        body.client_name || "dynamic-mcp-client",
        JSON.stringify(body.redirect_uris || []),
        JSON.stringify(scopes),
        "iw-customer-zero",
        JSON.stringify(body.grant_types || ["authorization_code"])
      )
      .run();

    // Return RFC 7591 response
    return c.json(
      {
        client_id: clientId,
        client_secret: clientSecret,
        client_name: body.client_name || "dynamic-mcp-client",
        redirect_uris: body.redirect_uris || [],
        grant_types: body.grant_types || ["authorization_code"],
        response_types: body.response_types || ["code"],
        token_endpoint_auth_method: body.token_endpoint_auth_method || "client_secret_post",
        scope: scopes.join(" "),
        client_id_issued_at: Math.floor(Date.now() / 1000),
      },
      201
    );
  } catch (err: any) {
    console.error("[OAuth Register] Error:", err.message);
    return c.json({ error: "server_error", error_description: err.message }, 500);
  }
});

// OAuth 2.0 Token Revocation (RFC 7009)
app.post("/oauth/revoke", async (c) => {
  const contentType = c.req.header("Content-Type") || "";
  let body: Record<string, string> = {};
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await c.req.formData();
    for (const [key, value] of formData.entries()) {
      body[key] = value.toString();
    }
  } else {
    body = (await c.req.json().catch(() => ({}))) as Record<string, string>;
  }

  const token = body.token;
  if (!token) {
    return c.json({ error: "invalid_request", error_description: "Missing token" }, 400);
  }

  // Only refresh tokens can be revoked (access tokens are stateless JWTs)
  if (token.startsWith("rt_") && c.env.DB) {
    const { revokeRefreshToken } = await import("./lib/oauth-refresh");
    await revokeRefreshToken(c.env.DB, token);
  }

  // Per RFC 7009: always return 200 regardless of whether token was found
  return c.json({ revoked: true }, 200, {
    "Access-Control-Allow-Origin": "*",
  });
});

// ============================================================================
// ROOT & HEALTH ENDPOINTS
// ============================================================================

// Root endpoint — GET returns server info, POST handles MCP protocol
app.get("/", (c) => {
  const url = new URL(c.req.url);
  const resource = resolveOAuthResource(url.hostname, c.env.OAUTH_RESOURCE);
  return c.json({
    name: "IntegrateWise MCP Tool Server",
    version: "1.0.0",
    status: "ok",
    protocol: "mcp-2025-03-26",
    auth: "oauth2",
    oauth: {
      protected_resource: `${resource}/.well-known/oauth-protected-resource`,
      authorization_server: `${resource}/.well-known/oauth-authorization-server`,
    },
    endpoints: {
      mcp: "/",
      tools: "/tools",
      invoke: "/invoke",
      health: "/health",
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    worker: "integratewise-mcp-tool-server",
    version: "2.0.0-semantic",
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    features: ["session-capture", "auto-embedding", "entity-linking", "correlation-tracing"],
    tools: {
      count: 18,
      names: [
        "kb.write_session_summary",
        "kb.write_article",
        "kb.get_artifact",
        "kb.list_recent",
        "kb.search",
        "kb.topic_upsert",
        "kb.topic_list",
        "memory.write_conversational",
        "memory.read_conversational",
        "memory.upsert_org",
        "memory.search_org",
        "memory.propose",
        "book.get_episodes",
        "book.get_episode",
        "book.create_episode",
        "book.add_primitive",
        "book.search_by_entity",
      ],
    },
  });
});

// MCP server configuration endpoint
app.get("/config/mcp-server", (c) => {
  const url = new URL(c.req.url);
  const resource = resolveOAuthResource(url.hostname, c.env.OAUTH_RESOURCE);
  return c.json({
    mcp_server: {
      protocol: "mcp-2025-03-26",
      discovery: "standard",
      auth: "oauth2",
      oauth_protected_resource: `${resource}/.well-known/oauth-protected-resource`,
      providers: ["claude", "chatgpt", "perplexity", "cursor"],
      description: "IntegrateWise MCP server endpoint for AI provider integration",
      purpose: "Multi-system tool orchestration and connector discovery",
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// MCP TOOL SERVER ENDPOINTS
// ============================================================================

// Tool discovery
app.get("/tools", toolsHandler);

// Tool invocation
app.post("/invoke", invokeHandler);

// ============================================================================
// AI SESSION MEMORY CAPTURE (Part 1)
// ============================================================================
import { SaveSessionMemorySchema } from "./lib/schema";
// Day 2: Helper to trigger session embedding via Knowledge service (Fetcher binding)
async function triggerSessionEmbedding(
  knowledge: Fetcher,
  tenantId: string,
  sessionId: string,
  summary: string,
  memories: string[],
  correlationId: string
): Promise<{ session_id: string; chunks_created: number; total_tokens: number } | null> {
  try {
    const response = await knowledge.fetch("https://internal/knowledge/embed/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        session_id: sessionId,
        tenant_id: tenantId,
        summary: summary,
        memories: memories,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Knowledge service error: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      data: { session_id: string; chunks_created: number; total_tokens: number };
    };
    if (!result.success) {
      throw new Error("Knowledge service returned unsuccessful response");
    }
    return result.data;
  } catch (error) {
    console.error("Session embedding failed:", error);
    return null;
  }
}

app.post("/v1/mcp/save_session_memory", async (c) => {
  const log = c.get("log");
  const apiKey = c.req.header("Authorization")?.replace("Bearer ", "") || c.req.header("X-MCP-Key");

  if (!apiKey || apiKey !== c.env.MCP_CONNECTOR_API_KEY) {
    log.warn("Unauthorized session memory capture attempt");
    return c.json({ status: "error", error: "unauthorized" }, 401);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: "error", error: "invalid_json" }, 400);
  }

  const result = SaveSessionMemorySchema.safeParse(body);
  if (!result.success) {
    log.warn("Validation failed for session memory capture", { details: result.error.flatten() });
    return c.json(
      {
        status: "error",
        error: "validation_failed",
        details: result.error.flatten(),
      },
      400
    );
  }

  const { tenant_id, session_id, tool_source, user_label, summary, memories } = result.data;
  const now = new Date();

  try {
    // 1. Write the main session document to D1
    if (c.env.DB) {
      try {
        await c.env.DB.prepare(
          `
          INSERT INTO ai_sessions (id, tenant_id, user_id, session_type, status, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET updated_at = excluded.updated_at
        `
        )
          .bind(
            session_id,
            tenant_id,
            null,
            "mcp",
            "active",
            JSON.stringify({ tool_source, user_label, summary, version: "v1" }),
            now.toISOString(),
            now.toISOString()
          )
          .run();
      } catch (dbError: any) {
        log.warn("Failed to store session in D1 (non-blocking)", { error: dbError.message });
      }
    }

    // 2. Write each memory to D1
    if (c.env.DB) {
      try {
        await Promise.all(
          memories.map((memory: any, index: number) => {
            return c.env
              .DB!.prepare(
                `
            INSERT INTO ai_session_memories (id, tenant_id, session_id, memory_type, content, importance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
              )
              .bind(
                `${session_id}::${index}`,
                tenant_id,
                session_id,
                "mcp_memory",
                JSON.stringify({ ...memory, confidence_score: memory.confidence_score ?? 0.7 }),
                memory.confidence_score ?? 0.7,
                now.toISOString()
              )
              .run();
          })
        );
      } catch (dbError: any) {
        log.warn("Failed to store memories in D1 (non-blocking)", { error: dbError.message });
      }
    }

    log.info("Successfully stored AI session memories", {
      tenant_id,
      session_id,
      tool_source,
      memories_count: memories.length,
    });

    // Day 2: Trigger auto-embedding for semantic search via KNOWLEDGE service binding
    let embeddingResult = null;
    if (c.env.KNOWLEDGE) {
      try {
        embeddingResult = await triggerSessionEmbedding(
          c.env.KNOWLEDGE,
          tenant_id,
          session_id,
          summary,
          memories.map((m: any) => m.text || m.content || JSON.stringify(m)),
          c.get("requestId")
        );
        log.info("Auto-embedding triggered", {
          session_id,
          chunks_created: embeddingResult?.chunks_created,
        });
      } catch (embedError: any) {
        log.warn("Auto-embedding failed (non-blocking)", { error: embedError.message });
      }

      // Triage bot (Cloudflare AI): session triage for consolidation → review → AI agent access
      try {
        await c.env.KNOWLEDGE.fetch("http://internal/v1/triage/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenant_id,
            "x-correlation-id": c.get("requestId"),
          },
          body: JSON.stringify({
            session_id,
            summary,
            memories: memories.map((m: any) => ({
              text: m.text ?? m.content,
              content: m.content ?? m.text,
            })),
          }),
        });
      } catch (triageErr: any) {
        log.warn("Triage session call failed (non-blocking)", { error: triageErr.message });
      }
    }

    return c.json({
      status: "success",
      stored_memories: memories.length,
      tenant_id,
      session_id,
      embedding_status: embeddingResult ? "completed" : "skipped",
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    log.error("Failed to store AI session memories", { error: error.message });
    return c.json({ status: "error", error: "internal_storage_error" }, 500);
  }
});

// ============================================================================
// Day 2: ENHANCED SESSION CAPTURE WITH ENTITY LINKING
// ============================================================================

import { z } from "zod";

const EnhancedSessionSchema = z.object({
  tenant_id: z.string().uuid(),
  session_id: z.string().uuid(),
  tool_source: z.string().default("unknown"),
  user_label: z.string().optional(),

  // Session content
  summary: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),

  // Tool calls made during session
  tool_calls: z
    .array(
      z.object({
        tool_name: z.string(),
        tool_input: z.any().optional(),
        tool_output: z.any().optional(),
      })
    )
    .optional(),

  // Entity linking
  entity_type: z.string().optional(), // e.g., 'account', 'opportunity'
  entity_id: z.string().optional(),
  related_entities: z
    .array(
      z.object({
        entity_type: z.string(),
        entity_id: z.string(),
        relationship: z.string().optional(), // e.g., 'mentioned', 'primary', 'related'
      })
    )
    .optional(),

  // Extracted memories
  memories: z
    .array(
      z.object({
        memory_type: z.string(),
        memory_key: z.string(),
        memory_value: z.string(),
        confidence_score: z.number().min(0).max(1).optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().optional(),
      })
    )
    .optional(),

  // Auto-embedding control
  auto_embed: z.boolean().optional().default(true),
});

app.post("/v1/mcp/capture_session", async (c) => {
  const log = c.get("log");
  const correlationId = c.get("requestId");

  const apiKey = c.req.header("Authorization")?.replace("Bearer ", "") || c.req.header("X-MCP-Key");

  if (!apiKey || apiKey !== c.env.MCP_CONNECTOR_API_KEY) {
    log.warn("Unauthorized enhanced session capture attempt");
    return c.json({ status: "error", error: "unauthorized", correlation_id: correlationId }, 401);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ status: "error", error: "invalid_json", correlation_id: correlationId }, 400);
  }

  const result = EnhancedSessionSchema.safeParse(body);
  if (!result.success) {
    log.warn("Validation failed for enhanced session capture", { details: result.error.flatten() });
    return c.json(
      {
        status: "error",
        error: "validation_failed",
        details: result.error.flatten(),
        correlation_id: correlationId,
      },
      400
    );
  }

  const {
    tenant_id,
    session_id,
    tool_source,
    user_label,
    summary,
    messages,
    tool_calls,
    entity_type,
    entity_id,
    related_entities,
    memories,
    auto_embed,
  } = result.data;

  const now = new Date();

  try {
    // 1. Write the main session document with enhanced metadata to D1
    if (c.env.DB) {
      try {
        await c.env.DB.prepare(
          `
          INSERT INTO ai_sessions (id, tenant_id, user_id, session_type, status, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET updated_at = excluded.updated_at
        `
        )
          .bind(
            session_id,
            tenant_id,
            null,
            "mcp",
            "active",
            JSON.stringify({
              tool_source,
              user_label,
              summary,
              entity_type,
              entity_id,
              related_entities: related_entities || [],
              tool_names: tool_calls?.map((tc: any) => tc.tool_name) || [],
              message_count: messages?.length || 0,
              version: "v2",
            }),
            now.toISOString(),
            now.toISOString()
          )
          .run();
      } catch (dbError: any) {
        log.warn("Failed to store enhanced session in D1 (non-blocking)", {
          error: dbError.message,
        });
      }
    }

    // 2. Write each memory with entity linking to D1
    if (c.env.DB && memories && memories.length > 0) {
      try {
        await Promise.all(
          memories.map((memory: any, index: number) => {
            return c.env
              .DB!.prepare(
                `
            INSERT INTO ai_session_memories (id, tenant_id, session_id, memory_type, content, importance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
              )
              .bind(
                `${session_id}::${index}`,
                tenant_id,
                session_id,
                "mcp_memory",
                JSON.stringify({
                  ...memory,
                  entity_type: memory.entity_type || entity_type,
                  entity_id: memory.entity_id || entity_id,
                  confidence_score: memory.confidence_score ?? 0.7,
                }),
                memory.confidence_score ?? 0.7,
                now.toISOString()
              )
              .run();
          })
        );
      } catch (dbError: any) {
        log.warn("Failed to store memories in D1 (non-blocking)", { error: dbError.message });
      }
    }

    // 3. Write entity links to Spine (using D1) — only for entities allowed for tenant (HARDENING_AND_WIRING.md §7)
    let allowedTypes: Set<string> | null = null;
    if (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_ROLE_KEY) {
      allowedTypes = await getTenantAllowedEntityTypes(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_ROLE_KEY,
        tenant_id
      );
    }
    const allowEntity = (et: string) => allowedTypes == null || allowedTypes.has(et);
    const shouldLinkPrimary = !!entity_type && !!entity_id && allowEntity(entity_type);

    if (c.env.DB && shouldLinkPrimary && entity_type && entity_id) {
      try {
        await c.env.DB.prepare(
          `
          INSERT INTO session_entity_links (session_id, tenant_id, entity_type, entity_id, link_type)
          VALUES (?, ?, ?, ?, 'primary')
          ON CONFLICT (session_id, entity_type, entity_id) DO UPDATE SET updated_at = datetime('now')
        `
        )
          .bind(session_id, tenant_id, entity_type, entity_id)
          .run();

        if (related_entities && related_entities.length > 0) {
          for (const re of related_entities) {
            if (!allowEntity(re.entity_type)) continue;
            await c.env.DB.prepare(
              `
              INSERT INTO session_entity_links (session_id, tenant_id, entity_type, entity_id, link_type)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT (session_id, entity_type, entity_id) DO UPDATE SET updated_at = datetime('now')
            `
            )
              .bind(
                session_id,
                tenant_id,
                re.entity_type,
                re.entity_id,
                re.relationship || "related"
              )
              .run();
          }
        }
      } catch (dbError: any) {
        log.warn("Entity linking to Spine failed (non-blocking)", { error: dbError.message });
      }
    }

    log.info("Successfully captured enhanced AI session", {
      tenant_id,
      session_id,
      tool_source,
      entity_type,
      entity_id,
      memories_count: memories?.length || 0,
      tool_calls_count: tool_calls?.length || 0,
    });

    // 4. Trigger auto-embedding if enabled via KNOWLEDGE service binding
    let embeddingResult = null;
    if (auto_embed && c.env.KNOWLEDGE) {
      try {
        embeddingResult = await triggerSessionEmbedding(
          c.env.KNOWLEDGE,
          tenant_id,
          session_id,
          summary,
          memories?.map((m: any) => m.memory_value || m.content || JSON.stringify(m)) || [],
          correlationId
        );
        log.info("Auto-embedding completed", {
          session_id,
          chunks_created: embeddingResult?.chunks_created,
        });
      } catch (embedError: any) {
        log.warn("Auto-embedding failed (non-blocking)", { error: embedError.message });
      }
    }

    // 5. Trigger triage bot (Flow C routing: auto-approve / HITL / discard)
    // Mirrors save_session_memory behavior — capture_session now also enters the triage pipeline
    let triageResult = null;
    if (c.env.KNOWLEDGE) {
      try {
        const triageResponse = await c.env.KNOWLEDGE.fetch("http://internal/v1/triage/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenant_id,
            "x-correlation-id": correlationId,
          },
          body: JSON.stringify({
            session_id,
            summary,
            memories:
              memories?.map((m: any) => ({
                text: m.memory_value || m.memory_key,
                content: m.memory_value || JSON.stringify(m),
              })) || [],
          }),
        });
        if (triageResponse.ok) {
          triageResult = (await triageResponse.json()) as any;
        }
      } catch (triageErr: any) {
        log.warn("Triage session call failed (non-blocking)", { error: triageErr.message });
      }
    }

    return c.json({
      status: "success",
      session_id,
      tenant_id,
      entity_linked: !!(entity_type && entity_id),
      related_entities_linked: related_entities?.length || 0,
      memories_stored: memories?.length || 0,
      embedding_status: embeddingResult ? "completed" : auto_embed ? "skipped" : "disabled",
      chunks_created: embeddingResult?.chunks_created || 0,
      triage_status: triageResult?.data?.approval_status || "skipped",
      correlation_id: correlationId,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    log.error("Failed to capture enhanced AI session", { error: error.message });
    return c.json(
      {
        status: "error",
        error: "internal_storage_error",
        correlation_id: correlationId,
      },
      500
    );
  }
});

// ============================================================================
// CODA PROXY — ops dashboard reads Coda page content (read-only)
// ============================================================================

// Coda proxy removed per D2026-05-27-001. Coda is a connector, not an MCP tool.

// ============================================================================
// STANDARD MCP PROTOCOL ENDPOINT
// ============================================================================

// MCP protocol handler — reused at both POST / and /mcp
async function handleMcpEndpoint(c: any): Promise<Response> {
  const log = c.get("log");

  // Auth for MCP transport: Cloudflare Access > API key > JWT
  const authHeader = c.req.header("Authorization");
  const mcpKeyHeader = c.req.header("X-MCP-Key");
  const cfAccessToken = c.req.header("CF-Access-JWT-Assertion");
  const isServiceBinding = c.req.header("cf-worker") !== undefined;

  // Import verifyAuth from tools handler (inline to avoid circular deps)
  const { verifyAuth } = await import("./handlers/tools");
  const auth = await verifyAuth(
    authHeader || null,
    mcpKeyHeader || null,
    isServiceBinding,
    log,
    {
      MCP_CONNECTOR_API_KEY: c.env.MCP_CONNECTOR_API_KEY,
      TRIAGE_BOT_API_KEY: c.env.TRIAGE_BOT_API_KEY,
      CF_ACCESS_TEAM_DOMAIN: c.env.CF_ACCESS_TEAM_DOMAIN,
      CF_ACCESS_AUD: c.env.CF_ACCESS_AUD,
    },
    c.req.header("x-tenant-id") || null,
    c.req.header("x-user-id") || null,
    cfAccessToken || null
  );

  if (!auth) {
    const url = new URL(c.req.url);
    const resource = resolveOAuthResource(url.hostname, c.env.OAUTH_RESOURCE);
    const hasToken = Boolean(authHeader?.startsWith("Bearer ") || mcpKeyHeader);
    return c.json(
      { error: hasToken ? "invalid_token" : "unauthorized", message: "Bearer token required" },
      401,
      {
        "WWW-Authenticate": wwwAuthenticateChallenge(
          resource,
          hasToken ? "invalid_token" : undefined,
          hasToken ? "Missing or invalid Authorization header" : undefined
        ),
      }
    );
  }

  const actor: McpActor = {
    tenant_id: auth.tenant_id,
    user_id: auth.user_id,
    roles: auth.roles,
    scope: auth.scope,
  };

  const server = createMcpServer(actor, c.env as any, log);
  return handleMcpRequest(c.req.raw, server);
}

// Mount MCP at root (POST /) — clients use https://mcp.integratewise.ai (OAuth issuer: https://auth.integratewise.ai)
app.post("/", handleMcpEndpoint);

// SSE Transport — for clients that don't support HTTP Streamable (e.g., Notion)
import { handleSseConnect, handleSseMessage } from "./mcp-sse-transport";

app.get("/sse", (c) => {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return handleSseConnect(c.req.raw, baseUrl);
});

app.post("/sse/message", async (c) => {
  const log = c.get("log");
  const { verifyAuth } = await import("./handlers/tools");

  // Auth check (same as /mcp endpoint)
  const authHeader = c.req.header("Authorization");
  const mcpKeyHeader = c.req.header("X-MCP-Key");
  const cfAccessToken = c.req.header("CF-Access-JWT-Assertion");
  const isServiceBinding = c.req.header("cf-worker") !== undefined;

  const auth = await verifyAuth(
    authHeader || null,
    mcpKeyHeader || null,
    isServiceBinding,
    log,
    {
      MCP_CONNECTOR_API_KEY: c.env.MCP_CONNECTOR_API_KEY,
      TRIAGE_BOT_API_KEY: c.env.TRIAGE_BOT_API_KEY,
      CF_ACCESS_TEAM_DOMAIN: c.env.CF_ACCESS_TEAM_DOMAIN,
      CF_ACCESS_AUD: c.env.CF_ACCESS_AUD,
    },
    c.req.header("x-tenant-id") || null,
    c.req.header("x-user-id") || null,
    cfAccessToken || null
  );

  if (!auth) {
    const url = new URL(c.req.url);
    const resource = resolveOAuthResource(url.hostname, c.env.OAUTH_RESOURCE);
    return c.json({ error: "unauthorized" }, 401, {
      "WWW-Authenticate": wwwAuthenticateChallenge(resource),
    });
  }

  const actor: McpActor = {
    tenant_id: auth.tenant_id,
    user_id: auth.user_id,
    roles: auth.roles,
    scope: auth.scope,
  };

  const server = createMcpServer(actor, c.env as any, log);
  return handleSseMessage(c.req.raw, server);
});

// Keep /mcp for backward compatibility
app.all("/mcp", handleMcpEndpoint);

// Catch-all for unknown routes
app.all("*", (c) => {
  const log = c.get("log");
  log.warn("Unknown endpoint", { path: c.req.path });
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  const log = c.get("log");
  log.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
  });

  return c.json(
    {
      error: "Internal server error",
      requestId: c.get("requestId"),
    },
    500
  );
});

export default app;
