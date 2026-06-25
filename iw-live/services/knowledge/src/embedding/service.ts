/**
 * Embedding Service
 *
 * Generates vector embeddings for text chunks using OpenAI, OpenRouter, or Voyage AI.
 * Handles batching, rate limiting, and error recovery.
 */

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingConfig {
  provider: "openai" | "openrouter" | "voyage" | "local";
  model: string;
  dimensions: number;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokenCount: number;
}

export interface BatchEmbeddingResult {
  embeddings: Array<{
    index: number;
    embedding: number[];
    tokenCount: number;
  }>;
  model: string;
  totalTokens: number;
  processingTimeMs: number;
}

export interface EmbeddingError {
  index: number;
  error: string;
  retryable: boolean;
}

// ============================================================================
// LOCKED Embedding Configuration (Day 2 Best Practice)
// ============================================================================
// Best Practice: Lock one embedding model and dimension to avoid churn.
// Do NOT change without migrating existing embeddings.

export const LOCKED_EMBEDDING_CONFIG: EmbeddingConfig = {
  provider: "openai",
  model: "text-embedding-3-small",
  dimensions: 1536,
  batchSize: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// WARNING: These are for migration/testing only. Production should use LOCKED_EMBEDDING_CONFIG.
// @deprecated - Use LOCKED_EMBEDDING_CONFIG for production
export const EMBEDDING_CONFIGS: Record<string, EmbeddingConfig> = {
  "openai-small": LOCKED_EMBEDDING_CONFIG, // Locked default
  "openai-large": {
    provider: "openai",
    model: "text-embedding-3-large",
    dimensions: 3072,
    batchSize: 50,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  "openai-ada": {
    provider: "openai",
    model: "text-embedding-ada-002",
    dimensions: 1536,
    batchSize: 100,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  // OpenRouter configurations (proxies to OpenAI embeddings)
  "openrouter-small": {
    provider: "openrouter",
    model: "openai/text-embedding-3-small",
    dimensions: 1536,
    batchSize: 100,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  "openrouter-large": {
    provider: "openrouter",
    model: "openai/text-embedding-3-large",
    dimensions: 3072,
    batchSize: 50,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  "voyage-2": {
    provider: "voyage",
    model: "voyage-2",
    dimensions: 1024,
    batchSize: 128,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  "voyage-large": {
    provider: "voyage",
    model: "voyage-large-2",
    dimensions: 1536,
    batchSize: 64,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
};

export const DEFAULT_CONFIG = EMBEDDING_CONFIGS["openai-small"];

// ============================================================================
// Embedding Service Class
// ============================================================================

export class EmbeddingService {
  private config: EmbeddingConfig;
  private apiKey: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    configName: string = "openai-small",
    customConfig?: Partial<EmbeddingConfig>
  ) {
    this.apiKey = apiKey;
    this.config = {
      ...(EMBEDDING_CONFIGS[configName] || DEFAULT_CONFIG),
      ...customConfig,
    };

    // Set base URL based on provider
    switch (this.config.provider) {
      case "voyage":
        this.baseUrl = "https://api.voyageai.com/v1";
        break;
      case "openrouter":
        this.baseUrl = "https://openrouter.ai/api/v1";
        break;
      case "openai":
      default:
        this.baseUrl = "https://api.openai.com/v1";
        break;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Embed a single text string
   */
  async embed(text: string): Promise<EmbeddingResult> {
    const result = await this.embedBatch([text]);
    return {
      embedding: result.embeddings[0].embedding,
      model: result.model,
      tokenCount: result.embeddings[0].tokenCount,
    };
  }

  /**
   * Embed multiple texts in batches
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const allEmbeddings: Array<{ index: number; embedding: number[]; tokenCount: number }> = [];
    let totalTokens = 0;

    // Process in batches
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      const batchResult = await this.embedBatchInternal(batch);

      // Add index offset
      for (const emb of batchResult.embeddings) {
        allEmbeddings.push({
          index: i + emb.index,
          embedding: emb.embedding,
          tokenCount: emb.tokenCount,
        });
        totalTokens += emb.tokenCount;
      }

      // Rate limit between batches
      if (i + this.config.batchSize < texts.length) {
        await this.delay(100);
      }
    }

    return {
      embeddings: allEmbeddings,
      model: this.config.model,
      totalTokens,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Internal batch embedding with retry logic
   */
  private async embedBatchInternal(
    texts: string[],
    attempt: number = 1
  ): Promise<{ embeddings: Array<{ index: number; embedding: number[]; tokenCount: number }> }> {
    try {
      const response = await this.callEmbeddingAPI(texts);
      return this.parseResponse(response);
    } catch (error: any) {
      if (attempt < this.config.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelayMs * attempt);
        return this.embedBatchInternal(texts, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Call the embedding API
   */
  private async callEmbeddingAPI(texts: string[]): Promise<any> {
    const endpoint = `${this.baseUrl}/embeddings`;

    const body: Record<string, any> = {
      input: texts,
      model: this.config.model,
    };

    // OpenAI-specific: specify dimensions for text-embedding-3 models
    if (this.config.provider === "openai" && this.config.model.includes("text-embedding-3")) {
      body.dimensions = this.config.dimensions;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new EmbeddingAPIError(
        `API error: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }

    return response.json();
  }

  /**
   * Parse API response
   */
  private parseResponse(response: any): {
    embeddings: Array<{ index: number; embedding: number[]; tokenCount: number }>;
  } {
    const embeddings: Array<{ index: number; embedding: number[]; tokenCount: number }> = [];

    for (const item of response.data) {
      embeddings.push({
        index: item.index,
        embedding: item.embedding,
        tokenCount: response.usage?.prompt_tokens
          ? Math.ceil(response.usage.prompt_tokens / response.data.length)
          : 0,
      });
    }

    return { embeddings };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof EmbeddingAPIError) {
      // Retry on rate limits and server errors
      return error.statusCode === 429 || error.statusCode >= 500;
    }
    // Retry on network errors
    return error.message?.includes("fetch") || error.message?.includes("network");
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class EmbeddingAPIError extends Error {
  statusCode: number;
  details: string;

  constructor(message: string, statusCode: number, details: string) {
    super(message);
    this.name = "EmbeddingAPIError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an embedding service with OpenAI
 */
export function createOpenAIEmbedder(
  apiKey: string,
  model: "small" | "large" | "ada" = "small"
): EmbeddingService {
  const configName = model === "ada" ? "openai-ada" : `openai-${model}`;
  return new EmbeddingService(apiKey, configName);
}

/**
 * Create an embedding service with OpenRouter
 * OpenRouter proxies to OpenAI embeddings API
 */
export function createOpenRouterEmbedder(
  apiKey: string,
  model: "small" | "large" = "small"
): EmbeddingService {
  const configName = `openrouter-${model}`;
  return new EmbeddingService(apiKey, configName);
}

/**
 * Create an embedding service with Voyage AI
 */
export function createVoyageEmbedder(
  apiKey: string,
  model: "voyage-2" | "voyage-large" = "voyage-2"
): EmbeddingService {
  const configName = model === "voyage-large" ? "voyage-large" : "voyage-2";
  return new EmbeddingService(apiKey, configName);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  return v.map((x) => x / norm);
}

/**
 * Format embedding for pgvector
 */
export function formatForPgVector(embedding: number[]): string {
  return "[" + embedding.join(",") + "]";
}
