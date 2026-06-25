/**
 * Embedding Storage
 *
 * Handles persistence of embeddings to the database via Pipeline db-proxy.
 * Also performs dual-writes to Cloudflare Vectorize and Cloudflare AI Search.
 */

import type { Chunk } from "../chunking";
import { formatForPgVector } from "./service";

// ============================================================================
// Types
// ============================================================================

export interface StoredChunk {
  id: string;
  tenantId: string;
  content: string;
  contentHash: string;
  chunkIndex: number;
  chunkType: string;
  charStart?: number;
  charEnd?: number;
  tokenCount?: number;
  sourceType: string;
  sourceName?: string;
  entityType?: string;
  entityId?: string;
  fileId?: string;
  sessionId?: string;
}

export interface StoredEmbedding {
  id: string;
  chunkId: string;
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface StoreChunkOptions {
  tenantId: string;
  sourceType: string;
  sourceName?: string;
  entityType?: string;
  entityId?: string;
  fileId?: string;
  sessionId?: string;
  versionId?: string;
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
  const pipeline = env?.PIPELINE || env;
  const url = typeof pipeline === "string" ? pipeline : "http://pipeline/api/v1/db-proxy";

  const init: RequestInit = {
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
  };

  const response =
    typeof pipeline === "string" ? await fetch(url, init) : await pipeline.fetch(url, init);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`db-proxy error: ${response.status} - ${errText}`);
  }

  return response.json();
}

// ============================================================================
// Chunk Storage
// ============================================================================

/**
 * Store chunks in the database
 */
export async function storeChunks(
  env: any,
  chunks: Chunk[],
  options: StoreChunkOptions
): Promise<string[]> {
  if (chunks.length === 0) return [];

  const payload = chunks.map((chunk) => ({
    tenant_id: options.tenantId,
    chunk_index: chunk.metadata.chunkIndex,
    chunk_type: chunk.metadata.chunkType,
    content: chunk.content,
    content_hash: chunk.contentHash,
    char_start: chunk.metadata.charStart || null,
    char_end: chunk.metadata.charEnd || null,
    token_count: chunk.metadata.tokenCount || null,
    source_type: options.sourceType,
    source_name: options.sourceName || null,
    entity_type: options.entityType || null,
    entity_id: options.entityId || null,
    file_id: options.fileId || null,
    session_id: options.sessionId || null,
  }));

  try {
    const results = await queryDbProxy(
      env,
      "knowledge.document_chunks",
      "POST",
      undefined,
      payload,
      {
        Prefer: "resolution=merge-duplicates,return=representation",
      }
    );
    return results.map((r: any) => r.id);
  } catch (error: any) {
    console.error("Failed to store chunks:", error.message);
    throw error;
  }
}

/**
 * Get chunks by IDs
 */
export async function getChunksByIds(env: any, chunkIds: string[]): Promise<StoredChunk[]> {
  if (chunkIds.length === 0) return [];

  try {
    const results = await queryDbProxy(
      env,
      "knowledge.document_chunks",
      "GET",
      `select=id,tenant_id,content,content_hash,chunk_index,chunk_type,char_start,char_end,token_count,source_type,source_name,entity_type,entity_id,file_id,session_id&id=in.(${chunkIds.join(",")})`
    );

    return results.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      content: r.content,
      contentHash: r.content_hash,
      chunkIndex: r.chunk_index,
      chunkType: r.chunk_type,
      charStart: r.char_start,
      charEnd: r.char_end,
      tokenCount: r.token_count,
      sourceType: r.source_type,
      sourceName: r.source_name,
      entityType: r.entity_type,
      entityId: r.entity_id,
      fileId: r.file_id,
      sessionId: r.session_id,
    }));
  } catch (error: any) {
    console.error("Failed to get chunks by ids:", error.message);
    throw error;
  }
}

/**
 * Get chunks without embeddings (for backfill)
 */
export async function getChunksWithoutEmbeddings(
  env: any,
  tenantId: string,
  limit: number = 100
): Promise<StoredChunk[]> {
  try {
    const results = await queryDbProxy(
      env,
      "knowledge.document_chunks",
      "GET",
      `select=id,tenant_id,content,content_hash,chunk_index,chunk_type,char_start,char_end,token_count,source_type,source_name,entity_type,entity_id,file_id,session_id,chunk_embeddings!left(id)&tenant_id=eq.${tenantId}&chunk_embeddings.id=is.null&order=created_at.desc&limit=${limit}`
    );

    return results.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      content: r.content,
      contentHash: r.content_hash,
      chunkIndex: r.chunk_index,
      chunkType: r.chunk_type,
      charStart: r.char_start,
      charEnd: r.char_end,
      tokenCount: r.token_count,
      sourceType: r.source_type,
      sourceName: r.source_name,
      entityType: r.entity_type,
      entityId: r.entity_id,
      fileId: r.file_id,
      sessionId: r.session_id,
    }));
  } catch (error: any) {
    console.error("Failed to get chunks without embeddings:", error.message);
    throw error;
  }
}

// ============================================================================
// Embedding Storage
// ============================================================================

/**
 * Store embeddings in the database
 */
