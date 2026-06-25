#!/usr/bin/env bash
# Deploy a single Worker from repo root for Cloudflare Builds (Git integration).
# Usage: ./scripts/cloudflare-deploy-worker.sh <service> [env]
# Example: ./scripts/cloudflare-deploy-worker.sh gateway production
# Cloudflare Build: set root directory to repo root, deploy command to:
#   ./scripts/cloudflare-deploy-worker.sh gateway production

set -euo pipefail

SERVICE="${1:?Usage: $0 <service> [env]. Service: pipeline|connector|intelligence|knowledge|bff|l2|gateway}"
ENV="${2:-dev}"

if [ "$ENV" = "production" ] || [ "$ENV" = "prod" ]; then
  ENV="prod"
  # Enforce Policy: No direct production deployments of Workers from local terminals
  if [ "${GITHUB_ACTIONS:-false}" != "true" ] && [ "${CI:-false}" != "true" ] && [ "${ALLOW_LOCAL_PROD_DEPLOY:-false}" != "true" ]; then
    echo "❌ Error: Direct production deployments of Workers from local terminal are blocked by policy."
    echo "   Please deploy to staging/test instead: $0 $SERVICE staging"
    echo "   Or set ALLOW_LOCAL_PROD_DEPLOY=true if you have explicit founder authorization."
    exit 1
  fi
elif [ "$ENV" = "staging" ] || [ "$ENV" = "test" ]; then
  ENV="test"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

case "$SERVICE" in
  pipeline)        WRANGLER_CONFIG="services/pipeline/wrangler.toml" ;;
  connector)       WRANGLER_CONFIG="services/connector/wrangler.toml" ;;
  mcp-connector)   WRANGLER_CONFIG="services/mcp-connector/wrangler.toml" ;;
  intelligence)    WRANGLER_CONFIG="services/intelligence/wrangler.toml" ;;
  knowledge)       WRANGLER_CONFIG="services/knowledge/wrangler.toml" ;;
  workflow)        WRANGLER_CONFIG="services/workflow/wrangler.toml" ;;
  connector-sync)  WRANGLER_CONFIG="services/connector-sync/wrangler.toml" ;;
  webhook-ingress) WRANGLER_CONFIG="services/webhook-ingress/wrangler.toml" ;;
  folder-watcher)  WRANGLER_CONFIG="services/folder-watcher/wrangler.toml" ;;
  continuity)      WRANGLER_CONFIG="services/continuity/wrangler.toml" ;;
  l2)              WRANGLER_CONFIG="services/l2/wrangler.toml" ;;
  gateway)         WRANGLER_CONFIG="services/gateway/wrangler.toml" ;;
  *)
    echo "Unknown service: $SERVICE"
    echo "Valid: pipeline, connector, mcp-connector, intelligence, knowledge, workflow, connector-sync, webhook-ingress, folder-watcher, continuity, l2, gateway"
    exit 1
    ;;
esac

if [ ! -f "$WRANGLER_CONFIG" ]; then
  echo "Config not found: $WRANGLER_CONFIG"
  exit 1
fi

echo "Installing dependencies..."
pnpm install --frozen-lockfile

if grep -q "^\[env\.${ENV}\]" "$WRANGLER_CONFIG"; then
  echo "Deploying $SERVICE with explicit environment: $ENV"
  pnpm exec wrangler deploy -c "$WRANGLER_CONFIG" --env "$ENV" --keep-vars
else
  echo "No [env.${ENV}] found in $WRANGLER_CONFIG, deploying top-level config explicitly."
  pnpm exec wrangler deploy -c "$WRANGLER_CONFIG" --env "" --keep-vars
fi
