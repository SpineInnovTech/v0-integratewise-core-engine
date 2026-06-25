# IntegrateWise MCP - Quick Start

## ✅ Setup Complete

Your Kiro MCP configuration is ready with **12 IntegrateWise tools** (Knowledge Bank + Memory Layer).

**Note**: Figma is NOT included - it's a connector (product feature), not an MCP tool for Kiro.

## 🚀 Quick Start (3 Steps)

### 1. Set Environment Variables

Add to `~/.zshrc`:

```bash
export INTEGRATEWISE_MCP_TOKEN="your_jwt_or_api_key"
export INTEGRATEWISE_TENANT_ID="your_tenant_uuid"
```

Then: `source ~/.zshrc`

### 2. Restart Kiro

Restart Kiro or reconnect MCP servers from the MCP Server view.

### 3. Test Connection

```bash
cd ~/Github/integratewise-live
./scripts/test-mcp-connection.sh
```

## 📋 Available Tools (12)

### Knowledge Bank (7 tools)

- `kb.search` - Search your Knowledge Bank ✓ auto-approved
- `kb.list_recent` - List recent artifacts ✓ auto-approved
- `kb.get_artifact` - Get artifact details ✓ auto-approved
- `kb.topic_list` - List topics ✓ auto-approved
- `kb.write_session_summary` - Write session summaries
- `kb.write_article` - Create KB articles
- `kb.topic_upsert` - Manage topic policies

### Memory Layer (5 tools)

- `memory.read_conversational` - Read session history ✓ auto-approved
- `memory.search_org` - Search org memory ✓ auto-approved
- `memory.write_conversational` - Write session context
- `memory.upsert_org` - Update org memory
- `memory.propose` - Propose memory entries

## 🔍 What Kiro Can Now Do

- **Search your Knowledge Bank** for past decisions, patterns, and insights
- **Read session memories** to understand context and history
- **Propose organizational knowledge** for team-wide learning
- **Write session summaries** to capture important conversations

## 📖 Full Documentation

See `docs/MCP_SETUP_COMPLETE.md` for detailed information.

---

**Status**: ✅ Ready to use
**Endpoint**: `https://gateway.integratewise.ai/api/v1/connector`
**Auto-approved tools**: 6 read-only tools
**Approval required**: 6 write tools
**Total**: 12 tools (Figma excluded - it's a connector, not an MCP tool)
