# AI & Agent Provider Architecture

## Overview

IntegrateWise supports **multiple AI and Agent providers** through abstraction layers. You can switch between providers via environment configuration without changing application code.

### Supported Combinations

**AI Providers:**
- Claude (Anthropic)
- GPT (OpenAI)
- Groq
- Cohere (planned)
- Mistral (planned)
- Local models (planned)

**Agent Providers:**
- Vercel AI (built-in)
- LangChain
- AutoGen (planned)
- Crew AI (planned)

---

## AI Provider Architecture

### Interface: AIProvider

**Location:** `lib/ai/types.ts`

```typescript
interface AIProvider {
  // Generate text from prompt
  generate(prompt, options?): Promise<AIGenerateResponse>

  // Stream text generation
  stream(prompt, options?): Promise<AIStreamResponse>

  // Multi-turn conversation
  chat(messages, options?): Promise<AIChatResponse>

  // Generate embeddings for semantic search
  embed(text, options?): Promise<AIEmbeddingResponse>

  // Health check
  healthCheck(): Promise<AIHealthCheckResult>

  // Get default model
  getDefaultModel(): string

  // Get supported models
  getSupportedModels(): string[]

  provider: 'claude' | 'gpt' | 'groq'
}
```

### AI Implementations

**Claude Provider** (`lib/ai/providers/claude-ai.ts`)
- Uses Anthropic API or Vercel AI Gateway
- Models: claude-3-opus, claude-3-sonnet, claude-3-haiku
- Supports: generate, stream, chat
- No embeddings (use dedicated provider)

**GPT Provider** (`lib/ai/providers/gpt-ai.ts`)
- Uses OpenAI API or Vercel AI Gateway
- Models: gpt-4-turbo, gpt-4o, gpt-4o-mini
- Supports: generate, stream, chat, embeddings
- Full OpenAI ecosystem support

**Groq Provider** (`lib/ai/providers/groq-ai.ts`)
- Fast inference with Groq API
- Models: mixtral-8x7b, llama2-70b
- Supports: generate, stream, chat
- No embeddings

### Configuration

```bash
# AI Provider Selection
NEXT_PUBLIC_AI_PROVIDER=claude|gpt|groq

# Use Vercel AI Gateway (default: true)
NEXT_PUBLIC_USE_AI_GATEWAY=true|false

# Provider API Keys
ANTHROPIC_API_KEY=...        # For Claude
OPENAI_API_KEY=...           # For GPT
GROQ_API_KEY=...             # For Groq
```

### Usage

```typescript
import { getAIProvider } from '@/lib/ai/factory'

// Get configured provider
const ai = getAIProvider()

// Generate text
const response = await ai.generate('What is IntegrateWise?', {
  temperature: 0.7,
  maxTokens: 1024
})

// Stream text
const { stream } = await ai.stream('Tell me about the system...', {
  onChunk: (chunk) => console.log(chunk)
})

// Chat (multi-turn)
const chat = await ai.chat([
  { role: 'system', content: 'You are helpful assistant' },
  { role: 'user', content: 'Hello!' }
])

// Embeddings (if supported)
const embedding = await ai.embed('Some text to embed')
```

### Helper Functions

```typescript
import { 
  isClaudeAI, 
  isGPTAI, 
  isGroqAI,
  getCurrentAIProvider,
  SUPPORTED_AI_PROVIDERS
} from '@/lib/ai/factory'

if (isClaudeAI()) {
  // Claude-specific optimization
}
```

---

## Agent Provider Architecture

### Interface: AgentProvider

**Location:** `lib/agent/types.ts`

```typescript
interface AgentProvider {
  // Execute single agent
  executeAgent(
    config: AgentConfig,
    task: AgentTask,
    context?: AgentExecutionContext
  ): Promise<AgentExecutionResult>

  // Execute multiple agents
  executeMultiAgent(
    config: MultiAgentConfig,
    tasks: AgentTask[],
    context?: AgentExecutionContext
  ): Promise<MultiAgentResult>

  // Register custom tool
  registerTool(
    toolId: string,
    toolFn: (input) => Promise<any>,
    description: string,
    schema?: Record<string, any>
  ): Promise<void>

  // Get available tools
  getAvailableTools(): Promise<Tool[]>

  // Stream agent execution
  streamExecute(
    config: AgentConfig,
    task: AgentTask,
    onStep: (step) => void,
    context?: AgentExecutionContext
  ): Promise<AgentExecutionResult>

  // Health check
  healthCheck(): Promise<{healthy, provider}>

  // Get agent info
  getAgentInfo(agentId: string): Promise<AgentConfig | null>

  // List all agents
  listAgents(): Promise<AgentConfig[]>

  provider: 'vercel-ai' | 'langchain'
}
```

### Agent Implementations

**Vercel AI Provider** (`lib/agent/providers/vercel-ai-agent.ts`)
- Built on Vercel AI SDK
- Supports: sequential, parallel execution
- Zero external dependencies
- Best for: Node.js, serverless

**LangChain Provider** (`lib/agent/providers/langchain-agent.ts`)
- Built on LangChain framework
- Supports: sequential, parallel, hierarchical coordination
- Rich ecosystem of tools
- Best for: Complex multi-agent systems

### Configuration

```bash
# Agent Provider Selection
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai|langchain
```

