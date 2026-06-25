/**
 * IntegrateWise Standard MCP Server
 *
 * Uses @modelcontextprotocol/sdk to expose tools via official MCP protocol.
 * Tool implementations are imported from the existing tool layer.
 */

import { Server } from "@modelcontextprotocol/sdk/server";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  WriteSessionSummaryInputSchema,
  WriteArticleInputSchema,
  GetArtifactInputSchema,
  ListRecentInputSchema,
  SearchInputSchema,
  TopicUpsertInputSchema,
  TopicListInputSchema,
  WriteConversationalInputSchema,
  ReadConversationalInputSchema,
  SearchOrgInputSchema,
  writeSessionSummary,
  writeArticle,
  getArtifact,
  listRecent,
  search,
  topicUpsert,
  topicList,
  writeConversational,
  readConversational,
  searchOrg,
  ProposeMemoryInputSchema,
  proposeMemory,
  type Bindings,
  type Log,
  checkPermission,
} from "./handlers/tools";
import {
  SpineEntityGetSchema,
  SpineEntityListSchema,
  SpineEntitySearchSchema,
  SignalListSchema,
  ProposalListSchema,
  ProposalApproveSchema,
  ProposalRejectSchema,
  SemanticSearchSchema,
  spineEntityGet,
  spineEntityList,
  spineEntitySearch,
  signalList,
  proposalList,
  proposalApprove,
  proposalReject,
  semanticSearch,
} from "./handlers/spine-tools";
import { hasToolScope, filterToolsByScope } from "./lib/oauth-scopes";

// ---------------------------------------------------------------------------
// MCP Tool Definitions (official schema format)
// ---------------------------------------------------------------------------

