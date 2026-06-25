#!/usr/bin/env bash
# =============================================================================
# One-time: set your Cloudflare Secrets Store ID in all services/*/wrangler.toml
# so Workers get secrets from the store on deploy (no manual Dashboard bindings).
# =============================================================================
# Usage:
#   ./scripts/set-secrets-store-id.sh <STORE_ID>
#   CLOUDFLARE_SECRETS_STORE_ID=xxx ./scripts/set-secrets-store-id.sh
#
# Get your store ID: npx wrangler secrets-store store list
# (Store name "default_secrets_store" has an ID like a UUID — use that ID.)
# =============================================================================

set -euo pipefail

STORE_ID="${1:-${CLOUDFLARE_SECRETS_STORE_ID:-}}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -z "$STORE_ID" ]; then
  echo "Usage: $0 <STORE_ID>"
  echo "   or: CLOUDFLARE_SECRETS_STORE_ID=<id> $0"
  echo ""
  echo "Get store ID: pnpm exec wrangler secrets-store store list"
  exit 1
fi

COUNT=0
for toml in services/*/wrangler.toml; do
  if [ -f "$toml" ] && grep -q "REPLACE_WITH_YOUR_STORE_ID" "$toml" 2>/dev/null; then
    if (sed "s/REPLACE_WITH_YOUR_STORE_ID/$STORE_ID/g" "$toml" > "${toml}.tmp" && mv "${toml}.tmp" "$toml"); then
      echo "✅ $(dirname "$toml")"
      ((COUNT++)) || true
    fi
  fi
done

echo ""
echo "Updated $COUNT wrangler.toml file(s). Deploy Workers to apply Secrets Store bindings:"
echo "  ./scripts/deploy-all-workers.sh production"
echo "  # or deploy individually: pnpm exec wrangler deploy -c services/<name>/wrangler.toml --env=production"
