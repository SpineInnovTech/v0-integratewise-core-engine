# Complete Provider-Agnostic Architecture Guide

## Executive Summary

IntegrateWise is now **completely provider-agnostic** across all four critical layers:

1. **Authentication** (Supabase Auth or Clerk)
2. **Database** (Supabase PostgreSQL or Cloudflare D1)
3. **AI Model** (Claude, GPT, or Groq)
4. **Agent Orchestration** (Vercel AI or LangChain)

**Change providers with environment variables only. Zero code changes required.**

---

## Four-Layer Architecture

### Layer 1: Authentication Provider

| Provider | Configuration | Best For |
|----------|---------------|----------|
| **Supabase Auth** | `NEXT_PUBLIC_AUTH_PROVIDER=supabase` | Full-featured auth, RLS policies |
| **Clerk Auth** | `NEXT_PUBLIC_AUTH_PROVIDER=clerk` | Modern UX, multi-tenancy |

**Location:** `lib/auth/factory.ts` → `getAuthProvider()`

### Layer 2: Database Provider

| Provider | Configuration | Best For |
|----------|---------------|----------|
| **Supabase PostgreSQL** | `NEXT_PUBLIC_DB_PROVIDER=supabase` | Complex queries, full SQL |
| **Cloudflare D1** | `NEXT_PUBLIC_DB_PROVIDER=d1` | Edge-first, zero cold starts |

**Location:** `lib/db/factory.ts` → `getDatabaseProvider()`

### Layer 3: AI Provider

| Provider | Configuration | Best For |
|----------|---------------|----------|
| **Claude (Anthropic)** | `NEXT_PUBLIC_AI_PROVIDER=claude` | Quality, reasoning |
| **GPT (OpenAI)** | `NEXT_PUBLIC_AI_PROVIDER=gpt` | Versatility, balanced |
| **Groq** | `NEXT_PUBLIC_AI_PROVIDER=groq` | Speed, cost-efficiency |

**Location:** `lib/ai/factory.ts` → `getAIProvider()`

### Layer 4: Agent Provider

| Provider | Configuration | Best For |
|----------|---------------|----------|
| **Vercel AI** | `NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai` | Simplicity, zero deps |
| **LangChain** | `NEXT_PUBLIC_AGENT_PROVIDER=langchain` | Complex workflows, tools |

**Location:** `lib/agent/factory.ts` → `getAgentProvider()`

---

## Pre-Built Configuration Templates

### Template 1: Full Supabase Stack (Proven, Established)

**Use Case:** Traditional SaaS, complex queries, full PostgreSQL features

**Environment:**
```bash
# Auth
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database
NEXT_PUBLIC_DB_PROVIDER=supabase

# AI
NEXT_PUBLIC_AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...

# Agent
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai
```

**Costs:** $$$ (Supabase + Anthropic)
**Setup Time:** 30 minutes
**Reliability:** ⭐⭐⭐⭐⭐

---

### Template 2: Full Cloudflare Stack (Modern, Edge-First)

**Use Case:** Edge computing, serverless-first, Cloudflare ecosystem

**Environment:**
```bash
# Auth
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database
NEXT_PUBLIC_DB_PROVIDER=d1
# Add to wrangler.toml:
# [[d1_databases]]
# binding = "DB"
# database_name = "integratewise"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# AI
NEXT_PUBLIC_AI_PROVIDER=gpt
OPENAI_API_KEY=sk-...

# Agent
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai
```

**Costs:** $ (Cloudflare free tier + OpenAI pay-as-you-go)
**Setup Time:** 45 minutes
**Reliability:** ⭐⭐⭐⭐

---

### Template 3: Cost-Optimized Stack (Budget-Conscious)

**Use Case:** Cost-sensitive, speed important, MVP/startup

**Environment:**
```bash
# Auth
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
NEXT_PUBLIC_DB_PROVIDER=d1
# Deploy to Cloudflare (free tier available)

# AI
NEXT_PUBLIC_AI_PROVIDER=groq
GROQ_API_KEY=gsk_...  # Free tier available
# Use Vercel AI Gateway for rate limiting
NEXT_PUBLIC_USE_AI_GATEWAY=true

# Agent
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai
```

**Costs:** $ (Primarily AI usage, mostly free)
**Setup Time:** 20 minutes
**Reliability:** ⭐⭐⭐⭐

---

### Template 4: Hybrid Stack (Best Performance)

**Use Case:** High-performance, mixed requirements, enterprise

**Environment:**
```bash
# Auth
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Database
NEXT_PUBLIC_DB_PROVIDER=d1
# Use D1 for performance, Supabase for auth

# AI
NEXT_PUBLIC_AI_PROVIDER=groq  # For speed
# Fallback to Claude for complex reasoning
GROQ_API_KEY=...
ANTHROPIC_API_KEY=...

# Agent
NEXT_PUBLIC_AGENT_PROVIDER=langchain  # For complex workflows
```

**Costs:** $$ (Flexible)
**Setup Time:** 60 minutes
**Reliability:** ⭐⭐⭐⭐⭐

