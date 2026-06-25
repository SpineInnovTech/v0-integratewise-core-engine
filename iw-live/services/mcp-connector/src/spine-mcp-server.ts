/**
 * IntegrateWise Spine MCP Server — Production
 *
 * This is the MCP interface that Claude/ChatGPT/Perplexity connect to.
 * It reads from the encrypted Spine Vault — never raw D1 tables.
 *
 * HARD RULES:
 * - AI clients NEVER see table structure, column names, or schema shape
 * - AI clients NEVER get raw SQL access
 * - All reads go through vault decrypt → schema resolver → projection
 * - All writes go through memory.propose → governance (never direct)
 * - Unconnected tools return "connector_not_available" — no workaround
 *
 * The schema resolver controls WHAT the AI can see based on:
 * - tenant_spine_config (what entity types exist for this tenant)
 * - subscription_tier (what features are unlocked)
 * - RBAC role (what categories of memory are accessible)
 */

import { Server } from "@modelcontextprotocol/sdk/server";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Vault and crypto functions inlined to avoid cross-service imports
// (Original in services/pipeline/src/spine/vault.ts and crypto.ts)

// Placeholder: vault operations will be called via service binding to pipeline
async function vaultSearch(
  _db: any,
  _key: string,
  _tenantId: string,
  _filter: any,
  _limit: number
): Promise<any[]> {
  // TODO: Call pipeline service binding for vault reads
  return [];
}

async function vaultRead(
  _db: any,
  _key: string,
  _tenantId: string,
  _source: string,
  _sourceId: string
): Promise<any | null> {
  return null;
}

async function vaultCount(_db: any, _tenantId: string): Promise<number> {
  return 0;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SpineMcpEnv {
  CACHE_DB: D1Database;
  SPINE_ENCRYPTION_KEY: string;
  VECTORIZE: VectorizeIndex;
  CACHE: KVNamespace;
  MCP_SERVICE_SECRET: string; // Shared secret between Gateway↔MCP (CF Secrets Store)
}

interface SpineMcpActor {
  tenant_id: string;
  user_id: string;
  email: string;
  role: string;
  tier: string; // free | starter | pro | enterprise
  connected_sources: string[];
  /** Set by token validation — proves caller went through Gateway auth */
  _authenticated: boolean;
}

interface SchemaProjection {
  allowed_entity_types: string[];
  connected_connectors: string[];
  tier: string;
}

// ─── MCP Access Gate ─────────────────────────────────────────────────────────

/**
 * Issue an MCP access token (called by Gateway after auth).
 * Short-lived (15 min). Tenant-scoped. HMAC-signed.
 */
export async function issueMcpToken(
  secret: string,
  tenantId: string,
  userId: string,
  ttlMs = 15 * 60 * 1000
): Promise<string> {
  const payload = {
    tenant_id: tenantId,
    user_id: userId,
    exp: Date.now() + ttlMs,
    iat: Date.now(),
  };

  const payloadB64 = btoa(JSON.stringify(payload));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return `${payloadB64}.${sigB64}`;
}

// ─── Schema Resolver ─────────────────────────────────────────────────────────

/**
 * Resolves what the AI is ALLOWED to see for this tenant.
 * Reads from tenant_spine_config (D1) — never exposes raw config to AI.
 */
async function resolveSchema(db: D1Database, tenantId: string): Promise<SchemaProjection> {
  const config = await db
    .prepare(
      "SELECT allowed_entity_types, connected_connectors, subscription_tier FROM tenant_spine_config WHERE tenant_id = ?"
    )
    .bind(tenantId)
    .first<{
      allowed_entity_types: string;
      connected_connectors: string;
      subscription_tier: string;
    }>();

  if (!config) {
    return { allowed_entity_types: [], connected_connectors: [], tier: "free" };
  }

  return {
    allowed_entity_types: JSON.parse(config.allowed_entity_types || "[]"),
    connected_connectors: JSON.parse(config.connected_connectors || "[]"),
    tier: config.subscription_tier || "free",
  };
}

/**
 * Checks if an entity type is accessible for this tenant's schema.
 */
function isEntityTypeAllowed(schema: SchemaProjection, entityType: string): boolean {
  // Empty means no schema configured yet — allow all for enterprise
  if (schema.allowed_entity_types.length === 0 && schema.tier === "enterprise") return true;
  return schema.allowed_entity_types.includes(entityType);
}

/**
 * Checks if a data source is connected.
 */
function isSourceConnected(schema: SchemaProjection, source: string): boolean {
  if (schema.connected_connectors.length === 0 && schema.tier === "enterprise") return true;
  return schema.connected_connectors.includes(source);
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

/**
 * These are the ONLY tools an AI client can call.
 * No raw queries. No schema exposure. No direct D1 access.
 */
const SPINE_MCP_TOOLS: Tool[] = [
  {
    name: "spine.query",
    description:
      "Query the unified operational truth. Returns normalized entities across all connected tools. Source tool identity is erased — you get canonical entities only.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "entity_type"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        entity_type: {
          type: "string",
          description:
            "Canonical entity type: account, contact, deal, ticket, task, opportunity, etc.",
        },
        name_contains: { type: "string", description: "Filter by name (partial match)" },
        status: { type: "string", description: "Filter by status" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
    },
  },
  {
    name: "spine.get",
    description:
      "Get full state of a specific entity by its source identity. Returns all normalized fields.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "source", "source_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        source: { type: "string", description: "Source system (e.g. hubspot, jira, stripe)" },
        source_id: { type: "string", description: "Entity ID in the source system" },
      },
    },
  },
  {
    name: "spine.summary",
    description:
      "Get a high-level summary of what's in the Spine for this tenant. Entity counts by type, connected sources, last sync time.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "memory.search",
    description:
      "Semantic search across institutional memory. Returns decisions, patterns, commitments, learnings relevant to your query.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "query"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        query: { type: "string", minLength: 1, description: "Natural language query" },
        category: {
          type: "string",
          enum: [
            "doctrine",
            "decision",
            "workflow",
            "policy",
            "insight",
            "pattern",
            "commitment",
            "learning",
          ],
          description: "Optional: filter by memory category",
        },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
      },
    },
  },
  {
    name: "memory.propose",
    description:
      "Propose a new memory entry for governance review. Does NOT write directly — enters the Triage Bot queue for scoring and approval.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "content_type", "title", "body"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        content_type: {
          type: "string",
          enum: ["decision", "commitment", "insight", "pattern", "learning", "workflow", "policy"],
        },
        title: { type: "string", minLength: 1 },
        body: { type: "string", minLength: 1 },
        entity_refs: {
          type: "array",
          items: { type: "string" },
          description: "Related entity IDs",
        },
        confidence: { type: "number", minimum: 0, maximum: 1, default: 0.7 },
        evidence: { type: "array", items: { type: "string" }, description: "Supporting evidence" },
      },
    },
  },
  {
    name: "spine.connected_sources",
    description:
      "List which data sources are connected and available. If a source is not connected, its data is not in the Spine.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
      },
    },
  },
];

