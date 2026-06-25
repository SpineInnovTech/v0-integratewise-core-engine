/**
 * Agent Provider Abstraction Layer
 *
 * Supports multiple agent orchestration providers:
 * - Vercel AI SDK (built-in)
 * - LangChain
 * - AutoGen (Microsoft)
 * - Crew AI
 * - Local agents (custom)
 *
 * All agent operations route through unified interface.
 */

export type AgentProviderType = 'vercel-ai' | 'langchain' | 'autogen' | 'crew-ai' | 'custom'

export interface AgentConfig {
  id: string
  name: string
  description: string
  role: string
  capabilities: string[]
  tools: string[]
  systemPrompt?: string
  temperature?: number
  maxIterations?: number
  metadata?: Record<string, any>
}

export interface AgentExecutionContext {
  agentId: string
  conversationId?: string
  userId?: string
  tenantId?: string
  maxSteps?: number
  timeout?: number
}

export interface AgentTask {
  id: string
  description: string
  expectedOutput?: string
  agent?: string
}

export interface AgentStep {
  stepNumber: number
  action: string
  input: Record<string, any>
  observation?: string
  thought?: string
}

export interface AgentExecutionResult {
  agentId: string
  taskId?: string
  status: 'success' | 'failed' | 'partial' | 'timeout'
  output: any
  steps: AgentStep[]
  duration: number
  tokensUsed?: {
    input: number
    output: number
  }
  errors?: string[]
}

export interface MultiAgentConfig {
  agents: AgentConfig[]
  coordinator?: 'sequential' | 'parallel' | 'hierarchical'
  maxConcurrent?: number
  timeout?: number
}

export interface MultiAgentResult {
  status: 'success' | 'partial_failure' | 'failed'
  results: Record<string, AgentExecutionResult>
  duration: number
  executedAgents: string[]
  failedAgents: string[]
}

export interface AgentPoolConfig {
  minSize: number
  maxSize: number
  provider: AgentProviderType
}

export interface AgentProvider {
  /**
   * Execute a single agent task
   */
  executeAgent(
    config: AgentConfig,
    task: AgentTask,
    context?: AgentExecutionContext
  ): Promise<AgentExecutionResult>

  /**
   * Execute multiple agents (sequential or parallel)
   */
  executeMultiAgent(
    config: MultiAgentConfig,
    tasks: AgentTask[],
    context?: AgentExecutionContext
  ): Promise<MultiAgentResult>

  /**
   * Register a tool that agents can use
   */
  registerTool(
    toolId: string,
    toolFn: (input: Record<string, any>) => Promise<any>,
    description: string,
    schema?: Record<string, any>
  ): Promise<void>

  /**
   * Get available tools
   */
  getAvailableTools(): Promise<Array<{
    id: string
    description: string
    schema?: Record<string, any>
  }>>

  /**
   * Stream agent execution (for real-time updates)
   */
  streamExecute(
    config: AgentConfig,
    task: AgentTask,
    onStep: (step: AgentStep) => void | Promise<void>,
    context?: AgentExecutionContext
  ): Promise<AgentExecutionResult>

  /**
   * Health check
   */
  healthCheck(): Promise<{
    healthy: boolean
    provider: AgentProviderType
    error?: string
  }>

  /**
   * Get agent status/info
   */
  getAgentInfo(agentId: string): Promise<AgentConfig | null>

  /**
   * List all available agents
   */
  listAgents(): Promise<AgentConfig[]>

  /**
   * Provider identifier
   */
  provider: AgentProviderType
}
