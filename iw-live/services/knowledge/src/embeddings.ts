/**
 * Embeddings Service
 *
 * Vector embeddings generation and hybrid search.
 * Combines semantic similarity with keyword matching.
 *
 * @integratewise/knowledge
 */

export interface EmbeddingConfig {
  /** Model to use for embeddings */
  model: "text-embedding-3-small" | "text-embedding-3-large" | "text-embedding-ada-002";
  /** Dimensions for the embedding (only for text-embedding-3-*) */
  dimensions?: number;
  /** Batch size for processing */
  batchSize: number;
  /** Rate limit (requests per minute) */
  rateLimit: number;
}

export interface EmbeddingResult {
  id: string;
  text: string;
  embedding: number[];
  tokenCount: number;
  model: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  matchType: "semantic" | "keyword" | "hybrid";
}

export interface HybridSearchOptions {
  /** Weight for semantic similarity (0-1) */
  semanticWeight: number;
  /** Weight for keyword matching (0-1) */
  keywordWeight: number;
  /** Minimum score threshold */
  minScore: number;
  /** Maximum results to return */
  limit: number;
  /** Filters to apply */
  filters?: Record<string, unknown>;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  model: "text-embedding-3-small",
  dimensions: 1536,
  batchSize: 100,
  rateLimit: 3000,
};

export const DEFAULT_SEARCH_OPTIONS: HybridSearchOptions = {
  semanticWeight: 0.7,
  keywordWeight: 0.3,
  minScore: 0.5,
  limit: 10,
};

/**
 * Generate embeddings using OpenAI API
 */
export async function generateEmbeddings(
  texts: string[],
  config: EmbeddingConfig = DEFAULT_CONFIG,
  openaiApiKey: string
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += config.batchSize) {
    const batch = texts.slice(i, i + config.batchSize);

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: batch,
        dimensions: config.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
      usage: { total_tokens: number };
    };

    for (const item of data.data) {
      results.push({
        id: crypto.randomUUID(),
        text: batch[item.index],
        embedding: item.embedding,
        tokenCount: Math.ceil(batch[item.index].length / 4), // Approximate
        model: config.model,
      });
    }
  }

  return results;
}

/**
 * Chunk text for embedding (respecting token limits)
 */
export function chunkText(
  text: string,
  options: { maxTokens?: number; overlap?: number } = {}
): string[] {
  const maxTokens = options.maxTokens ?? 512;
  const overlap = options.overlap ?? 50;
  const approxCharsPerToken = 4;

  const maxChars = maxTokens * approxCharsPerToken;
  const overlapChars = overlap * approxCharsPerToken;

  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    // Try to break at sentence boundary
    if (end < text.length) {
      const breakPoints = [". ", "! ", "? ", "\n\n", "\n", ". "];
      for (const bp of breakPoints) {
        const lastBreak = text.lastIndexOf(bp, end);
        if (lastBreak > start + maxChars / 2) {
          end = lastBreak + bp.length;
          break;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlapChars;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * SQL queries for embedding operations
 */
export const embeddingQueries = {
  /** Store embedding */
  store: `
    INSERT INTO embeddings (id, content, embedding, metadata, source, source_id, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (source, source_id, tenant_id)
    DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id
  `,

  /** Vector similarity search using pgvector */
  semanticSearch: `
    SELECT 
      id,
      content,
      metadata,
      1 - (embedding <=> $1::vector) as similarity
    FROM embeddings
    WHERE tenant_id = $2
      AND 1 - (embedding <=> $1::vector) > $3
    ORDER BY embedding <=> $1::vector
    LIMIT $4
  `,

  /** Full-text keyword search */
  keywordSearch: `
    SELECT 
      id,
      content,
      metadata,
      ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
    FROM embeddings
    WHERE tenant_id = $2
      AND search_vector @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC
    LIMIT $3
  `,

  /** Hybrid search combining vector and keyword */
  hybridSearch: `
    WITH semantic AS (
      SELECT 
        id,
        content,
        metadata,
        1 - (embedding <=> $1::vector) as score,
        'semantic' as match_type
      FROM embeddings
      WHERE tenant_id = $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    ),
    keyword AS (
      SELECT 
        id,
        content,
        metadata,
        ts_rank(search_vector, plainto_tsquery('english', $4)) as score,
        'keyword' as match_type
      FROM embeddings
      WHERE tenant_id = $2
        AND search_vector @@ plainto_tsquery('english', $4)
      ORDER BY score DESC
      LIMIT $3
    ),
    combined AS (
      SELECT 
        COALESCE(s.id, k.id) as id,
        COALESCE(s.content, k.content) as content,
        COALESCE(s.metadata, k.metadata) as metadata,
        COALESCE(s.score, 0) * $5 + COALESCE(k.score, 0) * $6 as score,
        CASE 
          WHEN s.id IS NOT NULL AND k.id IS NOT NULL THEN 'hybrid'
          WHEN s.id IS NOT NULL THEN 'semantic'
          ELSE 'keyword'
        END as match_type
      FROM semantic s
      FULL OUTER JOIN keyword k ON s.id = k.id
    )
    SELECT * FROM combined
    WHERE score >= $7
    ORDER BY score DESC
    LIMIT $3
  `,

  /** Delete embeddings by source */
  deleteBySource: `
    DELETE FROM embeddings
    WHERE source = $1 AND source_id = $2 AND tenant_id = $3
  `,

  /** Get embedding stats */
  getStats: `
    SELECT 
      source,
      COUNT(*) as count,
      AVG(array_length(string_to_array(content, ' '), 1)) as avg_words
    FROM embeddings
    WHERE tenant_id = $1
    GROUP BY source
  `,
};

/**
 * SQL migration for embeddings table
 */
export const EMBEDDINGS_MIGRATIONS = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings Table
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id, tenant_id)
);

-- Vector similarity index (IVFFlat for large datasets)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_embeddings_search ON embeddings USING gin(search_vector);

-- Tenant and source indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_tenant ON embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source, tenant_id);
`;

/**
 * Embedding service class
 */
export class EmbeddingService {
  constructor(
    private readonly config: EmbeddingConfig = DEFAULT_CONFIG,
    private readonly openaiApiKey: string
  ) {}

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const results = await generateEmbeddings([text], this.config, this.openaiApiKey);
    return results[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return generateEmbeddings(texts, this.config, this.openaiApiKey);
  }

  /**
   * Chunk and embed a long document
   */
  async embedDocument(
    content: string,
    options?: { maxTokens?: number; overlap?: number }
  ): Promise<EmbeddingResult[]> {
    const chunks = chunkText(content, options);
    return this.embedBatch(chunks);
  }

  /**
   * Calculate similarity between query and candidates
   */
  async rankBySimilarity(
    query: string,
    candidates: Array<{ id: string; text: string }>
  ): Promise<Array<{ id: string; score: number }>> {
    const queryEmbedding = await this.embed(query);
    const candidateEmbeddings = await this.embedBatch(candidates.map((c) => c.text));

    const ranked = candidates.map((candidate, index) => ({
      id: candidate.id,
      score: cosineSimilarity(queryEmbedding, candidateEmbeddings[index].embedding),
    }));

    return ranked.sort((a, b) => b.score - a.score);
  }
}

/**
 * Create embedding service instance
 */
export function createEmbeddingService(
  openaiApiKey: string,
  config?: Partial<EmbeddingConfig>
): EmbeddingService {
  return new EmbeddingService({ ...DEFAULT_CONFIG, ...config }, openaiApiKey);
}
