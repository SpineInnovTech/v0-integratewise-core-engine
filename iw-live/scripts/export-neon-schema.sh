#!/bin/bash
# ============================================================================
# Export Neon schema (DDL only) for Neon → Supabase migration
# ============================================================================
# Use this for step 1 of NEON_TO_SUPABASE_MIGRATION.md: capture Neon DDL
# so you can diff against sql-migrations/ and harden Supabase tables.
#
# Usage (from repo root):
#   export NEON_DATABASE_URL="postgresql://...?sslmode=require"   # or DATABASE_URL
#   ./scripts/export-neon-schema.sh
#
# Output: scripts/neon-schema-export.sql (gitignored)
# ============================================================================

set -e

# Run from repo root (script may be invoked as ./scripts/export-neon-schema.sh)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONN="${NEON_DATABASE_URL:-$DATABASE_URL}"
OUTPUT="${1:-$ROOT/scripts/neon-schema-export.sql}"

if [ -z "$CONN" ]; then
  echo "Error: set NEON_DATABASE_URL or DATABASE_URL (Neon connection string)"
  exit 1
fi

echo "Exporting schema only from Neon to $OUTPUT ..."
pg_dump "$CONN" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  --schema=hub \
  --file="$OUTPUT" 2>/dev/null || {
  # If multiple schemas fail, try public only
  pg_dump "$CONN" --schema-only --no-owner --no-privileges --schema=public --file="$OUTPUT"
}

echo "Done. Next: diff $OUTPUT against sql-migrations/ and add hardening migrations."
