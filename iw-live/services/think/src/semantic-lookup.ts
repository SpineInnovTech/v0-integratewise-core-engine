/**
 * Semantic Lookup (D1)
 *
 * NOTE: Cloudflare D1 does not natively support pgvector-style search.
 * This implementation provides a stub for semantic discovery on D1.
 * For production semantic search, use Cloudflare Vectorize.
 */

import type { EvidenceRef } from "./fusion";

// ============================================================================
// Types
// ============================================================================

export interface SemanticSearchResult {
  chunk_id: string;
  content: string;
  similarity_score: number;
  source_type: string;
  source_name?: string;
  entity_type?: string;
  entity_id?: string;
  chunk_type: string;
}

export interface SessionSearchResult {
  session_id: string;
  summary: string;
  similarity_score: number;
  embedding_type: string;
  session_start?: string;
  tool_names?: string[];
  entity_type?: string;
  entity_id?: string;
}

export interface SemanticLookupOptions {
  topK?: number;
  minScore?: number;
  sourceTypes?: string[];
  includeRelatedEntities?: boolean;
  correlationId?: string;
  /** §17.1: When false, exclude Knowledge UI (Flow C compounding) from session search. Default true. */
  includeKnowledgeUI?: boolean;
  /** When true, read only approved compounding memory for Flow C session search. */
  approvedOnly?: boolean;
}

export interface SemanticLookupResult {
  chunks: SemanticSearchResult[];
  sessions: SessionSearchResult[];
  evidence_refs: EvidenceRef[];
  query_embedding_time_ms?: number;
  search_time_ms?: number;
}

interface EmbeddingConfig {
  apiKey: string;
  provider?: "openai" | "openrouter";
  model?: string;
  dimensions?: number;
}

async function generateEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
  const provider = config.provider || "openai";
  const model = config.model || "text-embedding-3-small";
  const baseUrl =
    provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: text,
      model: provider === "openrouter" ? `openai/${model}` : model,
    }),
  });

  if (!response.ok) throw new Error(`Embedding error: ${await response.text()}`);
  const data = (await response.json()) as any;
  return data.data[0].embedding;
}

/**
 * Semantic Search via Knowledge Service (pgVector)
 * Falls back to D1 keyword search if Knowledge service is unavailable
 */
export async function searchChunks(
  db: D1Database,
  knowledge: Fetcher | undefined,
  tenantId: string,
  contextQuery: string,
  queryEmbedding: number[],
  options: SemanticLookupOptions = {}
): Promise<SemanticSearchResult[]> {
  // Try to use Knowledge service for vector search via pgVector
  if (knowledge) {
    try {
      const response = await knowledge.fetch("https://internal/knowledge/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-correlation-id": options.correlationId || crypto.randomUUID(),
        },
        body: JSON.stringify({
          query: contextQuery,
          query_embedding: queryEmbedding.length > 0 ? queryEmbedding : undefined,
          type: "vector",
          top_k: options.topK || 10,
          min_score: options.minScore ?? 0.5,
          source_types: options.sourceTypes,
          include_metadata: true,
        }),
      });

      if (response.ok) {
        const result = (await response.json()) as any;
        if (result.success && result.data?.chunks) {
          return result.data.chunks.map((chunk: any) => ({
            chunk_id: chunk.id || chunk.chunk_id,
            content: chunk.content,
            similarity_score: chunk.similarity_score || 0.75,
            source_type: chunk.source_type || "unknown",
            source_name: chunk.source_name,
            entity_type: chunk.entity_type,
            entity_id: chunk.entity_id,
            chunk_type: chunk.chunk_type || "text",
          }));
        }
      } else {
        console.warn(`Knowledge service error: ${response.status}`);
      }
    } catch (error) {
      console.warn("Knowledge service call failed, falling back to D1", error);
    }
  }

  // Fallback: D1 keyword search
  try {
    const results = await db
      .prepare(
        `
            SELECT id as chunk_id, content, source_type, entity_type, entity_id
            FROM document_chunks
            WHERE tenant_id = ?
            LIMIT ?
        `
      )
      .bind(tenantId, options.topK || 5)
      .all();

    return (results.results || []).map((r: any) => ({
      ...r,
      similarity_score: 0.5,
      chunk_type: "text",
    }));
  } catch (dbError) {
    console.error("D1 fallback query failed:", dbError);
    return [];
  }
}

