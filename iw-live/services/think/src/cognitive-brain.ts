/**
 * Cognitive Brain Service - L2 Intelligence Layer
 *
 * Routes for:
 * - Decision Memory (organizational learning)
 * - Trust Score Engine (source reliability, autonomy control)
 * - Simulation Engine (outcome prediction)
 * - Drift Detection (model-reality divergence)
 *
 * Constitutional Compliance:
 * - Clause 1: Temporal Truth (time-indexed data)
 * - Clause 2: Source Trust Physics
 * - Clause 3: Reversible Readiness
 * - Clause 4: Decision Replay Guarantee
 * - Clause 5: Autonomy Kill Hierarchy
 */

import { Hono } from "hono";
import { z } from "zod";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { resolveEntityTypeAlias } from "@integratewise/types";
import { Entity360Client } from "./entity360-client";
import { getActionMetadata } from "./actions";

// Route modules
import { decisionMemoryRoutes } from "./cognitive-routes/decision-memory";
import { trustScoreRoutes } from "./cognitive-routes/trust-score";
import { simulationRoutes } from "./cognitive-routes/simulation";
import { driftDetectionRoutes } from "./cognitive-routes/drift-detection";

type Bindings = {
  // Primary data source (truth database)
  // Legacy Supabase — D1/KV/AI Search preferred (DECISION 22). Made optional for desupabase completion.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;

  // Edge cache (D1) — used for cached projections, idempotency, and sync cursors
  DB: D1Database;

  // Service bindings (v3.6 Section 19.3-19.4)
  THINK: Fetcher;
  ACT: Fetcher;
  GOVERN: Fetcher;
  KNOWLEDGE: Fetcher;
  CONNECTOR: Fetcher;
  WORKFLOW?: Fetcher;

  ENVIRONMENT: string;
  SERVICE_SECRET?: string;
  OPENROUTER_API_KEY?: string;
};

// ============================================================================
// OpenRouter Model Configuration
// ============================================================================

/** Available OpenRouter models with metadata */
export const OPENROUTER_MODELS = {
  // Anthropic Models
  "anthropic/claude-3.5-sonnet": {
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    context_length: 200000,
    cost_tier: "standard",
    best_for: ["general", "analysis", "coding"],
  },
  "anthropic/claude-3.5-haiku": {
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    context_length: 200000,
    cost_tier: "economy",
    best_for: ["fast", "simple", "summarization"],
  },
  "anthropic/claude-3-opus": {
    name: "Claude 3 Opus",
    provider: "anthropic",
    context_length: 200000,
    cost_tier: "premium",
    best_for: ["complex", "reasoning", "research"],
  },
  // OpenAI Models
  "openai/gpt-4o": {
    name: "GPT-4o",
    provider: "openai",
    context_length: 128000,
    cost_tier: "standard",
    best_for: ["general", "multimodal", "analysis"],
  },
  "openai/gpt-4o-mini": {
    name: "GPT-4o Mini",
    provider: "openai",
    context_length: 128000,
    cost_tier: "economy",
    best_for: ["fast", "simple", "cost-effective"],
  },
  // Google Models
  "google/gemini-1.5-pro": {
    name: "Gemini 1.5 Pro",
    provider: "google",
    context_length: 2000000,
    cost_tier: "standard",
    best_for: ["long-context", "analysis", "multimodal"],
  },
  "google/gemini-1.5-flash": {
    name: "Gemini 1.5 Flash",
    provider: "google",
    context_length: 1000000,
    cost_tier: "economy",
    best_for: ["fast", "long-context"],
  },
  // Meta Models
  "meta-llama/llama-3.1-70b-instruct": {
    name: "Llama 3.1 70B",
    provider: "meta",
    context_length: 128000,
    cost_tier: "economy",
    best_for: ["general", "open-source"],
  },
  // Mistral Models
  "mistralai/mistral-large": {
    name: "Mistral Large",
    provider: "mistral",
    context_length: 128000,
    cost_tier: "standard",
    best_for: ["general", "european"],
  },
} as const;

export type OpenRouterModelId = keyof typeof OPENROUTER_MODELS;

/** AI Configuration per tenant/user */
export interface AIConfig {
  tenant_id: string;
  user_id?: string; // null = tenant default
  default_model: OpenRouterModelId;
  twin_model: OpenRouterModelId;
  brainstorm_model: OpenRouterModelId;
  extraction_model: OpenRouterModelId;
  temperature: number;
  max_tokens: number;
  cost_optimization: "speed" | "balanced" | "quality";
  updated_at: string;
}

/** Default AI configuration */
const DEFAULT_AI_CONFIG: Omit<AIConfig, "tenant_id" | "user_id" | "updated_at"> = {
  default_model: "anthropic/claude-3.5-sonnet",
  twin_model: "anthropic/claude-3.5-sonnet",
  brainstorm_model: "anthropic/claude-3.5-sonnet",
  extraction_model: "anthropic/claude-3.5-haiku", // Faster for extraction
  temperature: 0.7,
  max_tokens: 4096,
  cost_optimization: "balanced",
};

