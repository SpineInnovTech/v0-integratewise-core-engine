import type { Env, EcosystemCallParams } from "../types";
import { gatewayChat } from "./ai-gateway";
import { aiSearch, conversationalSearch, contextFromHits } from "./ai-search";
import { emitTriageInput } from "./memory-pipeline";
import { mcpSearch, mcpToolCall } from "./mcp";
import { spineHealth, spineReadMemory, spineReadEngineering } from "./spine";
import type { EngineeringProjection } from "./spine";

// Engineering-intent detector: when the user asks about engineering activity, the
// Twin grounds its answer in the SPINE Engineering projection (build_data) — never
// the GitHub API. This is the consumption path for spineReadEngineering.
const ENGINEERING_HINTS =
  /\b(engineering|repos?|repositor\w*|pull request|prs?\b|commits?|merge[ds]?|deploys?|deployment|blocked|sprint|github|codebase|shipp?(ed|ing)?|pipeline)\b/i;

function formatEngineering(e: EngineeringProjection): string {
  const repos = e.activeRepositories
    .map((r: any) => r.name)
    .filter(Boolean)
    .slice(0, 8)
    .join(", ");
  const prs = e.openPullRequests
    .map((p: any) => `${p.name}${p.author ? ` (@${p.author}, ${p.status})` : ""}`)
    .slice(0, 8)
    .join("; ");
  const blocked = e.blockedWork
    .map((b: any) => `${b.name}${b.assignee ? ` (@${b.assignee})` : ""}`)
    .slice(0, 8)
    .join("; ");
  const commits = e.recentCommits
    .map((c: any) => c.name)
    .filter(Boolean)
    .slice(0, 8)
    .join("; ");
  return [
    `Engineering projection (from SPINE build_data — not a live tool query):`,
    `- Active repositories (${e.counts.repositories}): ${repos || "none"}`,
    `- Open pull requests (${e.counts.openPRs}): ${prs || "none"}`,
    `- Recent commits (${e.counts.commits}): ${commits || "none"}`,
    `- Blocked work (${e.counts.blocked}): ${blocked || "none"}`,
  ].join("\n");
}

export async function retrieveContext(env: Env, tenantId: string, query: string) {
  const [aiHits, convHits, mcpHits] = await Promise.all([
    aiSearch(env, query, 6).catch(() => []),
    conversationalSearch(env, tenantId, query, 4).catch(() => []),
    mcpSearch(env, tenantId, query, 4).catch(() => []),
  ]);

  const all = [...convHits, ...aiHits, ...mcpHits];
  let context = contextFromHits(all);
  let engineeringIncluded = false;

  // Engineering questions ("what changed in engineering this week?") are grounded
  // in the SPINE Engineering projection, read D1-direct from build_data.
  if (ENGINEERING_HINTS.test(query)) {
    try {
      const eng = await spineReadEngineering(env, tenantId);
      const hasData =
        eng.counts.repositories + eng.counts.openPRs + eng.counts.commits + eng.counts.blocked > 0;
      if (hasData) {
        context = context ? `${context}\n\n${formatEngineering(eng)}` : formatEngineering(eng);
        engineeringIncluded = true;
      }
    } catch {
      /* engineering projection unavailable — fall back to search context */
    }
  }

  return {
    hits: all,
    context,
    count: all.length + (engineeringIncluded ? 1 : 0),
    transports: {
      ai_search: env.KNOWLEDGE ? "KNOWLEDGE service binding" : "unavailable",
      conversational: env.CACHE ? "CACHE KV binding" : "unavailable",
      mcp: env.CONNECTOR ? "CONNECTOR service binding" : "unavailable",
      engineering: engineeringIncluded ? "SPINE build_data (D1-direct)" : "not-requested",
    },
  };
}

export async function ecosystemCall(env: Env, call: EcosystemCallParams): Promise<unknown> {
  const tenantId = call.tenant_id || env.DEFAULT_TENANT_ID;

  switch (call.target) {
    case "intelligence":
    case "ai-gateway":
      return gatewayChat(
        env,
        (call.params?.messages as Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }>) || [],
        call.params?.model as string
      );
    case "continuity":
    case "memory-pipeline": {
      const logParams = {
        session_id: String(call.params?.session_id || ""),
        agent_id: String(call.params?.agent_id || "twin-agent"),
        content: String(call.params?.content || ""),
        kind: (call.params?.kind as any) || "ai_chat",
      };
      return emitTriageInput(env, tenantId, logParams, Boolean(call.params?.sync));
    }
    case "mcp":
    case "connector":
      return mcpToolCall(env, tenantId, call.action || "", { ...(call.params || {}) });
    case "spine":
    case "pipeline":
      if (call.action === "health") return spineHealth(env);
      if (call.action === "read_memory")
        return spineReadMemory(env, tenantId, Number(call.params?.limit || 10));
      if (call.action === "read_engineering") return spineReadEngineering(env, tenantId);
      throw new Error(`Unknown spine action: ${call.action}`);
    case "ai-search":
      return retrieveContext(env, tenantId, String(call.params?.query || ""));
    default:
      throw new Error(`Unknown ecosystem target: ${call.target}`);
  }
}

export { gatewayChat, emitTriageInput, mcpToolCall };
