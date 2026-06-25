# Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Cloudflare account with Workers paid plan
- Spine DB project
- Wrangler CLI authenticated

## Local Development

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your Cloudflare + Spine DB credentials

# Typecheck
pnpm typecheck  # Must be 31/31

# Run tests
pnpm test

# Start all services
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
killall -9 workerd wrangler 2>/dev/null; sleep 2; pnpm dev
```

## Production Deployment

All services deploy to Cloudflare Workers via GitHub Actions.

### CI/CD Pipeline (OpenClaw Triage)

```
Push → PR → OpenClaw Triage (multi-model review) → Tests → Build → Merge → Auto-deploy
```

### Triage Levels

| Level | Trigger     | Reviewers             |
| ----- | ----------- | --------------------- |
| L0    | Docs only   | Auto-approve          |
| L1    | UI changes  | Kimi + Human          |
| L2    | API changes | Kimi + Claude + Human |
| L3    | Core/Auth   | All + Nirmal          |

### Manual Deploy

```bash
# Deploy single service
pnpm --filter @integratewise/gateway exec wrangler deploy

# Deploy all
pnpm deploy
```

### Secrets

Set via Cloudflare Secrets Store or wrangler:

```bash
wrangler secret put SPINE_URL
wrangler secret put SPINE_ANON_KEY
wrangler secret put OPENROUTER_API_KEY
```

## Service Health

| Service     | Health Endpoint |
| ----------- | --------------- |
| Gateway     | `GET /health`   |
| All Workers | `GET /health`   |
| MCP         | `GET /health`   |

## Rollback

```bash
# List deployments
wrangler deployments list --name integratewise-gateway

# Rollback to previous
wrangler rollback --name integratewise-gateway
```
