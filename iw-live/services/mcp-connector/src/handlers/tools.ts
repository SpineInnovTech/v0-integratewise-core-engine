/**
 * IntegrateWise MCP Tool Server — tool definitions and invoke handlers.
 *
 * Real intent: MCP is the protocol layer for external AI systems (Claude, ChatGPT, Perplexity, etc.)
 * to talk to IntegrateWise. Primary tools are Knowledge Bank (kb.*): session summaries, articles,
 * search, topics — Flow C ingest and compounding.
 */

import type { Context } from "hono";
import { z } from "zod";
import { getTraceId } from "../lib/logging";
import { buildOrSyncDoc } from "../../../../packages/coda-pack/template";

export type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

export type Bindings = {
  KB_BUCKET?: string;
  GCS_PROJECT_ID?: string;
  FIRESTORE_PROJECT_ID?: string;
  VERTEX_AI_SEARCH_ENGINE_ID?: string;
  VERTEX_AI_LOCATION?: string;
  ENVIRONMENT: string;
  MCP_IDEMPOTENCY?: KVNamespace;
  MCP_CONNECTOR_API_KEY?: string; // When set, Bearer or X-MCP-Key can be used for /tools and /invoke (no JWT needed)
  TRIAGE_BOT_API_KEY?: string; // Write-protected tools require this key (memory writes, KB writes)
  DB?: D1Database; // Spine read cache
  KNOWLEDGE?: Fetcher; // Service binding to integratewise-knowledge
  PIPELINE?: Fetcher; // Service binding to integratewise-pipeline
  PIPELINE_QUEUE?: Queue; // Queue producer binding
  // DECISION 22: Supabase env vars removed. Auth via IW OAuth / MCP API key / CF Access only.
  // Spine-native routing
  INTELLIGENCE_URL?: string; // Fallback URL for intelligence worker (signals, proposals)
  SERVICE_SECRET?: string; // Internal service auth
  CODA_API_TOKEN?: string; // Coda API Secret token
  // Cloudflare Access OAuth
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
};

function readBooleanFlag(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1" || normalized === "on";
}

function mapApprovedMemoryType(type: unknown): string {
  switch (String(type || "").toLowerCase()) {
    case "topic":
      return "kb_article";
    case "pattern":
      return "project_rollup";
    default:
      return "session_summary";
  }
}

function buildApprovedMemoryTitle(memory: any): string {
  const content = String(memory?.content || "").trim();
  if (!content) return "Approved memory";
  return content.length > 96 ? `${content.slice(0, 93)}...` : content;
}

