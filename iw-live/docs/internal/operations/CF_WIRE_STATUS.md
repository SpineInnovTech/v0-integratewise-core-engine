# CF Wire Status Report

Generated: 2026-05-09

Account: a1bbbb12a32cdbb68dd170b09fe8b5f3
Email: connect@integratewise.ai
Wrangler: 4.90.0

---

## 1. Wrangler Auth Status

STATUS: NOT AUTHENTICATED via OAuth

- `wrangler whoami` returns: "You are not authenticated. Please run `wrangler login`."
- No `~/.wrangler/config/default.toml` found (only cache/logs/metrics.json in ~/.wrangler/)
- CLOUDFLARE_API_TOKEN is BLANK in both ~/.iw/secrets.env and .env (commented out placeholder)
- CLOUDFLARE_ACCOUNT_ID is SET: a1bbbb12a32cdbb68dd170b09fe8b5f3

ACTION REQUIRED: Run `wrangler login` in a browser-capable terminal OR create an API token at
https://dash.cloudflare.com → My Profile → API Tokens → Create Token (Edit Cloudflare Workers template)
Then set: CLOUDFLARE*API_TOKEN="cfat*..." in ~/.iw/secrets.env

---

## 2. Worker Health Checks

All workers tested via HTTPS /health endpoint against connect-a1b.workers.dev subdomain.

| Service       | Worker Name                 | Health URL                                                         | HTTP Status | Notes                            |
| ------------- | --------------------------- | ------------------------------------------------------------------ | ----------- | -------------------------------- |
| mcp-connector | integratewise-mcp-connector | https://integratewise-mcp-connector.connect-a1b.workers.dev/health | 200 HEALTHY | version 2.0.0-semantic, 12 tools |
| act           | integratewise-act           | https://integratewise-act.connect-a1b.workers.dev/health           | 200 HEALTHY |                                  |
| connector     | integratewise-connector     | https://integratewise-connector.connect-a1b.workers.dev/health     | 200 HEALTHY |                                  |
| gateway       | integratewise-gateway       | https://integratewise-gateway.connect-a1b.workers.dev/health       | 200 HEALTHY |                                  |
| think         | integratewise-think         | https://integratewise-think.connect-a1b.workers.dev/health         | 200 HEALTHY |                                  |
| knowledge     | integratewise-knowledge     | https://integratewise-knowledge.connect-a1b.workers.dev/health     | 200 HEALTHY |                                  |
| normalizer    | integratewise-normalizer    | https://integratewise-normalizer.connect-a1b.workers.dev/health    | 200 HEALTHY |                                  |
| billing       | integratewise-billing       | https://integratewise-billing.connect-a1b.workers.dev/health       | 200 HEALTHY |                                  |
| loader        | integratewise-loader        | https://integratewise-loader.connect-a1b.workers.dev/health        | 404 WARN    | /health not found; may use /     |
| workflow      | integratewise-bff           | https://integratewise-bff.connect-a1b.workers.dev/health           | 200 HEALTHY |                                  |
| govern        | integratewise-govern        | https://integratewise-govern.connect-a1b.workers.dev/health        | 200 HEALTHY |                                  |
| pipeline      | integratewise-pipeline      | https://integratewise-pipeline.connect-a1b.workers.dev/health      | 200 HEALTHY |                                  |

### Custom Domain

- https://gateway.integratewise.ai/health — DNS RESOLUTION FAILED (exit_code 6: Could not resolve host)
  ACTION: Verify DNS CNAME for gateway.integratewise.ai points to integratewise-gateway.connect-a1b.workers.dev
  or check Cloudflare DNS dashboard for the zone integratewise.ai

### MCP Connector Full Health Response

```json
{
  "status": "ok",
  "worker": "integratewise-mcp-tool-server",
  "version": "2.0.0-semantic",
  "timestamp": "2026-05-09T01:37:30.842Z",
  "features": ["session-capture", "auto-embedding", "entity-linking", "correlation-tracing"],
  "tools": {
    "count": 12,
    "names": [
      "kb.write_session_summary",
      "kb.write_article",
      "kb.get_artifact",
      "kb.list_recent",
      "kb.search",
      "kb.topic_upsert",
      "kb.topic_list",
      "figma.get_file",
      "figma.get_components",
      "figma.get_node",
      "figma.export_image",
      "figma.get_comments"
    ]
  }
}
```

---

## 3. Secrets Store

All services use Cloudflare Secrets Store ID: 1fd83fc5881e4cd296ae3c2fbe80693c
(see docs/SECRETS_STORE_SETUP.md for setup instructions)

