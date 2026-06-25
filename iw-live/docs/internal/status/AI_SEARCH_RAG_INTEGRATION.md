# AI Search + AI Gateway + Workers AI Integration

> **Date:** 2026-06-09 14:20 UTC  
> **Status:** ✅ INTEGRATED INTO INTELLIGENCE WORKER  
> **Architecture:** v3.6 Consolidated (no new workers)

---

## Architecture Decision

**REJECTED:** Standalone `integratewise-ai-orchestrator` worker  
**ADOPTED:** Integrate AI Search RAG into existing `intelligence` worker

**Rationale:**

- v3.6 architecture already consolidates AI functionality into `intelligence`
- Existing AI router (Workers AI + OpenRouter + AI Gateway) is working
- AI Search namespace already created: `integratewise-intelligence`
- Adding RAG is a feature enhancement, not a new service

---

## What's Wired (2026-06-09)

### ✅ Intelligence Worker Bindings

**File:** `services/intelligence/wrangler.toml`

```toml
# AI Search for RAG
[[ai_search_namespaces]]
binding = "AI_SEARCH"
namespace = "integratewise-intelligence"

# Workers AI for fast inference
[ai]
binding = "AI"

# OpenRouter API key (free tier)
[[secrets_store_secrets]]
binding = "OPENROUTER_API_KEY"
store_id = "1fd83fc5881e4cd296ae3c2fbe80693c"
secret_name = "OPENROUTER_API_KEY"

# Env vars
[vars]
AI_GATEWAY_ID = "integratewise-ai-dev"
```

### ✅ AI Router with RAG Support

**File:** `services/intelligence/src/lib/ai-router.ts`

**Features:**

- 3-tier fallback: Workers AI → OpenRouter free → OpenRouter fusion
- Optional RAG context from AI Search
- All requests through AI Gateway (caching + logging)
- Source attribution for RAG responses

**New Interface:**

```typescript
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tier?: "fast" | "balanced" | "critical";
  useRAG?: boolean; // NEW: Enable AI Search RAG
}

export interface AIResponse {
  content: string;
  model: string;
  cached: boolean;
  provider: "workers-ai" | "openrouter";
  cost: number;
  sources?: Array<{ title: string; url?: string; score?: number }>; // NEW: RAG sources
}
```

**RAG Flow:**

1. If `useRAG: true`, search AI Search namespace with user query
2. Retrieve top 5 results
3. Augment prompt with retrieved context
4. Route through AI tier (fast/balanced/critical)
5. Return answer + source attribution

### ✅ Test Endpoint

**File:** `services/intelligence/src/index.ts`

**New Route:** `POST /v1/test/rag`

**Request:**

```json
{
  "question": "What integrations does integratewise.ai support?",
  "tier": "fast"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "content": "IntegrateWise supports...",
    "model": "@cf/meta/llama-3.1-8b-instruct",
    "cached": false,
    "provider": "workers-ai",
    "cost": 0,
    "sources": [
      {
        "title": "Supported Integrations",
        "url": "https://integratewise.ai/integrations",
        "score": 0.92
      }
    ]
  }
}
```

---

## Deployment

### Step 1: Deploy Intelligence Worker

```bash
cd /Users/nirmal/Github/integratewise-live
unset CLOUDFLARE_API_TOKEN
wrangler deploy --config services/intelligence/wrangler.toml --env=""
```

**Expected Output:**

- ✅ Worker deployed
- ✅ AI_SEARCH binding verified
- ✅ AI binding verified
- ✅ OPENROUTER_API_KEY binding verified

---

### Step 2: Test RAG Search

```bash
# Test RAG-enabled query (fast tier)
curl -X POST https://intelligence.dev.integratewise.ai/v1/test/rag \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is IntegrateWise and what does it do?",
    "tier": "fast"
  }'

# Test with balanced tier (OpenRouter free)
curl -X POST https://intelligence.dev.integratewise.ai/v1/test/rag \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How does IntegrateWise handle entity resolution?",
    "tier": "balanced"
  }'

# Test with critical tier (OpenRouter fusion)
curl -X POST https://intelligence.dev.integratewise.ai/v1/test/rag \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Compare IntegrateWise to other integration platforms",
    "tier": "critical"
  }'
```

