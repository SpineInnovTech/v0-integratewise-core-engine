/**
 * Knowledge Search Service
 *
 * Implements semantic, keyword, and hybrid search across document chunks
 * and AI sessions using local D1 SQLite and Cloudflare Vectorize/AI Search.
 */

import { formatForPgVector } from "../embedding";

// ============================================================================
// Types
// ============================================================================

export type SearchType = "vector" | "keyword" | "hybrid";

export interface SearchOptions {
  type?: SearchType;
  topK?: number;
  minScore?: number;
  entityType?: string;
  entityId?: string;
  sourceTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  includeMetadata?: boolean;
  approvedOnly?: boolean;
}

export interface SearchResult {
  chunkId: string;
  content: string;
  similarityScore: number;
  keywordScore: number;
  combinedScore: number;
  sourceType: string;
  sourceName?: string;
  entityType?: string;
  entityId?: string;
  fileId?: string;
  sessionId?: string;
  metadata?: {
    chunkIndex: number;
    chunkType: string;
    tokenCount?: number;
  };
}

export interface SessionSearchResult {
  sessionId: string;
  summary: string;
  similarityScore: number;
  embeddingType: string;
  sessionStart?: Date;
  toolNames?: string[];
  entityType?: string;
  entityId?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  searchType: SearchType;
  totalResults: number;
  processingTimeMs: number;
}

// ============================================================================
// DB Proxy Helper
// ============================================================================

async function queryDbProxy(
  env: any,
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  query?: string,
  payload?: any,
  headers?: Record<string, string>
): Promise<any> {
  const pipeline = env?.PIPELINE;
  if (!pipeline) {
    throw new Error("Pipeline service binding not available for db-proxy write");
  }
  const response = await pipeline.fetch("http://pipeline/api/v1/db-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      table,
      method,
      query,
      payload,
      headers,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`db-proxy error: ${response.status} - ${errText}`);
  }

  return response.json();
}

// ============================================================================
// Search Service Class
// ============================================================================

export class SearchService {
  private env: any;
  private embedder: any;

  constructor(env: any, embedder: any) {
    this.env = env;
    this.embedder = embedder;
  }

