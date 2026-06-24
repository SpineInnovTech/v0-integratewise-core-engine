// Embeddings are intentionally OPTIONAL. The Replit OpenAI proxy does not expose
// an embeddings API, and we refuse to silently fabricate vectors or demand a key.
// Until a real embeddings provider is wired (env EMBEDDINGS_BASE_URL +
// EMBEDDINGS_API_KEY, optional EMBEDDINGS_MODEL), embed() returns an honest
// "unavailable" result and the context-assembler degrades to lexical + salience +
// recency ranking. This mirrors the no-silent-fallback doctrine in
// intelligence-service: never guess, always declare availability.

export interface EmbeddingResult {
  vector: number[] | null;
  available: boolean;
  reason: string;
  model: string | null;
}

const BASE_URL = process.env["EMBEDDINGS_BASE_URL"];
const API_KEY = process.env["EMBEDDINGS_API_KEY"];
const MODEL = process.env["EMBEDDINGS_MODEL"] ?? "text-embedding-3-small";
const TIMEOUT_MS = 6000;

export function embeddingCapability(): { available: boolean; reason: string } {
  if (BASE_URL && API_KEY) {
    return { available: true, reason: `provider configured (${MODEL})` };
  }
  return {
    available: false,
    reason:
      "no embeddings provider configured — semantic recall degrades to lexical + salience + recency",
  };
}

export async function embed(text: string): Promise<EmbeddingResult> {
  const cap = embeddingCapability();
  if (!cap.available) {
    return { vector: null, available: false, reason: cap.reason, model: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(`${BASE_URL!.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, input: text.slice(0, 8000) }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      return {
        vector: null,
        available: false,
        reason: `embeddings provider responded ${resp.status}`,
        model: MODEL,
      };
    }
    const data = (await resp.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    const vector = data.data?.[0]?.embedding ?? null;
    if (!vector || vector.length === 0) {
      return {
        vector: null,
        available: false,
        reason: "embeddings provider returned no vector",
        model: MODEL,
      };
    }
    return { vector, available: true, reason: "ok", model: MODEL };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "embeddings provider timed out"
        : "embeddings provider unreachable";
    return { vector: null, available: false, reason, model: MODEL };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lexical fallback similarity (token overlap), 0..1. Honest and deterministic —
 * NOT a semantic embedding. Used by the assembler when vector embeddings are
 * unavailable so the "ask" box still does something useful and explainable.
 */
export function lexicalScore(query: string, text: string): number {
  const norm = (s: string): Set<string> =>
    new Set(s.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []);
  const q = norm(query);
  if (q.size === 0) return 0;
  const t = norm(text);
  let hits = 0;
  for (const tok of q) if (t.has(tok)) hits++;
  return hits / q.size;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
