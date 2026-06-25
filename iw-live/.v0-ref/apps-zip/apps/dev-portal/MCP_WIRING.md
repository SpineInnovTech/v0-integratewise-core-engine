# Glowing Pancake - MCP Wiring Guide

Complete guide to wire up MCP, n8n, Python Intelligence, and the Dev Portal.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI ASSISTANT (Claude/GPT)                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Reads: https://glowingpancake.ai/.well-known/ai-context.json          ││
│  │  Grounds itself on llm.txt + context.json                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ MCP Protocol
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP SERVER (n8n)                                     │
│  URL: https://n8n.glowingpancake.online/mcp-server/http                     │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ query_context│  │ create_task  │  │trigger_work- │  │ analyze_with │    │
│  │              │  │              │  │   flow       │  │   python     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        n8n WORKFLOWS                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  WEBHOOK WORKFLOWS                                                   │   │
│  │  ├─ webhook-context-query → Query Supabase/Neon                     │   │
│  │  ├─ webhook-task-create → Insert to task DB                        │   │
│  │  ├─ webhook-workflow-trigger → Execute n8n workflow                │   │
│  │  └─ webhook-python-analysis → HTTP to Python API                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP / Database
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PYTHON INTELLIGENCE SERVICE                              │
│  URL: https://api.glowingpancake.online (or your deployment)               │
│                                                                             │
│  Agents:                                                                    │
│  ├─ ChurnShield (/api/v1/analyze/churn)                                    │
│  ├─ SuccessPilot (/api/v1/analyze/health)                                  │
│  ├─ DataSentinel (/api/v1/analyze/quality)                                 │
│  └─ ArchitectIQ (/api/v1/analyze/architecture)                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                           │
│  ├─ Supabase (Auth + Truth Storage)                                        │
│  ├─ Neon PostgreSQL (Event Store)                                          │
│  └─ Cloudflare R2 (File Storage)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Wiring

### Step 1: Deploy Python Intelligence Service

**Option A: Cloudflare Workers (Python)**
```bash
cd python-intelligence
pip install -r requirements.txt
# Deploy to Workers
npx wrangler deploy
```

**Option B: Vercel**
```bash
cd python-intelligence
vercel --prod
# Get URL: https://glowing-pancake-api.vercel.app
```

**Option C: Fly.io (Recommended)**
```bash
cd python-intelligence
fly launch --name glowing-pancake-api
fly deploy
# Get URL: https://glowing-pancake-api.fly.dev
```

Save the Python API URL for n8n configuration.

---

### Step 2: Configure n8n MCP Server

1. **Go to your n8n instance:** `https://n8n.glowingpancake.online`

2. **Enable MCP Server:**
   - Settings → MCP Server
   - Enable: ☑️ MCP Server
   - Base URL: `https://n8n.glowingpancake.online/mcp-server`
   - Save

3. **Create MCP Tools Workflow:**
   - Create new workflow
   - Add "Webhook" node (Method: POST, Path: `/mcp-tools`)
   - Add "Function" node with this code:

```javascript
// Return available tools
return {
  json: {
    jsonrpc: "2.0",
    result: {
      tools: [
        {
          name: "query_context",
          description: "Query Glowing Pancake knowledge base",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", enum: ["architecture", "gaps", "timeline", "status"] }
            },
            required: ["query"]
          }
        },
        {
          name: "analyze_with_python",
          description: "Run Python ML analysis",
          parameters: {
            type: "object",
            properties: {
              analysis_type: { type: "string", enum: ["churn_prediction", "health_score"] }
            },
            required: ["analysis_type"]
          }
        }
      ]
    },
    id: $input.json.id
  }
};
```

4. **Create Tool Execution Workflows:**

**For `query_context`:**
```javascript
// Webhook → HTTP Request (to dev portal API) → Return
// Or query Supabase directly
const query = $input.json.params.query;

// Fetch from your data source
const response = await $httpRequest({
  method: "GET",
  url: `https://glowing-pancake.pages.dev/context.json`
});

return {
  json: {
    jsonrpc: "2.0",
    result: response.body,
    id: $input.json.id
  }
};
```

**For `analyze_with_python`:**
```javascript
// Call Python API
const analysisType = $input.json.params.analysis_type;

const response = await $httpRequest({
  method: "POST",
  url: "https://YOUR-PYTHON-API.fly.dev/api/v1/analyze/churn",
  body: {
    customer_id: "123",
    usage_data: {}
  }
});

return {
  json: {
    jsonrpc: "2.0",
    result: response.body,
    id: $input.json.id
  }
};
```

---

### Step 3: Test MCP Connection

```bash
# Test MCP server is responding
curl -X POST https://n8n.glowingpancake.online/mcp-server/http \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Should return available tools
```

---

### Step 4: Connect AI Assistant

**For Claude (Anthropic):**
1. Go to Claude Desktop → Settings → MCP
2. Add server:
```json
{
  "mcpServers": {
    "glowing-pancake": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-proxy"],
      "env": {
        "MCP_SERVER_URL": "https://n8n.glowingpancake.online/mcp-server/http"
      }
    }
  }
}
```

**For Cursor:**
1. Settings → MCP
2. Add:
```json
{
  "servers": [
    {
      "name": "glowing-pancake",
      "url": "https://n8n.glowingpancake.online/mcp-server/http"
    }
  ]
}
```

**For Custom AI:**
```python
from mcp import ClientSession, StdioServerParameters

# Connect to MCP server
async with ClientSession(server_url="https://n8n.glowingpancake.online/mcp-server/http") as session:
    # List available tools
    tools = await session.list_tools()
    
    # Call a tool
    result = await session.call_tool("query_context", {"query": "architecture"})
```

---

### Step 5: Update Dev Portal MCP Status

Once wired, update `src/lib/data.ts`:

```typescript
export const INFRA_NODES = [
  // ... other nodes
  {
    name: "MCP Server",
    role: "AI-System Bridge",
    className: "infra-mcp",
    tags: ["n8n.glowingpancake.online/mcp-server", "Claude", "GPT", "Tools"],
    status: "active"  // Update this!
  },
  {
    name: "Python Intelligence",
    role: "ML/AI Backend",
    className: "infra-python",
    tags: ["Fly.io/Vercel", "ChurnShield", "SuccessPilot"],
    status: "active"
  }
];
```

---

## Approval-Based Workflow

All AI actions require human approval:

```
AI Request → n8n → Create Approval Task → Human Approves → Execute
                ↓
         Store in "pending_approvals" table
         Send notification (email/Slack)
         Wait for webhook callback
```

**n8n Approval Workflow:**
1. AI calls `create_task` or `update_context`
2. n8n creates record in `pending_approvals` (Supabase)
3. n8n sends notification to you
4. You review at `https://glowingpancake.ai/approvals`
5. You approve/reject
6. n8n executes or cancels

---

## Monitoring

| Service | Health Endpoint |
|---------|-----------------|
| Dev Portal | `https://glowing-pancake.pages.dev` |
| MCP Server | `https://n8n.glowingpancake.online/health` |
| Python API | `https://YOUR-API.fly.dev/health` |
| n8n | `https://n8n.glowingpancake.online` |

---

## Next Actions

1. **Deploy Python API** → Get URL
2. **Configure n8n MCP** → Add workflows
3. **Test connection** → Run curl test
4. **Connect Claude/Cursor** → Add MCP config
5. **Build approval UI** → Add to dev portal

**Which step do you want to tackle first?**
