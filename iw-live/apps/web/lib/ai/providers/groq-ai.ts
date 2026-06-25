/**
 * Groq AI Provider
 *
 * Fast inference using Groq API
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

export class GroqAIProvider implements AIProvider {
  private apiKey: string
  private models = {
    default: 'mixtral-8x7b-32768',
    fast: 'llama2-70b-4096',
    powerful: 'mixtral-8x7b-32768',
  }

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || ''
  }

  async generate(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<AIGenerateResponse> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        provider: 'groq',
      }
    } catch (error) {
      throw new Error(`Groq API error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async stream(
    prompt: string,
    options?: AIStreamOptions
  ): Promise<AIStreamResponse> {
    const self = this

    return {
      stream: (async function* () {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        })

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
      provider: 'groq',
    }
  }

  async chat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): Promise<AIChatResponse> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        provider: 'groq',
        conversationId: options?.conversationId,
      }
    } catch (error) {
      throw new Error(`Groq chat error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async embed(): Promise<AIEmbeddingResponse> {
    throw new Error('Groq does not support embeddings. Use a dedicated embedding provider.')
  }

  async healthCheck(): Promise<AIHealthCheckResult> {
    try {
      const start = Date.now()
      await this.generate('ping', { maxTokens: 10 })
      const latency = Date.now() - start

      return {
        healthy: true,
        provider: 'groq',
        model: this.models.default,
        latency,
      }
    } catch (error) {
      return {
        healthy: false,
        provider: 'groq',
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

  provider = 'groq' as const
}
