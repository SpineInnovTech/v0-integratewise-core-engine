/**
 * Provider Configuration Validation Tests
 *
 * Validates all 4 abstraction layers with different provider combinations.
 * Tests both factory instantiation and basic operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAuthProvider, resetAuthProvider } from '../auth/factory'
import { getDatabaseProvider, resetDatabaseProvider } from '../db/factory'
import { getAIProvider, resetAIProvider } from '../ai/factory'
import { getAgentProvider, resetAgentProvider } from '../agent/factory'

describe('Provider-Agnostic Architecture', () => {
  afterEach(() => {
    resetAuthProvider()
    resetDatabaseProvider()
    resetAIProvider()
    resetAgentProvider()
  })

  describe('Auth Provider Abstraction', () => {
    it('should return auth provider instance', () => {
      const auth = getAuthProvider()
      expect(auth).toBeDefined()
      expect(auth.provider).toBeDefined()
    })

    it('should cache auth provider instance', () => {
      const auth1 = getAuthProvider()
      const auth2 = getAuthProvider()
      expect(auth1).toBe(auth2)
    })

    it('should have required auth methods', () => {
      const auth = getAuthProvider()
      expect(typeof auth.getSession).toBe('function')
      expect(typeof auth.getCurrentUser).toBe('function')
      expect(typeof auth.signUp).toBe('function')
      expect(typeof auth.signIn).toBe('function')
      expect(typeof auth.signOut).toBe('function')
    })

    it('should identify auth provider correctly', () => {
      const auth = getAuthProvider()
      expect(auth.provider).toMatch(/supabase|clerk/)
    })
  })

  describe('Database Provider Abstraction', () => {
    it('should return database provider instance', () => {
      const db = getDatabaseProvider()
      expect(db).toBeDefined()
      expect(db.provider).toBeDefined()
    })

    it('should cache database provider instance', () => {
      const db1 = getDatabaseProvider()
      const db2 = getDatabaseProvider()
      expect(db1).toBe(db2)
    })

    it('should have required database methods', () => {
      const db = getDatabaseProvider()
      expect(typeof db.query).toBe('function')
      expect(typeof db.insert).toBe('function')
      expect(typeof db.update).toBe('function')
      expect(typeof db.delete).toBe('function')
      expect(typeof db.healthCheck).toBe('function')
    })

    it('should identify database provider correctly', () => {
      const db = getDatabaseProvider()
      expect(db.provider).toMatch(/supabase|d1/)
    })
  })

  describe('AI Provider Abstraction', () => {
    it('should return AI provider instance', () => {
      const ai = getAIProvider()
      expect(ai).toBeDefined()
      expect(ai.provider).toBeDefined()
    })

    it('should cache AI provider instance', () => {
      const ai1 = getAIProvider()
      const ai2 = getAIProvider()
      expect(ai1).toBe(ai2)
    })

    it('should have required AI methods', () => {
      const ai = getAIProvider()
      expect(typeof ai.generate).toBe('function')
      expect(typeof ai.stream).toBe('function')
      expect(typeof ai.chat).toBe('function')
      expect(typeof ai.healthCheck).toBe('function')
      expect(typeof ai.getDefaultModel).toBe('function')
    })

    it('should identify AI provider correctly', () => {
      const ai = getAIProvider()
      expect(ai.provider).toMatch(/claude|gpt|groq/)
    })

    it('should provide default model', () => {
      const ai = getAIProvider()
      const model = ai.getDefaultModel()
      expect(typeof model).toBe('string')
      expect(model.length).toBeGreaterThan(0)
    })

    it('should list supported models', () => {
      const ai = getAIProvider()
      const models = ai.getSupportedModels()
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBeGreaterThan(0)
    })
  })

  describe('Agent Provider Abstraction', () => {
    it('should return agent provider instance', () => {
      const agents = getAgentProvider()
      expect(agents).toBeDefined()
      expect(agents.provider).toBeDefined()
    })

    it('should cache agent provider instance', () => {
      const agents1 = getAgentProvider()
      const agents2 = getAgentProvider()
      expect(agents1).toBe(agents2)
    })

    it('should have required agent methods', () => {
      const agents = getAgentProvider()
      expect(typeof agents.executeAgent).toBe('function')
      expect(typeof agents.executeMultiAgent).toBe('function')
      expect(typeof agents.registerTool).toBe('function')
      expect(typeof agents.healthCheck).toBe('function')
      expect(typeof agents.listAgents).toBe('function')
    })

    it('should identify agent provider correctly', () => {
      const agents = getAgentProvider()
      expect(agents.provider).toMatch(/vercel-ai|langchain/)
    })
  })

  describe('Provider Combinations', () => {
    it('should support all four factories simultaneously', () => {
      const auth = getAuthProvider()
      const db = getDatabaseProvider()
      const ai = getAIProvider()
      const agents = getAgentProvider()

      expect(auth).toBeDefined()
      expect(db).toBeDefined()
      expect(ai).toBeDefined()
      expect(agents).toBeDefined()

      expect(auth.provider).toMatch(/supabase|clerk/)
      expect(db.provider).toMatch(/supabase|d1/)
      expect(ai.provider).toMatch(/claude|gpt|groq/)
      expect(agents.provider).toMatch(/vercel-ai|langchain/)
    })

    it('should reset providers independently', () => {
      const auth1 = getAuthProvider()
      const db1 = getDatabaseProvider()

      resetAuthProvider()

      const auth2 = getAuthProvider()
      const db2 = getDatabaseProvider()

      expect(auth1).not.toBe(auth2)
      expect(db1).toBe(db2)
    })
  })

  describe('Provider Interface Compliance', () => {
    it('auth provider should have required interface', () => {
      const auth = getAuthProvider()
      const requiredMethods = [
        'getSession',
        'getCurrentUser',
        'signUp',
        'signIn',
        'signOut',
        'getUserById',
        'updateUser',
        'deleteUser',
        'provider',
      ]

      requiredMethods.forEach((method) => {
        expect(method in auth || typeof auth[method as keyof typeof auth] !== 'undefined').toBe(
          true
        )
      })
    })

    it('database provider should have required interface', () => {
      const db = getDatabaseProvider()
      const requiredMethods = ['query', 'insert', 'update', 'delete', 'raw', 'healthCheck', 'provider']

      requiredMethods.forEach((method) => {
        expect(method in db || typeof db[method as keyof typeof db] !== 'undefined').toBe(true)
      })
    })

    it('AI provider should have required interface', () => {
      const ai = getAIProvider()
      const requiredMethods = [
        'generate',
        'stream',
        'chat',
        'embed',
        'healthCheck',
        'getDefaultModel',
        'getSupportedModels',
        'provider',
      ]

      requiredMethods.forEach((method) => {
        expect(method in ai || typeof ai[method as keyof typeof ai] !== 'undefined').toBe(true)
      })
    })

    it('agent provider should have required interface', () => {
      const agents = getAgentProvider()
      const requiredMethods = [
        'executeAgent',
        'executeMultiAgent',
        'registerTool',
        'getAvailableTools',
        'streamExecute',
        'healthCheck',
        'getAgentInfo',
        'listAgents',
        'provider',
      ]

      requiredMethods.forEach((method) => {
        expect(method in agents || typeof agents[method as keyof typeof agents] !== 'undefined').toBe(
          true
        )
      })
    })
  })
})
