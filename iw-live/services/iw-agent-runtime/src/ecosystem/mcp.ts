import { isToolAllowed } from "../capability-contract";
import type { Env } from "../types";

async function mcpRpc(env: Env, tenantId: string, body: unknown): Promise<unknown> {
  if (!env.CONNECTOR) {
    throw new Error("CONNECTOR service binding is not configured");
  }

  try {
    const res = await env.CONNECTOR.fetch("http://internal/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`MCP tool invocation failed with status ${res.status}`);
    }

    const payload = (await res.json()) as {
      result?: { content?: Array<{ text?: string }>; isError?: boolean };
    };

    if (payload.result?.isError) {
      throw new Error(payload.result.content?.[0]?.text || "MCP internal error");
    }

    const text = payload.result?.content?.[0]?.text;
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error: any) {
    console.error("[MCP Client] RPC call failed:", error.message);
    throw new Error(`MCP_RPC_ERROR: ${error.message}`);
  }
}

export async function mcpToolCall(
  env: Env,
  tenantId: string,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (!isToolAllowed(name)) {
    throw new Error(`Tool blocked by capability contract: ${name}`);
  }

  return mcpRpc(env, tenantId, {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name,
      arguments: {
        tenant_id: tenantId,
        ...args,
      },
    },
  });
}

export async function mcpSearch(env: Env, tenantId: string, query: string, limit = 6) {
  const [kb, org] = await Promise.all([
    mcpToolCall(env, tenantId, "kb.search", { query, limit }).catch(() => null),
    mcpToolCall(env, tenantId, "memory.search_org", { query, limit }).catch(() => null),
  ]);

  const hits: Array<{
    id: string;
    text: string;
    score: number;
    source: "mcp";
    transport: "service";
  }> = [];

  if (kb && typeof kb === "object") {
    const kbResults = ((kb as any).results || (kb as any).items || []) as any[];
    for (const r of kbResults) {
      hits.push({
        id: r.id || "kb-result",
        text: (r.snippet || r.content || r.text || "").slice(0, 400),
        score: r.score || 0.5,
        source: "mcp",
        transport: "service" as const,
      });
    }
  }

  if (org && typeof org === "object") {
    const orgItems = ((org as any).items || []) as any[];
    for (const r of orgItems) {
      hits.push({
        id: r.id || "org-result",
        text: (r.content || r.snippet || "").slice(0, 400),
        score: 0.4,
        source: "mcp",
        transport: "service" as const,
      });
    }
  }

  return hits;
}