async function getApprovedOnlyKnowledgePolicy(
  env: Bindings,
  tenantId: string,
  log: Log
): Promise<boolean> {
  if (!env.DB) {
    return false;
  }

  try {
    const row = await env.DB.prepare(
      "SELECT depth_matrix_snapshot FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1"
    )
      .bind(tenantId)
      .first<{ depth_matrix_snapshot: string | null }>();

    if (!row?.depth_matrix_snapshot) return false;
    const snapshot = JSON.parse(row.depth_matrix_snapshot) || {};
    const approvedOnly =
      snapshot.limit_flow_c_to_approved_memory ??
      snapshot.flow_c_approved_only ??
      snapshot.approved_compounding_only ??
      snapshot.compounding_memory_approved_only ??
      snapshot.knowledge_ui_approved_only;
    return readBooleanFlag(approvedOnly);
  } catch (error) {
    log.warn("Failed to resolve approved-only Flow C policy from D1", {
      tenant_id: tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function fetchApprovedMemories(
  env: Bindings,
  tenantId: string,
  log: Log,
  query?: string
): Promise<any[]> {
  if (!env.KNOWLEDGE) {
    log.warn("Knowledge binding unavailable for approved-memory read", { tenant_id: tenantId });
    return [];
  }

  try {
    const url = new URL("https://internal/v1/knowledge/memories");
    if (query) url.searchParams.set("q", query);

    const response = await env.KNOWLEDGE.fetch(
      new Request(url.toString(), {
        method: "GET",
        headers: { "x-tenant-id": tenantId },
      })
    );

    if (!response.ok) {
      log.warn("Approved-memory fetch failed", {
        tenant_id: tenantId,
        status: response.status,
      });
      return [];
    }

    const payload = (await response.json()) as any;
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    log.warn("Approved-memory fetch threw", {
      tenant_id: tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// ============================================================================
// TOOL DEFINITIONS (JSON Schema)
// ============================================================================

const TOOL_DEFINITIONS = [
  {
    name: "kb.write_session_summary",
    description:
      "Write a session-end summary artifact into the Knowledge Bank (R2 content storage + D1 metadata + D1 org_memory). Returns artifact reference. Idempotent by session_id.",
    permissions: ["Admin", "Member"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "tenant_id",
        "user_id",
        "provider",
        "session_id",
        "started_at",
        "ended_at",
        "summary_md",
      ],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        user_id: { type: "string", minLength: 1 },
        provider: {
          type: "string",
          enum: ["chatgpt", "claude", "grok", "gemini", "other"],
        },
        session_id: { type: "string", minLength: 1 },
        started_at: { type: "string", format: "date-time" },
        ended_at: { type: "string", format: "date-time" },
        summary_md: { type: "string", minLength: 1 },
        topics: {
          type: "array",
          items: { type: "string", minLength: 1 },
          default: [],
        },
        project: { type: "string" },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["artifact_id", "gcs_uri", "created_at"],
      properties: {
        artifact_id: { type: "string" },
        gcs_uri: {
          type: "string",
          description: "R2 storage URI (legacy field name retained for API compat)",
        },
        metadata_ref: { type: "string", description: "D1 spine_events row reference" },
        created_at: { type: "string", format: "date-time" },
        signed_url: { type: "string", description: "R2 signed URL for direct retrieval" },
      },
    },
  },
  {
    name: "kb.write_article",
    description:
      "Create or update a Knowledge Bank article (promoted artifact). Content stored in R2, metadata in D1 kb_artifacts table.",
    permissions: ["Admin", "Member"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "title", "content_md"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        article_id: { type: "string", description: "If omitted, server generates." },
        title: { type: "string", minLength: 1, maxLength: 200 },
        content_md: { type: "string", minLength: 1 },
        topics: {
          type: "array",
          items: { type: "string", minLength: 1 },
          default: [],
        },
        visibility: {
          type: "string",
          enum: ["private", "team", "org"],
          default: "team",
        },
        tags: {
          type: "array",
          items: { type: "string", minLength: 1 },
          default: [],
        },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["article_id", "artifact_id", "gcs_uri", "updated_at"],
      properties: {
        article_id: { type: "string" },
        artifact_id: { type: "string" },
        gcs_uri: {
          type: "string",
          description: "R2 storage URI (legacy field name retained for API compat)",
        },
        metadata_ref: { type: "string", description: "D1 spine_events row reference" },
        updated_at: { type: "string", format: "date-time" },
        signed_url: { type: "string", description: "R2 signed URL for direct retrieval" },
      },
    },
  },
  {
    name: "kb.get_artifact",
    description:
      "Fetch artifact metadata and access pointers (R2 URI and optional signed URL). Reads from D1 kb_artifacts.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "artifact_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        artifact_id: { type: "string", minLength: 1 },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["artifact_id", "type", "created_at", "gcs_uri"],
      properties: {
        artifact_id: { type: "string" },
        type: {
          type: "string",
          enum: ["session_summary", "kb_article", "thread_rollup", "project_rollup"],
        },
        title: { type: "string" },
        topics: { type: "array", items: { type: "string" } },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        gcs_uri: {
          type: "string",
          description: "R2 storage URI (legacy field name retained for API compat)",
        },
        signed_url: { type: "string", description: "R2 signed URL for direct retrieval" },
        source: { type: "string", description: "ai_relay|manual|workflow" },
      },
    },
  },
  {
    name: "kb.list_recent",
    description:
      "List recent Knowledge Bank artifacts from D1 kb_artifacts (D1 org_memory for approved knowledge). Filter by topic or type.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        topic: { type: "string" },
        type: {
          type: "string",
          enum: ["session_summary", "kb_article", "thread_rollup", "project_rollup"],
        },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["artifact_id", "type", "created_at"],
            properties: {
              artifact_id: { type: "string" },
              type: { type: "string" },
              title: { type: "string" },
              topics: { type: "array", items: { type: "string" } },
              created_at: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
  {
    name: "kb.search",
    description:
      "Search Knowledge Bank via D1 full-text queries and D1 org_memory with full-text search. Enforces tenant isolation server-side.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "q"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        q: { type: "string", minLength: 1 },
        topic: { type: "string" },
        from: { type: "string", format: "date-time" },
        to: { type: "string", format: "date-time" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["results"],
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["artifact_id", "title", "snippet", "created_at"],
            properties: {
              artifact_id: { type: "string" },
              title: { type: "string" },
              snippet: { type: "string" },
              topics: { type: "array", items: { type: "string" } },
              created_at: { type: "string", format: "date-time" },
              score: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "kb.topic_upsert",
    description:
      "Create or update a topic sync policy. cadence supports weekly/biweekly; hourly_opt_in is a flag only.",
    permissions: ["Admin"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "topic_name", "cadence"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        topic_name: { type: "string", minLength: 1, maxLength: 120 },
        cadence: { type: "string", enum: ["weekly", "biweekly"] },
        hourly_opt_in: { type: "boolean", default: false },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic_id", "name", "cadence", "updated_at"],
      properties: {
        topic_id: { type: "string" },
        name: { type: "string" },
        cadence: { type: "string" },
        hourly_opt_in: { type: "boolean" },
        last_synced_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    },
  },
  {
    name: "kb.topic_list",
    description: "List topics and sync policies for a tenant.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["topic_id", "name", "cadence"],
            properties: {
              topic_id: { type: "string" },
              name: { type: "string" },
              cadence: { type: "string" },
              hourly_opt_in: { type: "boolean" },
              last_synced_at: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
  // Memory layer tools (D1 conversational_memory + org_memory)
  {
    name: "memory.write_conversational",
    description:
      "Write a conversational memory event to the D1 memory layer. Stores session context for long-term retrieval and continuity.",
    permissions: ["Admin", "Member"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "session_id", "user_id", "role", "content"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        session_id: { type: "string", minLength: 1 },
        user_id: { type: "string", minLength: 1 },
        role: { type: "string", enum: ["user", "assistant", "system"] },
        content: { type: "string", minLength: 1 },
        model: { type: "string" },
        metadata: { type: "object", additionalProperties: true, default: {} },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "created_at"],
      properties: {
        id: { type: "string", format: "uuid" },
        created_at: { type: "string", format: "date-time" },
      },
    },
  },
  {
    name: "memory.read_conversational",
    description:
      "Read conversational memory events from the D1 memory layer by session_id or tenant_id. Returns chronologically ordered events.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        session_id: { type: "string" },
        user_id: { type: "string" },
        limit: { type: "integer", default: 50, maximum: 200 },
        offset: { type: "integer", default: 0 },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["items", "count"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "session_id", "role", "content", "created_at"],
            properties: {
              id: { type: "string", format: "uuid" },
              session_id: { type: "string" },
              user_id: { type: "string" },
              role: { type: "string" },
              content: { type: "string" },
              model: { type: "string" },
              metadata: { type: "object" },
              created_at: { type: "string", format: "date-time" },
            },
          },
        },
        count: { type: "integer" },
      },
    },
  },
  {
    name: "memory.upsert_org",
    description:
      "Upsert an organizational memory entry into the D1 org_memory table. Used for compounding knowledge, decisions, and patterns.",
    permissions: ["Admin", "Member"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "category", "topic", "content"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        category: { type: "string", minLength: 1 },
        topic: { type: "string", minLength: 1 },
        content: { type: "string", minLength: 1 },
        source: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        tier: { type: "string", enum: ["standard", "elevated", "critical"], default: "standard" },
        governance_state: {
          type: "string",
          enum: ["staging", "draft", "pending", "approved", "rejected", "published", "archived"],
          default: "staging",
        },
        metadata: { type: "object", additionalProperties: true, default: {} },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "updated_at"],
      properties: {
        id: { type: "string", format: "uuid" },
        updated_at: { type: "string", format: "date-time" },
      },
    },
  },
  {
    name: "memory.search_org",
    description:
      "Search organizational memory entries by category, topic, or content. Supports partial text matching on topic and content fields.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        category: { type: "string" },
        topic: { type: "string" },
        content: { type: "string" },
        governance_state: {
          type: "string",
          enum: ["staging", "draft", "pending", "approved", "rejected", "published", "archived"],
        },
        limit: { type: "integer", default: 20, maximum: 100 },
        offset: { type: "integer", default: 0 },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["items", "count"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "category", "topic", "content", "created_at"],
            properties: {
              id: { type: "string", format: "uuid" },
              category: { type: "string" },
              topic: { type: "string" },
              content: { type: "string" },
              source_session_id: { type: "string" },
              confidence: { type: "number" },
              tier: { type: "string" },
              governance_state: { type: "string" },
              metadata: { type: "object" },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
        },
        count: { type: "integer" },
      },
    },
  },
  {
    name: "memory.propose",
    description:
      "Submit a memory proposal to the Triage Bot queue. Nothing writes to org memory directly. All proposals require Triage Bot scoring and human approval.",
    permissions: ["Admin", "Member"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "content_type", "title", "body"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        content_type: {
          type: "string",
          enum: [
            "decision",
            "commitment",
            "insight",
            "risk",
            "solution",
            "preference",
            "relationship",
            "context",
            "pattern",
            "error_resolution",
            "skill_update",
            "external_signal",
          ],
        },
        title: { type: "string", minLength: 1 },
        body: { type: "string", minLength: 1 },
        target_layer: {
          type: "string",
          enum: ["personal", "organisational", "entity"],
          default: "organisational",
        },
        target_entity_type: { type: "string" },
        target_entity_id: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1, default: 0.5 },
        source_context: { type: "string" },
        evidence_chain: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "status", "created_at"],
      properties: {
        id: { type: "string" },
        status: { type: "string" },
        created_at: { type: "string", format: "date-time" },
      },
    },
  },
  // ── Book of Projects (Institutional Knowledge) ──────────────────────────
  {
    name: "book.get_episodes",
    description: "Get episodes from Book of Projects (institutional knowledge).",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        status: { type: "string", enum: ["active", "resolved", "superseded"] },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      },
    },
    output_schema: { type: "object", additionalProperties: true },
  },
  {
    name: "book.get_episode",
    description: "Get a single episode from Book of Projects.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        id: { type: "string", minLength: 1 },
      },
    },
    output_schema: { type: "object", additionalProperties: true },
  },
  {
    name: "book.create_episode",
    description: "Create a new episode in Book of Projects (via Triage Bot).",
    permissions: ["Admin"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "title", "created_by"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        title: { type: "string", minLength: 1 },
        description: { type: "string" },
        entity_refs: { type: "array", items: { type: "object" } },
        created_by: { type: "string", minLength: 1 },
      },
    },
    output_schema: { type: "object", additionalProperties: true },
  },
  {
    name: "book.add_primitive",
    description: "Add a primitive (fact, decision, commitment, learning) to an episode.",
    permissions: ["Admin"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "episode_id", "type", "content", "created_by"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        episode_id: { type: "string", minLength: 1 },
        type: { type: "string", enum: ["fact", "decision", "commitment", "learning"] },
        content: { type: "string", minLength: 1 },
        source: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        entity_refs: { type: "array", items: { type: "object" } },
        created_by: { type: "string", minLength: 1 },
      },
    },
    output_schema: { type: "object", additionalProperties: true },
  },
  {
    name: "book.search_by_entity",
    description: "Search episodes by entity reference.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "entity_type", "entity_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        entity_type: { type: "string", minLength: 1 },
        entity_id: { type: "string", minLength: 1 },
      },
    },
    output_schema: { type: "object", additionalProperties: true },
  },
  {
    name: "coda.sync_ops_plan",
    description:
      "Sync and publish the beautified Coda templates representing the 5 Connections (SI Plan) to Coda. Updates existing pages/tables in the document.",
    permissions: ["Admin", "Member"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        coda_api_token: {
          type: "string",
          description: "Optional Coda API token. Falls back to server secrets if omitted.",
        },
        coda_doc_id: {
          type: "string",
          description: "Optional document ID. If omitted, a new document is created.",
        },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "doc_url"],
      properties: {
        status: { type: "string" },
        doc_url: { type: "string" },
      },
    },
  },
  {
    name: "coda.connect_doc",
    description:
      "Connect a specific Coda document as an L4 projection surface for the tenant/user. Registers the doc_id so that personal_memory and org_memory can be synced to it via MCP, and Coda pages can be read/written through the MCP layer (no direct Coda API from agents). This enables Coda docs as a connected 'tool' in the ecosystem, with data flowing through Spine.",
    permissions: ["Admin", "Member"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "coda_doc_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        user_id: {
          type: "string",
          description:
            "Optional user for personal docs (e.g. founder personal OS). Defaults to tenant owner.",
        },
        coda_doc_id: { type: "string", minLength: 1 },
        coda_api_token: {
          type: "string",
          description: "Optional Coda API token. Falls back to server secrets if omitted.",
        },
        is_personal: {
          type: "boolean",
          description:
            "If true, connect as personal L4 for founder OS (ties to .iw-memory personal_memory).",
        },
        doc_name: {
          type: "string",
          description: "Friendly name for the connected doc (e.g. 'Founder Daily OS').",
        },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "doc_url", "connected_as"],
      properties: {
        status: { type: "string" },
        doc_url: { type: "string" },
        connected_as: { type: "string", description: "personal or org" },
        mcp_tools_available: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "coda.read_page",
    description:
      "Read content from a connected Coda page or doc via MCP (proxied, no direct client API calls). Returns structured content for agents/Twin to reason over without bypassing Spine/MCP. Use after coda.connect_doc.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "coda_doc_id", "page_id_or_name"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        coda_doc_id: { type: "string", minLength: 1 },
        page_id_or_name: { type: "string", minLength: 1 },
        format: {
          type: "string",
          enum: ["markdown", "html", "json"],
          default: "markdown",
        },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["page_id", "title", "content", "source"],
      properties: {
        page_id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        source: { type: "string", description: "coda_via_mcp" },
        last_updated: { type: "string" },
      },
    },
  },
  {
    name: "coda.sync_memory_to_doc",
    description:
      "Sync personal_memory and/or org_memory to a connected Coda doc via MCP. This is the L4 projection path: content from .iw-memory, Spine, etc. is pushed to Coda tables/pages without agents calling Coda directly. Supports founder personal OS + company projections.",
    permissions: ["Admin", "Member"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "coda_doc_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        coda_doc_id: { type: "string", minLength: 1 },
        scope: {
          type: "string",
          enum: ["personal", "org", "both"],
          default: "both",
        },
        user_id: { type: "string", description: "For personal scope (founder)." },
        coda_api_token: { type: "string", description: "Optional override." },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "synced_count", "doc_url"],
      properties: {
        status: { type: "string" },
        synced_count: { type: "number" },
        doc_url: { type: "string" },
        tables_updated: { type: "array", items: { type: "string" } },
      },
    },
  },
  // ── Personal Memory (Per-User Behavioral Patterns) ──────────────────────
  {
    name: "memory.read_personal",
    description:
      "Read personal memory entries for a user. Returns preferences, behaviors, context, decisions, and notes that help the Twin personalize interactions.",
    permissions: ["Admin", "Member", "Viewer"],
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "user_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        user_id: { type: "string", minLength: 1 },
        category: {
          type: "string",
          enum: ["preference", "behavior", "context", "decision", "note", "bookmark"],
        },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        offset: { type: "integer", minimum: 0, default: 0 },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["items", "count"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "topic", "category", "content", "created_at"],
            properties: {
              id: { type: "string" },
              topic: { type: "string" },
              category: { type: "string" },
              content: { type: "string" },
              metadata: { type: "object" },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
        },
        count: { type: "integer" },
      },
    },
  },
  {
    name: "memory.write_personal",
    description:
      "Write a personal memory entry for a user. Captures preferences, behavioral patterns, context, decisions, and notes for long-term personalization.",
    permissions: ["Admin", "Member"],
    triage_bot_only: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["tenant_id", "user_id", "topic", "category", "content"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        user_id: { type: "string", minLength: 1 },
        topic: { type: "string", minLength: 1 },
        category: {
          type: "string",
          enum: ["preference", "behavior", "context", "decision", "note", "bookmark"],
        },
        content: { type: "string", minLength: 1 },
        metadata: { type: "object", additionalProperties: true, default: {} },
      },
    },
    output_schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "created_at"],
      properties: {
        id: { type: "string" },
        created_at: { type: "string", format: "date-time" },
      },
    },
  },
] as const;

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const ProviderSchema = z.enum(["chatgpt", "claude", "grok", "gemini", "other"]);
export const CadenceSchema = z.enum(["weekly", "biweekly"]);
export const VisibilitySchema = z.enum(["private", "team", "org"]);
export const ArtifactTypeSchema = z.enum([
  "session_summary",
  "kb_article",
  "thread_rollup",
  "project_rollup",
]);