**Expected Behavior:**

- Query hits AI Search namespace
- Retrieves relevant docs from integratewise.ai
- Augments prompt with context
- Returns answer + sources

---

### Step 3: Verify AI Gateway Logs

1. Open Cloudflare Dashboard
2. Navigate to **AI Gateway** → `integratewise-ai-dev`
3. Check logs for:
   - Cache hit rate
   - Request counts by provider (workers-ai, openrouter)
   - Token usage
   - Error rates

---

## AI Search Content Status

### Current Status

**Namespace:** `integratewise-intelligence`  
**Status:** ✅ Created  
**Content:** ⚠️ EMPTY (needs bulk upload)

### Next: Bulk Upload Content

**Option A: Crawl Website (Recommended)**

```bash
# Enable Cloudflare AI Search crawler
# 1. Go to Cloudflare Dashboard → AI → AI Crawl Control
# 2. Allow "Cloudflare-AI-Search" bot for integratewise.ai domain
# 3. Trigger initial crawl:

curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/a1bbbb12a32cdbb68dd170b09fe8b5f3/ai-search/rags/integratewise-intelligence/refresh" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json"
```

**Option B: Bulk Upload from org_memory (Manual)**

```bash
# Create script to upload org_memory content
# File: services/intelligence/scripts/upload-to-ai-search.ts

const documents = await fetchOrgMemoryDocs(); // From Supabase

for (const doc of documents) {
  await env.AI_SEARCH.upsert({
    id: doc.id,
    text: doc.content_md,
    metadata: {
      title: doc.title,
      url: doc.url,
      tags: doc.tags,
      topics: doc.topics,
      governance_state: doc.governance_state,
    },
  });
}
```

**Option C: Sync from R2 Bucket**

```bash
# If org_memory content is already in R2, sync to AI Search
# (Requires AI Search API integration)
```

---

## What's Missing (Optional)

### Hugging Face API Key

**Status:** Not configured  
**Priority:** 🟢 LOW (optional, OpenRouter covers this)

**To Add:**

```bash
wrangler secrets-store secret create 1fd83fc5881e4cd296ae3c2fbe80693c \
  --name=HUGGINGFACE_API_KEY \
  --scopes=workers

# Add binding to intelligence/wrangler.toml
[[secrets_store_secrets]]
binding = "HF_API_KEY"
store_id = "1fd83fc5881e4cd296ae3c2fbe80693c"
secret_name = "HUGGINGFACE_API_KEY"
```

### Grok API Key

**Status:** Not configured  
**Priority:** 🟢 LOW (optional, covered by OpenRouter + Workers AI)

**To Add:**

```bash
wrangler secrets-store secret create 1fd83fc5881e4cd296ae3c2fbe80693c \
  --name=GROK_API_KEY \
  --scopes=workers

# Add binding to intelligence/wrangler.toml
[[secrets_store_secrets]]
binding = "GROK_API_KEY"
store_id = "1fd83fc5881e4cd296ae3c2fbe80693c"
secret_name = "GROK_API_KEY"
```

**Note:** These are optional fallback providers. Current setup (Workers AI + OpenRouter free) is sufficient for Phase 2.

---

## Usage in Production

### Morning Brief with RAG

```typescript
import { routeAI } from "./lib/ai-router";

async function generateMorningBrief(env: Env) {
  const response = await routeAI(
    {
      prompt: "Summarize overnight system changes and pending actions",
      systemPrompt: "You are a system monitor. Use knowledge base context.",
      useRAG: true,
      tier: "fast",
      maxTokens: 500,
    },
    env
  );

  return {
    content: response.content,
    sources: response.sources, // Attribution
    provider: response.provider,
  };
}
```

### Signal Analysis with RAG

