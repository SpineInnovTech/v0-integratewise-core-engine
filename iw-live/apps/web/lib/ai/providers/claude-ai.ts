/**
 * Claude (Anthropic) AI Provider
 *
 * Uses Vercel AI Gateway or direct Anthropic API
 */

import type {
  AIProvider,
  AIGenerateResponse,
  AIStreamResponse,
  AIChatResponse,
  AIEmbeddingResponse,
  AIHealthCheckResult,
  AIGenerateOptions,
  AIStreamOptions,
  AIChatOptions,
  AIEmbeddingOptions,
  AIMessage,
} from '../types'

export class ClaudeAIProvider implements AIProvider {
  private apiKey: string
  private useGateway: boolean
  private models = {
    default: 'claude-3-5-sonnet',
    fast: 'claude-3-haiku',
    powerful: 'claude-3-opus',
  }

  constructor(apiKey?: string, useGateway = true) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    this.useGateway = useGateway
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<AIGenerateResponse> {
    const endpoint = this.useGateway
      ? 'https://api.vercel.ai/openai/v1/chat/completions'
      : 'https://api.anthropic.com/v1/messages'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.models.default,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1024,
          system: options?.systemPrompt,
        }),
      })

      const data = await response.json()

      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices?.[0]?.finish_reason as any,
        model: this.models.default,
        provider: 'claude',
      }
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async stream(
    prompt: string,
    options?: AIStreamOptions
  ): Promise<AIStreamResponse> {
    const self = this

    return {
      stream: (async function* () {
        const response = await fetch(
          self.useGateway
            ? 'https://api.vercel.ai/openai/v1/chat/completions'
            : 'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${self.apiKey}`,
            },
            body: JSON.stringify({
              model: self.models.default,
              messages: [{ role: 'user', content: prompt }],
              temperature: options?.temperature ?? 0.7,
              max_tokens: options?.maxTokens ?? 1024,
              stream: true,
            }),
          }
        )

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              const content = data.choices?.[0]?.delta?.content || ''
              if (content) {
                yield content
                await options?.onChunk?.(content)
              }
            }
          }
        }
      })(),
      model: this.models.default,
      provider: 'claude',
    }
  }

  async chat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): Promise<AIChatResponse> {
    try {
      const response = await fetch(
        this.useGateway
          ? 'https://api.vercel.ai/openai/v1/chat/completions'
          : 'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.models.default,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 1024,
            system: options?.systemPrompt,
          }),
        }
      )

      const data = await response.json()

      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices?.[0]?.finish_reason as any,
        model: this.models.default,
        provider: 'claude',
        conversationId: options?.conversationId,
      }
    } catch (error) {
      throw new Error(`Claude chat error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async embed(
    text: string,
    options?: AIEmbeddingOptions
  ): Promise<AIEmbeddingResponse> {
    // Claude doesn't have native embeddings, use separate service
    throw new Error('Claude does not support embeddings. Use a dedicated embedding provider.')
  }

  async healthCheck(): Promise<AIHealthCheckResult> {
    try {
      const start = Date.now()
      await this.generate('ping', { maxTokens: 10 })
      const latency = Date.now() - start

      return {
        healthy: true,
        provider: 'claude',
        model: this.models.default,
        latency,
      }
    } catch (error) {
      return {
        healthy: false,
        provider: 'claude',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getDefaultModel(): string {
    return this.models.default
  }

  getSupportedModels(): string[] {
    return Object.values(this.models)
  }

  provider = 'claude' as const
}