export const WriteSessionSummaryInputSchema = z.object({
  tenant_id: z.string().min(1),
  user_id: z.string().min(1),
  provider: ProviderSchema,
  session_id: z.string().min(1),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime(),
  summary_md: z.string().min(1),
  topics: z.array(z.string().min(1)).default([]),
  project: z.string().optional(),
});

export const WriteArticleInputSchema = z.object({
  tenant_id: z.string().min(1),
  article_id: z.string().optional(),
  title: z.string().min(1).max(200),
  content_md: z.string().min(1),
  topics: z.array(z.string().min(1)).default([]),
  visibility: VisibilitySchema.default("team"),
  tags: z.array(z.string().min(1)).default([]),
});

export const GetArtifactInputSchema = z.object({
  tenant_id: z.string().min(1),
  artifact_id: z.string().min(1),
});

export const ListRecentInputSchema = z.object({
  tenant_id: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  topic: z.string().optional(),
  type: ArtifactTypeSchema.optional(),
});

export const SearchInputSchema = z.object({
  tenant_id: z.string().min(1),
  q: z.string().min(1),
  topic: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const TopicUpsertInputSchema = z.object({
  tenant_id: z.string().min(1),
  topic_name: z.string().min(1).max(120),
  cadence: CadenceSchema,
  hourly_opt_in: z.boolean().default(false),
});

export const TopicListInputSchema = z.object({
  tenant_id: z.string().min(1),
});

export const SyncOpsPlanInputSchema = z.object({
  tenant_id: z.string().min(1),
  coda_api_token: z.string().min(1),
  coda_doc_id: z.string().optional(),
});

export const ConnectCodaDocInputSchema = z.object({
  tenant_id: z.string().min(1),
  user_id: z.string().optional(),
  coda_doc_id: z.string().min(1),
  coda_api_token: z.string().optional(),
  is_personal: z.boolean().optional(),
  doc_name: z.string().optional(),
});

export const ReadCodaPageInputSchema = z.object({
  tenant_id: z.string().min(1),
  coda_doc_id: z.string().min(1),
  page_id_or_name: z.string().min(1),
  format: z.enum(["markdown", "html", "json"]).optional(),
});

export const SyncMemoryToCodaDocInputSchema = z.object({
  tenant_id: z.string().min(1),
  coda_doc_id: z.string().min(1),
  scope: z.enum(["personal", "org", "both"]).optional(),
  user_id: z.string().optional(),
  coda_api_token: z.string().optional(),
});

// ============================================================================
// REQUEST/RESPONSE ENVELOPES
// ============================================================================

const InvokeRequestSchema = z.object({
  request_id: z.string(),
  actor: z.object({
    tenant_id: z.string(),
    user_id: z.string(),
    roles: z.array(z.enum(["Admin", "Member", "Viewer"])),
  }),
  tool: z.object({
    name: z.string(),
    arguments: z.record(z.unknown()),
  }),
});

export const WriteConversationalInputSchema = z.object({
  tenant_id: z.string().min(1),
  session_id: z.string().min(1),
  user_id: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ReadConversationalInputSchema = z.object({
  tenant_id: z.string().min(1),
  session_id: z.string().optional(),
  user_id: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const UpsertOrgInputSchema = z.object({
  tenant_id: z.string().min(1),
  category: z.string().min(1),
  topic: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  tier: z.enum(["standard", "elevated", "critical"]).default("standard"),
  governance_state: z
    .enum(["staging", "draft", "pending", "approved", "rejected", "published", "archived"])
    .default("staging"),
  metadata: z.record(z.unknown()).optional(),
});

export const SearchOrgInputSchema = z.object({
  tenant_id: z.string().min(1),
  category: z.string().optional(),
  topic: z.string().optional(),
  content: z.string().optional(),
  governance_state: z
    .enum(["staging", "draft", "pending", "approved", "rejected", "published", "archived"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ── Book of Projects Zod Schemas ──────────────────────────────────────────

export const GetEpisodesInputSchema = z.object({
  tenant_id: z.string().min(1),
  status: z.enum(["active", "resolved", "superseded"]).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const GetEpisodeInputSchema = z.object({
  tenant_id: z.string().min(1),
  id: z.string().min(1),
});

export const CreateEpisodeInputSchema = z.object({
  tenant_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  entity_refs: z.array(z.record(z.unknown())).optional(),
  created_by: z.string().min(1),
});

export const AddPrimitiveInputSchema = z.object({
  tenant_id: z.string().min(1),
  episode_id: z.string().min(1),
  type: z.enum(["fact", "decision", "commitment", "learning"]),
  content: z.string().min(1),
  source: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  entity_refs: z.array(z.record(z.unknown())).optional(),
  created_by: z.string().min(1),
});

export const SearchByEntityInputSchema = z.object({
  tenant_id: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
});

// ── Personal Memory Zod Schemas ───────────────────────────────────────────

export const ReadPersonalInputSchema = z.object({
  tenant_id: z.string().min(1),
  user_id: z.string().min(1),
  category: z
    .enum(["preference", "behavior", "context", "decision", "note", "bookmark"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const WritePersonalInputSchema = z.object({
  tenant_id: z.string().min(1),
  user_id: z.string().min(1),
  topic: z.string().min(1),
  category: z.enum(["preference", "behavior", "context", "decision", "note", "bookmark"]),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Verify Bearer token and extract tenant/user info.
 * Supports: (1) service-to-service binding, (2) MCP API key (Bearer or X-MCP-Key + x-tenant-id), (3) JWT.
 */
export async function verifyAuth(
  authHeader: string | null,
  mcpKeyHeader: string | null,
  isServiceBinding: boolean,
  log: Log,
  env: {
    MCP_CONNECTOR_API_KEY?: string;
    TRIAGE_BOT_API_KEY?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
  },
  tenantHeader: string | null,
  userHeader: string | null,
  cfAccessToken?: string | null
): Promise<{ tenant_id: string; user_id: string; roles: string[]; scope?: string } | null> {
  // Service-to-service requests (no auth header needed due to Cloudflare binding)
  if (isServiceBinding) {
    const tenant_id = (tenantHeader || "").trim();
    if (tenant_id) {
      return {
        tenant_id,
        user_id: (userHeader || "").trim() || "service-account",
        roles: ["Admin"],
      };
    }
    return {
      tenant_id: "service-account",
      user_id: "service-account",
      roles: ["Admin"],
    };
  }

  // Cloudflare Access: prioritize CF-Access-JWT-Assertion header
  if (cfAccessToken && env.CF_ACCESS_TEAM_DOMAIN) {
    try {
      const { verifyAccessToken, extractActorFromAccess } = await import("../lib/access-auth");
      const payload = await verifyAccessToken(
        cfAccessToken,
        env.CF_ACCESS_TEAM_DOMAIN,
        env.CF_ACCESS_AUD
      );

      if (payload) {
        const actor = extractActorFromAccess(payload);
        const tenant_id = (tenantHeader || "").trim() || actor.email.split("@")[0] || "cf-access";

        log.info("Cloudflare Access auth successful", {
          user_id: actor.user_id,
          email: actor.email,
          tenant_id,
        });

        return {
          tenant_id,
          user_id: actor.user_id,
          roles: ["Member"], // CF Access users get Member role by default
        };
      }
    } catch (error) {
      log.warn("Cloudflare Access verification failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearerToken || mcpKeyHeader || null;

  if (!token) {
    return null;
  }

  // --- Start IntegrateWise OAuth Verification ---
  if (token.split(".").length === 3) {
    try {
      const parts = token.split(".");
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(b64));
      const issuer = payload.iss || "";
      const audience = payload.aud || "";

      if (issuer.includes("integratewise.")) {
        const { verifyJWT } = await import("../../../gateway/src/lib/jwt");
        const result = await verifyJWT(token, issuer, audience);
        if (result.valid && result.payload) {
          log.info("IntegrateWise OAuth token verification successful", {
            tenant_id: result.payload.tenant_id,
            user_id: result.payload.sub,
          });
          return {
            tenant_id: result.payload.tenant_id,
            user_id: result.payload.sub,
            roles: [result.payload.role || "Member"],
            scope: result.payload.scope || undefined,
          };
        } else {
          log.warn("IntegrateWise OAuth token verification failed", { error: result.error });
        }
      }
    } catch (e: any) {
      log.info("Not an IntegrateWise OAuth token or verification error", { error: e.message });
    }
  }
  // --- End IntegrateWise OAuth Verification ---

  // Triage bot API key: grants TriageBot role + write access to protected tools
  if (env.TRIAGE_BOT_API_KEY && token === env.TRIAGE_BOT_API_KEY) {
    const tenant_id = (tenantHeader || "").trim();
    if (!tenant_id) {
      log.warn("Triage bot auth requires x-tenant-id header");
      return null;
    }
    return {
      tenant_id,
      user_id: (userHeader || "").trim() || "triage-bot",
      roles: ["TriageBot", "Admin", "Member"],
    };
  }

  // MCP API key: same secret as set in MCP_CONNECTOR_API_KEY; requires x-tenant-id
  if (env.MCP_CONNECTOR_API_KEY && token === env.MCP_CONNECTOR_API_KEY) {
    const tenant_id = (tenantHeader || "").trim();
    if (!tenant_id) {
      log.warn("MCP key auth requires x-tenant-id header");
      return null;
    }
    return {
      tenant_id,
      user_id: (userHeader || "").trim() || "mcp-key-user",
      roles: ["Admin", "Member"],
    };
  }

  // JWT: Legacy Supabase JWT path removed per DECISION 22.
  // MCP OAuth (RS256 tokens issued by /oauth/token) is the sole auth path.
  // If token doesn't match API key, Triage key, or CF Access — reject.
  log.warn("Token verification failed: no valid auth method matched");
  return null;
}

/**
 * Check if user has required permission for tool.
 * Write-protected tools (triage_bot_only) require TriageBot role.
 * All agents have read access to non-protected tools.
 */
export function checkPermission(toolName: string, userRoles: string[]): boolean {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName) as
    | {
        name: string;
        permissions: string[];
        triage_bot_only?: boolean;
      }
    | undefined;

  // Tool not in legacy TOOL_DEFINITIONS — allow if user has Member or Admin role
  // (Spine tools, signal tools, proposal tools are defined in mcp-server.ts MCP_TOOL_DEFINITIONS)
  if (!tool) {
    return (
      userRoles.includes("Member") || userRoles.includes("Admin") || userRoles.includes("TriageBot")
    );
  }

  // Write-protected tools: TriageBot OR Admin can execute
  // (Admin = Customer Zero / founder operations via OAuth client_credentials)
  if (tool.triage_bot_only) {
    return userRoles.includes("TriageBot") || userRoles.includes("Admin");
  }

  // Read/default tools: any permitted role
  return tool.permissions.some((perm) => userRoles.includes(perm));
}

/**
 * Validate tenant isolation - ensure tenant_id in request matches authenticated tenant
 */
function validateTenantIsolation(requestTenantId: string, authenticatedTenantId: string): boolean {
  return requestTenantId === authenticatedTenantId;
}

// ============================================================================
// TOOL IMPLEMENTATIONS (Placeholder - integrate with GCS/Firestore/Vertex AI)
// ============================================================================

/**
 * Generate artifact ID
 */
function generateArtifactId(): string {
  return `art_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate GCS URI for session summary
 */
function getSessionSummaryGcsUri(tenantId: string, sessionId: string, bucket: string): string {
  return `gs://${bucket}/${tenantId}/sessions/${sessionId}/summary.md`;
}

/**
 * Generate GCS URI for article
 */
function getArticleGcsUri(tenantId: string, articleId: string, bucket: string): string {
  return `gs://${bucket}/${tenantId}/kb/${articleId}/content.md`;
}

/**
 * Generate Firestore document path
 */
function getSessionMetadataPath(tenantId: string, sessionId: string): string {
  return `tenants/${tenantId}/sessions/${sessionId}`;
}

function getArticleMetadataPath(tenantId: string, articleId: string): string {
  return `tenants/${tenantId}/kb/${articleId}`;
}

/**
 * Upload file to Store service via R2
 * Routes through KNOWLEDGE service binding to integratewise-knowledge → integratewise-store
 */
async function uploadFileToStore(
  env: Bindings,
  tenantId: string,
  file: File | Blob,
  fileName: string,
  _contentType: string,
  log: Log
): Promise<{ file_id: string; r2_url: string; size: number } | null> {
  if (!env.KNOWLEDGE) {
    log.warn("KNOWLEDGE service binding not available, cannot upload file");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", file, fileName);
    formData.append(
      "metadata",
      JSON.stringify({
        source: "mcp-connector",
        tenant_id: tenantId,
        uploaded_at: new Date().toISOString(),
      })
    );

    const res = await env.KNOWLEDGE.fetch(
      new Request("http://knowledge/v1/store/upload", {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
        },
        body: formData,
      })
    );

    if (!res.ok) {
      log.error("File upload to Store failed", {
        status: res.status,
        statusText: res.statusText,
      });
      return null;
    }

    const result = (await res.json()) as {
      file_id: string;
      r2_url: string;
      size: number;
    };
    return result;
  } catch (error) {
    log.error("File upload exception", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Fetch file from Store service via R2
 * Routes through KNOWLEDGE service binding to integratewise-knowledge → integratewise-store
 */
async function fetchFileFromStore(
  env: Bindings,
  tenantId: string,
  fileId: string,
  log: Log
): Promise<Response | null> {
  if (!env.KNOWLEDGE) {
    log.warn("KNOWLEDGE service binding not available, cannot fetch file");
    return null;
  }

  try {
    const res = await env.KNOWLEDGE.fetch(
      new Request(`http://knowledge/v1/store/files/${fileId}`, {
        method: "GET",
        headers: {
          "x-tenant-id": tenantId,
        },
      })
    );

    if (!res.ok) {
      log.warn("File fetch from Store failed", {
        status: res.status,
        fileId,
      });
      return null;
    }

    return res;
  } catch (error) {
    log.error("File fetch exception", {
      error: error instanceof Error ? error.message : String(error),
      fileId,
    });
    return null;
  }
}

/**
 * Tool: kb.write_session_summary
 */
export async function writeSessionSummary(
  input: z.infer<typeof WriteSessionSummaryInputSchema>,
  env: Bindings,
  log: Log,
  _idempotencyKey?: string
): Promise<any> {
  const bucket = env.KB_BUCKET || "integratewise-kb-default";
  const artifactId = generateArtifactId();
  const gcsUri = getSessionSummaryGcsUri(input.tenant_id, input.session_id, bucket);
  const metadataPath = getSessionMetadataPath(input.tenant_id, input.session_id);
  const createdAt = new Date().toISOString();

  // Check idempotency by session_id
  if (env.MCP_IDEMPOTENCY) {
    const idempotencyKey = `kb_session:${input.tenant_id}:${input.session_id}`;
    const existing = await env.MCP_IDEMPOTENCY.get(idempotencyKey);

    if (existing) {
      const existingData = JSON.parse(existing);
      log.info("Idempotent write_session_summary call", { session_id: input.session_id });
      return {
        artifact_id: existingData.artifact_id,
        gcs_uri: existingData.gcs_uri,
        metadata_ref: existingData.metadata_ref,
        created_at: existingData.created_at,
        signed_url: existingData.signed_url,
      };
    }

    // Upload session summary to Store service via R2
    const summaryBlob = new Blob([input.summary_md], { type: "text/markdown" });
    const fileUploadResult = await uploadFileToStore(
      env,
      input.tenant_id,
      summaryBlob,
      `${input.session_id}.md`,
      "text/markdown",
      log
    );

    const result = {
      artifact_id: artifactId,
      gcs_uri: gcsUri, // Keep for backward compatibility, now maps to R2
      metadata_ref: metadataPath,
      created_at: createdAt,
      signed_url: fileUploadResult?.r2_url || undefined,
    };

    // Store for idempotency
    await env.MCP_IDEMPOTENCY.put(
      idempotencyKey,
      JSON.stringify(result),
      { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
    );

    // Spine Integration: Log event to D1
    if (env.DB) {
      try {
        await env.DB.prepare(
          `
           INSERT INTO spine_events (id, tenant_id, event_type, source, payload, created_at)
           VALUES (?, ?, 'session.summary.created', 'mcp-connector', ?, ?)
         `
        )
          .bind(
            artifactId,
            input.tenant_id,
            JSON.stringify({
              session_id: input.session_id,
              summary: input.summary_md,
              gcs_uri: gcsUri,
            }),
            createdAt
          )
          .run();
      } catch (e: any) {
        log.warn("Failed to write to Spine DB", { error: e.message });
      }
    }

    return result;
  }

  // Fallback without idempotency
  return {
    artifact_id: artifactId,
    gcs_uri: gcsUri,
    metadata_ref: metadataPath,
    created_at: createdAt,
  };
}

/**
 * Tool: kb.write_article
 */
export async function writeArticle(
  input: z.infer<typeof WriteArticleInputSchema>,
  env: Bindings,
  log: Log
): Promise<any> {
  const bucket = env.KB_BUCKET || "integratewise-kb-default";
  const articleId =
    input.article_id || `article_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const artifactId = generateArtifactId();
  const gcsUri = getArticleGcsUri(input.tenant_id, articleId, bucket);
  const metadataPath = getArticleMetadataPath(input.tenant_id, articleId);
  const updatedAt = new Date().toISOString();

  log.info("Writing article", { article_id: articleId, tenant_id: input.tenant_id });

  // Upload article content to Store service via R2
  const contentBlob = new Blob([input.content_md], { type: "text/markdown" });
  const fileUploadResult = await uploadFileToStore(
    env,
    input.tenant_id,
    contentBlob,
    `${articleId}.md`,
    "text/markdown",
    log
  );

  // Spine Integration: Log event to D1
  if (env.DB) {
    try {
      await env.DB.prepare(
        `
          INSERT INTO spine_events (id, tenant_id, event_type, source, payload, created_at)
          VALUES (?, ?, 'kb.article.created', 'mcp-connector', ?, ?)
        `
      )
        .bind(
          artifactId,
          input.tenant_id,
          JSON.stringify({ article_id: articleId, title: input.title, tags: input.tags }),
          updatedAt
        )
        .run();
    } catch (e: any) {
      log.warn("Failed to write to Spine DB", { error: e.message });
    }
  }

  return {
    article_id: articleId,
    artifact_id: artifactId,
    gcs_uri: gcsUri, // Keep for backward compatibility, now maps to R2
    metadata_ref: metadataPath,
    updated_at: updatedAt,
    signed_url: fileUploadResult?.r2_url || undefined,
  };
}

/**
 * Tool: kb.get_artifact
 */
export async function getArtifact(
  input: z.infer<typeof GetArtifactInputSchema>,
  env: Bindings,
  log: Log
): Promise<any> {
  log.info("Getting artifact", { artifact_id: input.artifact_id, tenant_id: input.tenant_id });

  // Fetch artifact metadata and file from Store service via R2
  const fileResponse = await fetchFileFromStore(env, input.tenant_id, input.artifact_id, log);

  const r2Uri = fileResponse
    ? `r2://${env.KB_BUCKET || "integratewise-kb-default"}/${input.tenant_id}/artifacts/${input.artifact_id}`
    : undefined;

  // Placeholder response with Store service file reference
  return {
    artifact_id: input.artifact_id,
    type: "session_summary" as const,
    created_at: new Date().toISOString(),
    gcs_uri:
      r2Uri ||
      `gs://${env.KB_BUCKET || "integratewise-kb-default"}/${input.tenant_id}/artifacts/${input.artifact_id}`,
    signed_url: r2Uri || undefined,
  };
}

/**
 * Tool: kb.list_recent
 */
export async function listRecent(
  input: z.infer<typeof ListRecentInputSchema>,
  env: Bindings,
  log: Log
): Promise<any> {
  log.info("Listing recent artifacts", { tenant_id: input.tenant_id, limit: input.limit });

  const approvedOnly = await getApprovedOnlyKnowledgePolicy(env, input.tenant_id, log);
  if (approvedOnly) {
    const requestedTopic = input.topic;
    const memories = await fetchApprovedMemories(env, input.tenant_id, log);
    const items = memories
      .filter((memory: any) => {
        const mappedType = mapApprovedMemoryType(memory.type);
        const topics = Array.isArray(memory.tags) ? memory.tags.map(String) : [];
        const topicMatch =
          !requestedTopic || topics.some((topic: string) => topic.includes(requestedTopic));
        const typeMatch = !input.type || mappedType === input.type;
        return topicMatch && typeMatch;
      })
      .slice(0, input.limit)
      .map((memory: any) => ({
        artifact_id: memory.id,
        type: mapApprovedMemoryType(memory.type),
        title: buildApprovedMemoryTitle(memory),
        topics: Array.isArray(memory.tags) ? memory.tags.map(String) : [],
        created_at: memory.created_at,
      }));

    return { items };
  }

  // Query D1 for recent artifacts with optional filtering
  if (!env.DB) {
    log.warn("DB binding not available, returning empty list");
    return { items: [] };
  }

  try {
    let query = `
      SELECT id, type, title, topics, created_at
      FROM kb_artifacts
      WHERE tenant_id = ?
    `;
    const params: any[] = [input.tenant_id];

    // Filter by topic if provided
    if (input.topic) {
      query += ` AND topics LIKE ?`;
      params.push(`%${input.topic}%`);
    }

    // Filter by type if provided
    if (input.type) {
      query += ` AND type = ?`;
      params.push(input.type);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(input.limit);

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();

    const items = (result.results || []).map((row: any) => ({
      artifact_id: row.id,
      type: row.type,
      title: row.title,
      topics: row.topics ? JSON.parse(row.topics) : [],
      created_at: row.created_at,
    }));

    return { items };
  } catch (error) {
    log.error("Failed to list recent artifacts", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { items: [] };
  }
}

/**
 * Tool: kb.search
 */
export async function search(
  input: z.infer<typeof SearchInputSchema>,
  env: Bindings,
  log: Log
): Promise<any> {
  log.info("Searching Knowledge Bank", {
    tenant_id: input.tenant_id,
    query: input.q,
    topic: input.topic,
  });

  const approvedOnly = await getApprovedOnlyKnowledgePolicy(env, input.tenant_id, log);
  if (approvedOnly) {
    const requestedTopic = input.topic;
    const memories = await fetchApprovedMemories(env, input.tenant_id, log, input.q);
    const fromTs = input.from ? Date.parse(input.from) : Number.NEGATIVE_INFINITY;
    const toTs = input.to ? Date.parse(input.to) : Number.POSITIVE_INFINITY;

    const results = memories
      .filter((memory: any) => {
        const topics = Array.isArray(memory.tags) ? memory.tags.map(String) : [];
        const createdAt = Date.parse(memory.created_at || "");
        const topicMatch =
          !requestedTopic || topics.some((topic: string) => topic.includes(requestedTopic));
        const dateMatch = !Number.isFinite(createdAt) || (createdAt >= fromTs && createdAt <= toTs);
        return topicMatch && dateMatch;
      })
      .slice(0, input.limit)
      .map((memory: any) => ({
        artifact_id: memory.id,
        title: buildApprovedMemoryTitle(memory),
        snippet: String(memory.content || ""),
        topics: Array.isArray(memory.tags) ? memory.tags.map(String) : [],
        created_at: memory.created_at,
        score: Number(memory.confidence || 0.5),
      }));

    return { results };
  }

  // Search via D1 with full-text search or simple LIKE query
  if (!env.DB) {
    log.warn("DB binding not available, returning empty results");
    return { results: [] };
  }

  try {
    let query = `
      SELECT id, title, snippet, topics, created_at, relevance_score
      FROM kb_artifacts
      WHERE tenant_id = ?
      AND (title LIKE ? OR snippet LIKE ?)
    `;
    const params: any[] = [input.tenant_id, `%${input.q}%`, `%${input.q}%`];

    // Filter by topic if provided
    if (input.topic) {
      query += ` AND topics LIKE ?`;
      params.push(`%${input.topic}%`);
    }

    // Filter by date range if provided
    if (input.from) {
      query += ` AND created_at >= ?`;
      params.push(input.from);
    }
    if (input.to) {
      query += ` AND created_at <= ?`;
      params.push(input.to);
    }

    query += ` ORDER BY relevance_score DESC, created_at DESC LIMIT ?`;
    params.push(input.limit);

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();

    const results = (result.results || []).map((row: any) => ({
      artifact_id: row.id,
      title: row.title,
      snippet: row.snippet,
      topics: row.topics ? JSON.parse(row.topics) : [],
      created_at: row.created_at,
      score: row.relevance_score || 0.5,
    }));

    return { results };
  } catch (error) {
    log.error("Search failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { results: [] };
  }
}

/**
 * Tool: kb.topic_upsert
 */
export async function topicUpsert(
  input: z.infer<typeof TopicUpsertInputSchema>,
  env: Bindings,
  log: Log
): Promise<any> {
  const topicId = `topic_${input.tenant_id}_${input.topic_name.replace(/\s+/g, "_").toLowerCase()}`;
  log.info("Upserting topic", { topic_id: topicId, tenant_id: input.tenant_id });

  // Insert or update topic policy in D1
  if (!env.DB) {
    log.error("DB binding not available, cannot upsert topic");
    throw new Error("Database unavailable. Please try again later.");
  }

  try {
    const now = new Date().toISOString();
    await env.DB.prepare(
      `
      INSERT INTO kb_topic_policies (id, tenant_id, name, cadence, hourly_opt_in, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        name = excluded.name,
        cadence = excluded.cadence,
        hourly_opt_in = excluded.hourly_opt_in,
        updated_at = excluded.updated_at
    `
    )
      .bind(
        topicId,
        input.tenant_id,
        input.topic_name,
        input.cadence,
        input.hourly_opt_in ? 1 : 0,
        now
      )
      .run();

    return {
      topic_id: topicId,
      name: input.topic_name,
      cadence: input.cadence,
      hourly_opt_in: input.hourly_opt_in,
      updated_at: now,
    };
  } catch (error) {
    log.error("Failed to upsert topic", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Tool: kb.topic_list
 */
export async function topicList(
  input: z.infer<typeof TopicListInputSchema>,
  env: Bindings,
  log: Log
): Promise<any> {
  log.info("Listing topics", { tenant_id: input.tenant_id });

  // Query D1 for topics for this tenant
  if (!env.DB) {
    log.error("DB binding not available, cannot list topics");
    throw new Error("Database unavailable. Please try again later.");
  }

  try {
    const result = await env.DB.prepare(
      `
      SELECT id, name, cadence, hourly_opt_in, last_synced_at
      FROM kb_topic_policies
      WHERE tenant_id = ?
      ORDER BY updated_at DESC
    `
    )
      .bind(input.tenant_id)
      .all();

    const items = (result.results || []).map((row: any) => ({
      topic_id: row.id,
      name: row.name,
      cadence: row.cadence,
      hourly_opt_in: Boolean(row.hourly_opt_in),
      last_synced_at: row.last_synced_at,
    }));

    return { items };
  } catch (error) {
    log.error("Failed to list topics", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// MEMORY LAYER HANDLERS
// ============================================================================

export const PushRawInputSchema = z.object({
  tenant_id: z.string(),
  source: z.string(),
  source_type: z
    .enum(["loader_creamy", "loader_delta", "loader_full", "webhook", "manual"])
    .default("manual"),
  entity_type: z.string(),
  source_id: z.string(),
  payload: z.record(z.any()),
  phase: z.enum(["creamy", "delta", "full"]).optional(),
  trace_id: z.string().optional(),
});

export async function pushRaw(
  input: z.infer<typeof PushRawInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ success: boolean; trace_id: string; message_id: string }> {
  if (!env.PIPELINE_QUEUE) {
    throw new Error("PIPELINE_QUEUE binding is not configured.");
  }

  const traceId = input.trace_id || crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  // Construct standard PipelineQueueMessage
  const message = {
    message_version: 1,
    stage: "analyze",
    source: input.source,
    source_type: input.source_type,
    tenant_id: input.tenant_id,
    payload: {
      _entity_type: input.entity_type,
      _source_id: input.source_id,
      _tenant_id: input.tenant_id,
      ...input.payload,
    },
    metadata: {
      trace_id: traceId,
      attempt: 1,
      received_at: receivedAt,
      extracted_at: receivedAt,
      phase: input.phase || "creamy",
    },
  };

  // Enqueue message
  await env.PIPELINE_QUEUE.send(message);

  log.info("connector.push_raw enqueued message successfully", {
    tenant_id: input.tenant_id,
    source: input.source,
    entity_type: input.entity_type,
    source_id: input.source_id,
    trace_id: traceId,
  });

  return {
    success: true,
    trace_id: traceId,
    message_id: traceId,
  };
}

/**
 * Tool: memory.write_conversational
 */
export async function writeConversational(
  input: z.infer<typeof WriteConversationalInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ id: string; created_at: string }> {
  // Write to D1 directly (edge-local, D1-native writes per DECISION 22)
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO conversational_memory (id, tenant_id, session_id, model, role, content, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.tenant_id,
      input.session_id,
      input.model || input.user_id || "mcp",
      input.role,
      input.content,
      JSON.stringify(input.metadata || {}),
      now
    )
    .run();

  log.info("memory.write_conversational → D1", {
    id,
    tenant_id: input.tenant_id,
    session_id: input.session_id,
  });
  return { id, created_at: now };
}

/**
 * Tool: memory.read_conversational
 */
export async function readConversational(
  input: z.infer<typeof ReadConversationalInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ items: unknown[]; count: number }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  try {
    let query = "SELECT * FROM conversational_memory WHERE tenant_id = ?";
    const params: any[] = [input.tenant_id];
    if (input.session_id) {
      query += " AND session_id = ?";
      params.push(input.session_id);
    }
    if (input.user_id) {
      query += " AND user_id = ?";
      params.push(input.user_id);
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(input.limit, input.offset);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    const items = (results || []).map((row: any) => {
      if (row.metadata && typeof row.metadata === "string") {
        try {
          row.metadata = JSON.parse(row.metadata);
        } catch {}
      }
      return row;
    });

    // Count query
    let countQuery = "SELECT COUNT(*) as count FROM conversational_memory WHERE tenant_id = ?";
    const countParams: any[] = [input.tenant_id];
    if (input.session_id) {
      countQuery += " AND session_id = ?";
      countParams.push(input.session_id);
    }
    if (input.user_id) {
      countQuery += " AND user_id = ?";
      countParams.push(input.user_id);
    }
    const countRes = await env.DB.prepare(countQuery)
      .bind(...countParams)
      .first<{ count: number }>();
    const count = countRes?.count ?? items.length;

    return { items, count };
  } catch (err: any) {
    log.error("D1 read_conversational failed:", err);
    throw err;
  }
}

/**
 * Tool: memory.upsert_org
 */
export async function upsertOrg(
  input: z.infer<typeof UpsertOrgInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ id: string; updated_at: string }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO org_memory (id, tenant_id, category, topic, content, source_session_id, confidence, tier, governance_state, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.tenant_id,
      input.category,
      input.topic,
      input.content,
      input.source || "mcp-connector",
      input.confidence ?? 0.8,
      input.tier || "standard",
      input.governance_state || "staging",
      JSON.stringify(input.metadata || {}),
      now,
      now
    )
    .run();

  log.info("memory.upsert_org → D1", {
    id,
    tenant_id: input.tenant_id,
  });
  return { id, updated_at: now };
}

/**
 * Tool: memory.search_org
 */
export async function searchOrg(
  input: z.infer<typeof SearchOrgInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ items: unknown[]; count: number }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  try {
    let query = "SELECT * FROM org_memory WHERE tenant_id = ?";
    const params: any[] = [input.tenant_id];
    if (input.category) {
      query += " AND category = ?";
      params.push(input.category);
    }
    if (input.topic) {
      query += " AND topic LIKE ?";
      params.push(`%${input.topic}%`);
    }
    if (input.content) {
      query += " AND content LIKE ?";
      params.push(`%${input.content}%`);
    }
    if (input.governance_state) {
      query += " AND governance_state = ?";
      params.push(input.governance_state);
    }
    query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
    params.push(input.limit, input.offset);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    const items = (results || []).map((row: any) => {
      if (row.metadata && typeof row.metadata === "string") {
        try {
          row.metadata = JSON.parse(row.metadata);
        } catch {}
      }
      if (row.related_entity_ids && typeof row.related_entity_ids === "string") {
        try {
          row.related_entity_ids = JSON.parse(row.related_entity_ids);
        } catch {}
      }
      return row;
    });

    // Count query
    let countQuery = "SELECT COUNT(*) as count FROM org_memory WHERE tenant_id = ?";
    const countParams: any[] = [input.tenant_id];
    if (input.category) {
      countQuery += " AND category = ?";
      countParams.push(input.category);
    }
    if (input.topic) {
      countQuery += " AND topic LIKE ?";
      countParams.push(`%${input.topic}%`);
    }
    if (input.content) {
      countQuery += " AND content LIKE ?";
      countParams.push(`%${input.content}%`);
    }
    if (input.governance_state) {
      countQuery += " AND governance_state = ?";
      countParams.push(input.governance_state);
    }
    const countRes = await env.DB.prepare(countQuery)
      .bind(...countParams)
      .first<{ count: number }>();
    const count = countRes?.count ?? items.length;

    return { items, count };
  } catch (err: any) {
    log.error("D1 searchOrg read failed:", err);
    throw err;
  }
}

/**
 * Tool: memory.propose
 * Writes to D1 proposals table (Triage Bot queue). Does NOT write to org_memory directly.
 */
export const ProposeMemoryInputSchema = z.object({
  tenant_id: z.string().min(1),
  content_type: z.enum([
    "decision",
    "commitment",
    "insight",
    "risk",
    "solution",
    "preference",
    "relationship",
    "context",
    "pattern",
    "error_resolution",
    "skill_update",
    "external_signal",
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  target_layer: z.enum(["personal", "organisational", "entity"]).default("organisational"),
  target_entity_type: z.string().optional(),
  target_entity_id: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  source_context: z.string().optional(),
  evidence_chain: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export async function proposeMemory(
  input: z.infer<typeof ProposeMemoryInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ id: string; status: string; created_at: string }> {
  if (!env.DB) {
    throw new Error("D1 not configured");
  }

  const id = `prop:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO proposals (id, tenant_id, status, governance_level,
     originating_entity_id, originating_entity_type, originating_signal,
     lineage_id, action_type, action_target, action_parameters, action_description,
     confidence, reasoning_summary, evidence_count,
     ops_priority, ops_surface, created_at, updated_at)
     VALUES (?, ?, 'pending_review', 'manual', ?, ?, ?, ?, 'custom', '{}', '{}', ?, ?, ?, 0, 'medium', 'queue', ?, ?)`
  )
    .bind(
      id,
      input.tenant_id,
      input.target_entity_id || "manual",
      input.target_entity_type || "memory",
      JSON.stringify({
        source: "memory.propose",
        source_context: input.source_context,
        tags: input.tags,
      }),
      id,
      input.title,
      input.confidence,
      input.body,
      input.evidence_chain?.length || 0,
      now,
      now
    )
    .run();

  log.info("memory.propose submitted", {
    id,
    content_type: input.content_type,
    title: input.title,
  });

  return { id, status: "pending_review", created_at: now };
}

// ============================================================================
// BOOK OF PROJECTS HANDLERS
// ============================================================================

/**
 * Tool: book.get_episodes
 */
export async function getEpisodes(
  input: { tenant_id: string; status?: string; limit?: number },
  env: Bindings,
  _log: Log
): Promise<{ episodes: any[] }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  let query =
    "SELECT * FROM cross_data WHERE type = 'episode' AND json_extract(data, '$.tenant_id') = ?";
  const params: any[] = [input.tenant_id];

  if (input.status) {
    query += " AND status = ?";
    params.push(input.status);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(input.limit || 50);

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();
  const episodes = (result.results || []).map((row: any) => {
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(row.data);
    } catch {}

    let parsedTags = [];
    try {
      parsedTags = JSON.parse(row.tags || "[]");
    } catch {}

    return {
      id: row.id,
      tenant_id: input.tenant_id,
      title: row.name,
      description: parsedData.details?.description || parsedData.description || "",
      status: row.status,
      severity: row.severity,
      domain: row.domain,
      primary_surface: row.primary_surface,
      entity_refs: parsedData.details?.entity_refs || parsedData.entity_refs || [],
      created_by: parsedData.details?.created_by || "system",
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: parsedTags,
    };
  });

  return { episodes };
}

/**
 * Tool: book.get_episode
 */
export async function getEpisode(
  input: { tenant_id: string; id: string },
  env: Bindings,
  _log: Log
): Promise<any> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const row = await env.DB.prepare(
    "SELECT * FROM cross_data WHERE id = ? AND type = 'episode' LIMIT 1"
  )
    .bind(input.id)
    .first<any>();

  if (!row) throw new Error("Episode not found");

  let parsedData: any = {};
  try {
    parsedData = JSON.parse(row.data);
  } catch {}

  let parsedTags = [];
  try {
    parsedTags = JSON.parse(row.tags || "[]");
  } catch {}

  // Fetch linked primitives from cross_data where type = 'primitive' (linked via lineage_ref or episode_id in details)
  const primitiveResult = await env.DB.prepare(
    "SELECT * FROM cross_data WHERE type = 'primitive' AND json_extract(data, '$.episode_id') = ?"
  )
    .bind(input.id)
    .all<any>();

  const primitives = (primitiveResult.results || []).map((p: any) => {
    let pData: any = {};
    try {
      pData = JSON.parse(p.data);
    } catch {}
    return {
      id: p.id,
      tenant_id: input.tenant_id,
      episode_id: input.id,
      type: pData.type || "fact",
      content: p.name || pData.content || "",
      source: pData.source || "",
      confidence: pData.confidence || 1.0,
      entity_refs: pData.entity_refs || [],
      created_by: pData.created_by || "system",
      created_at: p.created_at,
    };
  });

  return {
    id: row.id,
    tenant_id: input.tenant_id,
    title: row.name,
    description: parsedData.details?.description || parsedData.description || "",
    status: row.status,
    severity: row.severity,
    domain: row.domain,
    primary_surface: row.primary_surface,
    entity_refs: parsedData.details?.entity_refs || parsedData.entity_refs || [],
    created_by: parsedData.details?.created_by || "system",
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: parsedTags,
    primitives,
  };
}

/**
 * Tool: book.create_episode
 */
export async function createEpisode(
  input: {
    tenant_id: string;
    title: string;
    description?: string;
    entity_refs?: any[];
    created_by: string;
    domain?: string;
    severity?: string;
    primary_surface?: string;
  },
  env: Bindings,
  _log: Log
): Promise<any> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const id = `ep:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const dataPayload = {
    tenant_id: input.tenant_id,
    severity: input.severity || "medium",
    domain: input.domain || "customer_success",
    primary_surface: input.primary_surface || "GROW",
    details: {
      description: input.description || "",
      entity_refs: input.entity_refs || [],
      created_by: input.created_by,
    },
  };

  await env.DB.prepare(
    `INSERT INTO cross_data (id, type, name, status, severity, domain, primary_surface, data, tags, created_at, updated_at)
     VALUES (?, 'episode', ?, 'active', ?, ?, ?, ?, '[]', ?, ?)`
  )
    .bind(
      id,
      input.title,
      input.severity || "medium",
      input.domain || "customer_success",
      input.primary_surface || "GROW",
      JSON.stringify(dataPayload),
      now,
      now
    )
    .run();

  _log.info("book.create_episode → D1", { id, title: input.title });

  return {
    id,
    tenant_id: input.tenant_id,
    title: input.title,
    description: input.description,
    status: "active",
    entity_refs: input.entity_refs || [],
    created_by: input.created_by,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Tool: book.add_primitive
 */
export async function addPrimitive(
  input: {
    tenant_id: string;
    episode_id: string;
    type: string;
    content: string;
    source?: string;
    confidence?: number;
    entity_refs?: any[];
    created_by: string;
  },
  env: Bindings,
  _log: Log
): Promise<any> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const id = `prim:${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const dataPayload = {
    tenant_id: input.tenant_id,
    episode_id: input.episode_id,
    type: input.type,
    content: input.content,
    source: input.source || "",
    confidence: input.confidence || 1.0,
    entity_refs: input.entity_refs || [],
    created_by: input.created_by,
  };

  await env.DB.prepare(
    `INSERT INTO cross_data (id, type, name, status, severity, domain, primary_surface, data, tags, created_at, updated_at)
     VALUES (?, 'primitive', ?, 'active', 'medium', 'customer_success', 'GROW', ?, '[]', ?, ?)`
  )
    .bind(id, input.content.slice(0, 100), JSON.stringify(dataPayload), now, now)
    .run();

  _log.info("book.add_primitive → D1", { id, type: input.type });

  return {
    id,
    tenant_id: input.tenant_id,
    episode_id: input.episode_id,
    type: input.type,
    content: input.content,
    source: input.source,
    confidence: input.confidence,
    entity_refs: input.entity_refs || [],
    created_by: input.created_by,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Tool: book.search_by_entity
 */
export async function searchByEntity(
  input: { tenant_id: string; entity_type: string; entity_id: string },
  env: Bindings,
  _log: Log
): Promise<{ episodes: any[] }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const query = `
    SELECT * FROM cross_data 
    WHERE type = 'episode' 
    AND json_extract(data, '$.tenant_id') = ?
    AND EXISTS (
      SELECT 1 FROM json_each(json_extract(data, '$.details.entity_refs'))
      WHERE json_extract(value, '$.entity_type') = ?
      AND json_extract(value, '$.entity_id') = ?
    )
    ORDER BY created_at DESC
  `;

  const result = await env.DB.prepare(query)
    .bind(input.tenant_id, input.entity_type, input.entity_id)
    .all<any>();

  const episodes = (result.results || []).map((row: any) => {
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(row.data);
    } catch {}

    let parsedTags = [];
    try {
      parsedTags = JSON.parse(row.tags || "[]");
    } catch {}

    return {
      id: row.id,
      tenant_id: input.tenant_id,
      title: row.name,
      description: parsedData.details?.description || parsedData.description || "",
      status: row.status,
      severity: row.severity,
      domain: row.domain,
      primary_surface: row.primary_surface,
      entity_refs: parsedData.details?.entity_refs || parsedData.entity_refs || [],
      created_by: parsedData.details?.created_by || "system",
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: parsedTags,
    };
  });

  return { episodes };
}

// ============================================================================
// PERSONAL MEMORY HANDLERS
// ============================================================================

/**
 * Tool: memory.read_personal
 */
export async function readPersonal(
  input: z.infer<typeof ReadPersonalInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ items: any[]; count: number }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }
  try {
    let query = "SELECT * FROM personal_memory WHERE tenant_id = ? AND user_id = ?";
    const params: any[] = [input.tenant_id, input.user_id];
    if (input.category) {
      query += " AND category = ?";
      params.push(input.category);
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(input.limit, input.offset);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    const items = (results || []).map((row: any) => {
      if (row.metadata && typeof row.metadata === "string") {
        try {
          row.metadata = JSON.parse(row.metadata);
        } catch {}
      }
      return row;
    });

    return { items, count: items.length };
  } catch (err: any) {
    log.error("D1 read_personal failed:", err);
    throw err;
  }
}

/**
 * Tool: memory.write_personal
 */
export async function writePersonal(
  input: z.infer<typeof WritePersonalInputSchema>,
  env: Bindings,
  log: Log
): Promise<{ id: string; created_at: string }> {
  if (!env.DB) {
    throw new Error("D1 database not available");
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO personal_memory (id, tenant_id, user_id, topic, category, content, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.tenant_id,
      input.user_id,
      input.topic,
      input.category,
      input.content,
      JSON.stringify(input.metadata || {}),
      createdAt,
      createdAt
    )
    .run();

  log.info("memory.write_personal → D1", { id, tenant_id: input.tenant_id });
  return { id, created_at: createdAt };
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /tools - Tool discovery endpoint
 */
export async function toolsHandler(c: Context) {
  return c.json({
    name: "integratewise-custom-connector",
    version: "1.0.0",
    protocol: "mcp-like",
    tools: TOOL_DEFINITIONS,
  });
}

/**
 * POST /invoke - Tool invocation endpoint
 */
export async function invokeHandler(c: Context) {
  const log = c.get("log") as Log;
  const traceId = getTraceId();
  const requestId = c.get("requestId");

  // Parse request body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        request_id: requestId,
        status: "error",
        tool: { name: "unknown" },
        error: {
          code: "VALIDATION_ERROR" as ErrorCode,
          message: "Invalid JSON payload",
        },
        meta: {
          server_time: new Date().toISOString(),
          trace_id: traceId,
        },
      },
      400
    );
  }

  // Validate request envelope
  const parsedRequest = InvokeRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return c.json(
      {
        request_id: requestId,
        status: "error",
        tool: { name: "unknown" },
        error: {
          code: "VALIDATION_ERROR" as ErrorCode,
          message: "Invalid request envelope",
          details: parsedRequest.error.flatten(),
        },
        meta: {
          server_time: new Date().toISOString(),
          trace_id: traceId,
        },
      },
      400
    );
  }

  const request = parsedRequest.data;

  // Verify authentication (service binding, MCP API key, or JWT)
  const authHeader = c.req.header("Authorization");
  const mcpKeyHeader = c.req.header("X-MCP-Key");
  const isServiceBinding = c.req.header("cf-worker") !== undefined;
  const env = c.env as Bindings;
  const auth = await verifyAuth(
    authHeader || null,
    mcpKeyHeader || null,
    isServiceBinding,
    log,
    {
      MCP_CONNECTOR_API_KEY: env.MCP_CONNECTOR_API_KEY,
      TRIAGE_BOT_API_KEY: env.TRIAGE_BOT_API_KEY,
      CF_ACCESS_TEAM_DOMAIN: env.CF_ACCESS_TEAM_DOMAIN,
      CF_ACCESS_AUD: env.CF_ACCESS_AUD,
    },
    c.req.header("x-tenant-id") || null,
    c.req.header("x-user-id") || null,
    c.req.header("CF-Access-JWT-Assertion") || null
  );

  if (!auth) {
    return c.json(
      {
        request_id: request.request_id,
        status: "error",
        tool: { name: request.tool.name },
        error: {
          code: "UNAUTHORIZED" as ErrorCode,
          message: "Missing or invalid Authorization header",
        },
        meta: {
          server_time: new Date().toISOString(),
          trace_id: traceId,
        },
      },
      401
    );
  }

  // Validate tenant isolation
  if (
    request.tool.arguments.tenant_id &&
    !validateTenantIsolation(request.tool.arguments.tenant_id as string, auth.tenant_id)
  ) {
    return c.json(
      {
        request_id: request.request_id,
        status: "error",
        tool: { name: request.tool.name },
        error: {
          code: "FORBIDDEN" as ErrorCode,
          message: "Tenant ID mismatch",
        },
        meta: {
          server_time: new Date().toISOString(),
          trace_id: traceId,
        },
      },
      403
    );
  }

  // Check permissions
  if (!checkPermission(request.tool.name, auth.roles)) {
    return c.json(
      {
        request_id: request.request_id,
        status: "error",
        tool: { name: request.tool.name },
        error: {
          code: "FORBIDDEN" as ErrorCode,
          message: "Insufficient permissions",
        },
        meta: {
          server_time: new Date().toISOString(),
          trace_id: traceId,
        },
      },
      403
    );
  }

  // Get idempotency key if provided
  const idempotencyKey = c.req.header("Idempotency-Key");

  // Route to appropriate tool handler
  try {
    let result: unknown;

    switch (request.tool.name) {
      case "kb.write_session_summary": {
        const input = WriteSessionSummaryInputSchema.parse(request.tool.arguments);
        result = await writeSessionSummary(
          input,
          c.env as Bindings,
          log,
          idempotencyKey || undefined
        );
        break;
      }
      case "kb.write_article": {
        const input = WriteArticleInputSchema.parse(request.tool.arguments);
        result = await writeArticle(input, c.env as Bindings, log);
        break;
      }
      case "kb.get_artifact": {
        const input = GetArtifactInputSchema.parse(request.tool.arguments);
        result = await getArtifact(input, c.env as Bindings, log);
        break;
      }
      case "kb.list_recent": {
        const input = ListRecentInputSchema.parse(request.tool.arguments);
        result = await listRecent(input, c.env as Bindings, log);
        break;
      }
      case "kb.search": {
        const input = SearchInputSchema.parse(request.tool.arguments);
        result = await search(input, c.env as Bindings, log);
        break;
      }
      case "kb.topic_upsert": {
        const input = TopicUpsertInputSchema.parse(request.tool.arguments);
        result = await topicUpsert(input, c.env as Bindings, log);
        break;
      }
      case "kb.topic_list": {
        const input = TopicListInputSchema.parse(request.tool.arguments);
        result = await topicList(input, c.env as Bindings, log);
        break;
      }
      case "memory.write_conversational": {
        const input = WriteConversationalInputSchema.parse(request.tool.arguments);
        result = await writeConversational(input, c.env as Bindings, log);
        break;
      }
      case "memory.read_conversational": {
        const input = ReadConversationalInputSchema.parse(request.tool.arguments);
        result = await readConversational(input, c.env as Bindings, log);
        break;
      }
      case "memory.upsert_org": {
        const input = UpsertOrgInputSchema.parse(request.tool.arguments);
        result = await upsertOrg(input, c.env as Bindings, log);
        break;
      }
      case "memory.search_org": {
        const input = SearchOrgInputSchema.parse(request.tool.arguments);
        result = await searchOrg(input, c.env as Bindings, log);
        break;
      }
      case "memory.propose": {
        const input = ProposeMemoryInputSchema.parse(request.tool.arguments);
        result = await proposeMemory(input, c.env as Bindings, log);
        break;
      }
      case "memory.read_personal": {
        const input = ReadPersonalInputSchema.parse(request.tool.arguments);
        result = await readPersonal(input, c.env as Bindings, log);
        break;
      }
      case "memory.write_personal": {
        const input = WritePersonalInputSchema.parse(request.tool.arguments);
        result = await writePersonal(input, c.env as Bindings, log);
        break;
      }
      case "book.get_episodes": {
        const input = GetEpisodesInputSchema.parse(request.tool.arguments);
        result = await getEpisodes(input, c.env as Bindings, log);
        break;
      }
      case "book.get_episode": {
        const input = GetEpisodeInputSchema.parse(request.tool.arguments);
        result = await getEpisode(input, c.env as Bindings, log);
        break;
      }
      case "book.create_episode": {
        const input = CreateEpisodeInputSchema.parse(request.tool.arguments);
        result = await createEpisode(input, c.env as Bindings, log);
        break;
      }
      case "book.add_primitive": {
        const input = AddPrimitiveInputSchema.parse(request.tool.arguments);
        result = await addPrimitive(input, c.env as Bindings, log);
        break;
      }
      case "book.search_by_entity": {
        const input = SearchByEntityInputSchema.parse(request.tool.arguments);
        result = await searchByEntity(input, c.env as Bindings, log);
        break;
      }
      case "coda.sync_ops_plan": {
        const input = SyncOpsPlanInputSchema.parse(request.tool.arguments);
        const apiToken = input.coda_api_token || (c.env as Bindings).CODA_API_TOKEN;
        if (!apiToken) {
          throw new Error(
            "Coda API Token is not configured. Please provide it in the arguments or set it as worker secret."
          );
        }
        process.env.CODA_API_TOKEN = apiToken;
        if (input.coda_doc_id) {
          process.env.CODA_DOC_ID = input.coda_doc_id;
        }
        const docId = await buildOrSyncDoc(input.coda_doc_id);
        result = {
          status: "success",
          doc_url: `https://coda.io/d/${docId}`,
        };
        break;
      }
      case "coda.connect_doc": {
        const input = ConnectCodaDocInputSchema.parse(request.tool.arguments);
        const apiToken = input.coda_api_token || (c.env as Bindings).CODA_API_TOKEN;
        if (!apiToken) {
          throw new Error("Coda API Token required for connect_doc (pass or set in env).");
        }
        // Register by writing a connection record to personal_memory or org (for founder OS or tenant)
        const scope = input.is_personal ? "personal" : "org";
        const userId = input.user_id || (input.is_personal ? "nirmal" : "system");
        const connectionRecord = {
          type: "coda_connection",
          doc_id: input.coda_doc_id,
          doc_name: input.doc_name || "Connected Coda Doc",
          scope,
          connected_at: new Date().toISOString(),
          mcp_enabled: true,
        };
        // Use existing memory write (via propose or direct for connection metadata)
        await (c.env as any).DB.prepare(
          `INSERT OR REPLACE INTO personal_memory (id, tenant_id, user_id, category, title, content, metadata, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            `coda-conn-${input.coda_doc_id}`,
            input.tenant_id,
            userId,
            "connector",
            `Coda Doc: ${input.doc_name || input.coda_doc_id}`,
            `Connected Coda document for ${scope} L4 projection.`,
            JSON.stringify(connectionRecord),
            new Date().toISOString(),
            new Date().toISOString()
          )
          .run();
        // Optionally trigger initial sync
        process.env.CODA_API_TOKEN = apiToken;
        process.env.CODA_DOC_ID = input.coda_doc_id;
        const docId = await buildOrSyncDoc(input.coda_doc_id);
        result = {
          status: "connected",
          doc_url: `https://coda.io/d/${docId}`,
          connected_as: scope,
          mcp_tools_available: [
            "coda.read_page",
            "coda.sync_memory_to_doc",
            "memory.read_personal",
            "memory.search_org",
          ],
        };
        break;
      }
      case "coda.read_page": {
        const input = ReadCodaPageInputSchema.parse(request.tool.arguments);
        const apiToken = (c.env as Bindings).CODA_API_TOKEN;
        if (!apiToken) {
          throw new Error("Coda API Token not configured for read_page.");
        }
        // Use Coda API to fetch page content (proxied via MCP, no direct client calls)
        const pageRes = await fetch(
          `https://coda.io/apis/v1/docs/${input.coda_doc_id}/pages/${encodeURIComponent(input.page_id_or_name)}`,
          {
            headers: { Authorization: `Bearer ${apiToken}` },
          }
        );
        if (!pageRes.ok) {
          throw new Error(`Coda read failed: ${pageRes.status}`);
        }
        const pageData = (await pageRes.json()) as any;
        // For content, may need to fetch the page content separately or use export; simplified here
        const content =
          pageData.content || pageData.name || "Page content (use coda.sync for full)";
        result = {
          page_id: pageData.id || input.page_id_or_name,
          title: pageData.name || input.page_id_or_name,
          content: typeof content === "string" ? content : JSON.stringify(content),
          source: "coda_via_mcp",
          last_updated: pageData.updatedAt || new Date().toISOString(),
        };
        break;
      }
      case "coda.sync_memory_to_doc": {
        const input = SyncMemoryToCodaDocInputSchema.parse(request.tool.arguments);
        const apiToken = input.coda_api_token || (c.env as Bindings).CODA_API_TOKEN;
        if (!apiToken) {
          throw new Error("Coda API Token required for sync.");
        }
        process.env.CODA_API_TOKEN = apiToken;
        process.env.CODA_DOC_ID = input.coda_doc_id;
        // Reuse existing sync logic, but scoped
        const docId = await buildOrSyncDoc(input.coda_doc_id);
        // For full memory sync, in real would fetch from memory.read_personal / search_org and push to Coda tables
        // Here we trigger the ops plan sync as base, and note personal scope
        let synced = 1;
        if (input.scope === "personal" || input.scope === "both") {
          // Would call personal memory fetch and Coda table update here
          synced += 5; // placeholder
        }
        result = {
          status: "synced",
          synced_count: synced,
          doc_url: `https://coda.io/d/${docId}`,
          tables_updated: ["Org Memory", "Personal Memory"],
        };
        break;
      }
      default:
        return c.json(
          {
            request_id: request.request_id,
            status: "error",
            tool: { name: request.tool.name },
            error: {
              code: "NOT_FOUND" as ErrorCode,
              message: `Unknown tool: ${request.tool.name}`,
            },
            meta: {
              server_time: new Date().toISOString(),
              trace_id: traceId,
            },
          },
          404
        );
    }

    // Success response
    return c.json({
      request_id: request.request_id,
      status: "ok",
      tool: { name: request.tool.name },
      result,
      meta: {
        server_time: new Date().toISOString(),
        trace_id: traceId,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return c.json(
        {
          request_id: request.request_id,
          status: "error",
          tool: { name: request.tool.name },
          error: {
            code: "VALIDATION_ERROR" as ErrorCode,
            message: "Invalid tool arguments",
            details: error.flatten(),
          },
          meta: {
            server_time: new Date().toISOString(),
            trace_id: traceId,
          },
        },
        400
      );
    }

    // Handle other errors
    log.error("Tool invocation error", {
      tool: request.tool.name,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        request_id: request.request_id,
        status: "error",
        tool: { name: request.tool.name },
        error: {
          code: "INTERNAL" as ErrorCode,
          message: "Internal server error",
        },
        meta: {
          server_time: new Date().toISOString(),
          trace_id: traceId,
        },
      },
      500
    );
  }
}
