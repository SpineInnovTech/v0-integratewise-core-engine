import { createAdminClient } from "@/lib/supabase/server"

export interface EmbeddingRecord {
  id: string
  source_type: string
  source_id: string
  content: string
  embedding?: number[]
  model?: string
  token_count?: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface SearchResult {
  id: string
  source_type: string
  source_id: string
  content: string
  similarity: number
  metadata?: Record<string, unknown>
  created_at: string
}

export interface EmbeddingConfig {
  model?: string
  apiKey?: string
  provider?: "openai" | "deepseek"
}

/**
 * Generate embedding using OpenAI or DeepSeek
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = {},
): Promise<{ embedding: number[]; model: string; tokenCount: number }> {
  const model = config.model || "text-embedding-ada-002"
  const provider = config.provider || "openai"

  if (provider === "openai") {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error("OpenAI API key not configured")
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    return {
      embedding: data.data[0].embedding,
      model: data.model,
      tokenCount: data.usage.total_tokens,
    }
  } else if (provider === "deepseek") {
    // DeepSeek doesn't have a native embeddings API yet
    // You could use a third-party service or fall back to OpenAI
    throw new Error("DeepSeek embeddings not yet implemented. Use OpenAI provider.")
  }

  throw new Error(`Unsupported embedding provider: ${provider}`)
}

/**
 * Store embedding in the database
 */
export async function storeEmbedding(
  sourceType: string,
  sourceId: string,
  content: string,
  embedding: number[],
  options: {
    model?: string
    tokenCount?: number
    metadata?: Record<string, unknown>
  } = {},
): Promise<EmbeddingRecord | null> {
  const supabase = createAdminClient()

  if (!supabase) {
    console.error("[Embeddings] Supabase client not available")
    return null
  }

  const { data, error } = await supabase
    .from("embeddings")
    .insert({
      source_type: sourceType,
      source_id: sourceId,
      content,
      embedding: JSON.stringify(embedding), // pgvector handles this as a vector type
      model: options.model || "text-embedding-ada-002",
      token_count: options.tokenCount,
      metadata: options.metadata || {},
    })
    .select()
    .single()

  if (error) {
    console.error("[Embeddings] Failed to store embedding:", error)
    return null
  }

  return data as EmbeddingRecord
}

/**
 * Generate and store embedding for content
 */
export async function embedContent(
  sourceType: string,
  sourceId: string,
  content: string,
  config: EmbeddingConfig = {},
  metadata: Record<string, unknown> = {},
): Promise<EmbeddingRecord | null> {
  try {
    // Generate embedding
    const { embedding, model, tokenCount } = await generateEmbedding(content, config)

    // Store in database
    return await storeEmbedding(sourceType, sourceId, content, embedding, {
      model,
      tokenCount,
      metadata,
    })
  } catch (error) {
    console.error("[Embeddings] Failed to embed content:", error)
    return null
  }
}

/**
 * Search embeddings by similarity
 */
export async function searchEmbeddings(
  queryEmbedding: number[],
  options: {
    threshold?: number
    limit?: number
    sourceType?: string
  } = {},
): Promise<SearchResult[]> {
  const supabase = createAdminClient()

  if (!supabase) {
    console.error("[Embeddings] Supabase client not available")
    return []
  }

  const threshold = options.threshold || 0.7
  const limit = options.limit || 10
  const sourceType = options.sourceType || null

  const { data, error } = await supabase.rpc("search_embeddings", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: limit,
    filter_source_type: sourceType,
  })

  if (error) {
    console.error("[Embeddings] Search failed:", error)
    return []
  }

  return (data as SearchResult[]) || []
}

/**
 * Hybrid search (vector + text)
 */
export async function hybridSearch(
  queryEmbedding: number[],
  queryText: string,
  options: {
    threshold?: number
    limit?: number
    sourceType?: string
  } = {},
): Promise<SearchResult[]> {
  const supabase = createAdminClient()

  if (!supabase) {
    console.error("[Embeddings] Supabase client not available")
    return []
  }

  const threshold = options.threshold || 0.7
  const limit = options.limit || 10
  const sourceType = options.sourceType || null

  const { data, error } = await supabase.rpc("hybrid_search", {
    query_embedding: JSON.stringify(queryEmbedding),
    query_text: queryText,
    match_threshold: threshold,
    match_count: limit,
    filter_source_type: sourceType,
  })

  if (error) {
    console.error("[Embeddings] Hybrid search failed:", error)
    return []
  }

  return (data as SearchResult[]) || []
}

/**
 * Search by text (generates embedding first)
 */
export async function searchByText(
  queryText: string,
  options: {
    threshold?: number
    limit?: number
    sourceType?: string
    config?: EmbeddingConfig
  } = {},
): Promise<SearchResult[]> {
  try {
    // Generate embedding for query
    const { embedding } = await generateEmbedding(queryText, options.config)

    // Search
    return await searchEmbeddings(embedding, {
      threshold: options.threshold,
      limit: options.limit,
      sourceType: options.sourceType,
    })
  } catch (error) {
    console.error("[Embeddings] Text search failed:", error)
    return []
  }
}

/**
 * Batch embed content
 */
export async function batchEmbedContent(
  items: Array<{
    sourceType: string
    sourceId: string
    content: string
    metadata?: Record<string, unknown>
  }>,
  config: EmbeddingConfig = {},
): Promise<Array<EmbeddingRecord | null>> {
  const results: Array<EmbeddingRecord | null> = []

  for (const item of items) {
    const result = await embedContent(item.sourceType, item.sourceId, item.content, config, item.metadata || {})
    results.push(result)

    // Rate limiting: wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats() {
  const supabase = createAdminClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.from("embedding_stats").select("*")

  if (error) {
    console.error("[Embeddings] Failed to get stats:", error)
    return null
  }

  return data
}

/**
 * Delete embeddings for a source
 */
export async function deleteEmbeddings(sourceType: string, sourceId: string): Promise<boolean> {
  const supabase = createAdminClient()

  if (!supabase) {
    return false
  }

  const { error } = await supabase.from("embeddings").delete().eq("source_type", sourceType).eq("source_id", sourceId)

  if (error) {
    console.error("[Embeddings] Failed to delete embeddings:", error)
    return false
  }

  return true
}
