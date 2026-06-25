/**
 * AI Provider Factory
 *
 * Returns configured AI provider based on environment variable
 */

import type { AIProvider, AIProviderType } from './types'
import { ClaudeAIProvider } from './providers/claude-ai'
import { GPTAIProvider } from './providers/gpt-ai'
import { GroqAIProvider } from './providers/groq-ai'

let cachedProvider: AIProvider | null = null

/**
 * Get the configured AI provider
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider

  const providerType = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude') as AIProviderType
  const useGateway = process.env.NEXT_PUBLIC_USE_AI_GATEWAY !== 'false'

  let provider: AIProvider

  switch (providerType) {
    case 'claude':
      provider = new ClaudeAIProvider(process.env.ANTHROPIC_API_KEY, useGateway)
      break

    case 'gpt':
      provider = new GPTAIProvider(process.env.OPENAI_API_KEY, useGateway)
      break

    case 'groq':
      provider = new GroqAIProvider(process.env.GROQ_API_KEY)
      break

    default:
      throw new Error(`Unknown AI provider: ${providerType}`)
  }

  cachedProvider = provider
  return provider
}

/**
 * Reset cached provider (for testing)
 */
export function resetAIProvider() {
  cachedProvider = null
}

/**
 * Check if using Claude
 */
export function isClaudeAI(): boolean {
  return (process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude') === 'claude'
}

/**
 * Check if using GPT
 */
export function isGPTAI(): boolean {
  return process.env.NEXT_PUBLIC_AI_PROVIDER === 'gpt'
}

/**
 * Check if using Groq
 */
export function isGroqAI(): boolean {
  return process.env.NEXT_PUBLIC_AI_PROVIDER === 'groq'
}

/**
 * Get current AI provider type
 */
export function getCurrentAIProvider(): AIProviderType {
  return (process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude') as AIProviderType
}

/**
 * Get all supported AI providers
 */
export const SUPPORTED_AI_PROVIDERS = ['claude', 'gpt', 'groq'] as const