export const MCP_TOOL_DEFINITIONS: Tool[] = [
  {
    name: "kb.write_session_summary",
    description:
      "Write a session-end summary artifact into the Knowledge Bank. Idempotent by session_id.",
    inputSchema: {
      type: "object",
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
        provider: { type: "string", enum: ["chatgpt", "claude", "grok", "gemini", "other"] },
        session_id: { type: "string", minLength: 1 },
        started_at: { type: "string", format: "date-time" },
        ended_at: { type: "string", format: "date-time" },
        summary_md: { type: "string", minLength: 1 },
        topics: { type: "array", items: { type: "string", minLength: 1 }, default: [] },
        project: { type: "string" },
      },
    },
  },
  {
    name: "kb.write_article",
    description: "Create or update a Knowledge Bank article and return references.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "title", "content_md"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        article_id: { type: "string", description: "If omitted, server generates." },
        title: { type: "string", minLength: 1, maxLength: 200 },
        content_md: { type: "string", minLength: 1 },
        topics: { type: "array", items: { type: "string", minLength: 1 }, default: [] },
        visibility: { type: "string", enum: ["private", "team", "org"], default: "team" },
        tags: { type: "array", items: { type: "string", minLength: 1 }, default: [] },
      },
    },
  },
  {
    name: "kb.get_artifact",
    description: "Fetch artifact metadata and access pointers.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "artifact_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        artifact_id: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "kb.list_recent",
    description: "List recent Knowledge Bank artifacts, optionally filtered by topic or type.",
    inputSchema: {
      type: "object",
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
  },
  {
    name: "kb.search",
    description: "Search Knowledge Bank with tenant/topic/date filters.",
    inputSchema: {
      type: "object",
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
  },
  {
    name: "kb.topic_upsert",
    description: "Create or update a topic sync policy.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "topic_name", "cadence"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        topic_name: { type: "string", minLength: 1, maxLength: 120 },
        cadence: { type: "string", enum: ["weekly", "biweekly"] },
        hourly_opt_in: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "kb.topic_list",
    description: "List topics and sync policies for a tenant.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "memory.write_conversational",
    description: "Write a conversational memory event to the Supabase memory layer.",
    inputSchema: {
      type: "object",
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
  },
  {
    name: "memory.read_conversational",
    description: "Read conversational memory events by session_id or tenant_id.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        session_id: { type: "string" },
        user_id: { type: "string" },
        limit: { type: "integer", default: 50, maximum: 200 },
        offset: { type: "integer", default: 0 },
      },
    },
  },

  {
    name: "memory.search_org",
    description: "Search organizational memory entries by category, key, or content.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        category: { type: "string" },
        key: { type: "string" },
        content: { type: "string" },
        governance_state: { type: "string", enum: ["draft", "pending", "approved", "rejected"] },
        limit: { type: "integer", default: 20, maximum: 100 },
        offset: { type: "integer", default: 0 },
      },
    },
  },
  {
    name: "memory.propose",
    description:
      "Write a memory event or learning proposal to the D1 proposals table (Triage Bot queue). Does NOT write to org_memory directly.",
    inputSchema: {
      type: "object",
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
  },
  // ─── Spine-Native Tools ───────────────────────────────────────────────────
  // MCP exposes the Spine. Tools feed the Spine. These are two different directions.
  {
    name: "spine.entity.get",
    description:
      "Fetch a canonical entity from the Spine by ID and type. Returns the normalized entity with no tool identity.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "entity_type", "entity_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        entity_type: {
          type: "string",
          minLength: 1,
          description: "e.g. account, contact, deal, ticket",
        },
        entity_id: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "spine.entity.list",
    description:
      "List canonical entities of a given type from the Spine. Sorted by most recently updated.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "entity_type"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        entity_type: { type: "string", minLength: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        offset: { type: "integer", minimum: 0, default: 0 },
      },
    },
  },
  {
    name: "spine.entity.search",
    description:
      "Search canonical entities in the Spine by name or ID. Optional entity_type filter.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "q"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        q: { type: "string", minLength: 1, description: "Search query" },
        entity_type: { type: "string", description: "Optional: filter by entity type" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
    },
  },
  {
    name: "signal.list",
    description:
      "List live intelligence signals for a tenant. Signals are generated by the SignalAnalyzer from Spine changes.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        status: { type: "string", enum: ["pending_review", "approved", "all"], default: "all" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
    },
  },
  {
    name: "proposal.list",
    description:
      "List governed proposals from the D1 governance queue. Default: pending_review + approved.",
    inputSchema: {
      type: "object",
      required: ["tenant_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        status: {
          type: "string",
          description: "e.g. pending_review, approved, or comma-separated list",
        },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
    },
  },
  {
    name: "proposal.approve",
    description:
      "Approve a governed proposal. Requires HITL approval. Twin cannot execute directly.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "proposal_id"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        proposal_id: { type: "string", minLength: 1 },
        review_notes: { type: "string", description: "Optional approval notes" },
      },
    },
  },
  {
    name: "proposal.reject",
    description:
      "Reject a governed proposal. Requires reason. Rejected proposals write back to org_memory for continuity.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "proposal_id", "review_notes"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        proposal_id: { type: "string", minLength: 1 },
        review_notes: {
          type: "string",
          minLength: 1,
          description: "Required: reason for rejection",
        },
      },
    },
  },
  {
    name: "search.semantic",
    description: "Semantic search across Spine memory and knowledge. Uses pgvector embeddings.",
    inputSchema: {
      type: "object",
      required: ["tenant_id", "q"],
      properties: {
        tenant_id: { type: "string", minLength: 1 },
        q: { type: "string", minLength: 1 },
        entity_type: { type: "string", description: "Optional: restrict to entity type" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------

async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  switch (name) {
    case "kb.write_session_summary": {
      const input = WriteSessionSummaryInputSchema.parse(args);
      return writeSessionSummary(input, env, log);
    }
    case "kb.write_article": {
      const input = WriteArticleInputSchema.parse(args);
      return writeArticle(input, env, log);
    }
    case "kb.get_artifact": {
      const input = GetArtifactInputSchema.parse(args);
      return getArtifact(input, env, log);
    }
    case "kb.list_recent": {
      const input = ListRecentInputSchema.parse(args);
      return listRecent(input, env, log);
    }
    case "kb.search": {
      const input = SearchInputSchema.parse(args);
      return search(input, env, log);
    }
    case "kb.topic_upsert": {
      const input = TopicUpsertInputSchema.parse(args);
      return topicUpsert(input, env, log);
    }
    case "kb.topic_list": {
      const input = TopicListInputSchema.parse(args);
      return topicList(input, env, log);
    }
    case "memory.write_conversational": {
      const input = WriteConversationalInputSchema.parse(args);
      return writeConversational(input, env, log);
    }
    case "memory.read_conversational": {
      const input = ReadConversationalInputSchema.parse(args);
      return readConversational(input, env, log);
    }

    case "memory.search_org": {
      const input = SearchOrgInputSchema.parse(args);
      return searchOrg(input, env, log);
    }
    case "memory.propose": {
      const input = ProposeMemoryInputSchema.parse(args);
      return proposeMemory(input, env, log);
    }
    // ─── Spine-Native Dispatch ──────────────────────────────────────────────
    case "spine.entity.get": {
      const input = SpineEntityGetSchema.parse(args);
      return spineEntityGet(input, env, log);
    }
    case "spine.entity.list": {
      const input = SpineEntityListSchema.parse(args);
      return spineEntityList(input, env, log);
    }
    case "spine.entity.search": {
      const input = SpineEntitySearchSchema.parse(args);
      return spineEntitySearch(input, env, log);
    }
    case "signal.list": {
      const input = SignalListSchema.parse(args);
      return signalList(input, env, log);
    }
    case "proposal.list": {
      const input = ProposalListSchema.parse(args);
      return proposalList(input, env, log);
    }
    case "proposal.approve": {
      const input = ProposalApproveSchema.parse(args);
      return proposalApprove(input, env, log);
    }
    case "proposal.reject": {
      const input = ProposalRejectSchema.parse(args);
      return proposalReject(input, env, log);
    }
    case "search.semantic": {
      const input = SemanticSearchSchema.parse(args);
      return semanticSearch(input, env, log);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Per-request MCP Server factory
// ---------------------------------------------------------------------------

export interface McpActor {
  tenant_id: string;
  user_id: string;
  roles: string[];
  scope?: string; // OAuth scopes from the access token
}

export function createMcpServer(actor: McpActor, env: Bindings, log: Log): Server {
  const server = new Server(
    {
      name: "integratewise-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Filter tool list based on actor's OAuth scopes
    const visibleTools = filterToolsByScope(MCP_TOOL_DEFINITIONS, actor.scope);
    return { tools: visibleTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;

    // Permission check (role-based)
    if (!checkPermission(name, actor.roles)) {
      return {
        content: [
          { type: "text", text: JSON.stringify({ error: "Forbidden: insufficient permissions" }) },
        ],
        isError: true,
      };
    }

    // Scope check (OAuth scope-based)
    if (!hasToolScope(name, actor.scope)) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Forbidden: insufficient scope",
              required: "See oauth-scopes.ts for tool→scope mapping",
              granted: actor.scope || "(none)",
            }),
          },
        ],
        isError: true,
      };
    }

    // Tenant isolation
    const requestTenantId = (args as Record<string, unknown>).tenant_id;
    if (requestTenantId && requestTenantId !== actor.tenant_id) {
      return {
        content: [
          { type: "text", text: JSON.stringify({ error: "Forbidden: tenant ID mismatch" }) },
        ],
        isError: true,
      };
    }

    try {
      const result = await dispatchTool(name, args as Record<string, unknown>, env, log);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log.error("MCP tool invocation error", { tool: name, error: message });
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return server;
}
