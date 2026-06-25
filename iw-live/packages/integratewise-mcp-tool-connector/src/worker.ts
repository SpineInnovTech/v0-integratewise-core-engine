import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

/**
 * CLOUDFLARE WORKER HANDLER
 * Exports a fetch handler that routes to the MCP Server
 */
export default {
  async fetch(request: Request, env: any) {
    const sql = neon(env.DATABASE_URL);

    const mcpServer = new Server(
      {
        name: "integratewise-gateway",
        version: "1.0.0",
      },
      {
        capabilities: { tools: {} },
      }
    );

    const TOOLS: Tool[] = [
      {
        name: "get_account_intelligence",
        description: "Retrieve comprehensive intelligence for a specific account.",
        inputSchema: {
          type: "object",
          properties: {
            account_name: { type: "string" },
          },
          required: ["account_name"],
        },
      },
      {
        name: "get_account_strategy",
        description: "Retrieve strategic objectives linked to an account.",
        inputSchema: {
          type: "object",
          properties: {
            account_name: { type: "string" },
          },
          required: ["account_name"],
        },
      },
      {
        name: "end_ai_session",
        description: "Save session summary and metadata to long-term memory.",
        inputSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            intent: { type: "string" },
            sentiment: { type: "number" },
            topics: { type: "array", items: { type: "string" } },
            suggested_actions: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "intent"],
        },
      },
      {
        name: "record_knowledge",
        description: "Store documents or snippets into the knowledge base.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
            content_type: {
              type: "string",
              enum: ["strategy", "technical", "personal", "financial"],
            },
          },
          required: ["content", "content_type"],
        },
      },
    ];

    mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

    mcpServer.setRequestHandler(CallToolRequestSchema, async (req) => {
      const { name, arguments: args } = req.params;

      if (name === "get_account_intelligence") {
        const { account_name } = z.object({ account_name: z.string() }).parse(args);
        const results = await sql`
                    SELECT * FROM accounts_core
                    WHERE name ILIKE ${"%" + account_name + "%"}
                    LIMIT 1
                `;
        const data = results[0];

        return {
          content: [
            { type: "text", text: JSON.stringify(data || { error: "Not found" }, null, 2) },
          ],
        };
      }

      if (name === "get_account_strategy") {
        const { account_name } = z.object({ account_name: z.string() }).parse(args);

        const results = await sql`
                    SELECT 
                        a.id AS account_id,
                        a.name AS account_name,
                        a.industry,
                        s.id AS objective_id,
                        s.objective_name,
                        s.status,
                        s.target_date
                    FROM accounts_core a
                    LEFT JOIN strategic_objectives s ON a.id = s.account_id
                    WHERE a.name ILIKE ${"%" + account_name + "%"}
                `;

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      if (name === "end_ai_session") {
        const { summary, intent, sentiment, topics, suggested_actions } = z
          .object({
            summary: z.string(),
            intent: z.string(),
            sentiment: z.number().optional(),
            topics: z.array(z.string()).optional(),
            suggested_actions: z.array(z.string()).optional(),
          })
          .parse(args);

        const results = await sql`
                    INSERT INTO ai_sessions_core 
                    (provider, summary, intent, sentiment, topics, metadata)
                    VALUES (
                        'external_agent', ${summary}, ${intent}, ${sentiment || 0}, ${topics || []}, 
                        ${JSON.stringify({ suggested_actions })}
                    )
                    RETURNING *
                `;
        const data = results[0];

        return { content: [{ type: "text", text: `Session ${data?.id} saved.` }] };
      }

      if (name === "record_knowledge") {
        const { content, content_type } = z
          .object({
            content: z.string(),
            content_type: z.string(),
          })
          .parse(args);

        const results = await sql`
                    INSERT INTO knowledge_records (source_system, content_type, raw_content)
                    VALUES ('mcp_gateway', ${content_type}, ${content})
                    RETURNING *
                `;
        const data = results[0];

        return { content: [{ type: "text", text: `Knowledge recorded: ${data?.id}` }] };
      }

      throw new Error("Tool not found");
    });

    // Handle MCP-over-HTTP (SSE or JSON-RPC)
    // Simplified routing: accept POST with JSON-RPC-like body and dispatch to tool handlers
    if (request.method === "POST") {
      const jsonRpcRequest = (await request.json()) as {
        method?: string;
        params?: { name?: string; arguments?: Record<string, unknown> };
      };
      const params = jsonRpcRequest?.params;
      const name = params?.name;
      const args = params?.arguments ?? {};
      if (name && (jsonRpcRequest?.method === "tools/call" || !jsonRpcRequest?.method)) {
        const handler = (
          mcpServer as unknown as {
            _handlers?: Map<unknown, (req: unknown, env: unknown) => Promise<unknown>>;
          }
        )._handlers;
        const callToolHandler = handler?.get?.("tools/call");
        const result = callToolHandler
          ? await (
              callToolHandler as (
                req: { params: { name: string; arguments?: Record<string, unknown> } },
                env: unknown
              ) => Promise<unknown>
            )({ params: { name, arguments: args } }, env)
          : {
              content: [{ type: "text" as const, text: "Tool dispatch not available" }],
              isError: true,
            };
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Missing method or params.name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("IntegrateWise MCP Gateway Active", { status: 200 });
  },
};