### Usage

```typescript
import { getAgentProvider } from '@/lib/agent/factory'

const agentProvider = getAgentProvider()

// Execute single agent
const result = await agentProvider.executeAgent(
  {
    id: 'analyst_1',
    name: 'Data Analyst',
    description: 'Analyzes data and generates insights',
    role: 'analyst',
    capabilities: ['data_analysis', 'visualization'],
    tools: ['sql_query', 'statistics']
  },
  {
    id: 'task_1',
    description: 'Analyze sales trends'
  }
)

// Execute multiple agents (parallel)
const multiResult = await agentProvider.executeMultiAgent(
  {
    agents: [analystAgent, engineerAgent, designerAgent],
    coordinator: 'parallel',
    maxConcurrent: 3
  },
  tasks
)

// Register custom tool
await agentProvider.registerTool(
  'fetch_data',
  async (input) => {
    const response = await fetch(input.url)
    return await response.json()
  },
  'Fetch data from external API',
  {
    type: 'object',
    properties: {
      url: { type: 'string' }
    }
  }
)

// Stream execution with real-time updates
const streamResult = await agentProvider.streamExecute(
  agentConfig,
  task,
  (step) => {
    console.log(`Step ${step.stepNumber}: ${step.action}`)
    console.log(`Observation: ${step.observation}`)
  }
)
```

### Helper Functions

```typescript
import {
  isVercelAIAgent,
  isLangChainAgent,
  getCurrentAgentProvider,
  SUPPORTED_AGENT_PROVIDERS
} from '@/lib/agent/factory'

if (isVercelAIAgent()) {
  // Vercel AI-specific optimization
}
```

---

## Complete Usage Example

```typescript
// Use AI to generate and agents to execute
import { getAIProvider } from '@/lib/ai/factory'
import { getAgentProvider } from '@/lib/agent/factory'

async function analyzeAndExecute() {
  const ai = getAIProvider()
  const agents = getAgentProvider()

  // 1. Generate analysis using AI
  const analysis = await ai.generate(
    'Generate a plan for analyzing customer churn'
  )

  // 2. Execute using agents
  const result = await agents.executeAgent(
    {
      id: 'churn_analyst',
      name: 'Churn Analyst',
      role: 'analyst',
      capabilities: ['analysis'],
      tools: ['data_query']
    },
    {
      id: 'churn_task',
      description: analysis.content
    }
  )

  // 3. Use AI to summarize results
  const summary = await ai.chat([
    { role: 'user', content: 'Summarize this analysis result:' },
    { role: 'assistant', content: JSON.stringify(result.output) },
    { role: 'user', content: 'Now give me top 3 insights' }
  ])

  return summary.content
}
```

---

## File Structure

```
apps/web/lib/
├── ai/
│   ├── types.ts                    # AIProvider interface
│   ├── factory.ts                  # getAIProvider factory
│   └── providers/
│       ├── claude-ai.ts            # Claude implementation
│       ├── gpt-ai.ts               # GPT implementation
│       └── groq-ai.ts              # Groq implementation
└── agent/
    ├── types.ts                    # AgentProvider interface
    ├── factory.ts                  # getAgentProvider factory
    └── providers/
        ├── vercel-ai-agent.ts      # Vercel AI implementation
        └── langchain-agent.ts      # LangChain implementation
```

---

## Environment Configuration

### Claude + Vercel AI

```bash
NEXT_PUBLIC_AI_PROVIDER=claude
NEXT_PUBLIC_USE_AI_GATEWAY=true
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai
ANTHROPIC_API_KEY=sk-ant-...
```

### GPT + LangChain

```bash
NEXT_PUBLIC_AI_PROVIDER=gpt
NEXT_PUBLIC_USE_AI_GATEWAY=true
NEXT_PUBLIC_AGENT_PROVIDER=langchain
OPENAI_API_KEY=sk-...
```

### Groq + Vercel AI

```bash
NEXT_PUBLIC_AI_PROVIDER=groq
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai
GROQ_API_KEY=gsk_...
```

---

## Cost Optimization

**Claude (via Gateway):** ~$0.003/1K input tokens
**GPT-4o-mini (via Gateway):** ~$0.00015/1K input tokens
**Groq:** Extremely fast, free tier available

**Recommendation:** Use Groq for speed, GPT for cost, Claude for quality.

---

## Performance Characteristics

| Provider | Speed | Cost | Quality | Streaming |
|----------|-------|------|---------|-----------|
| Claude | Medium | High | Excellent | Yes |
| GPT | Medium | Medium | Excellent | Yes |
| Groq | Very Fast | Low | Good | Yes |

---

## Future Enhancements

- Cohere integration
- Mistral integration
- Local model support (Ollama, LM Studio)
- AutoGen agent provider
- Crew AI agent provider
- Response caching layer
- Cost tracking per provider
- Rate limiting per provider
- A/B testing framework

---

## Best Practices

1. **Always use factory functions** - Never import providers directly
2. **Use appropriate provider for task**
   - Claude: Quality/reasoning
   - GPT: Balanced/versatile
   - Groq: Speed/cost
3. **Cache responses** when possible
4. **Stream for UX** when appropriate
5. **Use embeddings for search** - Delegate to specialized services
6. **Monitor costs** per provider
7. **Test all providers** in development

