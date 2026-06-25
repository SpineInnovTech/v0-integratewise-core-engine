#!/bin/bash
set -e

# ============================================================================
# Sync Doppler Secrets → Cloudflare Workers
# ============================================================================
# Run this after rotating secrets to push them to all Workers.
#
# NOTE: web-unified does NOT use this script. It is a Cloudflare Pages
# project and gets its VITE_* env vars at BUILD TIME via:
#   doppler run --config prd_web-unified -- npm run build
# See: scripts/deploy-with-doppler.sh  /  .github/workflows/deploy.yml
# ============================================================================
# Usage:
#   ./sync-doppler-to-workers.sh              # Sync all services (production)
#   ./sync-doppler-to-workers.sh staging       # Sync all services (staging)
#   ./sync-doppler-to-workers.sh production pipeline  # Sync one service
# ============================================================================

PROJECT="integratewise"
TARGET_ENV="${1:-production}"
TARGET_SERVICE="${2:-}"

# Normalize env name to Doppler prefix
case "$TARGET_ENV" in
  production|prd) DOPPLER_PREFIX="prd" ; WRANGLER_ENV="prod" ;;
  staging|stg|test) DOPPLER_PREFIX="stg" ; WRANGLER_ENV="test" ;;
  dev|development) DOPPLER_PREFIX="dev" ; WRANGLER_ENV="" ;;
  *) echo "❌ Unknown environment: $TARGET_ENV"; exit 1 ;;
esac

echo "🔄 Syncing Doppler → Cloudflare Workers"
echo "========================================"
echo "  Environment : ${WRANGLER_ENV:-default} (Doppler prefix: ${DOPPLER_PREFIX}_)"
[ -n "$TARGET_SERVICE" ] && echo "  Service     : $TARGET_SERVICE"
echo ""

# All active Worker services (v3.6 consolidated)
ALL_SERVICES=(
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

# If a specific service was requested, filter
if [ -n "$TARGET_SERVICE" ]; then
  SERVICES=("$TARGET_SERVICE")
else
  SERVICES=("${ALL_SERVICES[@]}")
fi

# Check prerequisites
if ! command -v doppler &>/dev/null; then
  echo "❌ Doppler CLI not found. Install: https://docs.doppler.com/docs/install-cli"
  exit 1
fi
if ! command -v wrangler &>/dev/null; then
  echo "❌ Wrangler CLI not found. Install: npm i -g wrangler"
  exit 1
fi
if ! doppler whoami &>/dev/null; then
  echo "❌ Not authenticated with Doppler. Run: doppler login"
  exit 1
fi

SYNCED=0
FAILED=0

for service in "${SERVICES[@]}"; do
  config_name="${DOPPLER_PREFIX}_${service}"
  wrangler_toml="services/$service/wrangler.toml"

  # Check wrangler.toml exists
  if [ ! -f "$wrangler_toml" ]; then
    echo "⚠️  Skipping $service — no $wrangler_toml"
    ((FAILED++)) || true
    continue
  fi

  echo "📦 Syncing $service (config: $config_name)..."

  # Download secrets from Doppler as JSON
  secrets_json=$(doppler secrets download \
    --config "$config_name" \
    --project "$PROJECT" \
    --format json \
    --no-file 2>/dev/null) || {
    echo "  ⚠️  Could not fetch Doppler config $config_name — skipping"
    ((FAILED++)) || true
    continue
  }

  # Extract secret keys and values, push to Cloudflare
  echo "$secrets_json" | jq -r 'to_entries[] | "\(.key)=\(.value)"' | while IFS='=' read -r key value; do
    # Skip VITE_* keys — they are for the frontend (web-unified), not Workers
    if [[ "$key" == VITE_* ]]; then
      continue
    fi
    # Skip NEXT_PUBLIC_* keys — legacy, deprecated
    if [[ "$key" == NEXT_PUBLIC_* ]]; then
      continue
    fi
    # Skip Doppler metadata keys
    if [[ "$key" == DOPPLER_* ]]; then
      continue
    fi

    echo "  → $key"
    if [ -n "$WRANGLER_ENV" ]; then
      echo "$value" | wrangler secret put "$key" \
        --env "$WRANGLER_ENV" \
        -c "$wrangler_toml" 2>/dev/null || true
    else
      echo "$value" | wrangler secret put "$key" \
        -c "$wrangler_toml" 2>/dev/null || true
    fi
  done

  echo "  ✅ Synced $service"
  ((SYNCED++)) || true
  echo ""
done

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Synced: $SYNCED   ⚠️ Skipped: $FAILED"
echo "════════════════════════════════════════"
echo ""
echo "Verify with:"
echo "  wrangler secret list --env \$WRANGLER_ENV -c services/pipeline/wrangler.toml"