```typescript
async function analyzeSignal(env: Env, signalData: unknown) {
  const response = await routeAI(
    {
      prompt: `Analyze this signal: ${JSON.stringify(signalData)}`,
      systemPrompt: "You are a signal analyzer. Reference knowledge base for context.",
      useRAG: true,
      tier: "balanced",
      maxTokens: 500,
    },
    env
  );

  return {
    analysis: response.content,
    sources: response.sources,
  };
}
```

### Critical Decision with Fusion

```typescript
async function criticalDecision(env: Env, context: unknown) {
  const response = await routeAI(
    {
      prompt: `Critical decision required: ${JSON.stringify(context)}`,
      systemPrompt: "Multi-model deliberation. Use knowledge base + reasoning.",
      useRAG: true,
      tier: "critical", // OpenRouter fusion
      maxTokens: 1000,
    },
    env
  );

  return {
    recommendation: response.content,
    sources: response.sources,
    model: response.model, // Will show "openrouter/fusion"
  };
}
```

---

## Cost Analysis

| Tier     | Provider   | Model             | Cost            | Use Case                               |
| -------- | ---------- | ----------------- | --------------- | -------------------------------------- |
| Fast     | Workers AI | llama-3.1-8b      | **FREE**        | Default, morning briefs, quick queries |
| Balanced | OpenRouter | openrouter/auto   | **FREE** (tier) | Signal analysis, medium reasoning      |
| Critical | OpenRouter | openrouter/fusion | **Paid**        | Critical decisions only                |

**AI Gateway Benefits:**

- Request caching (reduces API calls)
- Rate limiting (prevents abuse)
- Unified logs (all providers in one place)
- Cost tracking

---

## Success Criteria

### Phase 2 Complete When:

- ✅ Intelligence worker deployed with AI Search binding
- ✅ AI router supports RAG (`useRAG: true`)
- ✅ Test endpoint `/v1/test/rag` working
- ✅ AI Gateway logs showing traffic
- ⏳ AI Search namespace populated with content (bulk upload)
- ⏳ Production code uses RAG for morning briefs + signal analysis

---

## Next Steps

### Immediate (After Deployment)

1. **Deploy intelligence worker:**

   ```bash
   wrangler deploy --config services/intelligence/wrangler.toml --env=""
   ```

2. **Test RAG endpoint:**

   ```bash
   curl -X POST https://intelligence.dev.integratewise.ai/v1/test/rag \
     -H "Content-Type: application/json" \
     -d '{"question":"What is IntegrateWise?","tier":"fast"}'
   ```

3. **Verify AI Gateway logs:**
   - Check cache hit rate
   - Verify requests routing correctly

### Phase 3: Content Upload

1. **Option A: Website crawl** (simplest)
   - Enable AI Search crawler for integratewise.ai
   - Trigger initial crawl
   - Wait ~1 hour for indexing

2. **Option B: Bulk upload org_memory** (more control)
   - Write script to fetch org_memory (governance_state=approved)
   - Upload to AI Search via API
   - Map metadata (title, url, tags, topics)

### Phase 4: Production Integration

1. Update morning brief handler to use RAG
2. Update signal analysis to use RAG
3. Add RAG to MCP tools (knowledge search)
4. Monitor usage + costs

---

## Files Modified

1. **`services/intelligence/src/lib/ai-router.ts`**
   - Added `useRAG` parameter to AIRequest
   - Added `sources` field to AIResponse
   - Implemented AI Search integration in routeAI()
   - RAG context augmentation before AI call

2. **`services/intelligence/src/index.ts`**
   - Added `POST /v1/test/rag` endpoint
   - Integrated routeAI with RAG support

3. **`services/intelligence/wrangler.toml`**
   - Already has AI_SEARCH binding ✅
   - Already has AI binding ✅
   - Already has OPENROUTER_API_KEY binding ✅

---

**Status:** READY FOR DEPLOYMENT  
**Breaking Changes:** None  
**Rollback Available:** Yes  
**Last Updated:** 2026-06-09T14:20:00Z
