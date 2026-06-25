#!/usr/bin/env bash
# Validate repo structure for Cloudflare Git Integration (Option A).
# Run from repo root: ./scripts/validate-cloudflare-config.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Validating Cloudflare Worker config (v3.6 deploy order)"
echo ""

SERVICES=(
  "services/pipeline:integratewise-pipeline"
  "services/connector:integratewise-connector"
  "services/intelligence:integratewise-intelligence"
  "services/knowledge:integratewise-knowledge"
  "services/workflow:integratewise-bff"
  "services/l2:integratewise-l2"
  "services/gateway:integratewise-gateway"
)

FAIL=0
for entry in "${SERVICES[@]}"; do
  dir="${entry%%:*}"
  name="${entry##*:}"
  if [ ! -f "$dir/wrangler.toml" ]; then
    echo "FAIL $dir missing wrangler.toml"
    FAIL=1
  elif ! grep -q "name = \"$name\"" "$dir/wrangler.toml" 2>/dev/null; then
    echo "FAIL $dir/wrangler.toml name is not $name"
    FAIL=1
  else
    echo "OK   $dir -> $name"
  fi
  if [ ! -f "$dir/src/index.ts" ]; then
    echo "FAIL $dir missing src/index.ts"
    FAIL=1
  fi
done

echo ""
echo "Gateway service bindings (must exist in Cloudflare):"
for svc in integratewise-connector integratewise-pipeline integratewise-intelligence integratewise-knowledge integratewise-bff integratewise-l2; do
  if grep -q "service = \"$svc\"" services/gateway/wrangler.toml 2>/dev/null; then
    echo "  OK   $svc"
  else
    echo "  MISS $svc"
    FAIL=1
  fi
done

echo ""
if [ $FAIL -eq 0 ]; then
  echo "All checks passed. Ready for Cloudflare Git integration."
else
  echo "Some checks failed. Fix before connecting Git."
  exit 1
fi