/** Get AI config for tenant/user (fallback to defaults) */
async function getAIConfig(env: Bindings, tenantId: string, userId?: string): Promise<AIConfig> {
  try {
    // Try to get user-specific config first
    if (userId) {
      const userConfig = await supabaseQuery(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
        "ai_config",
        `tenant_id=eq.${tenantId}&user_id=eq.${userId}&limit=1`
      );
      if (userConfig?.[0]) return { ...DEFAULT_AI_CONFIG, ...userConfig[0] };
    }

    // Fall back to tenant default
    const tenantConfig = await supabaseQuery(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      "ai_config",
      `tenant_id=eq.${tenantId}&user_id=is.null&limit=1`
    );
    if (tenantConfig?.[0]) return { ...DEFAULT_AI_CONFIG, ...tenantConfig[0] };
  } catch (err) {
    console.warn("[AIConfig] Failed to fetch config, using defaults:", err);
  }

  // Return defaults
  return {
    ...DEFAULT_AI_CONFIG,
    tenant_id: tenantId,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
}

/** Select model based on task type and config */
function selectModelForTask(
  config: AIConfig,
  task: "twin" | "brainstorm" | "extraction" | "general"
): OpenRouterModelId {
  switch (task) {
    case "twin":
      return config.twin_model;
    case "brainstorm":
      return config.brainstorm_model;
    case "extraction":
      return config.extraction_model;
    default:
      return config.default_model;
  }
}

/** Get model params based on cost optimization */
function getModelParams(config: AIConfig) {
  const temps = {
    speed: 0.5, // Lower temp = faster, more focused
    balanced: 0.7, // Default
    quality: 0.9, // Higher temp = more creative/exploratory
  };

  const maxTokens = {
    speed: 2048,
    balanced: config.max_tokens,
    quality: Math.min(config.max_tokens * 1.5, 8192),
  };

  return {
    temperature: temps[config.cost_optimization],
    max_tokens: maxTokens[config.cost_optimization],
  };
}

/** §17.6: Get link_knowledge_ui_to_entity360 for Twin. When false, do not read Knowledge UI. */
async function getLinkKnowledgeUI(env: Bindings, tenantId: string): Promise<boolean> {
  if (!env.WORKFLOW) return true;
  try {
    const r = await env.WORKFLOW.fetch(
      `https://workflow/internal/tenant-config/link-knowledge-ui?tenant_id=${encodeURIComponent(tenantId)}`
    );
    const d = (await r.json()) as { link?: boolean };
    return d?.link ?? true;
  } catch {
    return true;
  }
}

type CognitiveBrainBindings = Bindings & {
  // DLQ is consumed via [[queues.consumers]] in wrangler.toml
};
import { AsyncLocalStorage } from "node:async_hooks";
export const envStore = new AsyncLocalStorage<any>();

// ============================================================================
// Supabase Query Helper (Truth Database)
// ============================================================================
async function supabaseQuery(
  url: string | undefined,
  key: string | undefined,
  table: string,
  query: string
): Promise<any[]> {
  try {
    const env = envStore.getStore();
    const pipeline = env?.PIPELINE;

    if (!url || !key) {
      if (pipeline) {
        const res = await pipeline.fetch("http://pipeline/api/v1/db-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table,
            method: "GET",
            query,
          }),
        });
        if (!res.ok) {
          console.error(`Supabase proxy query failed: ${res.status} ${await res.text()}`);
          return [];
        }
        return await res.json();
      }
      console.error(`Supabase credentials missing and PIPELINE binding not available`);
      return [];
    }

    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });

    if (!res.ok) {
      console.error(`Supabase query failed: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (err: any) {
    console.error(`Supabase fetch error: ${err.message}`);
    return [];
  }
}

/** Persona from tenant_spine_config for THINK: workflow ideas and daily insights by department/industry. */
export interface TenantPersona {
  industry: string | null;
  departments: string[];
  user_type: string | null;
  company_size: string | null;
}

async function getTenantPersona(
  url: string | undefined,
  key: string | undefined,
  tenantId: string
): Promise<TenantPersona> {
  const rows = await supabaseQuery(
    url,
    key,
    "tenant_spine_config",
    `tenant_id=eq.${encodeURIComponent(tenantId)}&select=industry,domains,user_type,company_size&limit=1`
  );
  const row = rows?.[0];
  return {
    industry: row?.industry ?? null,
    departments: Array.isArray(row?.domains) ? row.domains : [],
    user_type: row?.user_type ?? null,
    company_size: row?.company_size ?? null,
  };
}

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  return envStore.run(c.env, next);
});

app.use("*", cors());
app.use("*", secureHeaders());

// ============================================================================
// Correlation ID Middleware
// ============================================================================
app.use("*", async (c, next) => {
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();
  c.set("correlationId" as any, correlationId);
  c.res.headers.set("x-correlation-id", correlationId);
  await next();
});

// ============================================================================
// Rate Limiting
// ============================================================================
const requestCounts = new Map<string, { count: number; reset: number }>();

app.use("/v1/*", async (c, next) => {
  const tenantId = c.req.header("x-tenant-id") || "anonymous";
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 200;

  const current = requestCounts.get(tenantId);
  if (!current || now > current.reset) {
    requestCounts.set(tenantId, { count: 1, reset: now + windowMs });
  } else if (current.count >= maxRequests) {
    return c.json(
      { error: "Rate limit exceeded", retry_after: Math.ceil((current.reset - now) / 1000) },
      429
    );
  } else {
    current.count++;
  }
  await next();
});

// ============================================================================
// Health Check
// ============================================================================
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "Cognitive Brain (L2)",
    version: "v1.0",
    database: "Supabase (truth) + D1 (edge cache)",
    constitution: "v1",
    subsystems: ["decision-memory", "trust-score", "simulation", "drift-detection"],
  })
);

// ============================================================================
// Mount Route Modules
// ============================================================================
app.route("/v1/decisions", decisionMemoryRoutes);
app.route("/v1/trust", trustScoreRoutes);
app.route("/v1/simulation", simulationRoutes);
app.route("/v1/drift", driftDetectionRoutes);

// ============================================================================
// Brainstorm (⌘J) — Scoped AI Chat with SSE Streaming
// Architecture v3.6: Flow C — always HITL, scoped to entity/goal context
// Wired to OpenRouter Claude Messages API for intelligent analysis
// ============================================================================
app.post("/v1/brainstorm", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const correlationId = c.get("correlationId" as any) || crypto.randomUUID();

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { query, context, model: requestedModel } = body;
  if (!query) return c.json({ error: "query is required" }, 400);

  // Get AI configuration for tenant/user
  const aiConfig = await getAIConfig(c.env, tenantId, userId);
  const modelToUse = requestedModel || selectModelForTask(aiConfig, "brainstorm");
  const modelParams = getModelParams(aiConfig);

  // SSE response for streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Acknowledge + context retrieval
        send({
          type: "status",
          phase: "context",
          message: "Gathering context...",
          correlation_id: correlationId,
        });

        // Retrieve relevant decisions and drift events for context
        let decisions: any[] = [];
        let drifts: any[] = [];

        if (context?.entityId || context?.goalId) {
          try {
            // Query Supabase (truth database)
            const query = `tenant_id=eq.${tenantId}&order=created_at.desc&limit=5`;
            decisions = await supabaseQuery(
              c.env.SUPABASE_URL,
              c.env.SUPABASE_SERVICE_KEY,
              "decision_memory",
              query
            );
          } catch {
            /* non-blocking — Supabase error logged */
          }
        }

        // Get active drift events from Supabase
        try {
          const query = `tenant_id=eq.${tenantId}&response_status=eq.active&order=detected_at.desc&limit=3`;
          drifts = await supabaseQuery(
            c.env.SUPABASE_URL,
            c.env.SUPABASE_SERVICE_KEY,
            "drift_events",
            query
          );
        } catch {
          /* non-blocking — Supabase error logged */
        }

        send({
          type: "context",
          decisions: decisions.length,
          drifts: drifts.length,
          entity_id: context?.entityId,
          goal_id: context?.goalId,
          domain: context?.domain,
        });

        // Phase 2: Call OpenRouter Claude API if API key is available
        const apiKey = c.env.OPENROUTER_API_KEY;

        if (apiKey) {
          send({
            type: "status",
            phase: "thinking",
            message: "Analyzing with Claude AI context...",
          });

          // No-Hallucination Library: base URL for AI grounding (env or default)
          const libraryBase = (c.env as any).LIBRARY_BASE_URL || "https://integratewise.ai";

          // Build system prompt with organizational context and Library grounding
          const systemPrompt = `You are the IntegrateWise Intelligence Engine — a cognitive assistant embedded in a B2B Knowledge Workspace. You help users make data-driven decisions by analyzing their organizational context, signals, and patterns.

No-Hallucination rule: For any claim about IntegrateWise product, architecture, or process, use only the canonical source: ${libraryBase}/llm.txt (human-readable) and ${libraryBase}/context.json (structured). Do not describe IntegrateWise from memory alone; cite or rely on these grounding files.

Your Role:
- Provide actionable, specific insights grounded in actual organizational data
- Reference the user's decision history and current drift patterns
- Suggest next steps that connect to active goals and metrics
- Never hallucinate data — if you don't have information, acknowledge the gap

Context Available:
- Recent decisions: ${decisions.length > 0 ? JSON.stringify(decisions.slice(0, 3)) : "No recent decisions"}
- Active drift events: ${drifts.length > 0 ? JSON.stringify(drifts.slice(0, 2)) : "No active drifts"}
- Domain: ${context?.domain || "general"}
- Entity: ${context?.entityId || "unscoped"}

Response Style:
- Start with a direct answer to the user's query
- Use clear sections and bullet points
- Reference specific data when available
- End with 2-3 actionable suggestions`;

          try {
            const openrouterResponse = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                  "HTTP-Referer": "https://integratewise.ai",
                  "X-Title": "IntegrateWise",
                },
                body: JSON.stringify({
                  model: modelToUse,
                  max_tokens: modelParams.max_tokens,
                  temperature: modelParams.temperature,
                  stream: true,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query },
                  ],
                }),
              }
            );

            if (!openrouterResponse.ok) {
              throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
            }

            // Stream OpenRouter response (OpenAI SSE format)
            const reader = openrouterResponse.body?.getReader();
            if (!reader) throw new Error("No response stream");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data:")) continue;

                try {
                  const dataStr = line.slice(5).trim();

                  // Handle stream end marker
                  if (dataStr === "[DONE]") {
                    send({
                      type: "brainstorm_complete",
                      context_used: {
                        decisions_referenced: decisions.length,
                        drifts_analyzed: drifts.length,
                        entity_id: context?.entityId,
                        domain: context?.domain || "general",
                      },
                      correlation_id: correlationId,
                    });
                    continue;
                  }

                  const event = JSON.parse(dataStr);

                  // Stream content delta (OpenAI format)
                  if (event.choices?.[0]?.delta?.content) {
                    send({
                      type: "brainstorm_chunk",
                      content: event.choices[0].delta.content,
                    });
                  }
                } catch {
                  // Ignore JSON parse errors for non-JSON lines
                }
              }
            }
          } catch (err: any) {
            // Fallback to structured skeleton if API call fails
            send({
              type: "status",
              phase: "fallback",
              message: `Claude API unavailable (${err.message}). Using structured analysis...`,
            });

            send({
              type: "brainstorm",
              content: `Brainstorm analysis for: "${query}"\n\nAPI Context:\n- Decisions referenced: ${decisions.length}\n- Active drifts: ${drifts.length}\n- Domain: ${context?.domain || "general"}`,
              context_used: {
                decisions_referenced: decisions.length,
                drifts_analyzed: drifts.length,
                entity_id: context?.entityId,
                domain: context?.domain || "general",
              },
              suggestions: [
                "Connect this to your active goals for deeper analysis",
                "Review related signals in the Intelligence dashboard",
                "Check trust scores for data sources mentioned",
              ],
              correlation_id: correlationId,
            });
          }
        } else {
          // No API key — return structured skeleton
          send({
            type: "status",
            phase: "thinking",
            message: "Analyzing with cognitive context (no LLM)...",
          });

          send({
            type: "brainstorm",
            content: `Brainstorm analysis for: "${query}"\n\nContext Summary:\n- Recent decisions: ${decisions.length}\n- Active drift events: ${drifts.length}\n- Domain: ${context?.domain || "general"}`,
            context_used: {
              decisions_referenced: decisions.length,
              drifts_analyzed: drifts.length,
              entity_id: context?.entityId,
              domain: context?.domain || "general",
            },
            suggestions: [
              "Connect this to your active goals for deeper analysis",
              "Review related signals in the Intelligence dashboard",
              "Check trust scores for data sources mentioned",
            ],
            correlation_id: correlationId,
          });
        }

        send({ type: "done" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: any) {
        send({ type: "error", message: err.message });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-correlation-id": correlationId,
    },
  });
});

// ============================================================================
// Flow C — AI Session → Knowledge (NOT Spine)
//
// Engine loop: LOAD → NORMALIZE → STORE → Spine/Context/Knowledge → THINK → ACT → GOVERN → REPEAT
// Flows A & B go through the full loop above.
//
// Flow C is DIFFERENT — it bypasses Load/Normalize entirely:
//   AI Chats → MCP Connector / AI Connector → Session Summaries
//   → Written to Knowledge → Triage Bot (delta updates only)
//   → AI Suggests based on Knowledge context + Spine truth
//
// Flow C NEVER writes to Spine. It writes to Knowledge only.
// The Think layer reads Knowledge + Spine to generate suggestions/signals,
// which then enter the normal Think → Act → Govern loop if execution is needed.
// ============================================================================

const ContextToTruthSchema = z
  .object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })
      )
      .optional(),
    session_id: z.string().optional(),
    sessionId: z.string().optional(),
    entities: z
      .array(
        z.object({
          type: z.string(),
          data: z.record(z.any()).optional(),
          name: z.string().optional(),
          properties: z.record(z.any()).optional(),
        })
      )
      .optional(),
    confidence: z.number().min(0).max(1).optional(),
    context: z
      .object({
        domain: z.string().optional(),
        entity_id: z.string().optional(),
        entity_type: z.string().optional(),
        goal_id: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasMessages = Array.isArray(value.messages) && value.messages.length > 0;
    const hasEntities = Array.isArray(value.entities) && value.entities.length > 0;

    if (!hasMessages && !hasEntities) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either `messages` or `entities` must be provided.",
      });
    }
  });

app.post("/v1/cognitive/context-to-truth", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const correlationId = c.get("correlationId" as any) || crypto.randomUUID();

  // Get AI configuration for extraction task
  const aiConfig = await getAIConfig(c.env, tenantId, userId);
  const extractionModel = selectModelForTask(aiConfig, "extraction");
  const modelParams = getModelParams(aiConfig);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = ContextToTruthSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { messages, entities: preExtracted, confidence, context } = parsed.data;
  const sessionId = parsed.data.session_id || parsed.data.sessionId || crypto.randomUUID();

  try {
    let extractedData: any = null;

    // If caller provides pre-extracted entities (from useFlowC), package them
    if (preExtracted && preExtracted.length > 0) {
      extractedData = {
        entities: preExtracted.map((e) => ({
          // Resolve entity type through canonical aliases (DOMAIN_SPINE_CONFIG is source of truth)
          type: resolveEntityTypeAlias(e.type),
          name: e.name || e.data?.name || "Unnamed",
          properties: e.properties || e.data || {},
          confidence: confidence || 0.7,
        })),
        signals: [],
        recommendations: [],
        memories: preExtracted.map((e) => ({
          memory_type: "fact" as const,
          memory_key: `${e.type}.${e.name || e.data?.name || "entity"}`,
          memory_value: JSON.stringify(e.properties || e.data || {}),
          confidence_score: confidence || 0.7,
        })),
        summary: `Session ${sessionId.slice(0, 8)}: ${preExtracted.length} entities discovered`,
      };
    }

    // If messages provided, run AI triage extraction
    if (!extractedData && messages && messages.length > 0) {
      const conversationText = messages
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");

      const extractionPrompt = `Analyze this conversation and extract structured data in JSON format.

Extract:
1. "memories" — array of {memory_type: 'insight'|'preference'|'fact'|'decision'|'action_item', memory_key, memory_value, confidence_score: 0.0-1.0}
2. "entities" — array of {type, name, properties: {}, confidence: 0.0-1.0} for any mentioned people/companies/deals. Use ONLY these canonical entity types: account, contact, opportunity, task, ticket, engagement, lead, campaign, activity, contract, invoice, project, vendor, incident, generated_insight. If unsure, use "activity".
3. "signals" — array of {type, severity, title, description} for risks/opportunities/decisions
4. "recommendations" — array of {action, reasoning, priority, entity_ref} for suggested next steps
5. "summary" — 2-3 sentence summary of the conversation outcomes

Conversation:
${conversationText}

Domain: ${context?.domain || "general"}
Entity scope: ${context?.entity_type || "unscoped"} ${context?.entity_id || ""}

Respond ONLY with valid JSON.`;

      const apiKey = c.env.OPENROUTER_API_KEY;
      if (apiKey) {
        try {
          const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": "https://integratewise.ai",
              "X-Title": "IntegrateWise",
            },
            body: JSON.stringify({
              model: extractionModel,
              max_tokens: modelParams.max_tokens,
              temperature: 0.3, // Lower temp for structured extraction
              messages: [
                {
                  role: "system",
                  content:
                    "You are a data extraction engine. Extract structured memories, entities, signals, and recommendations from conversations. Always respond with valid JSON only.",
                },
                { role: "user", content: extractionPrompt },
              ],
            }),
          });

          if (aiResponse.ok) {
            const result = (await aiResponse.json()) as any;
            const content = result.choices?.[0]?.message?.content || "";
            const jsonStr = content
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            try {
              extractedData = JSON.parse(jsonStr);
              // Post-extraction: resolve AI entity types through canonical aliases
              if (extractedData?.entities && Array.isArray(extractedData.entities)) {
                extractedData.entities = extractedData.entities.map((e: any) => ({
                  ...e,
                  type: resolveEntityTypeAlias(e.type || "activity"),
                }));
              }
            } catch {
              console.warn("[FlowC] Failed to parse AI JSON response");
            }
          }
        } catch (err: any) {
          console.error("[FlowC] AI triage extraction failed:", err.message);
        }
      }
    }

    // Fallback if no extraction succeeded
    if (!extractedData) {
      extractedData = {
        entities: [],
        signals: [
          {
            type: "session_insight",
            severity: "low",
            title: "Conversation captured",
            description: "AI extraction failed; stored a minimal session insight for later review.",
          },
        ],
        recommendations: [],
        memories: [
          {
            memory_type: "insight",
            memory_key: `session.${sessionId.slice(0, 8)}`,
            memory_value: `AI session in ${context?.domain || "general"} domain`,
            confidence_score: 0.5,
          },
        ],
        summary: `AI conversation session ${sessionId.slice(0, 8)}.`,
      };
    }

    const memories = extractedData.memories || [];
    const entities = extractedData.entities || [];

    // ── Step 1: Write session summary + memories to MCP Connector → Knowledge ──
    // This is the canonical Flow C ingestion path.
    // MCP Connector writes to D1 (session store) + Knowledge Bank (embeddings).
    // Flow C NEVER writes to Spine — only to Knowledge.
    let mcpWriteSuccess = false;
    if (c.env.CONNECTOR) {
      try {
        const mcpRes = await c.env.CONNECTOR.fetch(
          new Request("http://connector/v1/mcp/save_session_memory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id": tenantId,
              "x-correlation-id": correlationId,
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              session_id: sessionId,
              tool_source: "integratewise",
              summary: extractedData.summary || "",
              memories: memories.map((m: any) => ({
                memory_type: m.memory_type || "insight",
                memory_key: m.memory_key || "general",
                memory_value: m.memory_value || "",
                confidence_score: m.confidence_score || 0.7,
                entity_type: context?.entity_type,
                entity_id: context?.entity_id,
              })),
              entity_type: context?.entity_type,
              entity_id: context?.entity_id,
              domain: context?.domain || "general",
            }),
          })
        );
        mcpWriteSuccess = mcpRes.ok;
      } catch {
        console.warn("[FlowC] MCP session memory write failed (non-blocking)");
      }
    }

    // ── Step 2: Write to Knowledge service for embedding + retrieval ──
    // The Triage Bot aspect: Knowledge service embeds the session so it's
    // searchable and available for the Think layer to generate AI suggestions.
    if (c.env.KNOWLEDGE) {
      try {
        await c.env.KNOWLEDGE.fetch(
          new Request("http://knowledge/knowledge/embed/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id": tenantId,
              "x-correlation-id": correlationId,
            },
            body: JSON.stringify({
              session_id: sessionId,
              tenant_id: tenantId,
              summary: extractedData.summary || "",
              tool_calls: [],
              memories: memories.map((m: any) => m.memory_value || ""),
              entity_type: context?.entity_type,
              entity_id: context?.entity_id,
            }),
          })
        );
      } catch {
        console.warn("[FlowC] Knowledge embedding failed (non-blocking)");
      }
    }

    // ── Step 2.5: Write insights to org_memory ──
    // Twin writes organizational knowledge to shared memory
    // This enables all agents and surfaces to access Twin's insights
    if (memories.length > 0) {
      try {
        for (const memory of memories) {
          if (memory.memory_type === "insight" || memory.memory_type === "decision") {
            await c.env.CONNECTOR?.fetch(
              new Request("http://connector/v1/mcp/invoke", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-tenant-id": tenantId,
                  "x-correlation-id": correlationId,
                },
                body: JSON.stringify({
                  request_id: crypto.randomUUID(),
                  actor: { tenant_id: tenantId, user_id: "twin", roles: ["Admin"] },
                  tool: {
                    name: "memory.upsert_org",
                    arguments: {
                      tenant_id: tenantId,
                      category: "twin-insight",
                      key: memory.memory_key || `insight.${sessionId.slice(0, 8)}`,
                      content: memory.memory_value || "",
                      source: "twin",
                      confidence: memory.confidence_score || 0.7,
                      governance_state: "approved",
                    },
                  },
                }),
              })
            );
          }
        }
      } catch {
        console.warn("[FlowC] org_memory write failed (non-blocking)");
      }
    }

    // ── Step 3: Audit trail ──
    try {
      await fetch(`${c.env.SUPABASE_URL || ""}/rest/v1/audit_log`, {
        method: "POST",
        headers: {
          apikey: c.env.SUPABASE_SERVICE_KEY || "",
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_KEY || ""}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          user_id: c.req.header("x-user-id") || null,
          action: "flow_c.session_to_knowledge",
          resource_type: "session",
          resource_id: sessionId,
          metadata: {
            memories_written: memories.length,
            entities_discovered: entities.length,
            mcp_write: mcpWriteSuccess,
            domain: context?.domain,
            correlation_id: correlationId,
          },
        }),
      });
    } catch {
      console.warn("[FlowC] Audit write failed (non-blocking)");
    }

    return c.json({
      success: true,
      session_id: sessionId,
      status: "written_to_knowledge",
      extracted: {
        entities: entities,
        signals: extractedData.signals || [],
        recommendations: extractedData.recommendations || [],
        memories,
        summary: extractedData.summary || "",
      },
      knowledge_write: mcpWriteSuccess,
      correlation_id: correlationId,
    });
  } catch (err: any) {
    console.error("[FlowC] Context-to-truth failed:", err.message);
    return c.json({ error: "Context-to-truth extraction failed", message: err.message }, 500);
  }
});

// ============================================================================
// Flow C — Session Status (GET by session ID)
// Frontend useFlowC.checkProposal() uses this to track session processing.
// ============================================================================

app.get("/v1/cognitive/context-to-truth/:sessionId", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const sessionId = c.req.param("sessionId");

  try {
    // Check if session exists in MCP connector (session memory store)
    let sessionData: any = null;
    if (c.env.CONNECTOR) {
      try {
        const res = await c.env.CONNECTOR.fetch(
          new Request(`http://connector/v1/mcp/sessions/${sessionId}`, {
            headers: { "x-tenant-id": tenantId },
          })
        );
        if (res.ok) {
          sessionData = await res.json();
        }
      } catch {
        /* non-blocking */
      }
    }

    // Check audit log for this session's processing record
    const auditEntries = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "audit_log",
      `tenant_id=eq.${tenantId}&resource_id=eq.${sessionId}&action=eq.flow_c.session_to_knowledge&order=created_at.desc&limit=1`
    );

    const auditEntry = auditEntries[0];
    const status = auditEntry ? "written_to_knowledge" : sessionData ? "processing" : "not_found";

    return c.json({
      session_id: sessionId,
      status,
      entities: sessionData?.entities || [],
      memories_written: auditEntry?.metadata?.memories_written || 0,
      entities_discovered: auditEntry?.metadata?.entities_discovered || 0,
      knowledge_write: auditEntry?.metadata?.mcp_write || false,
      created_at: auditEntry?.created_at || null,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// Digital Twin — Proactive Suggestions + Memory Browser
// ============================================================================
app.get("/v1/twin/proactive", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const linkKnowledgeUI = await getLinkKnowledgeUI(c.env, tenantId);

  try {
    const [recentDecisions, activeDrifts, persona, aiConfig] = await Promise.all([
      supabaseQuery(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "decision_memory",
        `tenant_id=eq.${tenantId}&order=created_at.desc&limit=10`
      ),
      supabaseQuery(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "drift_events",
        `tenant_id=eq.${tenantId}&response_status=eq.pending&order=detected_at.desc&limit=5`
      ),
      getTenantPersona(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY, tenantId),
      getAIConfig(c.env, tenantId, userId),
    ]);

    return c.json({
      tenant_id: tenantId,
      persona,
      suggestions: [
        ...(activeDrifts || []).map((d: any) => ({
          type: "drift_alert",
          priority: d.severity === "critical" ? "high" : "medium",
          message: `Drift detected: ${d.description}`,
          drift_id: d.id,
        })),
        ...(recentDecisions || []).slice(0, 3).map((d: any) => ({
          type: "decision_review",
          priority: "low",
          message: `Review outcome of: ${d.summary}`,
          decision_id: d.id,
        })),
      ],
      twin_config: {
        model: aiConfig.twin_model,
        model_info: OPENROUTER_MODELS[aiConfig.twin_model],
      },
      link_knowledge_ui: linkKnowledgeUI,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/twin/memories", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const linkKnowledgeUI = await getLinkKnowledgeUI(c.env, tenantId);
  const entityId = c.req.query("entity_id");
  const goalId = c.req.query("goal_id");
  const limit = parseInt(c.req.query("limit") || "20");

  try {
    // Build Supabase query string (truth database)
    let queryStr = `tenant_id=eq.${tenantId}&order=created_at.desc&limit=${limit}`;

    const memories = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "decision_memory",
      queryStr
    );

    return c.json({
      tenant_id: tenantId,
      memories: memories || [],
      total: memories?.length || 0,
      filters: { entity_id: entityId, goal_id: goalId },
      link_knowledge_ui: linkKnowledgeUI,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// AI Insights — brainstorm_insights + session context (Entity 360 / L2 feed)
// ============================================================================
app.get("/v1/insights", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const insightType = c.req.query("insight_type");

  try {
    let queryStr = `tenant_id=eq.${tenantId}&order=created_at.desc&limit=${limit}`;
    if (insightType) queryStr += `&insight_type=eq.${encodeURIComponent(insightType)}`;

    const insights = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "brainstorm_insights",
      queryStr
    );

    return c.json({
      tenant_id: tenantId,
      insights: insights || [],
      total: insights?.length || 0,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ----------------------------------------------------------------------------
// Daily insights by user persona (department, industry, role)
// ----------------------------------------------------------------------------
app.get("/v1/insights/daily", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const [persona, insights] = await Promise.all([
      getTenantPersona(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY, tenantId),
      supabaseQuery(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "brainstorm_insights",
        `tenant_id=eq.${tenantId}&order=created_at.desc&limit=20`
      ),
    ]);

    const daily = (insights || []).slice(0, 10).map((i: any) => ({
      id: i.id,
      insight_type: i.insight_type || "general",
      title: i.title || i.summary?.slice(0, 80) || "Insight",
      summary: i.summary,
      entity_type: i.entity_type,
      entity_id: i.entity_id,
      created_at: i.created_at,
    }));

    return c.json({
      tenant_id: tenantId,
      persona,
      daily_insights: daily,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ----------------------------------------------------------------------------
// Workflow ideas by user persona (department × industry)
// ----------------------------------------------------------------------------
const WORKFLOW_IDEAS_BY_PERSONA: Record<
  string,
  { id: string; title: string; description: string; department?: string }[]
> = {
  SALES: [
    {
      id: "wf-sales-1",
      title: "Auto-flag at-risk deals",
      description: "When deal stage age exceeds threshold, create task and notify owner",
      department: "SALES",
    },
    {
      id: "wf-sales-2",
      title: "Pipeline sync to forecast",
      description: "Sync won/lost to forecast and update quota attainment",
      department: "SALES",
    },
  ],
  REVOPS: [
    {
      id: "wf-revops-1",
      title: "Revenue reconciliation",
      description: "Daily match CRM closed-won to billing and flag variances",
      department: "REVOPS",
    },
    {
      id: "wf-revops-2",
      title: "Attribution refresh",
      description: "Recompute first-touch and multi-touch attribution when new conversions land",
      department: "REVOPS",
    },
  ],
  CUSTOMER_SUCCESS: [
    {
      id: "wf-cs-1",
      title: "Health score → task",
      description: "When health drops below threshold, create CSM task and add to standup",
      department: "CUSTOMER_SUCCESS",
    },
    {
      id: "wf-cs-2",
      title: "Renewal reminder",
      description: "60/30/14 days before renewal: suggest outreach and prep materials",
      department: "CUSTOMER_SUCCESS",
    },
  ],
  FINANCE: [
    {
      id: "wf-fin-1",
      title: "Invoice-to-cash reminder",
      description: "Remind on overdue invoices and suggest follow-up",
      department: "FINANCE",
    },
    {
      id: "wf-fin-2",
      title: "Revenue recognition",
      description: "Notify when deal closes for rev-rec and deferral schedule",
      department: "FINANCE",
    },
  ],
  PRODUCT: [
    {
      id: "wf-product-1",
      title: "Feedback to roadmap",
      description: "Triage support/feedback by theme and suggest roadmap item",
      department: "PRODUCT",
    },
    {
      id: "wf-product-2",
      title: "Release health check",
      description: "Post-release: aggregate errors and NPS for 7-day rollup",
      department: "PRODUCT",
    },
  ],
};

app.get("/v1/insights/workflow-ideas", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const persona = await getTenantPersona(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      tenantId
    );
    const departments = persona.departments?.length
      ? persona.departments
      : ["SALES", "CUSTOMER_SUCCESS"];
    const workflow_ideas: {
      id: string;
      title: string;
      description: string;
      department?: string;
    }[] = [];
    const seen = new Set<string>();
    for (const dept of departments) {
      const ideas = WORKFLOW_IDEAS_BY_PERSONA[dept] || [];
      for (const w of ideas) {
        if (!seen.has(w.id)) {
          seen.add(w.id);
          workflow_ideas.push(w);
        }
      }
    }

    return c.json({
      tenant_id: tenantId,
      persona,
      workflow_ideas,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ----------------------------------------------------------------------------
// Twin act inside THINK: draft-only (suggest) or execute via GOVERN + ACT
// ----------------------------------------------------------------------------
app.post("/v1/twin/act", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id") || "system";
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const linkKnowledgeUI = await getLinkKnowledgeUI(c.env, tenantId);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const {
    action_key,
    entity_type: rawEntityType,
    entity_id,
    parameters = {},
    draft_only = true,
  } = body;
  if (!action_key) return c.json({ error: "action_key is required" }, 400);
  // Resolve entity_type through canonical aliases
  const entity_type = rawEntityType ? resolveEntityTypeAlias(rawEntityType) : undefined;

  const correlationId = c.get("correlationId" as any) || crypto.randomUUID();

  if (draft_only) {
    try {
      const meta = getActionMetadata(action_key);
      const summary = meta
        ? meta.suggested_summary_template
            .replace("{entity_type}", entity_type || "entity")
            .replace("{entity_id}", entity_id || "(unspecified)")
        : `Suggested action: ${action_key} for ${entity_type || "entity"} ${entity_id || ""}`;
      const nextSteps = meta
        ? meta.suggested_next_steps
        : ["Review in HITL queue", "Approve to execute via ACT"];
      const draft = {
        action_key,
        title: meta?.title || action_key,
        description: meta?.description || "",
        suggested_summary: summary,
        suggested_next_steps: nextSteps,
        requires_approval: meta?.requires_approval ?? true,
        parameters,
      };
      return c.json({
        tenant_id: tenantId,
        draft_only: true,
        draft,
        link_knowledge_ui: linkKnowledgeUI,
        generated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }

  try {
    const governReq = new Request("http://govern/v1/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-id": userId,
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        action_type: action_key,
        priority: "medium",
        parameters: { ...parameters, entity_type, entity_id },
      }),
    });
    const governRes = c.env.GOVERN ? await c.env.GOVERN.fetch(governReq) : null;
    const governOk = governRes?.ok;
    const governData = governRes
      ? ((await governRes.json().catch(() => null)) as { data?: { allowed?: boolean } } | null)
      : null;

    if (!governOk || !governData?.data?.allowed) {
      return c.json(
        {
          tenant_id: tenantId,
          executed: false,
          reason: "govern_check_failed",
          message: "Action not allowed by policy",
          link_knowledge_ui: linkKnowledgeUI,
          generated_at: new Date().toISOString(),
        },
        403
      );
    }

    const actReq = new Request("http://act/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-id": userId,
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        action: action_key,
        spine_id: entity_id,
        params: { ...parameters, entity_type, entity_id },
      }),
    });
    const actRes = c.env.ACT ? await c.env.ACT.fetch(actReq) : null;
    const actOk = actRes?.ok;

    return c.json({
      tenant_id: tenantId,
      executed: actOk,
      action_key,
      entity_type,
      entity_id,
      govern_allowed: true,
      link_knowledge_ui: linkKnowledgeUI,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// AI Configuration Management (OpenRouter Model Selection)
// ============================================================================

// ─── Twin Chat — Entity-360-aware conversational AI ─────────────────────────
// The Digital Twin's chat endpoint. Takes a user message + optional entity_id,
// fetches Entity 360 context, injects it into the system prompt, and streams
// the LLM response via OpenRouter. This is the only chat surface in the
// product — it always talks *through* the Twin with full entity awareness.
// ============================================================================
app.post("/v1/twin/chat", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const correlationId = c.get("correlationId" as any) || crypto.randomUUID();

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { message, entity_id, history, model: requestedModel } = body;
  if (!message) return c.json({ error: "message is required" }, 400);

  // Get AI configuration (uses twin_model by default)
  const aiConfig = await getAIConfig(c.env, tenantId, userId);
  const modelToUse = requestedModel || selectModelForTask(aiConfig, "twin");
  const modelParams = getModelParams(aiConfig);

  // SSE streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Gather Entity 360 context
        send({
          type: "status",
          phase: "context",
          message: entity_id ? "Loading Entity 360..." : "Preparing workspace context...",
          correlation_id: correlationId,
        });

        let entity360: any = null;

        // Fetch Entity 360 if entity_id provided
        if (entity_id) {
          try {
            const e360Client = new Entity360Client({
              supabaseUrl: c.env.SUPABASE_URL,
              supabaseKey: c.env.SUPABASE_SERVICE_KEY,
              db: c.env.DB,
            });
            entity360 = await e360Client.get(tenantId, entity_id);
          } catch {
            /* non-blocking */
          }
        }

        send({
          type: "context",
          entity: entity360
            ? {
                name: entity360.display_name,
                type: entity360.entity_type,
                freshness: entity360.truth?.freshness,
                goals_health: entity360.goals?.health,
                context_count: entity360.context?.total_count || 0,
                knowledge_count: entity360.memory?.total_count || 0,
              }
            : null,
        });

        // Phase 2: Build system prompt with Entity 360 context
        // Twin reads: Truth + Context + Knowledge (AI session summaries) + Goals/Milestones
        // Twin produces: conversational answers + signals (AI insights) as output
        const apiKey = c.env.OPENROUTER_API_KEY;

        if (apiKey) {
          send({
            type: "status",
            phase: "thinking",
            message: entity360 ? `Analyzing ${entity360.display_name} with AI...` : "Thinking...",
          });

          const libraryBase = (c.env as any).LIBRARY_BASE_URL || "https://integratewise.ai";

          // Build entity context section for the system prompt
          // Only Truth + Context + Knowledge + Goals — signals are OUTPUTS, not inputs
          let entityContextBlock = "";
          if (entity360) {
            const truth = entity360.truth?.data || {};
            const contexts = entity360.context?.recent || [];
            const knowledge = entity360.memory?.recent || [];
            const goals = entity360.goals?.active || [];

            entityContextBlock = `
ENTITY 360 — ${entity360.display_name} (${entity360.entity_type})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRUTH LAYER:
${JSON.stringify(truth, null, 0)}
Data Freshness: ${entity360.truth?.freshness || "unknown"}

CONTEXT (documents, emails, meeting notes — ${contexts.length} items):
${
  contexts.length > 0
    ? contexts
        .slice(0, 5)
        .map(
          (ctx: any) => `- [${ctx.type || "note"}] ${ctx.title || "Untitled"}: ${ctx.summary || ""}`
        )
        .join("\n")
    : "No context available yet."
}

KNOWLEDGE BASE (AI session summaries — ${knowledge.length} items):
${
  knowledge.length > 0
    ? knowledge
        .slice(0, 5)
        .map((k: any) => `- [${k.memory_type || "session"}] ${k.content}`)
        .join("\n")
    : "No prior AI session summaries."
}

GOALS & MILESTONES (${goals.length}, health: ${entity360.goals?.health || "unknown"}):
${
  goals.length > 0
    ? goals
        .slice(0, 5)
        .map(
          (g: any) =>
            `- ${g.title} — status: ${g.status}, progress: ${g.progress || 0}%${g.target_date ? `, target: ${g.target_date}` : ""}`
        )
        .join("\n")
    : "No active goals."
}`;
          }

          const systemPrompt = `You are the IntegrateWise Digital Twin — the AI that thinks in context. You live inside a B2B Knowledge Workspace and have access to the entity's Truth layer, Context (documents, emails, meeting notes), Knowledge Base (AI session summaries from prior conversations), and Goals with Milestones.

Your job: reason over this real data and give precise, grounded answers. When you identify risks, patterns, or opportunities, surface them as clear insights the user can act on.

No-Hallucination rule: For any claim about IntegrateWise, use only: ${libraryBase}/llm.txt and ${libraryBase}/context.json. For entity-specific answers, rely ONLY on the Entity 360 data below. Never fabricate entity data. If data is missing, say so.

${entityContextBlock || "No specific entity scoped — answering from general workspace context."}

Response Guidelines:
- Lead with a direct answer grounded in the entity's Truth and Context
- Reference specific data points, documents, or goals by name
- Surface insights: patterns, risks, or opportunities you see in the data
- End with 1-2 concrete next steps the user can take right now
- Keep it concise — this is a workspace tool, not an essay`;

          try {
            // Build message array with conversation history
            const messages: Array<{ role: string; content: string }> = [
              { role: "system", content: systemPrompt },
            ];

            // Append prior conversation history (max 20 turns to stay within context)
            if (Array.isArray(history)) {
              const trimmed = history.slice(-20);
              for (const h of trimmed) {
                if (h.role === "user" || h.role === "assistant") {
                  messages.push({ role: h.role, content: h.content });
                }
              }
            }

            // Current user message
            messages.push({ role: "user", content: message });

            const openrouterResponse = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                  "HTTP-Referer": "https://integratewise.ai",
                  "X-Title": "IntegrateWise Twin",
                },
                body: JSON.stringify({
                  model: modelToUse,
                  max_tokens: modelParams.max_tokens,
                  temperature: modelParams.temperature,
                  stream: true,
                  messages,
                }),
              }
            );

            if (!openrouterResponse.ok) {
              throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
            }

            // Stream OpenRouter response chunks
            const reader = openrouterResponse.body?.getReader();
            if (!reader) throw new Error("No response stream");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                try {
                  const dataStr = line.slice(5).trim();
                  if (dataStr === "[DONE]") {
                    send({
                      type: "twin_complete",
                      entity: entity360
                        ? { name: entity360.display_name, type: entity360.entity_type }
                        : null,
                      correlation_id: correlationId,
                    });
                    continue;
                  }
                  const event = JSON.parse(dataStr);
                  if (event.choices?.[0]?.delta?.content) {
                    send({
                      type: "twin_chunk",
                      content: event.choices[0].delta.content,
                    });
                  }
                } catch {
                  /* ignore non-JSON lines */
                }
              }
            }
          } catch (err: any) {
            // LLM call failed — return structured fallback
            send({
              type: "status",
              phase: "fallback",
              message: `AI unavailable (${err.message}). Returning entity summary...`,
            });

            const fallbackContent = entity360
              ? `**${entity360.display_name}** (${entity360.entity_type})\n\nData freshness: ${entity360.truth?.freshness || "unknown"}\nContext items: ${entity360.context?.total_count || 0}\nKnowledge entries: ${entity360.memory?.total_count || 0}\nGoals health: ${entity360.goals?.health || "no goals"}\n\n_AI analysis unavailable. The entity data above is from the Spine truth layer._`
              : `_AI analysis unavailable. Connect to the Intelligence Engine for full conversational support._`;

            send({
              type: "twin_chunk",
              content: fallbackContent,
            });
            send({
              type: "twin_complete",
              entity: null,
              correlation_id: correlationId,
            });
          }
        } else {
          // No OpenRouter API key — structured entity summary only
          send({
            type: "status",
            phase: "thinking",
            message: "Analyzing entity data...",
          });

          const summaryContent = entity360
            ? `**${entity360.display_name}** (${entity360.entity_type})\n\nData freshness: ${entity360.truth?.freshness || "unknown"}\nContext items: ${entity360.context?.total_count || 0}\nKnowledge entries: ${entity360.memory?.total_count || 0}\nGoals health: ${entity360.goals?.health || "no goals"}\n\n_Connect an LLM via Settings > AI Configuration to enable the Digital Twin._`
            : `No entity selected and no LLM configured.\n\nTo use the Digital Twin:\n1. Select an entity from your workspace\n2. Configure an AI model in Settings > AI Configuration`;

          send({
            type: "twin_chunk",
            content: summaryContent,
          });
          send({
            type: "twin_complete",
            entity: null,
            correlation_id: correlationId,
          });
        }

        send({ type: "done" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: any) {
        send({ type: "error", message: err.message });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-correlation-id": correlationId,
    },
  });
});

/** Get available OpenRouter models */
app.get("/v1/ai/models", async (c) => {
  return c.json({
    models: OPENROUTER_MODELS,
    default_config: DEFAULT_AI_CONFIG,
    timestamp: new Date().toISOString(),
  });
});

/** Get current AI configuration for tenant/user */
app.get("/v1/ai/config", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const config = await getAIConfig(c.env, tenantId, userId);
    return c.json({
      config,
      models_info: {
        default: OPENROUTER_MODELS[config.default_model],
        twin: OPENROUTER_MODELS[config.twin_model],
        brainstorm: OPENROUTER_MODELS[config.brainstorm_model],
        extraction: OPENROUTER_MODELS[config.extraction_model],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/** Update AI configuration */
app.post("/v1/ai/config", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Validate model IDs
  const validModels = Object.keys(OPENROUTER_MODELS);
  if (body.default_model && !validModels.includes(body.default_model)) {
    return c.json({ error: `Invalid default_model: ${body.default_model}` }, 400);
  }
  if (body.twin_model && !validModels.includes(body.twin_model)) {
    return c.json({ error: `Invalid twin_model: ${body.twin_model}` }, 400);
  }
  if (body.brainstorm_model && !validModels.includes(body.brainstorm_model)) {
    return c.json({ error: `Invalid brainstorm_model: ${body.brainstorm_model}` }, 400);
  }
  if (body.extraction_model && !validModels.includes(body.extraction_model)) {
    return c.json({ error: `Invalid extraction_model: ${body.extraction_model}` }, 400);
  }

  try {
    const config: Partial<AIConfig> = {
      ...(body.default_model && { default_model: body.default_model }),
      ...(body.twin_model && { twin_model: body.twin_model }),
      ...(body.brainstorm_model && { brainstorm_model: body.brainstorm_model }),
      ...(body.extraction_model && { extraction_model: body.extraction_model }),
      ...(body.temperature !== undefined && {
        temperature: Math.max(0, Math.min(2, body.temperature)),
      }),
      ...(body.max_tokens && {
        max_tokens: Math.max(256, Math.min(8192, body.max_tokens)),
      }),
      ...(body.cost_optimization && {
        cost_optimization: ["speed", "balanced", "quality"].includes(body.cost_optimization)
          ? body.cost_optimization
          : "balanced",
      }),
      updated_at: new Date().toISOString(),
    };

    // Upsert config to Supabase
    const { data: _data, error } = await fetch(`${c.env.SUPABASE_URL || ""}/rest/v1/ai_config`, {
      method: "POST",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_KEY || "",
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_KEY || ""}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        user_id: userId || null,
        ...config,
      }),
    }).then(async (r) => ({
      data: r.ok ? await r.json() : null,
      error: r.ok ? null : await r.text(),
    }));

    if (error) throw new Error(error);

    return c.json({
      success: true,
      config: await getAIConfig(c.env, tenantId, userId),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/** Reset AI configuration to defaults */
app.delete("/v1/ai/config", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    // Delete user-specific or tenant config
    const query = userId
      ? `tenant_id=eq.${tenantId}&user_id=eq.${userId}`
      : `tenant_id=eq.${tenantId}&user_id=is.null`;

    await fetch(`${c.env.SUPABASE_URL || ""}/rest/v1/ai_config?${query}`, {
      method: "DELETE",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_KEY || "",
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_KEY || ""}`,
      },
    });

    return c.json({
      success: true,
      message: "AI configuration reset to defaults",
      default_config: DEFAULT_AI_CONFIG,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/** Get Twin-specific configuration */
app.get("/v1/twin/config", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const config = await getAIConfig(c.env, tenantId, userId);
    return c.json({
      twin_config: {
        model: config.twin_model,
        model_info: OPENROUTER_MODELS[config.twin_model],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        cost_optimization: config.cost_optimization,
      },
      available_models: Object.entries(OPENROUTER_MODELS).map(([id, info]) => ({
        id,
        ...info,
        recommended_for_twin: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o"].includes(id),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/** Update Twin-specific model */
app.post("/v1/twin/config", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { model } = body;
  if (!model || !OPENROUTER_MODELS[model as OpenRouterModelId]) {
    return c.json(
      {
        error: "Invalid model",
        valid_models: Object.keys(OPENROUTER_MODELS),
      },
      400
    );
  }

  // Update Twin model in ai_config
  const upsertBody = {
    tenant_id: tenantId,
    user_id: userId || null,
    twin_model: model,
    updated_at: new Date().toISOString(),
  };

  const upsertRes = await fetch(`${c.env.SUPABASE_URL || ""}/rest/v1/ai_config`, {
    method: "POST",
    headers: {
      apikey: c.env.SUPABASE_SERVICE_KEY || "",
      Authorization: `Bearer ${c.env.SUPABASE_SERVICE_KEY || ""}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(upsertBody),
  });

  if (!upsertRes.ok) {
    const errorText = await upsertRes.text();
    return c.json({ error: `Failed to update config: ${errorText}` }, 500);
  }

  return c.json({
    success: true,
    twin_config: {
      model: model as OpenRouterModelId,
      model_info: OPENROUTER_MODELS[model as OpenRouterModelId],
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// System Status
// ============================================================================
app.get("/v1/status", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    // Get counts from Supabase (truth database)
    const decisionResults = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "decision_memory",
      `tenant_id=eq.${tenantId}&select=id`
    );

    const driftResults = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "drift_events",
      `tenant_id=eq.${tenantId}&response_status=eq.pending&select=id`
    );

    const overrideResults = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "autonomy_overrides",
      `tenant_id=eq.${tenantId}&select=id`
    );

    return c.json({
      tenant_id: tenantId,
      decision_memory: {
        total_decisions: decisionResults?.length || 0,
      },
      drift_detection: {
        pending_drifts: driftResults?.length || 0,
      },
      autonomy: {
        active_overrides: overrideResults?.length || 0,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// Outcome Learning - Cognitive Loop Completion
// Receives action outcomes from Act service to refine rules and improve AI
// ============================================================================

/** Action outcome feedback from Act service */
interface ActionOutcome {
  action_id: string;
  proposal_id?: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  success: boolean;
  outcome_summary: string;
  error_details?: string;
  execution_time_ms: number;
  correlation_id: string;
  triggered_by_rules?: string[]; // Rule IDs that triggered this action
}

/**
 * POST /v1/outcome/feedback
 * Receives action execution outcomes from Act service for learning
 * This completes the cognitive loop: Think → Govern → HITL → Act → Learn → Think
 */
app.post("/v1/outcome/feedback", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  let outcome: ActionOutcome;
  try {
    outcome = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Validate required fields
  if (!outcome.action_id || !outcome.entity_type) {
    return c.json({ error: "action_id and entity_type required" }, 400);
  }

  const correlationId = c.get("correlationId" as any) || crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // 1. Store outcome in decision_memory for audit trail
    const decisionRecord = {
      tenant_id: tenantId,
      session_id: outcome.correlation_id,
      summary: `Action ${outcome.action_id} ${outcome.success ? "succeeded" : "failed"}: ${outcome.outcome_summary}`,
      tool_calls: [
        {
          tool: outcome.action_type,
          params: { entity_type: outcome.entity_type, entity_id: outcome.entity_id },
          result: outcome.success ? "success" : "failure",
          error: outcome.error_details,
        },
      ],
      outcome: outcome.success ? "success" : "failure",
      execution_time_ms: outcome.execution_time_ms,
      created_at: timestamp,
    };

    await fetch(`${c.env.SUPABASE_URL || ""}/rest/v1/decision_memory`, {
      method: "POST",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_KEY || "",
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(decisionRecord),
    });

    // 2. Update rule effectiveness scores
    if (outcome.triggered_by_rules && outcome.triggered_by_rules.length > 0) {
      for (const ruleId of outcome.triggered_by_rules) {
        await updateRuleEffectiveness(
          c.env,
          tenantId,
          ruleId,
          outcome.success,
          outcome.execution_time_ms
        );
      }
    }

    // 3. Check for patterns that indicate rule refinement needed
    const refinementSuggestions = await analyzeOutcomePatterns(c.env, tenantId, outcome);

    // 4. If success rate drops below threshold, flag for drift detection
    if (refinementSuggestions.requiresAttention) {
      await flagForDriftDetection(c.env, tenantId, outcome, refinementSuggestions);
    }

    console.log(`[OutcomeLearning] Processed outcome for action ${outcome.action_id}`, {
      success: outcome.success,
      entity_type: outcome.entity_type,
      correlation_id: correlationId,
    });

    return c.json({
      success: true,
      processed_at: timestamp,
      refinement_suggestions: refinementSuggestions,
      correlation_id: correlationId,
    });
  } catch (err: any) {
    console.error(`[OutcomeLearning] Error processing outcome: ${err.message}`);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * Update rule effectiveness based on action outcomes
 */
async function updateRuleEffectiveness(
  env: CognitiveBrainBindings,
  tenantId: string,
  ruleId: string,
  success: boolean,
  executionTimeMs: number
): Promise<void> {
  try {
    // Fetch current effectiveness record
    const existing = await supabaseQuery(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      "rule_effectiveness",
      `tenant_id=eq.${tenantId}&rule_id=eq.${ruleId}&limit=1`
    );

    const now = new Date().toISOString();

    if (existing?.[0]) {
      // Update existing record
      const record = existing[0];
      const newTotal = record.total_triggered + 1;
      const newSuccess = record.successful_outcomes + (success ? 1 : 0);
      const newFailed = record.failed_outcomes + (success ? 0 : 1);
      const newEffectiveness = Math.round((newSuccess / newTotal) * 100);

      // Calculate running average for execution time
      const newAvgTime = Math.round(
        (record.avg_execution_time_ms * record.total_triggered + executionTimeMs) / newTotal
      );

      await fetch(`${env.SUPABASE_URL || ""}/rest/v1/rule_effectiveness?id=eq.${record.id}`, {
        method: "PATCH",
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY || "",
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_triggered: newTotal,
          successful_outcomes: newSuccess,
          failed_outcomes: newFailed,
          avg_execution_time_ms: newAvgTime,
          last_triggered_at: now,
          effectiveness_score: newEffectiveness,
          updated_at: now,
        }),
      });
    } else {
      // Create new record
      await fetch(`${env.SUPABASE_URL || ""}/rest/v1/rule_effectiveness`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY || "",
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          rule_id: ruleId,
          total_triggered: 1,
          successful_outcomes: success ? 1 : 0,
          failed_outcomes: success ? 0 : 1,
          avg_execution_time_ms: executionTimeMs,
          last_triggered_at: now,
          effectiveness_score: success ? 100 : 0,
          created_at: now,
        }),
      });
    }
  } catch (err) {
    console.warn(`[OutcomeLearning] Failed to update rule effectiveness: ${err}`);
  }
}

/**
 * Analyze outcome patterns to detect drift or refinement needs
 */
async function analyzeOutcomePatterns(
  env: CognitiveBrainBindings,
  tenantId: string,
  outcome: ActionOutcome
): Promise<{
  requiresAttention: boolean;
  reason?: string;
  suggestedAction?: string;
}> {
  try {
    // Get recent outcomes for this entity type
    const recentOutcomes = await supabaseQuery(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      "decision_memory",
      `tenant_id=eq.${tenantId}&created_at=gte.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&order=created_at.desc&limit=50`
    );

    if (!recentOutcomes || recentOutcomes.length < 5) {
      return { requiresAttention: false };
    }

    // Calculate success rate for this entity type
    const relevantOutcomes = recentOutcomes.filter(
      (o: any) => o.tool_calls?.[0]?.params?.entity_type === outcome.entity_type
    );

    if (relevantOutcomes.length < 5) {
      return { requiresAttention: false };
    }

    const successCount = relevantOutcomes.filter((o: any) => o.outcome === "success").length;
    const successRate = successCount / relevantOutcomes.length;

    // If success rate drops below 70%, flag for attention
    if (successRate < 0.7) {
      return {
        requiresAttention: true,
        reason: `Success rate for ${outcome.entity_type} dropped to ${Math.round(successRate * 100)}%`,
        suggestedAction: "Review and refine situation escalation rules",
      };
    }

    // Check for repeated failures
    const recentFailures = relevantOutcomes
      .slice(0, 10)
      .filter((o: any) => o.outcome === "failure").length;

    if (recentFailures >= 7) {
      return {
        requiresAttention: true,
        reason: `High failure rate detected: ${recentFailures}/10 recent actions failed`,
        suggestedAction: "Investigate connector configuration or rule logic",
      };
    }

    return { requiresAttention: false };
  } catch (err) {
    console.warn(`[OutcomeLearning] Pattern analysis failed: ${err}`);
    return { requiresAttention: false };
  }
}

/**
 * Flag detected patterns for drift detection
 */
async function flagForDriftDetection(
  env: CognitiveBrainBindings,
  tenantId: string,
  outcome: ActionOutcome,
  suggestions: { reason?: string; suggestedAction?: string }
): Promise<void> {
  try {
    await fetch(`${env.SUPABASE_URL || ""}/rest/v1/drift_events`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY || "",
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        drift_type: "rule_effectiveness_decline",
        severity: "warning",
        description: suggestions.reason || "Rule effectiveness declined",
        source_entity_type: outcome.entity_type,
        source_entity_id: outcome.entity_id,
        suggested_action: suggestions.suggestedAction,
        response_status: "pending",
        detected_at: new Date().toISOString(),
      }),
    });

    console.log(`[OutcomeLearning] Flagged drift detection for ${outcome.entity_type}`);
  } catch (err) {
    console.warn(`[OutcomeLearning] Failed to flag drift: ${err}`);
  }
}

/**
 * GET /v1/outcome/effectiveness
 * Get rule effectiveness statistics for a tenant
 */
app.get("/v1/outcome/effectiveness", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  // const entityType = c.req.query("entity_type"); // Reserved for future entity-specific filtering
  const minEffectiveness = parseInt(c.req.query("min_effectiveness") || "0");

  try {
    let query = `tenant_id=eq.${tenantId}&effectiveness_score=gte.${minEffectiveness}`;

    const effectiveness = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "rule_effectiveness",
      query
    );

    // Aggregate by entity type if requested
    const summary = {
      total_rules: effectiveness?.length || 0,
      avg_effectiveness: 0,
      high_performers: 0,
      needs_attention: 0,
      by_entity_type: {} as Record<string, { count: number; avg_effectiveness: number }>,
    };

    if (effectiveness && effectiveness.length > 0) {
      const scores = effectiveness.map((r: any) => r.effectiveness_score);
      summary.avg_effectiveness = Math.round(
        scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      );
      summary.high_performers = effectiveness.filter(
        (r: any) => r.effectiveness_score >= 80
      ).length;
      summary.needs_attention = effectiveness.filter((r: any) => r.effectiveness_score < 50).length;
    }

    return c.json({
      tenant_id: tenantId,
      summary,
      rules: effectiveness || [],
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// UNIFIED ENTITY 360 SERVICE
// Consolidates entity data from Spine, Knowledge UI, and Cognitive context
// Replaces distributed fetching across L2, BFF, and Think
// ============================================================================

/**
 * GET /v1/entity360/:entity_type/:entity_id
 * Unified Entity 360 view - single source of truth for entity data
 */
app.get("/v1/entity360/:entity_type/:entity_id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityType = c.req.param("entity_type");
  const entityId = c.req.param("entity_id");
  const depth = (c.req.query("depth") || "standard") as string;

  try {
    // Fetch from multiple sources in parallel
    const [spineData, cognitiveContext] = await Promise.all([
      fetchSpineEntity(c.env, tenantId, entityType, entityId, depth),
      fetchCognitiveContext(c.env, tenantId, entityType, entityId, depth),
    ]);

    const entity360 = {
      meta: {
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: entityId,
        depth,
        generated_at: new Date().toISOString(),
      },
      spine: spineData,
      cognitive: cognitiveContext,
      unified: {
        ...spineData?.attributes,
        memories: cognitiveContext?.memories || [],
        situations: cognitiveContext?.situations || [],
      },
    };

    return c.json(entity360);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

async function fetchSpineEntity(
  env: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  _depth: string
): Promise<any> {
  try {
    const entity = await supabaseQuery(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY,
      entityType,
      `id=eq.${entityId}&tenant_id=eq.${tenantId}&limit=1`
    );
    if (!entity?.[0]) return null;
    return { id: entity[0].id, type: entityType, attributes: entity[0] };
  } catch {
    return null;
  }
}

async function fetchCognitiveContext(
  env: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  depth: string
): Promise<any> {
  try {
    const limit = depth === "deep" ? 20 : 10;
    const [memories, situations] = await Promise.all([
      supabaseQuery(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
        "decision_memory",
        `tenant_id=eq.${tenantId}&order=created_at.desc&limit=${limit}`
      ).catch(() => []),
      supabaseQuery(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
        "situations",
        `tenant_id=eq.${tenantId}&entity_type=eq.${entityType}&entity_id=eq.${entityId}&status=eq.active`
      ).catch(() => []),
    ]);
    return { memories: memories || [], situations: situations || [] };
  } catch {
    return null;
  }
}

// ============================================================================
// Queue Handler (v3.6 Section 19.7)
// ============================================================================
export const queue = {
  async queue(batch: MessageBatch<any>, env: CognitiveBrainBindings): Promise<void> {
    const correlationId = crypto.randomUUID();

    for (const message of batch.messages) {
      const {
        tenant_id,
        entity_type,
        raw_data,
        source_system,
        error,
        error_type,
        errors,
        timestamp,
        correlation_id: msg_correlation_id,
      } = message.body;

      const trace_id = msg_correlation_id || correlationId;

      try {
        console.log(
          `[Cognitive Brain DLQ] Processing failed message for tenant ${tenant_id} - Correlation: ${trace_id}`
        );

        // 1. Log comprehensive error details
        const errorLog = {
          timestamp: timestamp || new Date().toISOString(),
          correlation_id: trace_id,
          tenant_id,
          entity_type,
          source_system,
          error_message: error,
          error_type: error_type || "unknown",
          error_details: errors ? JSON.stringify(errors) : null,
          raw_data_preview: raw_data ? JSON.stringify(raw_data).substring(0, 500) : null,
          severity: error_type === "system_error" ? "critical" : "warning",
        };

        console.error("[Cognitive Brain DLQ] Error Details:", JSON.stringify(errorLog, null, 2));

        // 2. Categorize failure type
        let failureCategory = "unknown";
        if (error_type === "system_error") {
          failureCategory = "system";
        } else if (error?.includes("validation")) {
          failureCategory = "validation";
        } else if (error?.includes("format")) {
          failureCategory = "format";
        } else if (error?.includes("missing")) {
          failureCategory = "missing_field";
        } else if (error?.includes("transform")) {
          failureCategory = "transform";
        }

        // 3. Store failure metadata in D1 edge cache for monitoring/alerting
        try {
          const dlq_id = crypto.randomUUID();
          await env.DB.prepare(
            `
            INSERT INTO dlq_entries (
              id,
              tenant_id,
              entity_type,
              source_system,
              error_message,
              error_type,
              failure_category,
              raw_data_snapshot,
              correlation_id,
              severity,
              stored_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          )
            .bind(
              dlq_id,
              tenant_id,
              entity_type,
              source_system,
              error,
              error_type || "unknown",
              failureCategory,
              raw_data ? JSON.stringify(raw_data).substring(0, 1000) : null,
              trace_id,
              error_type === "system_error" ? "critical" : "warning",
              new Date().toISOString()
            )
            .run();

          console.log(`[Cognitive Brain DLQ] Stored DLQ entry: ${dlq_id}`);
        } catch (db_err: any) {
          console.error(`[Cognitive Brain DLQ] Failed to store DLQ entry in D1: ${db_err.message}`);
          // Continue processing even if storage fails
        }

        // 4. Create monitoring alert for critical failures
        if (error_type === "system_error") {
          console.warn(
            `[Cognitive Brain DLQ] CRITICAL: System error in pipeline for tenant ${tenant_id}`
          );
          // In production, would trigger alert to ops team (e.g., PagerDuty, Slack)
        }

        // 5. Always ack DLQ messages (terminal queue — no retries)
        message.ack();
        console.log(`[Cognitive Brain DLQ] Message acked (terminal): ${trace_id}`);
      } catch (error: any) {
        // Even if processing fails, ack the message to prevent infinite loops
        console.error(
          `[Cognitive Brain DLQ] Unexpected error processing DLQ message: ${error.message}`
        );
        message.ack();
      }
    }
  },
};

export default {
  fetch: app.fetch,
  queue: queue.queue,
};
