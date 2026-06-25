import type { Env } from "../types";

export interface SearchHit {
  id: string;
  text: string;
  score: number;
  source: "knowledge" | "conversational_cache" | "mcp";
  transport: "binding" | "service";
}

/** Queries the live KNOWLEDGE service binding for institutional knowledge and memories. */
export async function aiSearch(env: Env, query: string, limit = 8): Promise<SearchHit[]> {
  if (!env.KNOWLEDGE) return [];

  try {
    const res = await env.KNOWLEDGE.fetch("http://internal/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) {
      console.warn(`[AI Search] Knowledge search returned status ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      results?: Array<{ id: string; snippet: string; score: number }>;
    };

    return (data.results || []).map((r) => ({
      id: r.id,
      text: r.snippet || "",
      score: r.score || 0.5,
      source: "knowledge" as const,
      transport: "binding" as const,
    }));
  } catch (err: any) {
    console.error("[AI Search] Search fetch failed:", err.message);
    return [];
  }
}

/** Queries local CACHE KV for conversational turns. */
export async function conversationalSearch(
  env: Env,
  tenantId: string,
  query: string,
  limit = 6
): Promise<SearchHit[]> {
  if (!env.CACHE) return [];

  const results: SearchHit[] = [];
  const list = await env.CACHE.list({ prefix: `search:${tenantId}:` });
  const q = query.toLowerCase();

  for (const key of list.keys) {
    const raw = await env.CACHE.get(key.name);
    if (!raw) continue;
    try {
      const { text, meta } = JSON.parse(raw) as {
        text: string;
        meta: { triage_id: string; episode_id: string };
      };
      const lower = text.toLowerCase();
      if (lower.includes(q)) {
        const idx = lower.indexOf(q);
        results.push({
          id: meta.triage_id || meta.episode_id,
          text: text.slice(Math.max(0, idx - 40), idx + 120),
          score: 0.85,
          source: "conversational_cache" as const,
          transport: "binding" as const,
        });
        if (results.length >= limit) break;
      }
    } catch {
      // Ignore invalid JSON format
    }
  }

  return results;
}

export function contextFromHits(hits: SearchHit[]): string {
  if (!hits.length) return "";
  return hits.map((h) => `[${h.source}] ${h.text}`).join("\n---\n");
}
