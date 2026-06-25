#!/usr/bin/env bash
# =============================================================================
# Run Adaptive Spine 12×11 migration (055) against Supabase
# =============================================================================
# Requires one of:
#   A) SUPABASE_DB_URL set (Direct connection URI from Supabase Dashboard
#      → Project Settings → Database → Connection string → URI)
#   B) Or: supabase link already run, then we use: npx supabase db push
# =============================================================================

set -e

MIGRATION_FILE="sql-migrations/055_adaptive_spine_12x11_full.sql"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: $MIGRATION_FILE not found."
  exit 1
fi

# Option 1: Push via Supabase CLI (linked project)
if [ -z "$SUPABASE_DB_URL" ] && [ -f supabase/.temp/project-ref ]; then
  echo "Pushing migrations via Supabase CLI (linked project)..."
  npx --yes supabase db push
  echo "Done."
  exit 0
fi

# Option 2: Direct psql with SUPABASE_DB_URL
if [ -n "$SUPABASE_DB_URL" ]; then
  if ! command -v psql &>/dev/null; then
    echo "Error: psql not found. Install PostgreSQL client or set up Supabase CLI and run: supabase link && supabase db push"
    exit 1
  fi
  echo "Running migration via psql (SUPABASE_DB_URL)..."
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
  echo "Done."
  exit 0
fi

# Option 3: Build URL from .env.local (service role key as DB password - see setup-supabase.sh)
if [ -f "apps/web/.env.local" ]; then
  # shellcheck source=/dev/null
  source apps/web/.env.local
  for var in VITE_SUPABASE_URL NEXT_PUBLIC_SUPABASE_URL; do
    [ -n "${!var}" ] && SUPABASE_URL="${!var}" && break
  done
  if [ -n "$SUPABASE_URL" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_DB_PASSWORD}" ]; then
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's/\.supabase\.co//')
    DB_HOST="db.${PROJECT_REF}.supabase.co"
    PASS="${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_DB_PASSWORD}"
    # Note: Supabase direct DB often uses the project database password, not the service role key.
    DIRECT_URL="postgresql://postgres:${PASS}@${DB_HOST}:5432/postgres"
    if command -v psql &>/dev/null; then
      echo "Running migration via psql (from .env.local)..."
      psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
      echo "Done."
      exit 0
    fi
  fi
fi

echo "Cannot run migration: no Supabase DB connection."
echo ""
echo "Do one of:"
echo "  1. Set SUPABASE_DB_URL (from Supabase Dashboard → Project Settings → Database → Connection string URI), then run:"
echo "     SUPABASE_DB_URL='postgresql://...' ./scripts/run-adaptive-spine-migration.sh"
echo "  2. Or link Supabase CLI and push:"
echo "     npx supabase link --project-ref YOUR_PROJECT_REF"
echo "     npx supabase db push"
echo "  3. Or run the SQL manually in Supabase Dashboard → SQL Editor: paste contents of $MIGRATION_FILE"
exit 1