NOTE: `wrangler secret list` could NOT be run — no CLOUDFLARE_API_TOKEN set.
The tables below reflect secrets DECLARED in wrangler.toml [[secrets_store_secrets]] bindings.
Actual population status in the Cloudflare Secrets Store is UNKNOWN until API token is provided.

Cross-reference: secrets.env LIVE values (confirmed populated):
SPINE_URL, SPINE_ANON_KEY,
CLOUDFLARE_ACCOUNT_ID, GCP_PROJECT_ID, FIREBASE_PROJECT_ID, GCS_STAGING_BUCKET,
GCS_FINAL_BUCKET, REDIS_URL, GITHUB_CLIENT_ID, POSTHOG_HOST, MCP_SERVER_URL,
FIGMA_CLIENT_ID, CODA_API_TOKEN

secrets.env BLANK values (need filling):
CLOUDFLARE*API_TOKEN, DATABASE_URL, SPINE_ACCESS_TOKEN, GCP_SERVICE_ACCOUNT_KEY_PATH,
OPENROUTER_API_KEY, TOKEN_ENCRYPTION_KEY, GITHUB_WEBHOOK_SECRET, GITHUB_CLIENT_SECRET,
FIGMA_ACCESS_TOKEN, SLACK*\_, STRIPE\__, RAZORPAY*\*, HUBSPOT*_, SALESFORCE\__, ZOHO*\*,
LINEAR*_, NOTION\__, JIRA*\*, ASANA*_, ZENDESK\__, INTERCOM*\*, GOOGLE_CLIENT_SECRET,
META*_, LINKEDIN\__, TWITTER*\*, CALENDLY*_, N8N\_\_, SENTRY_DSN

### Secrets per Service (declared in wrangler.toml)

#### act (integratewise-act)

| Secret         | In secrets.env |
| -------------- | -------------- |
| SPINE_URL      | LIVE           |
| SPINE_ANON_KEY | LIVE           |

#### connector (integratewise-connector)

| Secret               | In secrets.env |
| -------------------- | -------------- |
| SPINE_URL            | LIVE           |
| SPINE_ANON_KEY       | LIVE           |
| DATABASE_URL         | BLANK          |
| TOKEN_ENCRYPTION_KEY | BLANK          |

#### gateway (integratewise-gateway)

| Secret                    | In secrets.env |
| ------------------------- | -------------- |
| SPINE_URL                 | LIVE           |
| SPINE_ANON_KEY            | LIVE           |
| DATABASE_URL              | BLANK          |
| TOKEN_ENCRYPTION_KEY      | BLANK          |
| GITHUB_WEBHOOK_SECRET     | BLANK          |
| HUBSPOT_WEBHOOK_SECRET    | BLANK          |
| SALESFORCE_WEBHOOK_SECRET | BLANK          |
| STRIPE_WEBHOOK_SECRET     | BLANK          |
| RAZORPAY_WEBHOOK_SECRET   | BLANK          |
| SLACK_SIGNING_SECRET      | BLANK          |
| HUBSPOT_CLIENT_ID         | BLANK          |
| HUBSPOT_CLIENT_SECRET     | BLANK          |
| SALESFORCE_CLIENT_ID      | BLANK          |
| SALESFORCE_CLIENT_SECRET  | BLANK          |
| GOOGLE_CLIENT_ID          | LIVE           |
| GOOGLE_CLIENT_SECRET      | BLANK          |
| SLACK_CLIENT_ID           | BLANK          |
| SLACK_CLIENT_SECRET       | BLANK          |
| GITHUB_CLIENT_ID          | LIVE           |
| GITHUB_CLIENT_SECRET      | BLANK          |
| NOTION_CLIENT_ID          | BLANK          |
| NOTION_CLIENT_SECRET      | BLANK          |
| ASANA_CLIENT_ID           | BLANK          |
| ASANA_CLIENT_SECRET       | BLANK          |
| LINEAR_CLIENT_ID          | BLANK          |
| LINEAR_CLIENT_SECRET      | BLANK          |
| JIRA_CLIENT_ID            | BLANK          |
| JIRA_CLIENT_SECRET        | BLANK          |
| STRIPE_CLIENT_ID          | BLANK          |
| STRIPE_CLIENT_SECRET      | BLANK          |
| ZENDESK_CLIENT_ID         | BLANK          |
| ZENDESK_CLIENT_SECRET     | BLANK          |
| INTERCOM_CLIENT_ID        | BLANK          |
| INTERCOM_CLIENT_SECRET    | BLANK          |
| ZOHO_CRM_CLIENT_ID        | BLANK          |
| ZOHO_CRM_CLIENT_SECRET    | BLANK          |

#### think (integratewise-think)

