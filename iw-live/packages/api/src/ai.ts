import { Env, Entity, Metric, CommandResult, EntityType } from "./types";
import * as db from "./db";

interface ParsedIntent {
  action: "create" | "list" | "update" | "delete" | "search" | "metrics" | "unknown";
  entityType?: EntityType;
  filters?: Record<string, string>;
  data?: Record<string, unknown>;
  query?: string;
}

// Simple intent parser - can be enhanced with actual AI
function parseIntent(input: string): ParsedIntent {
  const normalized = input.toLowerCase().trim();

  // Create patterns
  if (normalized.match(/^(create|add|new)\s+(project|task|customer|document|note)/)) {
    const match = normalized.match(/^(create|add|new)\s+(\w+)\s*:?\s*(.*)$/);
    if (match) {
      return {
        action: "create",
        entityType: match[2] as EntityType,
        data: { title: match[3] || "Untitled" },
      };
    }
  }

  // List patterns
  if (
    normalized.match(/^(show|list|get)\s+(all\s+)?(projects?|tasks?|customers?|opportunities?)/)
  ) {
    const match = normalized.match(/^(show|list|get)\s+(all\s+)?(\w+)/);
    if (match) {
      let type = match[3].replace(/s$/, ""); // Remove trailing 's'
      if (type === "opportunitie") type = "opportunity";
      return {
        action: "list",
        entityType: type as EntityType,
      };
    }
  }

  // Metrics patterns
  if (normalized.match(/^(show|get|what'?s?)\s+(the\s+)?(mrr|burn|runway|metrics|kpis?)/)) {
    return { action: "metrics", query: normalized };
  }

  if (normalized.match(/(weekly|monthly|daily)\s+(mrr|burn|metrics)/)) {
    return { action: "metrics", query: normalized };
  }

  // Search patterns
  if (normalized.match(/^(search|find|look for)\s+/)) {
    const query = normalized.replace(/^(search|find|look for)\s+/, "");
    return { action: "search", query };
  }

  // Update patterns
  if (normalized.match(/^(update|mark|set|complete)\s+/)) {
    return { action: "update", query: normalized };
  }

  // Pull/sync patterns (for integrations)
  if (normalized.match(/^(pull|sync|fetch)\s+(latest\s+)?(opportunities?|sfdc|salesforce)/)) {
    return { action: "list", entityType: "opportunity", filters: { source: "salesforce" } };
  }

  // Index docs
  if (normalized.match(/^(index|sync)\s+(docs?|documents?)/)) {
    return { action: "list", entityType: "document" };
  }

  return { action: "unknown", query: normalized };
}

export async function processCommand(env: Env, input: string): Promise<CommandResult> {
  const intent = parseIntent(input);

  try {
    switch (intent.action) {
      case "create": {
        if (!intent.entityType || !intent.data) {
          return {
            intent: "create",
            message: 'Could not determine what to create. Try: "Create project: My Project Name"',
          };
        }
        const entity = await db.createEntity(env.DB, {
          type: intent.entityType,
          title: intent.data.title as string,
          status: "active",
          priority: "medium",
        });
        await db.logActivity(env.DB, {
          entity_id: entity.id,
          action: "created",
          details: { via: "ai_command", input },
        });
        return {
          intent: "create",
          action: "created",
          entities: [entity],
          message: `Created ${intent.entityType}: "${entity.title}"`,
        };
      }

      case "list": {
        const entities = await db.listEntities(env.DB, {
          type: intent.entityType,
          ...intent.filters,
        });
        return {
          intent: "list",
          entities,
          message: `Found ${entities.length} ${intent.entityType || "items"}`,
        };
      }

      case "search": {
        if (!intent.query) {
          return { intent: "search", message: "Please provide a search query" };
        }
        const entities = await db.searchEntities(env.DB, intent.query);
        return {
          intent: "search",
          entities,
          message: `Found ${entities.length} results for "${intent.query}"`,
        };
      }

      case "metrics": {
        const category = intent.query?.includes("finance")
          ? "finance"
          : intent.query?.includes("sales")
            ? "sales"
            : intent.query?.includes("marketing")
              ? "marketing"
              : intent.query?.includes("team")
                ? "team"
                : undefined;

        const metrics = await db.getLatestMetrics(env.DB, category);
        const metricList = Object.entries(metrics).map(([key, value]) => ({
          id: key,
          key,
          value,
          category: category || "general",
          created_at: new Date().toISOString(),
        }));

        return {
          intent: "metrics",
          metrics: metricList,
          data: metrics,
          message: `Current metrics: ${
            Object.entries(metrics)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ") || "No metrics found"
          }`,
        };
      }

      case "unknown":
      default:
        // Could integrate with Claude API here for more complex commands
        const suggestions = [
          'Try: "Create project: My Project"',
          'Try: "Show all tasks"',
          'Try: "Search customer revenue"',
          'Try: "Show metrics"',
        ];
        return {
          intent: "unknown",
          message: `I didn't understand that command. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`,
        };
    }
  } catch (error) {
    console.error("Command processing error:", error);
    return {
      intent: intent.action,
      message: `Error processing command: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Advanced AI processing via OpenRouter (centralized API key management)
export async function processWithClaude(
  env: Env,
  input: string,
  context?: { entities?: Entity[]; metrics?: Record<string, number> }
): Promise<CommandResult> {
  // Use OpenRouter as the centralized AI provider (key from master.env)
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not configured, falling back to simple parser");
    return processCommand(env, input);
  }

  try {
    const systemPrompt = `You are an AI assistant for IntegrateWise Hub Controller. You help users manage their business operations through natural language commands.

Available actions:
- create: Create new entities (projects, tasks, customers, documents, notes)
- list: List entities with optional filters
- update: Update existing entities
- delete: Remove entities
- search: Search across all entities
- metrics: Get KPIs and metrics

Current context:
${context ? JSON.stringify(context, null, 2) : "No context available"}

Respond with a JSON object:
{
  "action": "create|list|update|delete|search|metrics",
  "entityType": "project|task|customer|opportunity|document|note",
  "data": { ... },
  "filters": { ... },
  "message": "Human-readable response"
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://integratewise.ai",
        "X-Title": "IntegrateWise",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = result.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Execute the parsed action
      return processCommand(
        env,
        `${parsed.action} ${parsed.entityType || ""}: ${parsed.data?.title || ""}`
      );
    }

    return {
      intent: "ai_response",
      message: text,
    };
  } catch (error) {
    console.error("AI processing error:", error);
    // Fall back to simple parser
    return processCommand(env, input);
  }
}