export async function storeEmbeddings(
  env: any,
  tenantId: string,
  embeddings: Array<{
    chunkId: string;
    embedding: number[];
    model: string;
  }>
): Promise<string[]> {
  if (embeddings.length === 0) return [];

  // 1. Write to Supabase via db-proxy
  const payload = embeddings.map((emb) => ({
    tenant_id: tenantId,
    chunk_id: emb.chunkId,
    embedding: formatForPgVector(emb.embedding),
    model_name: emb.model,
    dimensions: emb.embedding.length,
  }));

  try {
    const results = await queryDbProxy(
      env,
      "knowledge.chunk_embeddings",
      "POST",
      undefined,
      payload,
      {
        Prefer: "resolution=merge-duplicates,return=representation",
      }
    );

    // 2. Also write to CF Vectorize if bound in the environment
    if (env?.VECTORIZE_INDEX) {
      try {
        const vectors = embeddings.map((emb) => ({
          id: emb.chunkId,
          values: emb.embedding,
          metadata: {
            tenant_id: tenantId,
            model: emb.model,
          },
        }));
        await env.VECTORIZE_INDEX.upsert(vectors);
        console.log(`[Vectorize] Upserted ${vectors.length} vectors to CF Vectorize`);
      } catch (vecErr: any) {
        console.error(`[Vectorize] Failed to upsert to CF Vectorize: ${vecErr.message}`);
        // Do not fail the write if Vectorize upsert fails
      }
    }

    return results.map((r: any) => r.id);
  } catch (error: any) {
    console.error("Failed to store embeddings:", error.message);
    throw error;
  }
}

/**
 * Store session embeddings
 */
export async function storeSessionEmbedding(
  env: any,
  tenantId: string,
  sessionId: string,
  embeddingType: "summary" | "memory" | "tool_call" | "full_session",
  contentEmbedded: string,
  embedding: number[],
  model: string = "text-embedding-3-small"
): Promise<string> {
  // 1. Write to Supabase via db-proxy
  const payload = {
    tenant_id: tenantId,
    session_id: sessionId,
    embedding_type: embeddingType,
    content_embedded: contentEmbedded,
    embedding: formatForPgVector(embedding),
    model_name: model,
  };

  try {
    const results = await queryDbProxy(
      env,
      "knowledge.session_embeddings",
      "POST",
      undefined,
      payload,
      {
        Prefer: "resolution=merge-duplicates,return=representation",
      }
    );

    // 2. Also write to CF AI Search if bound in the environment
    if (env?.AI_SEARCH) {
      try {
        const instance = env.AI_SEARCH.get("integratewise-knowledge");
        const docId = `session-${sessionId}-${embeddingType}`;
        const markdown = `
# Session ${sessionId} (${embeddingType})
- Session ID: ${sessionId}
- Embedding Type: ${embeddingType}
- Tenant ID: ${tenantId}

${contentEmbedded}
`.trim();

        await instance.items.upload(`${docId}.md`, markdown, {
          metadata: {
            session_id: sessionId,
            embedding_type: embeddingType,
            tenant_id: tenantId,
          },
        });
        console.log(`[AISearch] Uploaded session embedding ${docId} to AI Search`);
      } catch (aiErr: any) {
        console.error(`[AISearch] Failed to upload to AI Search: ${aiErr.message}`);
        // Do not fail the write if AI Search upload fails
      }
    }

    return results[0].id;
  } catch (error: any) {
    console.error("Failed to store session embedding:", error.message);
    throw error;
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Process and store document: chunk + embed + store
 */
export async function processAndStoreDocument(
  env: any,
  content: string,
  options: StoreChunkOptions & {
    embedder: {
      embedBatch: (texts: string[]) => Promise<{
        embeddings: Array<{ index: number; embedding: number[]; tokenCount: number }>;
        model: string;
      }>;
    };
    fileType?: string;
  }
): Promise<{
  chunkIds: string[];
  embeddingIds: string[];
  totalChunks: number;
  totalTokens: number;
}> {
  const { chunkDocument } = await import("../chunking");

  // 1. Chunk the document
  const chunkResult = await chunkDocument(content, {
    sourceType: options.sourceType,
    fileType: options.fileType,
  });

  // 2. Store chunks
  const chunkIds = await storeChunks(env, chunkResult.chunks, options);

  // 3. Generate embeddings
  const texts = chunkResult.chunks.map((c) => c.content);
  const embeddingResult = await options.embedder.embedBatch(texts);

  // 4. Store embeddings
  const embeddingsToStore = embeddingResult.embeddings.map((e, i) => ({
    chunkId: chunkIds[i],
    embedding: e.embedding,
    model: embeddingResult.model,
  }));

  const embeddingIds = await storeEmbeddings(env, options.tenantId, embeddingsToStore);

  return {
    chunkIds,
    embeddingIds,
    totalChunks: chunkResult.chunks.length,
    totalTokens: chunkResult.totalTokens,
  };
}

/**
 * Backfill embeddings for chunks that don't have them
 */
export async function backfillEmbeddings(
  env: any,
  tenantId: string,
  embedder: {
    embedBatch: (texts: string[]) => Promise<{
      embeddings: Array<{ index: number; embedding: number[]; tokenCount: number }>;
      model: string;
    }>;
  },
  batchSize: number = 50
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  while (true) {
    const chunks = await getChunksWithoutEmbeddings(env, tenantId, batchSize);

    if (chunks.length === 0) break;

    try {
      const texts = chunks.map((c) => c.content);
      const result = await embedder.embedBatch(texts);

      const embeddingsToStore = result.embeddings.map((e, i) => ({
        chunkId: chunks[i].id,
        embedding: e.embedding,
        model: result.model,
      }));

      await storeEmbeddings(env, tenantId, embeddingsToStore);
      processed += chunks.length;
    } catch (error) {
      console.error("Backfill batch failed:", error);
      failed += chunks.length;
    }
  }

  return { processed, failed };
}