  /**
   * Semantic search across document chunks
   */
  async search(
    tenantId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchType = options.type || "hybrid";
    const topK = options.topK || 10;
    const minScore = options.minScore || 0.5;

    let results: SearchResult[];

    switch (searchType) {
      case "vector":
        results = await this.vectorSearch(tenantId, query, topK, minScore, options);
        break;
      case "keyword":
        results = await this.keywordSearch(tenantId, query, topK, options);
        break;
      case "hybrid":
      default:
        results = await this.hybridSearch(tenantId, query, topK, minScore, options);
        break;
    }

    // Filter by source types if requested
    if (options.sourceTypes && options.sourceTypes.length > 0) {
      const sources = new Set(options.sourceTypes.map((s) => s.toLowerCase()));
      results = results.filter((r) => sources.has(r.sourceType.toLowerCase()));
    }

    // Filter by entity if requested
    if (options.entityType) {
      results = results.filter(
        (r) => r.entityType?.toLowerCase() === options.entityType?.toLowerCase()
      );
    }
    if (options.entityId) {
      results = results.filter((r) => r.entityId === options.entityId);
    }

    return {
      results,
      query,
      searchType,
      totalResults: results.length,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Pure vector similarity search using Cloudflare Vectorize & local D1
   */
  private async vectorSearch(
    tenantId: string,
    query: string,
    topK: number,
    minScore: number,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.env.DB) {
      throw new Error("D1 database binding not configured");
    }

    // 1. Get query embedding
    const embeddingResult = await this.embedder.embed(query);
    const embedding = embeddingResult.embedding;

    // 2. Query Cloudflare Vectorize
    let matches: any[] = [];
    if (this.env.VECTORIZE_INDEX) {
      try {
        const vecRes = await this.env.VECTORIZE_INDEX.query(embedding, {
          topK: topK * 2, // Query a bit extra to filter by tenant in memory if needed
          returnMetadata: true,
        });
        matches = vecRes.matches || [];
      } catch (err: any) {
        console.error("Vectorize query failed:", err.message);
      }
    }

    // 3. Fallback: if Vectorize fails or returns nothing, return empty
    if (matches.length === 0) {
      return [];
    }

    // 4. Filter matches by tenantId
    const tenantMatches = matches.filter(
      (m) => !m.metadata || !m.metadata.tenant_id || m.metadata.tenant_id === tenantId
    );

    const chunkIds = tenantMatches.map((m) => m.id);
    if (chunkIds.length === 0) return [];

    // 5. Fetch chunk details from D1
    const placeholders = chunkIds.map((_, i) => `?${i + 1}`).join(", ");
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM document_chunks WHERE id IN (${placeholders}) AND tenant_id = ?`
    )
      .bind(...chunkIds, tenantId)
      .all();

    const chunkMap = new Map<string, any>();
    for (const row of results || []) {
      chunkMap.set(row.id, row);
    }

    // 6. Map and sort by similarity score
    const searchResults: SearchResult[] = [];
    for (const match of tenantMatches) {
      const row = chunkMap.get(match.id);
      if (!row) continue;

      const similarityScore = match.score || 0;
      if (similarityScore < minScore) continue;

      searchResults.push({
        chunkId: row.id,
        content: row.content,
        similarityScore,
        keywordScore: 0,
        combinedScore: similarityScore,
        sourceType: row.source_type,
        sourceName: row.source_name || undefined,
        entityType: row.entity_type || undefined,
        entityId: row.entity_id || undefined,
        fileId: row.file_id || undefined,
        sessionId: row.session_id || undefined,
        metadata: options.includeMetadata
          ? {
              chunkIndex: row.chunk_index,
              chunkType: row.chunk_type,
              tokenCount: row.token_count || undefined,
            }
          : undefined,
      });
    }

    return searchResults.slice(0, topK);
  }

  /**
   * Full-text keyword search using SQLite LIKE split
   */
  private async keywordSearch(
    tenantId: string,
    query: string,
    topK: number,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.env.DB) {
      throw new Error("D1 database binding not configured");
    }

    const words = query
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((w) => w.length > 2);

    if (words.length === 0) {
      // Fallback if query is too short: return recent chunks
      const { results } = await this.env.DB.prepare(
        "SELECT * FROM document_chunks WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?"
      )
        .bind(tenantId, topK)
        .all();
      return (results || []).map((row: any) =>
        this.mapRowToSearchResult(row, 0, 1, 1, options.includeMetadata)
      );
    }

    let sqlQuery = "SELECT * FROM document_chunks WHERE tenant_id = ?";
    const params: any[] = [tenantId];

    const likeClauses = words.map((w) => {
      params.push(`%${w}%`);
      return "content LIKE ?";
    });

    sqlQuery += ` AND (${likeClauses.join(" OR ")})`;
    sqlQuery += ` LIMIT ?`;
    params.push(topK * 2); // Get a few extra for client-side scoring

    const { results } = await this.env.DB.prepare(sqlQuery)
      .bind(...params)
      .all();

    // Score based on word match count
    const scoredResults = (results || []).map((row: any) => {
      const contentLower = row.content.toLowerCase();
      let matchCount = 0;
      for (const word of words) {
        if (contentLower.includes(word.toLowerCase())) {
          matchCount++;
        }
      }
      const keywordScore = matchCount / words.length;
      return this.mapRowToSearchResult(row, 0, keywordScore, keywordScore, options.includeMetadata);
    });

    return scoredResults
      .sort((a: SearchResult, b: SearchResult) => b.keywordScore - a.keywordScore)
      .slice(0, topK);
  }

  /**
   * Hybrid search combining vector and keyword
   */
  private async hybridSearch(
    tenantId: string,
    query: string,
    topK: number,
    minScore: number,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // 1. Run vector and keyword searches in parallel
    const [vectorRes, keywordRes] = await Promise.all([
      this.vectorSearch(tenantId, query, topK * 2, minScore, options),
      this.keywordSearch(tenantId, query, topK * 2, options),
    ]);

    // 2. Combine results (Reciprocal Rank Fusion)
    const combinedMap = new Map<string, SearchResult>();

    // Add vector matches
    for (let i = 0; i < vectorRes.length; i++) {
      const r = vectorRes[i];
      combinedMap.set(r.chunkId, {
        ...r,
        // Combined score = 0.7 * semantic + 0.3 * keyword
        combinedScore: r.similarityScore * 0.7,
      });
    }

    // Merge keyword matches
    for (let i = 0; i < keywordRes.length; i++) {
      const r = keywordRes[i];
      const existing = combinedMap.get(r.chunkId);
      if (existing) {
        existing.keywordScore = r.keywordScore;
        existing.combinedScore += r.keywordScore * 0.3;
      } else {
        combinedMap.set(r.chunkId, {
          ...r,
          combinedScore: r.keywordScore * 0.3,
        });
      }
    }

    // 3. Sort by combined score and return topK
    return Array.from(combinedMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK);
  }

  /**
   * Search across AI sessions
   */
  async searchSessions(
    tenantId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SessionSearchResult[]> {
    if (!this.env.DB) {
      throw new Error("D1 database binding not configured");
    }

    const topK = options.topK || 10;
    const minScore = options.minScore || 0.5;

    // Handle approved only queries (from org_memory)
    if (options.approvedOnly) {
      const normalizedEntityType = (options.entityType || "").toLowerCase();
      const accountScopedTypes = new Set(["account", "organization", "company", "customer"]);
      const userScopedTypes = new Set(["user", "owner", "member"]);
      const accountId = accountScopedTypes.has(normalizedEntityType)
        ? options.entityId || null
        : null;
      const userId = userScopedTypes.has(normalizedEntityType) ? options.entityId || null : null;

      let sqlQuery = `
        SELECT
          id AS session_id,
          content AS session_summary,
          created_at AS session_start,
          topic,
          source_session_id
        FROM org_memory
        WHERE tenant_id = ?
          AND governance_state = 'approved'
      `;
      const params: any[] = [tenantId];

      if (accountId) {
        sqlQuery += " AND json_extract(metadata, '$.account_id') = ?";
        params.push(accountId);
      }
      if (userId) {
        sqlQuery += " AND json_extract(metadata, '$.user_id') = ?";
        params.push(userId);
      }

      if (query && query.trim().length > 0) {
        sqlQuery += " AND (content LIKE ? OR topic LIKE ?)";
        params.push(`%${query}%`, `%${query}%`);
      }

      sqlQuery += " ORDER BY created_at DESC LIMIT ?";
      params.push(topK);

      const { results } = await this.env.DB.prepare(sqlQuery)
        .bind(...params)
        .all();

      return (results || []).map((r: any) => ({
        sessionId: r.source_session_id || r.session_id,
        summary: r.session_summary,
        similarityScore: 0.95,
        embeddingType: "approved_memory",
        sessionStart: r.session_start ? new Date(r.session_start) : undefined,
        toolNames: r.topic ? [r.topic] : [],
        entityType: accountId ? "account" : userId ? "user" : undefined,
        entityId: accountId || userId || undefined,
      }));
    }

    // Default search session flow
    // 1. Query Cloudflare AI Search if available
    if (this.env.AI_SEARCH) {
      try {
        const instance = this.env.AI_SEARCH.get("integratewise-knowledge");
        const searchRes = await instance.search(query, {
          limit: topK,
          filter: { tenant_id: tenantId },
        });

        if (searchRes.results && searchRes.results.length > 0) {
          return searchRes.results.map((r: any) => ({
            sessionId: r.metadata?.session_id || r.id.replace("session-", ""),
            summary: r.content,
            similarityScore: r.score || 0.9,
            embeddingType: r.metadata?.embedding_type || "summary",
            sessionStart: r.metadata?.timestamp ? new Date(r.metadata.timestamp) : undefined,
            toolNames: [],
            entityType: r.metadata?.entity_id ? "entity" : undefined,
            entityId: r.metadata?.entity_id || undefined,
          }));
        }
      } catch (err: any) {
        console.error("AI Search query failed, falling back to SQLite keyword:", err.message);
      }
    }

    // 2. SQLite keyword search fallback on conversational_memory
    let sqlQuery = `
      SELECT
        id, session_id, content, created_at, role, model
      FROM conversational_memory
      WHERE tenant_id = ?
        AND role = 'assistant'
    `;
    const params: any[] = [tenantId];

    if (query && query.trim().length > 0) {
      sqlQuery += " AND content LIKE ?";
      params.push(`%${query}%`);
    }

    sqlQuery += " ORDER BY created_at DESC LIMIT ?";
    params.push(topK);

    const { results } = await this.env.DB.prepare(sqlQuery)
      .bind(...params)
      .all();

    return (results || []).map((r: any) => ({
      sessionId: r.session_id,
      summary: r.content,
      similarityScore: 0.7,
      embeddingType: "chat_turn",
      sessionStart: r.created_at ? new Date(r.created_at) : undefined,
      toolNames: r.model ? [r.model] : [],
    }));
  }

  /**
   * Find similar chunks to a given chunk
   */
  async findSimilar(tenantId: string, chunkId: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.env.DB || !this.env.VECTORIZE_INDEX) {
      return [];
    }

    try {
      // 1. Fetch chunk metadata/vector ID from local D1
      const sourceChunk = await this.env.DB.prepare(
        "SELECT * FROM document_chunks WHERE id = ? AND tenant_id = ?"
      )
        .bind(chunkId, tenantId)
        .first();

      if (!sourceChunk) return [];

      // 2. Query Vectorize by chunk_id metadata to fetch the vector, or check if we can query directly
      // Since Vectorize cannot search by source_id vector directly without vector input, we can fetch
      // the vector first. Since D1 doesn't have vectors, we fetch the vector from Supabase.
      const embRes = await queryDbProxy(
        this.env,
        "knowledge.chunk_embeddings",
        "GET",
        `select=embedding&chunk_id=eq.${chunkId}&limit=1`
      );

      if (!embRes || embRes.length === 0) return [];

      const embeddingStr = embRes[0].embedding;
      // parse vector format [1.0, 2.0, ...]
      const vector: number[] = JSON.parse(embeddingStr);

      // 3. Query Vectorize
      const vecRes = await this.env.VECTORIZE_INDEX.query(vector, {
        topK: topK + 1,
        returnMetadata: true,
      });

      const matches = (vecRes.matches || []).filter((m: any) => m.id !== chunkId);

      const chunkIds = matches.map((m: any) => m.id);
      if (chunkIds.length === 0) return [];

      const placeholders = chunkIds.map((_: any, i: number) => `?${i + 1}`).join(", ");
      const { results } = await this.env.DB.prepare(
        `SELECT * FROM document_chunks WHERE id IN (${placeholders}) AND tenant_id = ?`
      )
        .bind(...chunkIds, tenantId)
        .all();

      const chunkMap = new Map<string, any>();
      for (const row of results || []) {
        chunkMap.set(row.id, row);
      }

      return matches
        .map((m: any) => {
          const row = chunkMap.get(m.id);
          if (!row) return null;
          return this.mapRowToSearchResult(row, m.score || 0, 0, m.score || 0, true);
        })
        .filter((r: any): r is SearchResult => r !== null)
        .slice(0, topK);
    } catch (err: any) {
      console.error("Find similar failed:", err.message);
      return [];
    }
  }

  /**
   * Log search for analytics (via db-proxy)
   */
  async logSearch(
    tenantId: string,
    query: string,
    queryEmbedding: number[],
    searchType: SearchType,
    results: SearchResult[],
    durationMs: number,
    userId?: string,
    correlationId?: string
  ): Promise<void> {
    try {
      await queryDbProxy(this.env, "knowledge.search_history", "POST", undefined, {
        tenant_id: tenantId,
        user_id: userId || null,
        query_text: query,
        query_embedding: formatForPgVector(queryEmbedding),
        search_type: searchType,
        top_k: results.length,
        result_count: results.length,
        result_ids: results.map((r) => r.chunkId),
        relevance_scores: results.map((r) => r.combinedScore),
        duration_ms: durationMs,
        correlation_id: correlationId || null,
      });
    } catch (err: any) {
      console.error("Failed to log search history:", err.message);
    }
  }

  /**
   * Map database row to SearchResult
   */
  private mapRowToSearchResult(
    row: any,
    similarityScore: number,
    keywordScore: number,
    combinedScore: number,
    includeMetadata?: boolean
  ): SearchResult {
    return {
      chunkId: row.id,
      content: row.content,
      similarityScore,
      keywordScore,
      combinedScore,
      sourceType: row.source_type,
      sourceName: row.source_name || undefined,
      entityType: row.entity_type || undefined,
      entityId: row.entity_id || undefined,
      fileId: row.file_id || undefined,
      sessionId: row.session_id || undefined,
      metadata: includeMetadata
        ? {
            chunkIndex: row.chunk_index,
            chunkType: row.chunk_type,
            tokenCount: row.token_count || undefined,
          }
        : undefined,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSearchService(env: any, embedder: any): SearchService {
  return new SearchService(env, embedder);
}