---

## Usage Examples

### Example 1: Provider-Agnostic User Fetch

```typescript
// Works with Supabase Auth OR Clerk
import { getAuthProvider } from '@/lib/auth/factory'

export async function getUserAction() {
  const auth = getAuthProvider()
  const user = await auth.getCurrentUser()
  return user
}
```

### Example 2: Provider-Agnostic Database Query

```typescript
// Works with Supabase PostgreSQL OR D1
import { getDatabaseProvider } from '@/lib/db/factory'

export async function fetchUserData(userId: string) {
  const db = getDatabaseProvider()
  const result = await db.query(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  )
  return result.data?.[0]
}
```

### Example 3: Provider-Agnostic AI Generation

```typescript
// Works with Claude, GPT, or Groq
import { getAIProvider } from '@/lib/ai/factory'

export async function generateSummary(text: string) {
  const ai = getAIProvider()
  const response = await ai.generate(
    `Summarize this text: ${text}`,
    { maxTokens: 200 }
  )
  return response.content
}
```

### Example 4: Provider-Agnostic Agent Execution

```typescript
// Works with Vercel AI or LangChain
import { getAgentProvider } from '@/lib/agent/factory'

export async function executeAnalysis(task: string) {
  const agents = getAgentProvider()
  const result = await agents.executeAgent(
    {
      id: 'analyst_1',
      name: 'Analyst',
      role: 'analyst',
      capabilities: ['analysis'],
      tools: ['data_query']
    },
    { id: 'task_1', description: task }
  )
  return result.output
}
```

### Example 5: Combining All Layers

```typescript
// Use all four layers together
import { getAuthProvider } from '@/lib/auth/factory'
import { getDatabaseProvider } from '@/lib/db/factory'
import { getAIProvider } from '@/lib/ai/factory'
import { getAgentProvider } from '@/lib/agent/factory'

export async function complexWorkflow(userId: string, query: string) {
  // 1. Get user (auth agnostic)
  const auth = getAuthProvider()
  const user = await auth.getCurrentUser()

  // 2. Fetch data (db agnostic)
  const db = getDatabaseProvider()
  const data = await db.query(
    'SELECT * FROM reports WHERE user_id = ?',
    [userId]
  )

  // 3. Generate analysis (ai agnostic)
  const ai = getAIProvider()
  const analysis = await ai.generate(
    `Analyze this data: ${JSON.stringify(data)}`,
    { temperature: 0.7 }
  )

  // 4. Execute agents (agent agnostic)
  const agents = getAgentProvider()
  const result = await agents.executeAgent(
    {
      id: 'executor',
      name: 'Executor',
      role: 'executor',
      capabilities: ['execution'],
      tools: ['api_call']
    },
    { id: 'task', description: analysis.content }
  )

  return result.output
}
```

---

## Switching Providers

### Switch Auth Provider

```bash
# Current: Supabase Auth
# Target: Clerk Auth

# 1. Update .env.local
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# 2. Add ClerkProvider to layout (if not already done)
# 3. Remove Supabase env vars (optional)

# 4. Restart dev server
# Done! All code using getAuthProvider() automatically uses Clerk
```

### Switch Database Provider

```bash
# Current: Supabase PostgreSQL
# Target: Cloudflare D1

# 1. Set up D1 (add to wrangler.toml)
[[d1_databases]]
binding = "DB"
database_name = "integratewise"
database_id = "..."

# 2. Migrate schema to D1 (see migration guide)

# 3. Update .env.local
NEXT_PUBLIC_DB_PROVIDER=d1

# 4. Restart dev server
# Done! All code using getDatabaseProvider() automatically uses D1
```

### Switch AI Provider

```bash
# Current: Claude
# Target: Groq (for speed/cost)

# 1. Update .env.local
NEXT_PUBLIC_AI_PROVIDER=groq
GROQ_API_KEY=gsk_...

# 2. Restart dev server
# Done! All code using getAIProvider() automatically uses Groq
```

### Switch Agent Provider

```bash
# Current: Vercel AI
# Target: LangChain (for complex workflows)

# 1. Update .env.local
NEXT_PUBLIC_AGENT_PROVIDER=langchain

# 2. Install LangChain (if needed)
# pnpm add langchain

# 3. Restart dev server
# Done! All code using getAgentProvider() automatically uses LangChain
```

---

## Helper Functions for Provider Detection

```typescript
// Auth Detection
import { isSupabaseAuth, isClerkAuth } from '@/lib/auth/factory'

if (isClerkAuth()) {
  // Clerk-specific logic
}

// Database Detection
import { isSupabaseDatabase, isD1Database } from '@/lib/db/factory'

if (isD1Database()) {
  // D1-specific optimization
}

// AI Detection
import { isClaudeAI, isGPTAI, isGroqAI } from '@/lib/ai/factory'

if (isGroqAI()) {
  // Use Groq's fast inference for real-time tasks
}

// Agent Detection
import { isVercelAIAgent, isLangChainAgent } from '@/lib/agent/factory'

if (isLangChainAgent()) {
  // Use LangChain's advanced features
}
```

