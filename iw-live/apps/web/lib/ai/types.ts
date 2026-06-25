/**
 * AI Provider Abstraction Layer
 *
 * Supports multiple LLM providers:
 * - Claude (Anthropic)
 * - GPT (OpenAI)
 * - Groq
 * - Cohere
 * - Mistral
 * - Local models (Ollama, LM Studio, etc.)
 *
 * All requests route through a unified interface.
 */

export type AIProviderType = 'claude' | 'gpt' | 'groq' | 'cohere' | 'mistral' | 'local'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIGenerateOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  systemPrompt?: string
  tags?: Record<string, string>
}

export interface AIGenerateResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: 'stop' | 'length' | 'error'
  model: string
  provider: AIProviderType
}

export interface AIStreamOptions extends AIGenerateOptions {
  onChunk?: (chunk: string) => void | Promise<void>
}

export interface AIStreamResponse {
  stream: AsyncIterable<string>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: AIProviderType
}

export interface AIChatOptions extends AIGenerateOptions {
  conversationId?: string
}

export interface AIChatResponse extends AIGenerateResponse {
  conversationId?: string
}

export interface AIEmbeddingOptions {
  dimensions?: number
}

export interface AIEmbeddingResponse {
  embedding: number[]
  model: string
  provider: AIProviderType
  dimensions: number
}

export interface AIHealthCheckResult {
  healthy: boolean
  provider: AIProviderType
  model?: string
  latency?: number
  error?: string
}

export interface AIProvider {
  /**
   * Generate text from prompt
   */
  generate(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<AIGenerateResponse>

  /**
   * Stream text generation
   */
  stream(
    prompt: string,
    options?: AIStreamOptions
  ): Promise<AIStreamResponse>

  /**
   * Multi-turn conversation
   */
  chat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): Promise<AIChatResponse>

  /**
   * Generate embeddings for semantic search
   */
  embed(
    text: string,
    options?: AIEmbeddingOptions
  ): Promise<AIEmbeddingResponse>

  /**
   * Health check for the provider
   */
  healthCheck(): Promise<AIHealthCheckResult>

  /**
   * Get default model for this provider
   */
  getDefaultModel(): string

  /**
   * Get supported models for this provider
   */
  getSupportedModels(): string[]

  /**
   * Provider identifier
   */
  provider: AIProviderType
}
