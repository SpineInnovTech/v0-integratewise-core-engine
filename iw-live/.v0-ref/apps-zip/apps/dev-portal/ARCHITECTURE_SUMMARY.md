# Glowing Pancake - Complete Architecture

## What's Been Built

### ✅ Phase 1: Dev Portal (DONE)
- **URL:** `https://glowing-pancake.pages.dev`
- **Custom Domain:** `glowingpancake.ai` (when you add it)
- **Features:**
  - 6-tab dashboard (Overview, Architecture, Infrastructure, Gaps, Timeline, AI Context)
  - Responsive design with dark theme
  - Framer Motion animations
  - AI Context Layer (llm.txt, context.json, ai-context.json)

### 🔄 Phase 2: MCP Wiring (IN PROGRESS)
- **MCP Server:** `n8n.glowingpancake.online/mcp-server/http`
- **Tools:** query_context, create_task, trigger_workflow, analyze_with_python
- **Status:** Needs n8n configuration

### ⏳ Phase 3: Python Intelligence (PENDING DEPLOYMENT)
- **Service:** FastAPI backend with 4 agents
  - ChurnShield (churn prediction)
  - SuccessPilot (health scoring)
  - DataSentinel (data quality)
  - ArchitectIQ (architecture recommendations)
- **Status:** Code ready, needs deployment to Fly.io/Vercel

### ⏳ Phase 4: Approval System (NOT BUILT)
- Pending approvals UI in dev portal
- Notification system
- Webhook handlers

## File Structure

```
glowing-pancake/
├── src/                          # Next.js Dev Portal
│   ├── app/                      # Main application
│   ├── components/               # UI components
│   ├── lib/data.ts               # All content data
│   └── ...
├── public/                       # Static assets
│   ├── llm.txt                   # AI context document
│   ├── context.json              # Structured context
│   └── .well-known/              # AI discovery
├── mcp-server/                   # MCP configuration
│   ├── mcp-tools.json            # Tool definitions
│   └── README.md                 # Setup guide
├── python-intelligence/          # ML/AI backend
│   ├── main.py                   # FastAPI server
│   ├── requirements.txt          # Dependencies
│   └── README.md                 # Deployment guide
├── MCP_WIRING.md                 # Complete wiring guide
└── README.md                     # Main documentation
```

## URLs Reference

| Service | Development | Production |
|---------|-------------|------------|
| Dev Portal | `https://glowing-pancake.pages.dev` | `https://glowingpancake.ai` |
| MCP Server | `https://n8n.glowingpancake.online` | Same |
| Python API | `http://localhost:8000` | `https://api.glowingpancake.online` |

## AI Context Endpoints

```
https://glowing-pancake.pages.dev/llm.txt
https://glowing-pancake.pages.dev/context.json
https://glowing-pancake.pages.dev/.well-known/ai-context.json
https://n8n.glowingpancake.online/mcp-server/http
```

## What AI Can Do (When Wired)

1. **Query Context**
   - "What's the current architecture?"
   - "Show me critical gaps"
   - "What's on the timeline?"

2. **Create Tasks**
   - "Create a task to fix Flow B"
   - "Add infrastructure monitoring as high priority"

3. **Run Analysis**
   - "Analyze churn risk for customer ABC"
   - "Generate health score for account XYZ"
   - "Check data quality of events table"

4. **Trigger Workflows**
   - "Run the deployment workflow"
   - "Trigger data sync"

All actions are **approval-based** — AI proposes, you approve, system executes.

## Next Steps (Priority Order)

### 1. Deploy Python Intelligence (30 min)
```bash
cd python-intelligence
fly launch --name glowing-pancake-api
fly deploy
```
Get URL, save it.

### 2. Configure n8n MCP (45 min)
- Enable MCP server in n8n settings
- Create webhook workflows for each tool
- Connect to Python API
- Test with curl

### 3. Connect Claude/Cursor (15 min)
- Add MCP config to AI assistant
- Test tool calls
- Verify responses

### 4. Build Approval UI (2-3 hours)
- Add "Approvals" tab to dev portal
- Show pending AI actions
- Approve/Reject buttons
- Webhook to n8n

### 5. Custom Domain (10 min)
- Add `glowingpancake.ai` in Cloudflare
- Configure DNS
- SSL certificate auto-provisions

## Success Criteria

✅ Dev portal loads at custom domain
✅ AI reads llm.txt and knows Glowing Pancake context
✅ AI can query architecture without hallucinating
✅ AI can create tasks (pending approval)
✅ AI can run Python analysis
✅ All actions require human approval
✅ Approval UI shows pending actions

## Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Dev Portal | ✅ Live | https://glowing-pancake.pages.dev |
| AI Context | ✅ Live | Available at 3 endpoints |
| MCP Server | ⚠️ Config needed | n8n setup required |
| Python API | ⚠️ Deploy needed | Code ready |
| Approval System | ❌ Not built | Needs dev |

## Your Next Action

**Choose one:**

1. **Deploy Python API now** → I guide you through Fly.io
2. **Configure n8n MCP** → I give you exact n8n workflow JSON
3. **Test current setup** → Try the dev portal and AI context
4. **Build approval UI** → I create the React components

What do you want to do next?
