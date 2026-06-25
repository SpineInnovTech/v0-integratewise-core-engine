#!/usr/bin/env bash
# =============================================================================
# Deploy all (or one) Cloudflare Workers — no Doppler required.
# For CI/CD (GitHub Actions) or local: set CLOUDFLARE_API_TOKEN and run.
# =============================================================================
# Usage:
#   ./scripts/deploy-all-workers.sh [environment] [service]
#   ./scripts/deploy-all-workers.sh production           # all workers
#   ./scripts/deploy-all-workers.sh production gateway   # gateway only
#   ./scripts/deploy-all-workers.sh staging              # all to staging
# =============================================================================

set -euo pipefail

DEPLOY_ENV="${1:-dev}"

if [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "prod" ]; then
  DEPLOY_ENV="prod"
  # Enforce Policy: No direct production deployments of Workers from local terminals
  if [ "${GITHUB_ACTIONS:-false}" != "true" ] && [ "${CI:-false}" != "true" ] && [ "${ALLOW_LOCAL_PROD_DEPLOY:-false}" != "true" ]; then
    echo "❌ Error: Direct production deployments of Workers from local terminal are blocked by policy."
    echo "   Please deploy to staging/test instead: $0 staging"
    echo "   Or set ALLOW_LOCAL_PROD_DEPLOY=true if you have explicit founder authorization."
    exit 1
  fi
elif [ "$DEPLOY_ENV" = "staging" ] || [ "$DEPLOY_ENV" = "test" ]; then
  DEPLOY_ENV="test"
fi
TARGET_SERVICE="${2:-all}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Deploy order: downstream first, gateway last (v3.6 consolidated Workers)
SERVICES=(
  pipeline
  connector
  mcp-connector
  intelligence
  knowledge
  workflow
  connector-sync
  webhook-ingress
  folder-watcher
  continuity
  l2
  gateway
)

deploy_service() {
  local svc="$1"
  local toml="services/$svc/wrangler.toml"

  if [ ! -f "$toml" ]; then
    echo "⚠️  Skipping $svc — $toml not found"
    return 0
  fi

  if grep -q "^\[env\.${DEPLOY_ENV}\]" "$toml" 2>/dev/null; then
    ENV_FLAG="--env $DEPLOY_ENV"
  else
    ENV_FLAG=""
  fi

  echo "🚀 Deploying $svc (env: ${DEPLOY_ENV:-top-level})..."
  if pnpm exec wrangler deploy -c "$toml" $ENV_FLAG --keep-vars 2>&1; then
    echo "✅ $svc deployed"
    return 0
  else
    echo "❌ $svc failed"
    return 1
  fi
}

echo "Installing dependencies..."
pnpm install --frozen-lockfile

DEPLOYED=0
FAILED=0
FAILED_SERVICES=()

if [ "$TARGET_SERVICE" = "all" ]; then
  for svc in "${SERVICES[@]}"; do
    if deploy_service "$svc"; then
      ((DEPLOYED++)) || true
    else
      ((FAILED++)) || true
      FAILED_SERVICES+=("$svc")
    fi
  done
else
  if deploy_service "$TARGET_SERVICE"; then
    ((DEPLOYED++)) || true
  else
    ((FAILED++)) || true
    FAILED_SERVICES+=("$TARGET_SERVICE")
  fi
fi

echo ""
echo "════════════════════════════════════════"
echo " ✅ Deployed: $DEPLOYED   ❌ Failed: $FAILED"
[ ${#FAILED_SERVICES[@]} -gt 0 ] && echo " Failed: ${FAILED_SERVICES[*]}"
echo "════════════════════════════════════════"

[ $FAILED -gt 0 ] && exit 1
exit 0
