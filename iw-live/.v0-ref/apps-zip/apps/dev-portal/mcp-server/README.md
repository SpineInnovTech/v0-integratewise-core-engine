# Glowing Pancake MCP Server

Model Context Protocol (MCP) server for AI-to-System integration.

## Architecture

```
AI Assistant (Claude/GPT)
    ↓ MCP Protocol
n8n MCP Server (n8n.glowingpancake.online)
    ↓ Webhooks
Cloudflare Workers
    ↓ API Calls
Python Intelligence Service
    ↓ Data/Actions
Supabase/Neon/External APIs
```

## MCP Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/mcp-server/http` | Primary MCP HTTP endpoint |
| `/mcp-server/sse` | Server-Sent Events for streaming |
| `/webhook/ingest` | Data ingestion from external tools |

## Tools Exposed to AI

### 1. Knowledge Tools
- `query_context` - Query the knowledge base
- `get_architecture` - Get system architecture
- `get_timeline` - Get evolution timeline

### 2. Action Tools
- `create_task` - Create a task in the system
- `update_status` - Update project status
- `trigger_workflow` - Trigger n8n workflow

### 3. Intelligence Tools
- `analyze_data` - Run Python analysis
- `generate_report` - Generate intelligence report
- `predict_churn` - Churn prediction via ML

## n8n Configuration

### MCP Server Setup
1. n8n → Settings → MCP Server
2. Enable MCP Server
3. Set endpoint: `https://n8n.glowingpancake.online/mcp-server`
4. Configure tools in `mcp-tools.json`

### Webhook Workflows
- `webhook-tool-ingest` - Tool data ingestion
- `webhook-context-update` - Context updates
- `webhook-ai-action` - AI-triggered actions

## Security

- API Key authentication required
- Rate limiting: 100 requests/minute
- Request signing for webhooks
- RLS on all database queries

## Testing

```bash
# Test MCP connection
curl -X POST https://n8n.glowingpancake.online/mcp-server/http \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```