export async function searchSessions(
  db: D1Database,
  knowledge: Fetcher | undefined,
  tenantId: string,
  contextQuery: string,
  queryEmbedding: number[],
  options: SemanticLookupOptions = {}
): Promise<SessionSearchResult[]> {
  // Try to use Knowledge service for session vector search
  if (knowledge) {
    try {
      const response = await knowledge.fetch("https://internal/knowledge/search/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-correlation-id": options.correlationId || crypto.randomUUID(),
        },
        body: JSON.stringify({
          query: contextQuery,
          query_embedding: queryEmbedding.length > 0 ? queryEmbedding : undefined,
          top_k: options.topK || 5,
          min_score: options.minScore ?? 0.5,
          entity_type: options.sourceTypes?.[0],
          entity_id: options.sourceTypes?.[1],
          approved_only: options.approvedOnly ?? false,
        }),
      });

      if (response.ok) {
        const result = (await response.json()) as any;
        if (result.success && result.data?.results) {
          return result.data.results.map((session: any) => ({
            session_id: session.id || session.session_id,
            summary: session.summary || session.content,
            similarity_score: session.similarity_score || 0.7,
            embedding_type: session.embedding_type || "summary",
            session_start: session.created_at || session.session_start,
            tool_names: session.tool_names,
            entity_type: session.entity_type,
            entity_id: session.entity_id,
          }));
        }
      } else {
        console.warn(`Knowledge service error: ${response.status}`);
      }
    } catch (error) {
      console.warn("Knowledge service session search failed, falling back to D1", error);
    }
  }

  if (options.approvedOnly) {
    return [];
  }

  // Fallback: D1 query
  try {
    const results = await db
      .prepare(
        `
            SELECT id as session_id, summary, created_at as session_start
            FROM ai_sessions
            WHERE tenant_id = ?
            LIMIT ?
        `
      )
      .bind(tenantId, options.topK || 3)
      .all();

    return (results.results || []).map((r: any) => ({
      ...r,
      similarity_score: 0.5,
      embedding_type: "summary",
    }));
  } catch (dbError) {
    console.error("D1 fallback session query failed:", dbError);
    return [];
  }
}

export async function performEntitySemanticLookup(
  db: D1Database,
  knowledge: Fetcher | undefined,
  aiConfig: { apiKey: string; provider: "openai" | "openrouter" },
  tenantId: string,
  entityType: string,
  entityId: string,
  contextQuery?: string,
  options: SemanticLookupOptions = {}
): Promise<SemanticLookupResult> {
  const startTime = Date.now();
  const query = contextQuery || `Information about ${entityType} ${entityId}`;

  // 1. Generate Embedding (Optional for fallback)
  const embeddingStartTime = Date.now();
  let queryEmbedding: number[] = [];
  try {
    queryEmbedding = await generateEmbedding(query, aiConfig);
  } catch (e) {
    console.error("Embedding generation failed", e);
  }
  const embeddingTime = Date.now() - embeddingStartTime;

  // 2. Search linked context via Knowledge service (with D1 fallback)
  // §17.1: When includeKnowledgeUI is false, skip session search (Flow C compounding)
  const includeSessions = options.includeKnowledgeUI !== false;
  const [chunks, sessions] = await Promise.all([
    searchChunks(db, knowledge, tenantId, query, queryEmbedding, options),
    includeSessions
      ? searchSessions(db, knowledge, tenantId, query, queryEmbedding, options)
      : Promise.resolve([]),
  ]);

  return {
    chunks,
    sessions,
    evidence_refs: [],
    query_embedding_time_ms: embeddingTime,
    search_time_ms: Date.now() - startTime - embeddingTime,
  };
}
