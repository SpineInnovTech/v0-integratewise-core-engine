# IntegrateWise n8n Workflows

> ⚠️ **SUPERSEDED (v3.7, June 2026).** n8n is NOT IntegrateWise infrastructure.
> Workflow orchestration is Cloudflare Workflows + Queues (`services/workflow`) and the
> Twin runtime (`services/iw-agent-runtime`). The n8n workflow JSON in this folder is a
> legacy export kept for reference only — do not treat it as the live workflow path.
> Canonical: `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md` + `AGENTS.md` (DECISION 18).

## Your Live MCP Endpoint

```
https://integratewise-mcp-connector.connect-a1b.workers.dev
```

## Workflows Included

### 1. Morning Brief (Simple)

**File:** `morning-brief-simple.json`

- Runs daily at 8 AM
- Generates static brief content
- Sends email to nirmpapri@gmail.com
- No external API dependencies

### 2. Morning Brief (with MCP)

**File:** `morning-brief-with-mcp.json`

- Runs daily at 8 AM
- Checks MCP health status
- Generates AI-powered brief using Think service
- Sends personalized email
- **Requires:** Email credentials in n8n

### 3. Weekly LinkedIn Post

**File:** `weekly-linkedin-post.json`

- Runs Wednesdays at 10 AM
- Generates AI content for LinkedIn
- Sends for review via email
- **Requires:** Email credentials in n8n

## Setup Instructions

### Step 1: Import Workflows

1. Open your n8n instance (GCP: `https://n8n.integratewise.co`)
2. Go to Workflows → Import from File
3. Import the JSON files one by one

### Step 2: Configure Credentials

1. Go to Settings → Credentials
2. Add Email (SMTP) credentials:
   - **SendGrid:** smtp.sendgrid.net:587
   - **Resend:** smtp.resend.com:587
   - Username: `apikey`
   - Password: Your API key

### Step 3: Activate Workflows

1. Open each workflow
2. Click "Active" toggle
3. Test manually first (click "Execute Workflow")

### Step 4: Verify

Check your email at 8 AM tomorrow for the first morning brief!

## Testing Without Email

You can test the workflows without email by:

1. Replacing "Send Email" node with "No Operation" node
2. Or setting up a webhook to receive the data

## Live Service Endpoints

Use these in your workflows:

- **MCP:** `https://integratewise-mcp-connector.connect-a1b.workers.dev`
- **Think (AI):** `https://integratewise-think.connect-a1b.workers.dev`
- **Knowledge:** `https://integratewise-knowledge.connect-a1b.workers.dev`
- **Gateway:** `https://integratewise-gateway.connect-a1b.workers.dev`

## Troubleshooting

### MCP Health Check Fails

```bash
# Test manually
curl https://integratewise-mcp-connector.connect-a1b.workers.dev/health
```

### AI Brief Not Generated

- Check Think service: `curl https://integratewise-think.connect-a1b.workers.dev`
- Verify OPENROUTER_API_KEY is configured

### Email Not Sent

- Verify SMTP credentials in n8n
- Check spam folders
- Try SendGrid or Resend free tier
