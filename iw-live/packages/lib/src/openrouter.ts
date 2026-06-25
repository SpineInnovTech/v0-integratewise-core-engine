/**
 * OpenRouter AI Provider Integration
 *
 * OpenRouter provides a unified API to access multiple AI models
 * (OpenAI, Anthropic, Meta, Google, etc.) with automatic fallbacks.
 *
 * @see https://openrouter.ai/docs
 */

// ============================================================================
// Types
// ============================================================================

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  siteUrl?: string; // Your site URL for rankings
  siteName?: string; // Your site name for rankings
  defaultModel?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  model?: string;
  input: string | string[];
  dimensions?: number;
}

export interface EmbeddingResponse {
  data: Array<{
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

// ============================================================================
// Available Models (Recommended)
// ============================================================================

export const OPENROUTER_MODELS = {
  // Chat / Completion Models
  chat: {
    // OpenAI
    "gpt-4o": "openai/gpt-4o",
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "gpt-4-turbo": "openai/gpt-4-turbo",
    "o1-preview": "openai/o1-preview",
    "o1-mini": "openai/o1-mini",

    // Anthropic
    "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
    "claude-3-opus": "anthropic/claude-3-opus",
    "claude-3-haiku": "anthropic/claude-3-haiku",

    // Meta Llama
    "llama-3.1-405b": "meta-llama/llama-3.1-405b-instruct",
    "llama-3.1-70b": "meta-llama/llama-3.1-70b-instruct",
    "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",

    // Google
    "gemini-pro-1.5": "google/gemini-pro-1.5",
    "gemini-flash-1.5": "google/gemini-flash-1.5",

    // Mistral
    "mistral-large": "mistralai/mistral-large",
    "mixtral-8x22b": "mistralai/mixtral-8x22b-instruct",

    // DeepSeek (cost-effective)
    "deepseek-chat": "deepseek/deepseek-chat",
    "deepseek-coder": "deepseek/deepseek-coder",
  },

  // Embedding Models (OpenRouter proxies to OpenAI for embeddings)
  embedding: {
    "text-embedding-3-small": "openai/text-embedding-3-small",
    "text-embedding-3-large": "openai/text-embedding-3-large",
    "text-embedding-ada-002": "openai/text-embedding-ada-002",
  },
} as const;

// Default models for different use cases
export const DEFAULT_MODELS = {
  chat: "anthropic/claude-3.5-sonnet", // Best quality
  fastChat: "openai/gpt-4o-mini", // Fast and cheap
  embedding: "openai/text-embedding-3-small", // Standard embeddings
  analysis: "anthropic/claude-3.5-sonnet", // Deep analysis
  coding: "deepseek/deepseek-coder", // Cost-effective coding
};

// ============================================================================
// OpenRouter Client
// ============================================================================

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private siteUrl?: string;
  private siteName?: string;
  private defaultModel: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.siteUrl = config.siteUrl;
    this.siteName = config.siteName;
    this.defaultModel = config.defaultModel || DEFAULT_MODELS.chat;
  }

  /**
   * Build standard headers for OpenRouter API
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (this.siteUrl) {
      headers["HTTP-Referer"] = this.siteUrl;
    }

    if (this.siteName) {
      headers["X-Title"] = this.siteName;
    }

    return headers;
  }

  /**
   * Chat completion
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: request.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter chat error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }

  /**
   * Generate embeddings
   * Note: OpenRouter proxies embedding requests to OpenAI
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: request.model || DEFAULT_MODELS.embedding,
        input: request.input,
        dimensions: request.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter embedding error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<EmbeddingResponse>;
  }

  /**
   * Single text embedding (convenience method)
   */
  async embedText(text: string, model?: string, dimensions?: number): Promise<number[]> {
    const result = await this.embed({
      model: model || DEFAULT_MODELS.embedding,
      input: text,
      dimensions: dimensions || 1536,
    });
    return result.data[0].embedding;
  }

  /**
   * Batch text embeddings
   */
  async embedBatch(texts: string[], model?: string, dimensions?: number): Promise<number[][]> {
    const result = await this.embed({
      model: model || DEFAULT_MODELS.embedding,
      input: texts,
      dimensions: dimensions || 1536,
    });

    // Sort by index and return embeddings
    const sorted = result.data.sort((a, b) => a.index - b.index);
    return sorted.map((d) => d.embedding);
  }

  /**
   * Simple text completion (convenience method)
   */
  async complete(
    prompt: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const response = await this.chat({
      model: options?.model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });

    return response.choices[0]?.message?.content || "";
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter models error: ${response.status}`);
    }

    const data = (await response.json()) as { data: ModelInfo[] };
    return data.data;
  }

  /**
   * Check API key validity
   */
  async validateKey(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create OpenRouter client from environment
 */
export function createOpenRouterClient(env: {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_SITE_URL?: string;
  OPENROUTER_SITE_NAME?: string;
  OPENROUTER_DEFAULT_MODEL?: string;
}): OpenRouterClient {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  return new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    siteUrl: env.OPENROUTER_SITE_URL || "https://app.integratewise.ai",
    siteName: env.OPENROUTER_SITE_NAME || "IntegrateWise",
    defaultModel: env.OPENROUTER_DEFAULT_MODEL,
  });
}

/**
 * Generate embedding using OpenRouter (standalone function)
 */
export async function generateEmbeddingViaOpenRouter(
  text: string,
  apiKey: string,
  options?: { model?: string; dimensions?: number }
): Promise<number[]> {
  const client = new OpenRouterClient({ apiKey });
  return client.embedText(text, options?.model, options?.dimensions);
}

/**
 * Chat completion using OpenRouter (standalone function)
 */
export async function chatViaOpenRouter(
  messages: ChatMessage[],
  apiKey: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = new OpenRouterClient({ apiKey });
  const response = await client.chat({
    model: options?.model,
    messages,
    temperature: options?.temperature,
    max_tokens: options?.maxTokens,
  });
  return response.choices[0]?.message?.content || "";
}
