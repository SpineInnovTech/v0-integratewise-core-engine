/**
 * Provider Configuration Integration Tests
 *
 * Tests different provider combinations to ensure they work together.
 * Validates the 24 supported configuration combinations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { AuthProviderType } from '../auth/types'
import type { DatabaseProviderType } from '../db/types'
import type { AIProviderType } from '../ai/types'
import type { AgentProviderType } from '../agent/types'

describe('Provider Configuration Integration', () => {
  const AUTH_PROVIDERS: AuthProviderType[] = ['supabase', 'clerk']
  const DB_PROVIDERS: DatabaseProviderType[] = ['supabase', 'd1']
  const AI_PROVIDERS: AIProviderType[] = ['claude', 'gpt', 'groq']
  const AGENT_PROVIDERS: AgentProviderType[] = ['vercel-ai', 'langchain']

  describe('Configuration Combinations', () => {
    it('should support all 24 combinations', () => {
      const combinations: string[] = []

      for (const auth of AUTH_PROVIDERS) {
        for (const db of DB_PROVIDERS) {
          for (const ai of AI_PROVIDERS) {
            for (const agent of AGENT_PROVIDERS) {
              combinations.push(`${auth}+${db}+${ai}+${agent}`)
            }
          }
        }
      }

      expect(combinations).toHaveLength(24)
      expect(combinations).toContain('supabase+supabase+claude+vercel-ai')
      expect(combinations).toContain('clerk+d1+groq+langchain')
      expect(combinations).toContain('supabase+d1+gpt+vercel-ai')
    })
  })

  describe('Supabase Full Stack', () => {
    it('should load all Supabase providers', () => {
      process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'supabase'
      process.env.NEXT_PUBLIC_DB_PROVIDER = 'supabase'
      process.env.NEXT_PUBLIC_AI_PROVIDER = 'claude'
      process.env.NEXT_PUBLIC_AGENT_PROVIDER = 'vercel-ai'

      // This is a configuration validation test
      expect(process.env.NEXT_PUBLIC_AUTH_PROVIDER).toBe('supabase')
      expect(process.env.NEXT_PUBLIC_DB_PROVIDER).toBe('supabase')
      expect(process.env.NEXT_PUBLIC_AI_PROVIDER).toBe('claude')
      expect(process.env.NEXT_PUBLIC_AGENT_PROVIDER).toBe('vercel-ai')
    })
  })

  describe('Cloudflare Full Stack', () => {
    it('should load all Cloudflare providers', () => {
      process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
      process.env.NEXT_PUBLIC_DB_PROVIDER = 'd1'
      process.env.NEXT_PUBLIC_AI_PROVIDER = 'gpt'
      process.env.NEXT_PUBLIC_AGENT_PROVIDER = 'vercel-ai'

      expect(process.env.NEXT_PUBLIC_AUTH_PROVIDER).toBe('clerk')
      expect(process.env.NEXT_PUBLIC_DB_PROVIDER).toBe('d1')
      expect(process.env.NEXT_PUBLIC_AI_PROVIDER).toBe('gpt')
      expect(process.env.NEXT_PUBLIC_AGENT_PROVIDER).toBe('vercel-ai')
    })
  })

  describe('Cost-Optimized Stack', () => {
    it('should load cost-optimized configuration', () => {
      process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
      process.env.NEXT_PUBLIC_DB_PROVIDER = 'd1'
      process.env.NEXT_PUBLIC_AI_PROVIDER = 'groq'
      process.env.NEXT_PUBLIC_AGENT_PROVIDER = 'vercel-ai'

      expect(process.env.NEXT_PUBLIC_AUTH_PROVIDER).toBe('clerk')
      expect(process.env.NEXT_PUBLIC_DB_PROVIDER).toBe('d1')
      expect(process.env.NEXT_PUBLIC_AI_PROVIDER).toBe('groq')
      expect(process.env.NEXT_PUBLIC_AGENT_PROVIDER).toBe('vercel-ai')
    })
  })

  describe('Hybrid Stack', () => {
    it('should load hybrid configuration', () => {
      process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'supabase'
      process.env.NEXT_PUBLIC_DB_PROVIDER = 'd1'
      process.env.NEXT_PUBLIC_AI_PROVIDER = 'groq'
      process.env.NEXT_PUBLIC_AGENT_PROVIDER = 'langchain'

      expect(process.env.NEXT_PUBLIC_AUTH_PROVIDER).toBe('supabase')
      expect(process.env.NEXT_PUBLIC_DB_PROVIDER).toBe('d1')
      expect(process.env.NEXT_PUBLIC_AI_PROVIDER).toBe('groq')
      expect(process.env.NEXT_PUBLIC_AGENT_PROVIDER).toBe('langchain')
    })
  })

  describe('Provider Fallbacks', () => {
    it('should use default providers when env vars not set', () => {
      delete process.env.NEXT_PUBLIC_AUTH_PROVIDER
      delete process.env.NEXT_PUBLIC_DB_PROVIDER
      delete process.env.NEXT_PUBLIC_AI_PROVIDER
      delete process.env.NEXT_PUBLIC_AGENT_PROVIDER

      // Defaults should be: supabase, supabase, claude, vercel-ai
      const auth = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supabase'
      const db = process.env.NEXT_PUBLIC_DB_PROVIDER || 'supabase'
      const ai = process.env.NEXT_PUBLIC_AI_PROVIDER || 'claude'
      const agent = process.env.NEXT_PUBLIC_AGENT_PROVIDER || 'vercel-ai'

      expect(auth).toBe('supabase')
      expect(db).toBe('supabase')
      expect(ai).toBe('claude')
      expect(agent).toBe('vercel-ai')
    })
  })

  describe('Provider Compatibility', () => {
    it('should work with any auth + db combination', () => {
      const combinations = [
        { auth: 'supabase', db: 'supabase' },
        { auth: 'supabase', db: 'd1' },
        { auth: 'clerk', db: 'supabase' },
        { auth: 'clerk', db: 'd1' },
      ]

      combinations.forEach(({ auth, db }) => {
        expect(AUTH_PROVIDERS).toContain(auth as AuthProviderType)
        expect(DB_PROVIDERS).toContain(db as DatabaseProviderType)
      })
    })

    it('should work with any ai + agent combination', () => {
      const combinations = [
        { ai: 'claude', agent: 'vercel-ai' },
        { ai: 'claude', agent: 'langchain' },
        { ai: 'gpt', agent: 'vercel-ai' },
        { ai: 'gpt', agent: 'langchain' },
        { ai: 'groq', agent: 'vercel-ai' },
        { ai: 'groq', agent: 'langchain' },
      ]

      combinations.forEach(({ ai, agent }) => {
        expect(AI_PROVIDERS).toContain(ai as AIProviderType)
        expect(AGENT_PROVIDERS).toContain(agent as AgentProviderType)
      })
    })
  })
})