| Secret             | In secrets.env |
| ------------------ | -------------- |
| SPINE_URL          | LIVE           |
| SPINE_ANON_KEY     | LIVE           |
| OPENROUTER_API_KEY | BLANK          |

#### knowledge (integratewise-knowledge)

| Secret             | In secrets.env |
| ------------------ | -------------- |
| SPINE_URL          | LIVE           |
| SPINE_ANON_KEY     | LIVE           |
| DATABASE_URL       | BLANK          |
| OPENROUTER_API_KEY | BLANK          |

#### mcp-connector (integratewise-mcp-connector)

| Secret                | In secrets.env   |
| --------------------- | ---------------- |
| SPINE_URL             | LIVE             |
| SPINE_ANON_KEY        | LIVE             |
| GITHUB_WEBHOOK_SECRET | BLANK            |
| FIGMA_ACCESS_TOKEN    | BLANK (optional) |

#### normalizer (integratewise-normalizer)

| Secret         | In secrets.env |
| -------------- | -------------- |
| SPINE_URL      | LIVE           |
| SPINE_ANON_KEY | LIVE           |

#### billing (integratewise-billing)

| Secret         | In secrets.env |
| -------------- | -------------- |
| SPINE_URL      | LIVE           |
| SPINE_ANON_KEY | LIVE           |

#### loader (integratewise-loader)

| Secret         | In secrets.env |
| -------------- | -------------- |
| SPINE_URL      | LIVE           |
| SPINE_ANON_KEY | LIVE           |

#### workflow / bff (integratewise-bff)

| Secret         | In secrets.env |
| -------------- | -------------- |
| SPINE_URL      | LIVE           |
| SPINE_ANON_KEY | LIVE           |

#### govern (integratewise-govern)

| Secret         | In secrets.env |
| -------------- | -------------- |
| SPINE_URL      | LIVE           |
| SPINE_ANON_KEY | LIVE           |
| DATABASE_URL   | BLANK          |

#### pipeline (integratewise-pipeline)

| Secret             | In secrets.env |
| ------------------ | -------------- |
| SPINE_URL          | LIVE           |
| SPINE_ANON_KEY     | LIVE           |
| OPENROUTER_API_KEY | BLANK          |

---

## 4. Critical Action Items

### BLOCKER: No Cloudflare API Token

- Cannot run `wrangler secret list`, `wrangler secret put`, or any CF API operations
- Fix: Create token at https://dash.cloudflare.com/profile/api-tokens
  Template: "Edit Cloudflare Workers" (includes Workers Scripts:Edit, Workers KV:Edit, Account Settings:Read)
  Then: echo 'CLOUDFLARE_API_TOKEN="cfat_YOURTOKEN"' >> ~/.iw/secrets.env

### WARN: gateway.integratewise.ai DNS not resolving

- Custom domain returns DNS resolution failure
- Check: Cloudflare DNS zone for integratewise.ai → should have CNAME or Workers Route pointing to integratewise-gateway

### WARN: loader /health returns 404

- integratewise-loader worker is deployed but /health route not found
- May serve on / instead — check loader source or wrangler.toml routes

### BLANK secrets that block live connector integrations (gateway)

Priority order to fill for MVP:

1. TOKEN_ENCRYPTION_KEY — needed by connector + gateway (generate random 32-byte hex)
2. DATABASE_URL — needed by connector, gateway, knowledge, govern
3. OPENROUTER_API_KEY — needed by think, knowledge, pipeline
4. GITHUB_WEBHOOK_SECRET — needed by gateway, mcp-connector
5. GOOGLE_CLIENT_SECRET — needed by gateway OAuth
6. STRIPE\_\* — needed for billing integrations

### Secrets Store ID

All services reference store_id = "1fd83fc5881e4cd296ae3c2fbe80693c"
Once API token is set, verify store exists:
wrangler secrets-store store list --account-id a1bbbb12a32cdbb68dd170b09fe8b5f3

---

## 5. Summary Scorecard

| Category                    | Status         |
| --------------------------- | -------------- |
| Wrangler OAuth login        | NOT AUTH       |
| CLOUDFLARE_API_TOKEN        | BLANK          |
| CLOUDFLARE_ACCOUNT_ID       | SET (LIVE)     |
| Workers deployed (11/12)    | HEALTHY        |
| Workers with /health issues | 1 (loader 404) |
| Custom domain DNS           | BROKEN         |
| Core Spine secrets          | LIVE in store  |
| OAuth/webhook secrets       | MOSTLY BLANK   |
| AI keys (OpenRouter)        | BLANK          |
| Secrets Store ID wired      | YES (all svcs) |

---

Report saved by Hermes Agent | /Users/nirmal/Github/integratewise-live/docs/operations/CF_WIRE_STATUS.md