---

## Testing All Combinations

**Matrix:** 2 Auth × 2 DB × 3 AI × 2 Agent = **24 combinations**

### Quick Test Script

```bash
#!/bin/bash

# Test all combinations
for AUTH in supabase clerk; do
  for DB in supabase d1; do
    for AI in claude gpt groq; do
      for AGENT in vercel-ai langchain; do
        echo "Testing: $AUTH + $DB + $AI + $AGENT"
        export NEXT_PUBLIC_AUTH_PROVIDER=$AUTH
        export NEXT_PUBLIC_DB_PROVIDER=$DB
        export NEXT_PUBLIC_AI_PROVIDER=$AI
        export NEXT_PUBLIC_AGENT_PROVIDER=$AGENT
        
        pnpm build 2>&1 | grep -E "error|Error" && echo "✗ FAILED" || echo "✓ PASSED"
      done
    done
  done
done
```

---

## File Structure

```
apps/web/lib/
├── auth/
│   ├── types.ts
│   ├── env.ts
│   ├── factory.ts
│   └── providers/
│       ├── supabase-auth.ts
│       └── clerk-auth.ts
├── db/
│   ├── types.ts
│   ├── env.ts
│   ├── factory.ts
│   └── providers/
│       ├── supabase-db.ts
│       └── d1-db.ts
├── ai/
│   ├── types.ts
│   ├── env.ts
│   ├── factory.ts
│   └── providers/
│       ├── claude-ai.ts
│       ├── gpt-ai.ts
│       └── groq-ai.ts
└── agent/
    ├── types.ts
    ├── env.ts
    ├── factory.ts
    └── providers/
        ├── vercel-ai-agent.ts
        └── langchain-agent.ts
```

---

## Deployment Considerations

### For Supabase Stack
- Keep Supabase service connected
- Use environment variables for secrets
- No additional configuration needed

### For Cloudflare Stack
- Deploy to Cloudflare Workers
- Configure wrangler.toml for D1
- Set environment variables in Vercel/Cloudflare

### For Mixed Stack
- Configure all relevant services
- Test all provider combinations
- Monitor costs per provider

---

## Best Practices

1. **Always use factory functions** - Never import providers directly
2. **Keep providers consistent per deployment** - Don't mix for testing in prod
3. **Monitor provider performance** - Track latency per provider
4. **Use appropriate provider for task**:
   - Claude: Complex reasoning
   - GPT: General-purpose
   - Groq: Real-time/speed-critical
5. **Cache provider instances** - Factories handle this automatically
6. **Test all combinations** - Ensure cross-provider compatibility
7. **Document provider choice** - Note why you chose each provider
8. **Plan migration paths** - Know how to switch if needed

---

## Migration from One Stack to Another

### From Supabase-only to Cloudflare-first

```bash
# Phase 1: Keep auth, migrate DB
NEXT_PUBLIC_AUTH_PROVIDER=supabase    # Keep existing
NEXT_PUBLIC_DB_PROVIDER=d1             # New
# Migrate schema to D1 and test

# Phase 2: Migrate auth
NEXT_PUBLIC_AUTH_PROVIDER=clerk        # New
NEXT_PUBLIC_DB_PROVIDER=d1             # Current
# Update auth provider, test

# Phase 3: Optimize AI/Agent
NEXT_PUBLIC_AI_PROVIDER=groq           # For speed
NEXT_PUBLIC_AGENT_PROVIDER=langchain   # For complexity
```

---

## Troubleshooting

### "Unknown auth provider" Error
- Check `NEXT_PUBLIC_AUTH_PROVIDER` env var is set to `supabase` or `clerk`
- Verify required API keys are present

### "Database connection failed"
- Check `NEXT_PUBLIC_DB_PROVIDER` is `supabase` or `d1`
- Verify database credentials
- Check D1 binding in wrangler.toml

### "AI provider timeout"
- Check API key validity
- Verify network connectivity
- Try Groq for faster responses

### "Agent execution failed"
- Check `NEXT_PUBLIC_AGENT_PROVIDER` value
- Verify agent config is valid
- Check tools are registered

---

## Performance Metrics

| Metric | Supabase | D1 | Claude | GPT | Groq |
|--------|----------|-----|--------|-----|------|
| Latency | 50-200ms | 10-50ms | 1-3s | 0.5-2s | 0.2-0.8s |
| Cost/M | $50-200 | $0-5 | $15 | $1-5 | $0.5-2 |
| Throughput | High | Very High | Medium | High | Very High |

---

## Support Matrix

All factory functions follow this pattern:

```typescript
// Pattern: Get {Provider} → Use interface
const provider = get{Provider}Provider()
await provider.{method}()

// Examples:
const auth = getAuthProvider()
const db = getDatabaseProvider()
const ai = getAIProvider()
const agents = getAgentProvider()
```

All code is **100% TypeScript-safe** with full autocomplete support.

---

This completes the four-layer provider-agnostic architecture. Choose your providers, deploy, and switch anytime with zero code changes.