// ─── Tool Dispatch ───────────────────────────────────────────────────────────

async function dispatchSpineTool(
  name: string,
  args: Record<string, unknown>,
  env: SpineMcpEnv,
  actor: SpineMcpActor
): Promise<unknown> {
  const tenantId = (args.tenant_id as string) || actor.tenant_id;

  // Tenant isolation — hard wall
  if (tenantId !== actor.tenant_id) {
    throw new Error("Forbidden: tenant ID mismatch");
  }

  // Resolve schema projection for this tenant
  const schema = await resolveSchema(env.CACHE_DB, tenantId);

  switch (name) {
    case "spine.query": {
      const entityType = args.entity_type as string;

      // Schema check — is this entity type valid for this tenant?
      if (!isEntityTypeAllowed(schema, entityType)) {
        return {
          status: "entity_type_not_configured",
          entity_type: entityType,
          message: `Entity type "${entityType}" is not configured for your workspace. Available types: ${schema.allowed_entity_types.slice(0, 10).join(", ")}`,
        };
      }

      // Query encrypted vault
      const results = await vaultSearch(
        env.CACHE_DB,
        env.SPINE_ENCRYPTION_KEY,
        tenantId,
        {
          entity_type: entityType,
          status: args.status as string | undefined,
          name_contains: args.name_contains as string | undefined,
        },
        (args.limit as number) || 20
      );

      // Project — strip internal fields, return clean shape
      return {
        count: results.length,
        entity_type: entityType,
        entities: results.map((e) => ({
          id: e.id,
          name: e.name,
          entity_type: e.entity_type,
          health_score: e.health_score,
          health_trend: e.health_trend,
          arr: e.arr,
          tier: e.tier,
          status: e.status,
          data: e.data,
          updated_at: e.updated_at,
        })),
      };
    }

    case "spine.get": {
      const source = args.source as string;
      const sourceId = args.source_id as string;

      // Check if source is connected
      if (!isSourceConnected(schema, source)) {
        return {
          status: "connector_not_available",
          source,
          message: `"${source}" is not connected. Connect it at /connectors to make its data available in the Spine.`,
          connected_sources: schema.connected_connectors,
        };
      }

      const entity = await vaultRead(
        env.CACHE_DB,
        env.SPINE_ENCRYPTION_KEY,
        tenantId,
        source,
        sourceId
      );

      if (!entity) {
        return { found: false, source, source_id: sourceId };
      }

      return {
        found: true,
        entity: {
          id: entity.id,
          name: entity.name,
          entity_type: entity.entity_type,
          health_score: entity.health_score,
          health_trend: entity.health_trend,
          arr: entity.arr,
          tier: entity.tier,
          status: entity.status,
          data: entity.data,
          updated_at: entity.updated_at,
        },
      };
    }

    case "spine.summary": {
      const totalCount = await vaultCount(env.CACHE_DB, tenantId);

      return {
        tenant_id: tenantId,
        total_entities: totalCount,
        allowed_entity_types: schema.allowed_entity_types,
        connected_sources: schema.connected_connectors,
        subscription_tier: schema.tier,
      };
    }

    case "memory.search": {
      const query = args.query as string;
      const limit = (args.limit as number) || 5;

      // Tier gate — free users can't search memory
      if (schema.tier === "free") {
        return {
          status: "tier_restricted",
          message: "Memory search requires Starter plan or above.",
        };
      }

      // Query Vectorize for semantic search
      const embedding = await generateEmbedding(env, query);
      const vectorResults = await env.VECTORIZE.query(embedding, {
        topK: limit,
        filter: { tenant_id: tenantId },
        returnMetadata: "all",
      });

      return {
        query,
        results: vectorResults.matches.map((m) => ({
          id: m.id,
          score: m.score,
          category: (m.metadata as any)?.category,
          title: (m.metadata as any)?.title,
          entity_refs: (m.metadata as any)?.entity_refs,
          governance_state: (m.metadata as any)?.governance_state,
        })),
      };
    }

    case "memory.propose": {
      const now = new Date().toISOString();
      const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Write to proposals table (D1) — enters Triage Bot queue
      await env.CACHE_DB.prepare(
        `INSERT INTO proposals (id, tenant_id, title, body, confidence, category, evidence, state, proposed_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_review', 'mcp_agent', ?, ?)`
      )
        .bind(
          proposalId,
          tenantId,
          args.title as string,
          args.body as string,
          (args.confidence as number) || 0.7,
          args.content_type as string,
          JSON.stringify((args.evidence as string[]) || []),
          now,
          now
        )
        .run();

      return {
        status: "proposed",
        proposal_id: proposalId,
        message:
          "Submitted to governance queue. Triage Bot will score and route (auto-approve ≥0.85, HITL 0.60-0.84, reject <0.60).",
      };
    }

    case "spine.connected_sources": {
      return {
        connected: schema.connected_connectors,
        entity_types_available: schema.allowed_entity_types,
        tier: schema.tier,
        message:
          "Only data from connected sources is available in the Spine. Query any entity type listed above.",
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Embedding Helper ────────────────────────────────────────────────────────

async function generateEmbedding(_env: SpineMcpEnv, text: string): Promise<number[]> {
  // Use Cloudflare AI for embeddings (bge-base-en-v1.5 produces 768-dim,
  // but we're using 1536-dim Vectorize index — so use text-embedding-ada-002 compatible)
  // For now, generate a placeholder that can be replaced with real embedding call
  // TODO: Wire to Workers AI or OpenAI embedding endpoint
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Expand to 1536 dimensions (placeholder — replace with real embedding)
  const embedding = new Array(1536).fill(0);
  const view = new Float32Array(hash);
  for (let i = 0; i < 1536; i++) {
    embedding[i] = view[i % view.length] / 255;
  }
  return embedding;
}

// ─── Server Factory ──────────────────────────────────────────────────────────

export function createSpineMcpServer(actor: SpineMcpActor, env: SpineMcpEnv): Server {
  const server = new Server(
    { name: "integratewise-spine", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Filter tools based on tier
    let tools = [...SPINE_MCP_TOOLS];

    if (actor.tier === "free") {
      // Free tier: no memory tools
      tools = tools.filter((t) => !t.name.startsWith("memory."));
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;

    try {
      const result = await dispatchSpineTool(name, args as Record<string, unknown>, env, actor);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return server;
}
