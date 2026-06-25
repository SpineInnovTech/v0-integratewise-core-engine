#!/usr/bin/env bash
# Sync root .env to apps/web/.env.local and to services/*/.dev.vars for local dev.
# Run from repo root. Requires .env to exist (copy from .env.example).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV="$ROOT/.env"
if [ ! -f "$ENV" ]; then
  echo "No .env at repo root. Copy .env.example to .env and set values."
  exit 1
fi

# apps/web/.env.local — VITE_* only
WEB_ENV="$ROOT/apps/web/.env.local"
mkdir -p "$(dirname "$WEB_ENV")"
{
  grep -E '^VITE_' "$ENV" 2>/dev/null || true
} > "$WEB_ENV"
echo "Wrote VITE_* to $WEB_ENV"

# services/gateway/.dev.vars
GATEWAY_VARS="$ROOT/services/gateway/.dev.vars"
mkdir -p "$(dirname "$GATEWAY_VARS")"
{
  grep -E '^SUPABASE_URL=|^SUPABASE_SERVICE_ROLE_KEY=|^GITHUB_WEBHOOK_SECRET=' "$ENV" 2>/dev/null || true
} > "$GATEWAY_VARS"
echo "Wrote to $GATEWAY_VARS"

# services/think/.dev.vars
THINK_VARS="$ROOT/services/think/.dev.vars"
{
  grep -E '^SUPABASE_URL=|^SUPABASE_SERVICE_KEY=|^OPENROUTER_API_KEY=' "$ENV" 2>/dev/null || true
} > "$THINK_VARS"
echo "Wrote to $THINK_VARS"

# services/knowledge/.dev.vars
KNOWLEDGE_VARS="$ROOT/services/knowledge/.dev.vars"
{
  grep -E '^SUPABASE_URL=|^SUPABASE_SERVICE_ROLE_KEY=|^OPENROUTER_API_KEY=' "$ENV" 2>/dev/null || true
} > "$KNOWLEDGE_VARS"
echo "Wrote to $KNOWLEDGE_VARS"

echo "Done. Restart dev servers if they are running."
