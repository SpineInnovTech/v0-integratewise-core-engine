/**
 * Agent Provider Factory
 *
 * Returns configured agent provider based on environment variable
 */

import type { AgentProvider, AgentProviderType } from './types'
import { VercelAIAgentProvider } from './providers/vercel-ai-agent'
import { LangChainAgentProvider } from './providers/langchain-agent'

let cachedProvider: AgentProvider | null = null

/**
 * Get the configured agent provider
 */
export function getAgentProvider(): AgentProvider {
  if (cachedProvider) return cachedProvider

  const providerType = (process.env.NEXT_PUBLIC_AGENT_PROVIDER || 'vercel-ai') as AgentProviderType

  let provider: AgentProvider

  switch (providerType) {
    case 'vercel-ai':
      provider = new VercelAIAgentProvider()
      break

    case 'langchain':
      provider = new LangChainAgentProvider()
      break

    default:
      throw new Error(`Unknown agent provider: ${providerType}`)
  }

  cachedProvider = provider
  return provider
}

/**
 * Reset cached provider (for testing)
 */
export function resetAgentProvider() {
  cachedProvider = null
}

/**
 * Check if using Vercel AI
 */
export function isVercelAIAgent(): boolean {
  return (process.env.NEXT_PUBLIC_AGENT_PROVIDER || 'vercel-ai') === 'vercel-ai'
}

/**
 * Check if using LangChain
 */
export function isLangChainAgent(): boolean {
  return process.env.NEXT_PUBLIC_AGENT_PROVIDER === 'langchain'
}

/**
 * Get current agent provider type
 */
export function getCurrentAgentProvider(): AgentProviderType {
  return (process.env.NEXT_PUBLIC_AGENT_PROVIDER || 'vercel-ai') as AgentProviderType
}

/**
 * Get all supported agent providers
 */
export const SUPPORTED_AGENT_PROVIDERS = ['vercel-ai', 'langchain'] as const
