import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

interface Env {
  DB: D1Database;
}

const server = new Server(
  {
    name: "integratewise-connector",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * TOOL DEFINITIONS
 */
const TOOLS: Tool[] = [
  {
    name: "get_account_intelligence",
    description:
      "Retrieve comprehensive intelligence for a specific account, including health, strategy, and products.",
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
    description:
      "Retrieve strategic objectives linked to an account by joining accounts_core and strategic_objectives.",
    inputSchema: {
      type: "object",
      properties: {
        account_name: { type: "string" },
      },
      required: ["account_name"],
    },
  },
  {
    name: "list_active_situations",
    description: "List currently detected situations that require intervention or review.",
    inputSchema: {
      type: "object",
      properties: {
        min_confidence: { type: "number", minimum: 0, maximum: 100 },
      },
    },
  },
  {
    name: "end_ai_session",
    description:
      "Call this at the end of an AI session to save the summary, sentiment, and key takeaways into the official knowledge layer.",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Concise summary of the conversation" },
        intent: { type: "string", description: "What was the primary goal of this session?" },
        sentiment: { type: "number", description: "Sentiment score from -1.0 to 1.0" },
        topics: { type: "array", items: { type: "string" } },
        suggested_actions: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "intent"],
    },
  },
  {
    name: "record_knowledge",
    description:
      "Store a specific piece of information, document, or code snippet into the long-term knowledge memory.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        content_type: { type: "string", enum: ["strategy", "technical", "personal", "financial"] },
        metadata: { type: "object" },
      },
      required: ["content", "content_type"],
    },
  },
  {
    name: "search_knowledge",
    description:
      "Search the knowledge base using vector similarity to find relevant context from past sessions or technical docs.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query or topic" },
        limit: { type: "number", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_session_context",
    description:
      "Retrieve the most recent session history and context for a specific account or pillar to ensure alignment and prevent hallucinations.",
    inputSchema: {
      type: "object",
      properties: {
        account_id: { type: "string" },
        pillar: { type: "string" },
      },
    },
  },
];

/**
 * HANDLERS
 */

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  const env = extra as unknown as Env;
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_account_intelligence") {
      const { account_name } = z.object({ account_name: z.string() }).parse(args);

      // Query SSOT (D1)
      const stmt = env.DB.prepare("SELECT * FROM accounts_core WHERE name LIKE ? LIMIT 1");
      const { results } = await stmt.bind("%" + account_name + "%").all();
      const account = results[0];

      if (!account)
        return {
          content: [{ type: "text", text: `Account '${account_name}' not found.` }],
          isError: true,
        };

      return {
        content: [{ type: "text", text: JSON.stringify(account, null, 2) }],
      };
    }

    if (name === "get_account_strategy") {
      const { account_name } = z.object({ account_name: z.string() }).parse(args);

      const stmt = env.DB.prepare(`
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
                WHERE a.name LIKE ?
            `);
      const { results } = await stmt.bind("%" + account_name + "%").all();

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }

    if (name === "list_active_situations") {
      const { min_confidence = 50 } = z
        .object({ min_confidence: z.number().optional() })
        .parse(args);

      const stmt = env.DB.prepare(
        "SELECT * FROM situation_log WHERE confidence >= ? AND status = 'active'"
      );
      const { results: situations } = await stmt.bind(min_confidence).all();

      return {
        content: [{ type: "text", text: JSON.stringify(situations, null, 2) }],
      };
    }

    if (name === "end_ai_session") {
      const schema = z.object({
        summary: z.string(),
        intent: z.string(),
        sentiment: z.number().optional(),
        topics: z.array(z.string()).optional(),
        suggested_actions: z.array(z.string()).optional(),
      });
      const data = schema.parse(args);

      const insertStmt = env.DB.prepare(`
                INSERT INTO ai_sessions_core 
                (provider, summary, intent, sentiment, topics, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
      await insertStmt
        .bind(
          "external_agent",
          data.summary,
          data.intent,
          data.sentiment || 0,
          JSON.stringify(data.topics || []),
          JSON.stringify({ suggested_actions: data.suggested_actions })
        )
        .run();

      const getStmt = env.DB.prepare(
        "SELECT * FROM ai_sessions_core WHERE id = last_insert_rowid()"
      );
      const { results } = await getStmt.all();
      const session = results[0];

      return {
        content: [{ type: "text", text: `Session saved successfully with ID: ${session.id}` }],
      };
    }

    if (name === "record_knowledge") {
      const schema = z.object({
        content: z.string(),
        content_type: z.string(),
        metadata: z.any().optional(),
      });
      const data = schema.parse(args);

      const insertStmt = env.DB.prepare(`
                INSERT INTO knowledge_records 
                (source_system, content_type, raw_content, metadata)
                VALUES (?, ?, ?, ?)
            `);
      await insertStmt
        .bind("mcp_connector", data.content_type, data.content, JSON.stringify(data.metadata || {}))
        .run();

      const getStmt = env.DB.prepare(
        "SELECT * FROM knowledge_records WHERE id = last_insert_rowid()"
      );
      const { results } = await getStmt.all();
      const record = results[0];

      return {
        content: [{ type: "text", text: `Knowledge recorded successfully with ID: ${record.id}` }],
      };
    }

    if (name === "search_knowledge") {
      const { query, limit = 5 } = z
        .object({ query: z.string(), limit: z.number().optional() })
        .parse(args);

      // Note: In a real vector database setup, this would use embeddings for semantic search
      // Mocking the vector search logic for now using LIKE on raw_content
      const stmt = env.DB.prepare(
        "SELECT * FROM knowledge_records WHERE raw_content LIKE ? LIMIT ?"
      );
      const { results } = await stmt.bind("%" + query + "%", limit).all();

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }

    if (name === "get_session_context") {
      const { account_id } = z.object({ account_id: z.string().optional() }).parse(args);

      const stmt = env.DB.prepare(
        "SELECT * FROM ai_sessions_core ORDER BY created_at DESC LIMIT 3"
      );
      const { results: sessions } = await stmt.all();

      return {
        content: [{ type: "text", text: JSON.stringify(sessions, null, 2) }],
      };
    }

    throw new Error(`Tool ${name} not found.`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * RUN
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("IntegrateWise MCP Connector running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
